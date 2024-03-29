# Generated by Django 3.2.10 on 2022-02-10 15:23

from django.db import migrations



def forwards(apps, schema_editor):
    Entrance = apps.get_model('olmap', 'Entrance')
    Gate = apps.get_model('olmap', 'Gate')
    UnloadingPlace = apps.get_model('olmap', 'UnloadingPlace')

    for Model in [Entrance, Gate, UnloadingPlace]:
        for i in Model.objects.all().filter(layer__lt=0):
            i.image_note.layer = i.layer
            i.image_note.save()


class Migration(migrations.Migration):

    dependencies = [
        ('olmap', '0024_osmimagenote_layer'),
    ]

    operations = [
        migrations.RunPython(forwards, lambda m, s: None)
    ]
