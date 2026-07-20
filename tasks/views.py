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

    def perform_update(self, serializer):
        user = self.request.user
        
        if user.is_authenticated and user.role and user.role.name == 'DEVELOPER':
            # Check what fields they are trying to change
            allowed_fields = {'status'}
            incoming_fields = set(self.request.data.keys())
            
            if not incoming_fields.issubset(allowed_fields):
                raise PermissionDenied("Developers can only update the status field.")
            # Ensure they are only updating their OWN task
            if serializer.instance.assigned_to != user:
                raise PermissionDenied("You can only update tasks assigned to you.")
                
        serializer.save()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

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
            
        return super().destroy(request, *args, **kwargs)
