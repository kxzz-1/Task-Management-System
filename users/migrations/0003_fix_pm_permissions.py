from django.db import migrations

def fix_pm_permissions(apps, schema_editor):
    CustomRole = apps.get_model('users', 'CustomRole')
    SystemPermission = apps.get_model('users', 'SystemPermission')

    try:
        pm_role = CustomRole.objects.get(name='PM')
        # PM should only have task permissions and project mark-complete rights
        pm_perms = SystemPermission.objects.filter(codename__in=[
            'create_task',
            'edit_task',
            'delete_task',
            'mark_complete_project'
        ])
        pm_role.permissions.set(pm_perms)
    except CustomRole.DoesNotExist:
        pass

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_customrole_systempermission_and_more'),
    ]

    operations = [
        migrations.RunPython(fix_pm_permissions),
    ]
