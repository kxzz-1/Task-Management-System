import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from users.serializers import UserSerializer

user = User.objects.exclude(role__name='ADMIN').first()
print(f"Initial: {user.username}, Is Customized: {user.is_permissions_customized}, Perms: {list(user.custom_permissions.values_list('codename', flat=True))}")

# Simulate PATCH request data
data = {
    "is_permissions_customized": True,
    "custom_permissions": ["create_project", "edit_project"]
}

serializer = UserSerializer(instance=user, data=data, partial=True)
if serializer.is_valid():
    updated_user = serializer.save()
    print(f"After Save (in-memory): {updated_user.is_permissions_customized}, Perms: {list(updated_user.custom_permissions.values_list('codename', flat=True))}")
    
    # Reload from DB
    db_user = User.objects.get(id=user.id)
    print(f"After Save (from DB): {db_user.is_permissions_customized}, Perms: {list(db_user.custom_permissions.values_list('codename', flat=True))}")
else:
    print(f"Validation Errors: {serializer.errors}")
