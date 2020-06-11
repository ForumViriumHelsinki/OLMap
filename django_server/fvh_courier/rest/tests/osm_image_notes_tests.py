import os

from django.contrib.auth.models import Group, User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status

from .base import FVHAPITestCase
from fvh_courier import models
from fvh_courier.rest.permissions import REVIEWER_GROUP


class OSMImageNotesTests(FVHAPITestCase):
    def create_and_login_reviewer(self):
        user = User.objects.create(username='reviewer', first_name='Regina', last_name='Reviewer')
        user.groups.add(Group.objects.get(name=REVIEWER_GROUP))
        self.client.force_login(user)
        return user

    def test_save_osm_image_note(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # When requesting to save an OSM image note over ReST
        url = reverse('osmimagenote-list')
        fields = {
            'lat': '60.16134701761975',
            'lon': '24.944593941327188',
            'comment': 'Nice view',
            'osm_features': [3330783778, 3336789583, 3330783754],
            'tags': ['Entrance', 'Steps']
        }
        response = self.client.post(url, data=fields, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And a note is created in db:
        note = models.OSMImageNote.objects.get()

        # And it registers the user as the creator of the note:
        self.assertEqual(note.created_by_id, courier.user_id)
        self.assertEqual(note.modified_by_id, courier.user_id)

        # And it creates any passed tags:
        self.assertSetEqual(set(note.tags.values_list('tag', flat=True)), set(fields['tags']))

        # And when subsequently requesting to attach an image to the note
        with open(os.path.join(os.path.dirname(__file__), 'test_image.png'), 'rb') as file:
            file_content = file.read()
        uploaded_file = SimpleUploadedFile("image.png", file_content, content_type="image/png")
        url = reverse('osmimagenote-detail', kwargs={'pk': note.id})
        response = self.client.patch(url, data={'image': uploaded_file}, format='multipart')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And a note is updated in db:
        note = models.OSMImageNote.objects.get()
        self.assertEqual(note.image.name, f'osm_image_notes/{note.id}/image.png')

    def test_save_osm_image_note_with_no_features(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # When requesting to save an OSM image note over ReST, giving an empty list of features to which to link
        url = reverse('osmimagenote-list')
        fields = {
            'lat': '60.16134701761975',
            'lon': '24.944593941327188',
            'comment': 'Nice view',
            'osm_features': []
        }
        response = self.client.post(url, data=fields, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And a note is created in db:
        note = models.OSMImageNote.objects.get()

    def test_update_osm_image_note_features(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # And given a successfully created OSM image note
        note = models.OSMImageNote.objects.create(lat='60.16134701761975', lon='24.944593941327188')

        # When requesting to update an OSM image note over ReST, giving a list of features to which to link
        url = reverse('osmimagenote-detail', kwargs={'pk': note.id})
        response = self.client.patch(url, data={'osm_features': [37812542837, 12735437812]}, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the note is updated in db:
        note = models.OSMImageNote.objects.get()
        self.assertEqual(note.osm_features.count(), 2)

        # And when subsequently requesting any of the associated features over ReST:
        url = reverse('osmfeature-detail', kwargs={'pk': 37812542837})
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the image note is included in the response:
        self.assertEqual(response.json()['image_notes'][0]['id'], note.id)

    def test_update_osm_image_note_tags(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # And given a successfully created OSM image note
        note = models.OSMImageNote.objects.create(lat='60.16134701761975', lon='24.944593941327188')

        # When requesting to update an OSM image note over ReST, giving a list of tags to add
        url = reverse('osmimagenote-detail', kwargs={'pk': note.id})
        fields = {'tags': ['Entrance', 'Steps']}
        response = self.client.patch(url, data=fields, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the passed tags are created:
        note = models.OSMImageNote.objects.get()
        self.assertSetEqual(set(note.tags.values_list('tag', flat=True)), set(fields['tags']))

        # And when subsequently requesting to update the note, giving another list of tags
        fields = {'tags': ['Entrance']}
        response = self.client.patch(url, data=fields, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the tags have been changed:
        note = models.OSMImageNote.objects.get()
        self.assertSetEqual(set(note.tags.values_list('tag', flat=True)), set(fields['tags']))

    def test_review_features(self):
        # Given that a reviewer user is signed in
        user = self.create_and_login_reviewer()

        # And given a successfully created OSM image note
        note = models.OSMImageNote.objects.create(lat='60.16134701761975', lon='24.944593941327188')

        # When requesting to mark the OSM image note as processed over ReST
        url = reverse('osmimagenote-mark-processed', kwargs={'pk': note.id})
        response = self.client.put(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the note is updated in db:
        note = models.OSMImageNote.objects.get()
        self.assertEqual(note.processed_by_id, user.id)

        # And when requesting to mark the OSM image note as reviewed over ReST
        url = reverse('osmimagenote-mark-reviewed', kwargs={'pk': note.id})
        response = self.client.put(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And a note is updated in db:
        note = models.OSMImageNote.objects.get()
        self.assertEqual(note.reviewed_by_id, user.id)

    def test_hide_features(self):
        # Given that a reviewer user is signed in
        user = self.create_and_login_reviewer()

        # And given a successfully created OSM image note
        note = models.OSMImageNote.objects.create(lat='60.16134701761975', lon='24.944593941327188')

        # When requesting to mark the OSM image note as hidden over ReST
        url = reverse('osmimagenote-hide-note', kwargs={'pk': note.id})
        response = self.client.put(url, data={'hidden_reason': 'Too ugly.'})

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And a note is updated in db:
        note = models.OSMImageNote.objects.get()
        self.assertEqual(note.reviewed_by_id, user.id)
        self.assertEqual(note.hidden_reason, 'Too ugly.')

        # And the note is not shown in further requests to list OSM image notes
        url = reverse('osmimagenote-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_vote_on_osm_image_note(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # And given a successfully created OSM image note
        note = models.OSMImageNote.objects.create(lat='60.16134701761975', lon='24.944593941327188')

        # When requesting to upvote the OSM image note over ReST
        url = reverse('osmimagenote-upvote', kwargs={'pk': note.id})
        response = self.client.put(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the upvote is created:
        note = models.OSMImageNote.objects.get()
        self.assertSetEqual(set(response.json()['upvotes']), set([courier.user_id]))
        self.assertSetEqual(set(note.upvotes.values_list('user_id', flat=True)), set([courier.user_id]))

        # And when subsequently requesting to downvote the note
        url = reverse('osmimagenote-downvote', kwargs={'pk': note.id})
        response = self.client.put(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the votes have been changed:
        note = models.OSMImageNote.objects.get()
        self.assertSetEqual(set(note.upvotes.values_list('user_id', flat=True)), set())
        self.assertSetEqual(set(response.json()['downvotes']), set([courier.user_id]))
        self.assertSetEqual(set(note.downvotes.values_list('user_id', flat=True)), set([courier.user_id]))

    def test_comment_on_osm_image_note(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # And given a successfully created OSM image note
        note = models.OSMImageNote.objects.create(lat='60.16134701761975', lon='24.944593941327188')

        # When requesting to comment the OSM image note over ReST
        url = reverse('osmimagenotecomment-list')
        response = self.client.post(url, {'image_note': note.id, 'comment': 'nice!'})

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And the comment is created:
        note = models.OSMImageNote.objects.get()
        self.assertSetEqual(set(note.comments.values_list('comment', flat=True)), set(['nice!']))

        # And it is included with the note when fetched over ReST
        url = reverse('osmimagenote-detail', kwargs={'pk': note.id})
        response = self.client.get(url)
        self.assertEqual(response.json()['comments'][0]['comment'], 'nice!')

        # And when subsequently requesting to delete the note
        url = reverse('osmimagenotecomment-detail', kwargs={'pk': note.comments.first().id})
        response = self.client.delete(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # And the comment is deleted:
        note = models.OSMImageNote.objects.get()
        self.assertSetEqual(set(note.comments.values_list('comment', flat=True)), set([]))

    def test_associate_entrance(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # When requesting to associate an entrance with businesses over ReST, giving OSM ids for the entrance &
        # businesses:
        url = reverse('osmentrance-detail', kwargs={'pk': 12345678})
        response = self.client.patch(url, {'associated_features': [23456789, 98765432]}, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the entrance, businesses & relations are created in the db:
        entrance = models.OSMFeature.objects.get(id=12345678)
        self.assertSetEqual(set(entrance.associated_features.values_list('id', flat=True)), {23456789, 98765432})

        # And when subsequently requesting the associated entrances for any of the associated features over ReST:
        url = reverse('osmfeature-detail', kwargs={'pk': 23456789})
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the entrance is included in the response:
        self.assertEqual(response.json()['associated_entrances'][0], 12345678)

    def test_osm_image_notes_as_geojson(self):
        # Given that there are some OSM image notes in the db
        note = models.OSMImageNote.objects.create(**{
            'lat': '60.16134701761975',
            'lon': '24.944593941327188',
            'comment': 'Nice view'})
        for id in [3330783778, 3336789583, 3330783754]:
            note.osm_features.create(id=id)

        # When requesting the notes as geojson
        url = reverse('osm_image_notes_geojson')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains the notes as geojson:
        self.assertDictEqual(response.json(), {
            'type': 'FeatureCollection',
            'features': [{
                'type': 'Feature',
                'geometry': {'type': 'Point', 'coordinates': [24.94459394, 60.16134702]},
                'properties': {
                    'id': note.id,
                    'comment': 'Nice view',
                    'lat': '60.16134702',
                    'lon': '24.94459394',
                    'is_processed': False,
                    'is_reviewed': False
                }
            }]
        })

    def test_rejected_image_notes_not_in_geojson(self):
        # And given that there are some OSM image notes in the db marked as not visible
        note = models.OSMImageNote.objects.create(**{
            'lat': '60.16134701761975',
            'lon': '24.944593941327188',
            'comment': 'Nice view',
            'visible': False})

        # When requesting the notes as geojson
        url = reverse('osm_image_notes_geojson')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it does not contain the invisible notes:
        self.assertDictEqual(response.json(), {
            'type': 'FeatureCollection',
            'features': []
        })
