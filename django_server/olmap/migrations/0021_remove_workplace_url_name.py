# Generated by Django 3.2.10 on 2021-12-08 13:47

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('olmap', '0020_workplace_max_vehicle_height'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='workplace',
            name='url_name',
        ),
    ]
