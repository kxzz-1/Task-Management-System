from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from users.permissions import IsAdmin

from .models import Project
from .serializers import ProjectSerializer

# Create your views here.

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['created_by']
    search_fields = ['name', 'description']

    # NEW: Secure this API!
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only Admins can modify projects
            permission_classes = [IsAdmin]
        else:
            # Everyone logged in can view projects (Admins, PMs, Developers)
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    # NEW: Set the creator automatically
    def perform_create(self, serializer):
        """
        When a project is created, automatically set the 'created_by' field
        to the currently logged-in user.
        """
        serializer.save(created_by=self.request.user)
