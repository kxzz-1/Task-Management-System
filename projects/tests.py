from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from users.models import User, CustomRole
from projects.models import Project
from tasks.models import Task

class ProjectAPITests(APITestCase):
    def setUp(self):
        # Create users for each role
        admin_role, _ = CustomRole.objects.get_or_create(name='ADMIN')
        pm_role, _ = CustomRole.objects.get_or_create(name='PM')
        dev_role, _ = CustomRole.objects.get_or_create(name='DEVELOPER')

        self.admin_user = User.objects.create_user(username='admin', password='pw', role=admin_role)
        self.pm_user = User.objects.create_user(username='pm', password='pw', role=pm_role)
        self.dev_user = User.objects.create_user(username='dev', password='pw', role=dev_role)
        
        self.url = reverse('project-list')

    def test_admin_can_create_project(self):
        """Test that Admins can create a project and created_by is auto-set."""
        self.client.force_authenticate(user=self.admin_user)
        data = {'name': 'Admin Project', 'description': 'Testing'}
        response = self.client.post(self.url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.count(), 1)
        self.assertEqual(Project.objects.get().created_by, self.admin_user)

    def test_pm_cannot_create_project(self):
        """Test that PMs are forbidden from creating projects."""
        self.client.force_authenticate(user=self.pm_user)
        data = {'name': 'PM Project'}
        response = self.client.post(self.url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Project.objects.count(), 0)

    def test_developer_can_read_projects(self):
        """Test that Developers can read the list of projects."""
        project = Project.objects.create(name='Existing Project')
        
        # Developers only see projects they have tasks in, so create a task assigned to this developer
        Task.objects.create(title='Some Task', project=project, assigned_to=self.dev_user)
        
        self.client.force_authenticate(user=self.dev_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return paginated result
        self.assertEqual(response.data['count'], 1)
