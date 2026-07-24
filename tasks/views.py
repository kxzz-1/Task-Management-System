from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import PermissionDenied

from users.permissions import IsAdmin, IsPM, IsDeveloper, HasSystemPermission
from .models import Task, TaskStatus
from .serializers import TaskSerializer, TaskStatusSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'project', 'assigned_to']
    search_fields = ['title', 'description']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role and user.role.name == 'DEVELOPER':
            return user.assigned_tasks.all()
        return Task.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            # Only Admins and PMs can create or delete tasks
            permission_classes = [IsAdmin | IsPM]
        elif self.action in ['update', 'partial_update']:
            # Admins, PMs, and Developers can update (we will restrict Developers later)
            permission_classes = [IsAdmin | IsPM | IsDeveloper]
        else:
            # Everyone logged in can view tasks
            permission_classes = [permissions.IsAuthenticated]
            
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            task_ids = [t.id for t in page]
            from users.cache import get_cached_entities
            serialized_data = get_cached_entities(
                entity_name='task',
                entity_ids=task_ids,
                model_class=Task,
                serializer_class=TaskSerializer,
                request=request
            )
            return self.get_paginated_response(serialized_data)

        task_ids = list(queryset.values_list('id', flat=True))
        from users.cache import get_cached_entities
        serialized_data = get_cached_entities(
            entity_name='task',
            entity_ids=task_ids,
            model_class=Task,
            serializer_class=TaskSerializer,
            request=request
        )
        return Response(serialized_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        from users.cache import get_cached_entities
        serialized_data = get_cached_entities(
            entity_name='task',
            entity_ids=[instance.id],
            model_class=Task,
            serializer_class=TaskSerializer,
            request=request
        )
        if serialized_data:
            return Response(serialized_data[0])
        return Response({"error": "Not found"}, status=404)

    def perform_update(self, serializer):
        user = self.request.user
        
        if user.is_authenticated and user.role and user.role.name == 'DEVELOPER':
            # Check what fields they are trying to change
            allowed_fields = {'status'}
            incoming_fields = set(self.request.data.keys())
            
            if not incoming_fields.issubset(allowed_fields):
                from users.exceptions import TMSApiException
                raise TMSApiException(
                    detail="Developers can only update the status field.",
                    status_code=403,
                    code="developer_status_only"
                )
            # Ensure they are only updating their OWN task
            if serializer.instance.assigned_to != user:
                from users.exceptions import TMSApiException
                raise TMSApiException(
                    detail="You can only update tasks assigned to you.",
                    status_code=403,
                    code="assigned_task_only"
                )
                
        task = serializer.save()
        
        # Invalidate task and parent project details caches
        from users.cache import invalidate_entity
        invalidate_entity('task', task.id)
        invalidate_entity('project', task.project_id)
        
        from users.utils import log_event
        log_event(
            user=user,
            action="TASK_UPDATED",
            description=f"Task '{task.title}' updated. Status: {task.status.name if task.status else 'None'}."
        )

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        
        # Invalidate parent project details cache
        from users.cache import invalidate_entity
        invalidate_entity('project', task.project_id)
        
        from users.utils import log_event
        log_event(
            user=self.request.user,
            action="TASK_CREATED",
            description=f"Task '{task.title}' created in project '{task.project.name}'."
        )

    def perform_destroy(self, instance):
        task_id = instance.id
        project_id = instance.project_id
        instance.delete()
        
        # Invalidate task and parent project details caches
        from users.cache import invalidate_entity
        invalidate_entity('task', task_id)
        invalidate_entity('project', project_id)


class TaskStatusViewSet(viewsets.ModelViewSet):
    queryset = TaskStatus.objects.all().order_by('name')
    serializer_class = TaskStatusSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [HasSystemPermission('manage_users')()]
        return [permissions.IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        status_instance = self.get_object()
        
        # 1. Prevent deleting core statuses
        if status_instance.name in ['TODO', 'IN_PROGRESS', 'DONE']:
            return Response(
                {"error": "Cannot delete core system statuses."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 2. Check if status is used by any project workflow
        if status_instance.projects.exists():
            return Response(
                {"error": "Cannot delete this status because it is linked to one or more projects."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 3. Check if status is used by any tasks
        if status_instance.tasks.exists():
            return Response(
                {"error": "Cannot delete this status because tasks are currently using it."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        status_name = status_instance.name
        response = super().destroy(request, *args, **kwargs)
        
        from users.utils import log_event
        log_event(
            user=request.user,
            action="STATUS_DELETED",
            description=f"Task status '{status_name}' was successfully deleted."
        )
        return response
