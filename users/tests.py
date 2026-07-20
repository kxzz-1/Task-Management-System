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
