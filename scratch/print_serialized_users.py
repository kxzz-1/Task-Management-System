import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from users.serializers import UserSerializer

user = User.objects.get(username='zeeshan')
serializer = UserSerializer(user)
print("Serialized data for zeeshan:")
print(serializer.data)
