# Generated by Django 3.2 on 2023-04-10 12:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('crawls', '0008_auto_20230410_0717'),
    ]

    operations = [
        migrations.AddField(
            model_name='crawl',
            name='picture',
            field=models.TextField(blank=True, default=''),
        ),
    ]
