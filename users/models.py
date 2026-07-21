from django.db import models
from django.contrib.auth.models import AbstractUser

class SystemPermission(models.Model):
    module = models.CharField(max_length=50) # e.g. "projects", "tasks", "users"
    codename = models.CharField(max_length=100, unique=True) # e.g. "create_project"
    name = models.CharField(max_length=100) # e.g. "Create Projects"

    def __str__(self):
        return f"{self.module} - {self.name}"

class CustomRole(models.Model):
    name = models.CharField(max_length=50, unique=True) # e.g. "ADMIN", "PM", "DEVELOPER"
    permissions = models.ManyToManyField(SystemPermission, blank=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    role = models.ForeignKey(CustomRole, on_delete=models.SET_NULL, null=True, blank=True)
    custom_permissions = models.ManyToManyField(SystemPermission, blank=True, related_name='override_users')
    is_permissions_customized = models.BooleanField(default=False)

    def has_system_permission(self, codename):
        # Admin always has bypass permission
        if self.role and self.role.name == 'ADMIN':
            return True
        if self.is_permissions_customized:
            return self.custom_permissions.filter(codename=codename).exists()
        if self.role:
            return self.role.permissions.filter(codename=codename).exists()
        return False

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        username = self.user.username if self.user else "System"
        return f"{self.timestamp} - {username} - {self.action}"

class SystemErrorLog(models.Model):
    error_message = models.TextField()
    traceback_summary = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.timestamp} - Error: {self.error_message[:50]}"