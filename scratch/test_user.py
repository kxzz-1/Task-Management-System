import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, SystemPermission

# Find a test user (non-admin)
user = User.objects.exclude(role__name='ADMIN').first()
if user:
    print(f"User: {user.username}")
    print(f"Is Customized: {user.is_permissions_customized}")
    print(f"Custom Perms: {list(user.custom_permissions.all())}")
else:
    print("No non-admin user found")
