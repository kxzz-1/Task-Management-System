from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from users.models import User, CustomRole
from projects.models import Project
from tasks.models import Task, TaskStatus

class Status:
    TODO = 'TODO'
    IN_PROGRESS = 'IN_PROGRESS'
    DONE = 'DONE'

class TaskAPITests(APITestCase):
    def setUp(self):
        admin_role, _ = CustomRole.objects.get_or_create(name='ADMIN')
        pm_role, _ = CustomRole.objects.get_or_create(name='PM')
        dev_role, _ = CustomRole.objects.get_or_create(name='DEVELOPER')

        self.admin_user = User.objects.create_user(username='admin', password='pw', role=admin_role)
        self.pm_user = User.objects.create_user(username='pm', password='pw', role=pm_role)
        self.dev_user = User.objects.create_user(username='dev', password='pw', role=dev_role)
        
        self.todo_status, _ = TaskStatus.objects.get_or_create(name='TODO')
        self.in_progress_status, _ = TaskStatus.objects.get_or_create(name='IN_PROGRESS')
        self.done_status, _ = TaskStatus.objects.get_or_create(name='DONE')

        self.project = Project.objects.create(name='Test Project')
        self.project.statuses.add(self.todo_status, self.in_progress_status, self.done_status)

        self.task = Task.objects.create(
            title='Test Task', 
            project=self.project, 
            assigned_to=self.dev_user,
            status=self.todo_status
        )
        
        self.list_url = reverse('task-list')
        self.detail_url = reverse('task-detail', args=[self.task.id])

    def test_pm_can_create_task(self):
        self.client.force_authenticate(user=self.pm_user)
        data = {'title': 'PM Task', 'project': self.project.id, 'status': Status.TODO}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.get(title='PM Task').created_by, self.pm_user)

    def test_developer_cannot_create_task(self):
        self.client.force_authenticate(user=self.dev_user)
        data = {'title': 'Dev Task', 'project': self.project.id, 'status': Status.TODO}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_developer_can_update_status(self):
        self.client.force_authenticate(user=self.dev_user)
        data = {'status': Status.DONE}
        response = self.client.patch(self.detail_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status.name, Status.DONE)

    def test_developer_cannot_update_title(self):
        self.client.force_authenticate(user=self.dev_user)
        data = {'title': 'Hacked Title'}
        response = self.client.patch(self.detail_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, 'Test Task')

    def test_hybrid_serializer_behavior(self):
        """Test that GET returns read-only names, but PUT/PATCH accepts IDs."""
        self.client.force_authenticate(user=self.admin_user)
        
        # 1. Test GET request contains human-readable data
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('project_name', response.data)
        self.assertEqual(response.data['project_name'], 'Test Project')
        self.assertIn('assigned_to_username', response.data)
        self.assertEqual(response.data['assigned_to_username'], 'dev')
        
        # 2. Test PATCH request works using ONLY the integer ID
        update_data = {
            'title': 'Updated by ID',
            'project': self.project.id,
            'status': Status.TODO
        }
        patch_response = self.client.patch(self.detail_url, update_data)
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_response.data['title'], 'Updated by ID')
        self.assertEqual(patch_response.data['project'], self.project.id)
