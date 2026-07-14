from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    manager_username = serializers.ReadOnlyField(source='manager.username')

    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'status',
            'created_by',
            'created_by_username',
            'manager',
            'manager_username',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_by', 'created_by_username', 'manager_username', 'created_at', 'updated_at']
