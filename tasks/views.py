from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import PermissionDenied

from users.permissions import IsAdmin, IsPM, IsDeveloper
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'project', 'assigned_to']
    search_fields = ['title', 'description']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DEVELOPER':
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

    # NEW: Restricting what Developers can update
    def perform_update(self, serializer):
        user = self.request.user
        
        if user.role == 'DEVELOPER':
            # Check what fields they are trying to change
            allowed_fields = {'status'}
            # self.request.data contains the incoming JSON
            incoming_fields = set(self.request.data.keys())
            
            if not incoming_fields.issubset(allowed_fields):
                raise PermissionDenied("Developers can only update the status field.")
            # Ensure they are only updating their OWN task
            if serializer.instance.assigned_to != user:
                raise PermissionDenied("You can only update tasks assigned to you.")
                
        # If all checks pass, save the data
        serializer.save()

        # NEW: Set the creator automatically
    def perform_create(self, serializer):
        """
        When a task is created, automatically set the 'created_by' field
        to the currently logged-in user.
        """
        serializer.save(created_by=self.request.user)

