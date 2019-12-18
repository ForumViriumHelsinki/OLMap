# Generated by Django 3.0 on 2019-12-17 15:40

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('fvh_courier', '0005_package_uuid'),
    ]

    operations = [
        migrations.CreateModel(
            name='PackageSMS',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('modified_at', models.DateTimeField(auto_now=True)),
                ('message_type', models.PositiveSmallIntegerField(choices=[(0, 'reservation'), (1, 'pickup'), (2, 'delivery')])),
                ('recipient_number', models.CharField(max_length=32)),
                ('twilio_sid', models.CharField(max_length=64)),
                ('content', models.TextField()),
                ('package', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sms_messages', to='fvh_courier.Package')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]