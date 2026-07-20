from rest_framework import serializers
from .models import Task, TaskStatus

class TaskStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskStatus
        fields = ['id', 'name']

class StatusField(serializers.Field):
    def to_representation(self, value):
        return value.name if value else None

    def to_internal_value(self, data):
        if not data:
            return None
        if isinstance(data, int):
            try:
                return TaskStatus.objects.get(id=data)
            except TaskStatus.DoesNotExist:
                raise serializers.ValidationError(f"Status ID {data} does not exist.")
        elif isinstance(data, str):
            try:
                return TaskStatus.objects.get(name=data)
            except TaskStatus.DoesNotExist:
                if data.isdigit():
                    try:
                        return TaskStatus.objects.get(id=int(data))
                    except TaskStatus.DoesNotExist:
                        pass
                raise serializers.ValidationError(f"Status name '{data}' does not exist.")
        raise serializers.ValidationError("Invalid status format.")

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    status = StatusField()

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'status',
            'project',
            'project_name',
            'assigned_to',
            'assigned_to_username',
            'created_by',
            'created_by_username',
            'due_date'
        ]
        read_only_fields = ['created_by', 'created_by_username']

    def validate_assigned_to(self, value):
        if value and value.role and value.role.name in ['ADMIN', 'PM']:
            raise serializers.ValidationError("Tasks cannot be assigned to Admins or Project Managers.")
        return value

    def validate(self, data):
        # Validate that the selected status is allowed by the project
        project = data.get('project') or (self.instance.project if self.instance else None)
        status = data.get('status')
        if project and status:
            if not project.statuses.filter(id=status.id).exists():
                raise serializers.ValidationError(
                    {"status": f"Status '{status.name}' is not allowed for project '{project.name}'."}
                )
        return data