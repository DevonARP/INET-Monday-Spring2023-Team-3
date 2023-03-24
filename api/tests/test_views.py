from rest_framework.test import APITestCase  # , APIRequestFactory
from rest_framework import status
from django.urls import reverse
from api.models import User


class RegisterTest(APITestCase):
    def test_user_register_success(self):
        data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}

        response = self.client.post(reverse("register"), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_register_fail(self):
        data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}

        User.objects.create(**data)

        response = self.client.post(reverse("register"), data)
        self.assertEqual(response.data["error"], "user already exists")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTest(APITestCase):
    def test_user_login_success(self):
        data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}
        self.client.post(reverse("register"), data)

        response = self.client.post(reverse("login"), data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_login_user_exists_fail(self):
        data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}

        response = self.client.post(reverse("login"), data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "username does not exist")

    def test_user_login_password_fail(self):
        data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}

        User.objects.create(**data)

        data["password"] = "fail"

        response = self.client.post(reverse("login"), data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "incorrect password")
