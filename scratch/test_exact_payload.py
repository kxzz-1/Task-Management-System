import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from users.serializers import UserSerializer

user = User.objects.get(username='zeeshan')

# Exact payload sent by Users.jsx:
payload = { 
    "username": "zeeshan",
    "first_name": "",
    "last_name": "",
    "email": "zeeshan@email.com",
    "role": "DEVELOPER",
    "is_permissions_customized": True,
    "custom_permissions": ["create_project", "edit_project"]
}

serializer = UserSerializer(instance=user, data=payload, partial=True)
if serializer.is_valid():
    print("Serializer is valid!")
else:
    print("Serializer validation errors:")
    print(serializer.errors)
