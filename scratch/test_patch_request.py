import os
import sys
import django
import requests

sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

# Get admin and abc user
admin = User.objects.get(username='admin')
abc = User.objects.get(username='abc')

# Reset abc customization to False first
abc.is_permissions_customized = False
abc.custom_permissions.clear()
abc.save()

print(f"Before PATCH: abc customized = {abc.is_permissions_customized}, perms = {list(abc.custom_permissions.values_list('codename', flat=True))}")

# Get token for admin
login_url = "http://localhost:8000/api/token/"
try:
    token_res = requests.post(login_url, json={"username": "admin", "password": "admin"})
    token_res.raise_for_status()
    token = token_res.json()["access"]
except Exception as e:
    print(f"Failed to get token: {e}")
    sys.exit(1)

# Perform PATCH request to update abc
headers = {"Authorization": f"Bearer {token}"}
patch_url = f"http://localhost:8000/api/users/{abc.id}/"
payload = {
    "username": "abc",
    "role": "PM",
    "is_permissions_customized": True,
    "custom_permissions": ["create_project", "edit_project"]
}

print(f"Sending PATCH request to {patch_url}...")
res = requests.patch(patch_url, json=payload, headers=headers)
print(f"Response Status: {res.status_code}")
print(f"Response Body: {res.json()}")

# Reload abc from DB
abc.refresh_from_db()
print(f"After PATCH in DB: abc customized = {abc.is_permissions_customized}, perms = {list(abc.custom_permissions.values_list('codename', flat=True))}")
