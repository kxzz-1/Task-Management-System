from rest_framework import serializers
from .models import Task
from users.models import Role

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'

    def validate_assigned_to(self, value):
        if value and value.role in [Role.ADMIN, Role.PM]:
            raise serializers.ValidationError("Tasks cannot be assigned to Admins or Project Managers.")
        return value