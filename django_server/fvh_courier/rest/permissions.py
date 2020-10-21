from datetime import timedelta

from django.core.exceptions import ObjectDoesNotExist
from django.utils.timezone import now
from rest_framework import permissions

REVIEWER_GROUP = 'Reviewer'

# Deprecated in favor of UserRole subclasses:
COURIER_GROUP = 'Courier'
SENDER_GROUP = 'Sender'


class UserBelongsToGroup(permissions.IsAuthenticated):
    group_name = 'OVERRIDE IN SUBCLASSES!'

    def has_permission(self, request, view):
        return (super(UserBelongsToGroup, self).has_permission(request, view) and
                request.user.groups.filter(name=self.group_name).exists())


class IsCourier(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        try:
            return bool(request.user.courier.id)
        except (ObjectDoesNotExist, AttributeError):
            return False


class IsReviewer(UserBelongsToGroup):
    group_name = REVIEWER_GROUP


class IsReviewerOrCreator(permissions.BasePermission):
    def has_object_permission(self, request, view, image_note_obj):
        if request.user.is_anonymous:
            # Anonymous users can edit new anonymous notes in order to be able to attach an image to a freshly
            # created note:
            return image_note_obj.created_by is None and image_note_obj.created_at > now() - timedelta(minutes=1)
        if request.user.groups.filter(name=REVIEWER_GROUP).exists():
            return True
        return image_note_obj.created_by_id == request.user.id
