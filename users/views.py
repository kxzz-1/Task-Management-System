from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from users.permissions import HasSystemPermission, IsAdminOrSelf

from .models import User, CustomRole, SystemPermission
from .serializers import UserSerializer, CustomRoleSerializer, SystemPermissionSerializer

import django_filters

class UserFilter(django_filters.FilterSet):
    role = django_filters.CharFilter(field_name='role__name')

    class Meta:
        model = User
        fields = ['role']

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = UserFilter
    search_fields = ['username', 'first_name', 'last_name', 'email']

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            permission_classes = [HasSystemPermission('manage_users')]
        elif self.action in ["update", "partial_update"]:
            permission_classes = [IsAdminOrSelf]
        else:
            permission_classes = [permissions.IsAuthenticated]
            
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response({'error': 'Both current and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'success': 'Password updated successfully.'}, status=status.HTTP_200_OK)

class SystemPermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SystemPermission.objects.all().order_by('module', 'name')
    serializer_class = SystemPermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

class CustomRoleViewSet(viewsets.ModelViewSet):
    queryset = CustomRole.objects.all().order_by('name')
    serializer_class = CustomRoleSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [HasSystemPermission('manage_roles')()]
        return [permissions.IsAuthenticated()]