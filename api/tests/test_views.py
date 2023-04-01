from rest_framework.test import APITestCase  # , APIRequestFactory
from rest_framework import status
from django.urls import reverse
from api.models import User, OTP_Request
import datetime


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

        user = User.objects.get(username=data["username"])
        user.verified = True
        user.save()

        response = self.client.post(reverse("login"), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_login_send_otp(self):
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


class EmailTest(APITestCase):
    def test_send_recovery_success(self):
        data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}
        self.client.post(reverse("register"), data)

        response = self.client.post(reverse("recover"), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_send_recovery_fail(self):
        data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}

        response = self.client.post(reverse("recover"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_verify_success(self):
        otp_num = "123456"
        data = {
            "username": "test_u",
            "email": "test@gmail.com",
            "password": "test_pw",
            "otp": otp_num,
        }
        self.client.post(reverse("register"), data)

        user = User.objects.get(username=data["username"])
        OTP_Request.objects.create(
            user=user,
            otp=otp_num,
            verified="False",
            created_at=datetime.datetime.now(),
            tries=0,
        )

        response = self.client.post(reverse("verify"), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_email_verify_fail_username(self):
        data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}

        response = self.client.post(reverse("verify"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_verify_fail_otp_tries(self):
        otp_num = "123456"
        data = {
            "username": "test_u",
            "email": "test@gmail.com",
            "password": "test_pw",
            "otp": otp_num,
        }
        self.client.post(reverse("register"), data)

        user = User.objects.get(username=data["username"])
        OTP_Request.objects.create(
            user=user,
            otp=otp_num,
            verified="False",
            created_at=datetime.datetime.now(),
            tries=5,
        )

        response = self.client.post(reverse("verify"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_verify_fail_otp_wrong(self):
        otp_num = "123456"
        otp_wrong_num = "345678"
        data = {
            "username": "test_u",
            "email": "test@gmail.com",
            "password": "test_pw",
            "otp": otp_wrong_num,
        }
        self.client.post(reverse("register"), data)

        user = User.objects.get(username=data["username"])
        OTP_Request.objects.create(
            user=user,
            otp=otp_num,
            verified="False",
            created_at=datetime.datetime.now(),
            tries=5,
        )

        response = self.client.post(reverse("verify"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_verify_fail_server_error(self):
        otp_num = "123456"
        data = {
            "username": "test_u",
            "email": "test@gmail.com",
            "password": "test_pw",
        }
        self.client.post(reverse("register"), data)

        user = User.objects.get(username=data["username"])
        OTP_Request.objects.create(
            user=user,
            otp=otp_num,
            verified="False",
            created_at=datetime.datetime.now(),
            tries=0,
        )

        response = self.client.post(reverse("verify"), data)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class OTPTest(APITestCase):
    def test_send_otp_success(self):
        data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}
        self.client.post(reverse("register"), data)

        response = self.client.post(reverse("send_otp"), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_send_otp_fail(self):
        data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}

        response = self.client.post(reverse("send_otp"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

# class FollowTest(APITestCase):
    # def test_follow_user(self):
    #     user1data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}
    #     user2data = {"username": "test_u2", "email": "test2@gmail.com", "password": "test_pw"}
        
    #     url = reverse("follow", kwargs={"target_address": user2data["username"], "self_address": user1data["username"]})
        
    #     response = self.client.post(url)
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     self.assertTrue(self.user1.following.filter(username=user2.username).exists())


    # def test_follow_user(self):
    #     # data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}
    #     # self.client.post(reverse("register"), data)

    #     # user = User.objects.get(username=data["username"])
    #     # user.verified = True
    #     # user.save()

    #     # response = self.client.post(reverse("login"), data)
    #     # self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
    #     user1 = User.objects.create_user(username="test_u1", email="test1@gmail.com", password="test_pw")
    #     user2 = User.objects.create_user(username="test_u2", email="test2@gmail.com", password="test_pw")
    #     self.client.force_login(user1)
        
    #     response = self.client.post(reverse("follow", kwargs={"pk": user2.id}))
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     self.assertEqual(user1.following.count(), 1)
        
    # def test_unfollow_user(self):
    #     user1 = User.objects.create_user(username="test_u1", email="test1@gmail.com", password="test_pw")
    #     user2 = User.objects.create_user(username="test_u2", email="test2@gmail.com", password="test_pw")
    #     self.client.force_login(user1)
        
    #     response = self.client.delete(reverse("unfollow", kwargs={"pk": user2.id}))
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     self.assertEqual(user1.following.count(), 0)

class UserInfoTest(APITestCase):
    def setUp(self):
        data = {"username": "test_u", "email": "test@gmail.com", "password": "test_pw"}
        User.objects.create(**data)
        response = self.client.post(reverse("register"), data)
        
    def test_get_user_info_by_username_success(self):
        response = self.client.post('/api/get_other_user_profile/test_u')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_user_get_other_user_fail(self):
        response = self.client.post('/api/get_other_user_profile/testerror')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "user does not exist")