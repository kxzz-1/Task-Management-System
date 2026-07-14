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

# Create your views here.

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['created_by']
    search_fields = ['name', 'description']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', None) == 'ADMIN':
            return Project.objects.all()
        elif getattr(user, 'role', None) == 'PM':
            # PM can see projects they created OR projects they manage
            return Project.objects.filter(Q(created_by=user) | Q(manager=user)).distinct()
        else: # Developer
            # Developers only see projects they have tasks in
            return Project.objects.filter(tasks__assigned_to=user).distinct()

    # NEW: Secure this API!
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only Admins can modify projects
            permission_classes = [IsAdmin]
        else:
            # Everyone logged in can view projects
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    # NEW: Set the creator automatically
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='mark-complete')
    def mark_complete(self, request, pk=None):
        project = self.get_object()
        user = request.user
        # Only admin or the project's manager can mark it complete
        if user.role != 'ADMIN' and project.manager != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the project manager or admin can mark this project as complete.")
        project.status = 'COMPLETED'
        project.save()
        from .serializers import ProjectSerializer
        return Response(ProjectSerializer(project).data)
