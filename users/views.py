from django.shortcuts import render
from rest_framework import viewsets, permissions
from users.permissions import IsAdmin

from .models import User
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            # Only admin can create, update or delete the user
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
            
        # DRF requires us to instantiate the classes by calling them!
        return [permission() for permission in permission_classes]