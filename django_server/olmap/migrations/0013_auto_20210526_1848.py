# Generated by Django 3.1.7 on 2021-05-26 15:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('olmap', '0012_auto_20210512_1307'),
    ]

    operations = [
        migrations.AddField(
            model_name='entrance',
            name='description',
            field=models.CharField(blank=True, max_length=96),
        ),
        migrations.AddField(
            model_name='workplaceentrance',
            name='deliveries',
            field=models.CharField(blank=True, choices=[['no', 'no'], ['yes', 'yes'], ['main', 'main']], max_length=32),
        ),
        migrations.AddField(
            model_name='workplaceentrance',
            name='description',
            field=models.CharField(blank=True, max_length=64),
        ),
    ]
