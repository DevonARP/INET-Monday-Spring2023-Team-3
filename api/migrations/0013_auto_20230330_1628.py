# Generated by Django 2.2 on 2023-03-30 16:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_auto_20230329_2005'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='date_of_birth',
        ),
        migrations.RemoveField(
            model_name='user',
            name='location',
        ),
        migrations.RemoveField(
            model_name='usertest',
            name='date_of_birth',
        ),
        migrations.RemoveField(
            model_name='usertest',
            name='location',
        ),
        migrations.AddField(
            model_name='user',
            name='followers',
            field=models.ManyToManyField(blank=True, related_name='_user_followers_+', to='api.User'),
        ),
        migrations.AddField(
            model_name='usertest',
            name='followers',
            field=models.ManyToManyField(blank=True, related_name='_usertest_followers_+', to='api.UserTest'),
        ),
    ]
