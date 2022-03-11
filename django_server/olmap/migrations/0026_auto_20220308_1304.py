# Generated by Django 3.2.10 on 2022-03-08 11:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('olmap', '0025_populate_layer_field'),
    ]

    operations = [
        migrations.AlterField(
            model_name='entrance',
            name='opening_hours',
            field=models.CharField(blank=True, help_text='E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00', max_length=256),
        ),
        migrations.AlterField(
            model_name='gate',
            name='opening_hours',
            field=models.CharField(blank=True, help_text='E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00', max_length=256),
        ),
        migrations.AlterField(
            model_name='unloadingplace',
            name='opening_hours',
            field=models.CharField(blank=True, help_text='E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00', max_length=256),
        ),
        migrations.AlterField(
            model_name='workplace',
            name='opening_hours',
            field=models.CharField(blank=True, help_text='E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00', max_length=256),
        ),
    ]
