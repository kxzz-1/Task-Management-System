from rest_framework import serializers
from .models import User, CustomRole, SystemPermission

class RoleField(serializers.Field):
    def to_representation(self, value):
        return value.name if value else None

    def to_internal_value(self, data):
        if not data:
            return None

        if isinstance(data, int) or (isinstance(data, str) and data.isdigit()):
            lookup = {'id': int(data)}
            error_msg = f"Role ID {data} does not exist."
        elif isinstance(data, str):
            lookup = {'name': data}
            error_msg = f"Role name '{data}' does not exist."
        else:
            raise serializers.ValidationError("Invalid role format.")

        try:
            return CustomRole.objects.get(**lookup)
        except CustomRole.DoesNotExist:
            raise serializers.ValidationError(error_msg)

class UserSerializer(serializers.ModelSerializer):
    role = RoleField(allow_null=True, required=False)
    custom_permissions = serializers.SlugRelatedField(
        slug_field='codename',
        many=True,
        queryset=SystemPermission.objects.all(),
        required=False
    )
    effective_permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "role",
            "first_name",
            "last_name",
            "custom_permissions",
            "is_permissions_customized",
            "effective_permissions",
        ]
        extra_kwargs = {
            "password": {
                "write_only": True
            }
        }

    def get_effective_permissions(self, obj):
        if obj.role and obj.role.name == 'ADMIN':
            return list(SystemPermission.objects.values_list('codename', flat=True))
        if obj.is_permissions_customized:
            return list(obj.custom_permissions.values_list('codename', flat=True))
        if obj.role:
            return list(obj.role.permissions.values_list('codename', flat=True))
        return []

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        custom_perms = validated_data.pop("custom_permissions", [])
        
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        
        if custom_perms:
            user.custom_permissions.set(custom_perms)
            
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        custom_perms = validated_data.pop("custom_permissions", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        instance.save()

        if custom_perms is not None:
            instance.custom_permissions.set(custom_perms)

        return instance

class SystemPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemPermission
        fields = ['id', 'module', 'codename', 'name']

class CustomRoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SlugRelatedField(
        slug_field='codename',
        many=True,
        queryset=SystemPermission.objects.all(),
        required=False
    )

    class Meta:
        model = CustomRole
        fields = ['id', 'name', 'permissions']