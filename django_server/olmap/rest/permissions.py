from datetime import timedelta

from django.utils.timezone import now
from rest_framework import permissions

REVIEWER_GROUP = 'Reviewer'


def user_is_reviewer(user):
    return user.groups.filter(name=REVIEWER_GROUP).exists()


class UserBelongsToGroup(permissions.IsAuthenticated):
    group_name = 'OVERRIDE IN SUBCLASSES!'

    def has_permission(self, request, view):
        return (super(UserBelongsToGroup, self).has_permission(request, view) and
                request.user.groups.filter(name=self.group_name).exists())


class IsReviewer(UserBelongsToGroup):
    group_name = REVIEWER_GROUP


class IsReviewerOrCreator(permissions.BasePermission):
    def has_object_permission(self, request, view, instance):
        image_note_obj = getattr(instance, 'image_note', instance)
        if request.user.is_anonymous:
            # Anonymous users can edit new anonymous notes in order to be able to attach an image to a freshly
            # created note:
            return image_note_obj.created_by is None and image_note_obj.created_at > now() - timedelta(minutes=30)
        if request.user.groups.filter(name=REVIEWER_GROUP).exists():
            return True
        return image_note_obj.created_by_id == request.user.id


class IsAuthenticatedOrNewDataPoint(permissions.BasePermission):
    def has_object_permission(self, request, view, instance):
        image_note_obj = getattr(instance, 'image_note', instance)
        # Anonymous users can edit new anonymous notes in order to be able to attach an image to a freshly
        # created note:
        return ((not request.user.is_anonymous) or
                (image_note_obj.created_by is None and image_note_obj.created_at > now() - timedelta(minutes=30)))
