# Generated by Django 3.1.7 on 2021-05-07 12:41

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('olmap', '0007_auto_20210506_1604'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='office',
            name='image_note',
        ),
        migrations.RemoveField(
            model_name='shop',
            name='image_note',
        ),
        migrations.DeleteModel(
            name='Amenity',
        ),
        migrations.DeleteModel(
            name='Office',
        ),
        migrations.DeleteModel(
            name='Shop',
        ),
    ]
