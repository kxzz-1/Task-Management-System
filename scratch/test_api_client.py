import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from rest_framework.test import APIClient

# Get admin and abc user
admin = User.objects.get(username='admin')
abc = User.objects.get(username='abc')

# Reset abc customization to False first
abc.is_permissions_customized = False
abc.custom_permissions.clear()
abc.save()

print(f"Before PATCH: abc customized = {abc.is_permissions_customized}, perms = {list(abc.custom_permissions.values_list('codename', flat=True))}")

# Initialize APIClient and force authenticate as admin
client = APIClient()
client.force_authenticate(user=admin)

# Perform PATCH request to update abc
patch_url = f"/api/users/{abc.id}/"
payload = {
    "username": "abc",
    "role": "PM",
    "is_permissions_customized": True,
    "custom_permissions": ["create_project", "edit_project"]
}

print(f"Sending PATCH request to {patch_url}...")
res = client.patch(patch_url, data=payload, format='json')
print(f"Response Status: {res.status_code}")
print(f"Response Body: {res.data}")

# Reload abc from DB
abc.refresh_from_db()
print(f"After PATCH in DB: abc customized = {abc.is_permissions_customized}, perms = {list(abc.custom_permissions.values_list('codename', flat=True))}")
