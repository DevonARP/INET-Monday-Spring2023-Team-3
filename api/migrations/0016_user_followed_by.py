# Generated by Django 2.2 on 2023-03-30 17:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0015_auto_20230330_1702'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='followed_by',
            field=models.ManyToManyField(blank=True, related_name='followedby', to='api.User'),
        ),
    ]
