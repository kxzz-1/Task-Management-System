from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import DatabaseError
from users.permissions import HasSystemPermission, IsAdminOrSelf, IsAdmin

from .models import User, CustomRole, SystemPermission, AuditLog, SystemErrorLog
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
        
        from users.utils import log_event
        log_event(
            user=user,
            action="PASSWORD_CHANGED",
            description=f"User '{user.username}' successfully changed their password."
        )
        
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

class LogViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def list(self, request):
        user_filter = request.query_params.get('user')
        action_filter = request.query_params.get('action')
        search_query = request.query_params.get('search')

        try:
            # 1. Fetch Audit Logs
            audit_qs = AuditLog.objects.all().select_related('user')
            if user_filter:
                audit_qs = audit_qs.filter(user_id=user_filter)
            if action_filter:
                audit_qs = audit_qs.filter(action=action_filter)
            if search_query:
                audit_qs = audit_qs.filter(description__icontains=search_query)

            audit_logs = []
            for log in audit_qs.order_by('-timestamp')[:100]:
                audit_logs.append({
                    'id': f"audit-{log.id}",
                    'type': 'Audit Log',
                    'action': log.action,
                    'description': log.description,
                    'timestamp': log.timestamp.isoformat(),
                    'user_username': log.user.username if log.user else 'System',
                })

            # 2. Fetch System Error Logs
            error_qs = SystemErrorLog.objects.all()
            if search_query:
                error_qs = error_qs.filter(error_message__icontains=search_query)

            error_logs = []
            if not user_filter and not action_filter:
                for log in error_qs.order_by('-timestamp')[:100]:
                    error_logs.append({
                        'id': f"error-{log.id}",
                        'type': 'System Error',
                        'action': 'ERROR',
                        'description': f"{log.error_message}\nTraceback Summary:\n{log.traceback_summary}",
                        'timestamp': log.timestamp.isoformat(),
                        'user_username': 'System',
                    })

            combined_logs = audit_logs + error_logs
            combined_logs.sort(key=lambda x: x['timestamp'], reverse=True)

            return Response({
                'is_database_down': False,
                'logs': combined_logs[:100]
            })

        except DatabaseError as e:
            import logging
            import traceback
            tms_logger = logging.getLogger('tms')
            tms_logger.critical(
                f"[DATABASE_FAILURE] The database log query failed. Connection is offline. Error: {e}"
            )
            tms_logger.critical(f"Traceback:\n{traceback.format_exc()}")

            logs = self.read_logs_from_file()
            
            if search_query:
                logs = [l for l in logs if search_query.lower() in l['description'].lower()]
            if action_filter:
                logs = [l for l in logs if action_filter.lower() in l['action'].lower()]
                
            return Response({
                'is_database_down': True,
                'logs': logs[:100]
            })

    def read_logs_from_file(self):
        from django.conf import settings
        log_file_path = settings.BASE_DIR / 'tms.log'
        logs = []
        if not log_file_path.exists():
            return logs
            
        try:
            with open(log_file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()[-100:]
                
            for idx, line in enumerate(reversed(lines)):
                line = line.strip()
                if not line:
                    continue
                parts = line.split(' ', 4)
                if len(parts) >= 5:
                    level = parts[0]
                    timestamp = f"{parts[1]} {parts[2]}"
                    module = parts[3]
                    message = parts[4]
                else:
                    level = "INFO"
                    timestamp = "Unknown"
                    module = "system"
                    message = line
                    
                logs.append({
                    'id': f"file-{idx}",
                    'type': "System Error" if level in ["ERROR", "CRITICAL"] else "System Log",
                    'action': level,
                    'description': message,
                    'timestamp': timestamp,
                    'user_username': "System",
                })
        except Exception:
            pass
        return logs