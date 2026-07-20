import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

for u in User.objects.all():
    print(f"User: {u.username}")
    print(f"  Role: {u.role}")
    print(f"  Is Customized: {u.is_permissions_customized}")
    print(f"  Custom Perms: {list(u.custom_permissions.values_list('codename', flat=True))}")
