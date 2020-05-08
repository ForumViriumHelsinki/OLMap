from django.core.exceptions import ObjectDoesNotExist
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
