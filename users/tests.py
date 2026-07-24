from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from users.models import User, CustomRole

class UserAuthenticationTests(APITestCase):
    def setUp(self):
        # Create a test user
        admin_role, _ = CustomRole.objects.get_or_create(name='ADMIN')
        self.user = User.objects.create_user(
            username='testadmin', 
            password='testpassword123',
            role=admin_role
        )
        # URL for token obtain pair
        self.token_url = reverse('token_obtain_pair')
        self.refresh_url = reverse('token_refresh')
        self.blacklist_url = reverse('token_blacklist')

    def test_login_success(self):
        """Test that valid credentials return JWT tokens."""
        data = {
            'username': 'testadmin',
            'password': 'testpassword123'
        }
        response = self.client.post(self.token_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_failure(self):
        """Test that invalid credentials return 401 Unauthorized."""
        data = {
            'username': 'testadmin',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.token_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('access', response.data)

    def test_logout_blacklist(self):
        """Test that a refresh token can be blacklisted (logged out) and cannot be used again."""
        # 1. Login to get tokens
        data = {'username': 'testadmin', 'password': 'testpassword123'}
        login_response = self.client.post(self.token_url, data)
        refresh_token = login_response.data['refresh']

        # 2. Blacklist the refresh token (Logout)
        blacklist_data = {'refresh': refresh_token}
        logout_response = self.client.post(self.blacklist_url, blacklist_data)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        # 3. Try to use the blacklisted refresh token to get a new access token
        refresh_response = self.client.post(self.refresh_url, blacklist_data)
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(refresh_response.data['code'], 'token_not_valid')


from unittest.mock import patch
from django.db import DatabaseError
from users.utils import log_event

class LoggingSystemTests(APITestCase):
    def setUp(self):
        self.admin_role, _ = CustomRole.objects.get_or_create(name='ADMIN')
        self.dev_role, _ = CustomRole.objects.get_or_create(name='DEVELOPER')
        
        self.admin_user = User.objects.create_user(
            username='admin_logger', 
            password='testpassword123',
            role=self.admin_role
        )
        self.dev_user = User.objects.create_user(
            username='dev_logger', 
            password='testpassword123',
            role=self.dev_role
        )
        
        self.logs_url = reverse('logs-list')

    def test_admin_can_access_logs(self):
        """Test that Admin users can retrieve system logs."""
        self.client.force_authenticate(user=self.admin_user)
        log_event(self.admin_user, "TEST_ACTION", "Admin viewed test logs.")
        
        response = self.client.get(self.logs_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['is_database_down'], False)
        self.assertTrue(len(response.data['logs']) >= 1)
        self.assertEqual(response.data['logs'][0]['action'], "TEST_ACTION")

    def test_developer_cannot_access_logs(self):
        """Test that non-Admin users are blocked from logs view."""
        self.client.force_authenticate(user=self.dev_user)
        response = self.client.get(self.logs_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch('users.views.AuditLog.objects.all')
    def test_database_down_fallback(self, mock_all):
        """Test that database failure triggers text file log fallback."""
        self.client.force_authenticate(user=self.admin_user)
        
        # Simulate database query failure
        mock_all.side_effect = DatabaseError("Database Connection Failed")
        
        response = self.client.get(self.logs_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['is_database_down'], True)
        self.assertIn('logs', response.data)


from django.core.cache import cache
from projects.models import Project

class EntityCachingTests(APITestCase):
    def setUp(self):
        cache.clear()
        
        self.admin_role, _ = CustomRole.objects.get_or_create(name='ADMIN')
        self.admin_user = User.objects.create_user(
            username='admin_cache_tester', 
            password='testpassword123',
            role=self.admin_role
        )
        
        self.project = Project.objects.create(
            name="Cache Test Project",
            description="Testing cache hits, misses, and invalidations.",
            created_by=self.admin_user
        )
        self.projects_url = reverse('project-list')
        self.project_detail_url = reverse('project-detail', args=[self.project.id])

    def tearDown(self):
        cache.clear()

    def test_caching_and_invalidation_flow(self):
        """Test that project retrieval is cached and updates invalidate the cache."""
        self.client.force_authenticate(user=self.admin_user)
        
        # 1. First fetch: should query DB and populate cache
        response = self.client.get(self.project_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the item is now in the cache
        cache_key = f"project_detail:{self.project.id}"
        cached_data = cache.get(cache_key)
        self.assertIsNotNone(cached_data)
        self.assertEqual(cached_data['name'], "Cache Test Project")

        # 2. Modify project: should trigger cache invalidation
        update_data = {"name": "Cache Test Project Updated"}
        update_response = self.client.patch(self.project_detail_url, update_data)
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)

        # Verify that the cache was cleared/invalidated
        self.assertIsNone(cache.get(cache_key))

        # 3. Fetch again: should fetch updated data and re-cache
        response2 = self.client.get(self.project_detail_url)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.data['name'], "Cache Test Project Updated")
        
        # Cache should be populated again with the updated name
        self.assertEqual(cache.get(cache_key)['name'], "Cache Test Project Updated")

