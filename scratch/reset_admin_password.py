import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

admin = User.objects.filter(username='admin').first()
if admin:
    admin.set_password('admin')
    admin.save()
    print("Admin password set to 'admin'")
else:
    print("Admin user not found")
