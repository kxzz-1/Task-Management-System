from rest_framework import serializers
from .models import Project
from tasks.models import TaskStatus
from tasks.serializers import TaskStatusSerializer

class ProjectSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    manager_username = serializers.ReadOnlyField(source='manager.username')
    statuses = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=TaskStatus.objects.all(),
        required=False
    )

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
            'statuses',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_by', 'created_by_username', 'manager_username', 'created_at', 'updated_at']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['statuses'] = TaskStatusSerializer(instance.statuses.all(), many=True).data
        return rep

    def create(self, validated_data):
        statuses = validated_data.pop('statuses', [])
        project = Project.objects.create(**validated_data)
        
        if statuses:
            project.statuses.set(statuses)
        else:
            # Default to TODO, IN_PROGRESS, DONE
            todo = TaskStatus.objects.get(name='TODO')
            inprogress = TaskStatus.objects.get(name='IN_PROGRESS')
            done = TaskStatus.objects.get(name='DONE')
            project.statuses.add(todo, inprogress, done)
            
        return project

    def update(self, instance, validated_data):
        statuses = validated_data.pop('statuses', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if statuses is not None:
            instance.statuses.set(statuses)
            
        return instance
