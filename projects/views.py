from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from users.permissions import IsAdmin

from django.db.models import Q
from .models import Project
from .serializers import ProjectSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['created_by']
    search_fields = ['name', 'description']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Project.objects.none()
            
        # Role name-based filtering
        role_name = user.role.name if user.role else ''
        
        if user.is_staff or role_name == 'ADMIN':
            return Project.objects.all()
        elif role_name == 'PM':
            # PM can see projects they created OR projects they manage
            return Project.objects.filter(Q(created_by=user) | Q(manager=user)).distinct()
        else: # Developer
            # Developers only see projects they have tasks in
            return Project.objects.filter(tasks__assigned_to=user).distinct()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only Admins can modify projects
            permission_classes = [IsAdmin]
        else:
            # Everyone logged in can view projects
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            project_ids = [p.id for p in page]
            from users.cache import get_cached_entities
            serialized_data = get_cached_entities(
                entity_name='project',
                entity_ids=project_ids,
                model_class=Project,
                serializer_class=ProjectSerializer,
                request=request
            )
            return self.get_paginated_response(serialized_data)

        project_ids = list(queryset.values_list('id', flat=True))
        from users.cache import get_cached_entities
        serialized_data = get_cached_entities(
            entity_name='project',
            entity_ids=project_ids,
            model_class=Project,
            serializer_class=ProjectSerializer,
            request=request
        )
        return Response(serialized_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        from users.cache import get_cached_entities
        serialized_data = get_cached_entities(
            entity_name='project',
            entity_ids=[instance.id],
            model_class=Project,
            serializer_class=ProjectSerializer,
            request=request
        )
        if serialized_data:
            return Response(serialized_data[0])
        return Response({"error": "Not found"}, status=404)

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        from users.utils import log_event
        log_event(
            user=self.request.user,
            action="PROJECT_CREATED",
            description=f"Project '{project.name}' was created successfully."
        )

    def perform_update(self, serializer):
        project = serializer.save()
        from users.cache import invalidate_entity
        invalidate_entity('project', project.id)

    def perform_destroy(self, instance):
        project_id = instance.id
        instance.delete()
        from users.cache import invalidate_entity
        invalidate_entity('project', project_id)

    @action(detail=True, methods=['post'], url_path='mark-complete')
    def mark_complete(self, request, pk=None):
        project = self.get_object()
        user = request.user
        
        role_name = user.role.name if user.role else ''
        
        # Only admin or the project's manager can mark it complete
        if role_name != 'ADMIN' and project.manager != user:
            from users.exceptions import TMSApiException
            raise TMSApiException(
                detail="Only the project manager or admin can mark this project as complete.",
                status_code=403,
                code="manager_restricted"
            )
            
        project.status = 'COMPLETED'
        project.save()
        
        # Invalidate cache for this project
        from users.cache import invalidate_entity
        invalidate_entity('project', project.id)
        
        from users.utils import log_event
        log_event(
            user=user,
            action="PROJECT_COMPLETED",
            description=f"Project '{project.name}' was marked as COMPLETED."
        )
        
        return Response(ProjectSerializer(project).data)

