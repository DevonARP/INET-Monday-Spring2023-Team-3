# Generated by Django 3.2 on 2023-04-10 10:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_auto_20230410_0717'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='profile_pic',
            field=models.TextField(blank=True, default=''),
        ),
    ]
