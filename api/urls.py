from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

urlpatterns = [
    path("register/", views.user_register, name="register"),
    path("login/", views.user_login, name="login"),
    # path("profile/", views.profile, name="profile"),
    path('profile/<str:other_username>/', views.profile, name='profile'),
    path("verify/", views.email_verify),
    path("send-otp/", views.send_otp, name="send_otp"),
    path("recover/", views.send_recovery, name="recover"),
    path("verify-recovery/", views.verify_recovery),
    path("update-password/", views.update_password),
    path("google-oauth/", views.google_verify),
    path("full_profile/", views.full_profile, name="full_profile"),
    path("update-user-info/", views.update_user_info),
    path("request-follow/", views.follow),
    path("request-unfollow/", views.unfollow),
    path("get_other_user_profile/<str:other_username>/", views.get_other_user_profile),

]

urlpatterns = format_suffix_patterns(urlpatterns)
