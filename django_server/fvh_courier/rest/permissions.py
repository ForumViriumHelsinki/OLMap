from rest_framework import permissions

COURIER_GROUP = 'Courier'
REVIEWER_GROUP = 'Reviewer'


class UserBelongsToGroup(permissions.IsAuthenticated):
    group_name = 'OVERRIDE IN SUBCLASSES!'

    def has_permission(self, request, view):
        return (super(UserBelongsToGroup, self).has_permission(request, view) and
                request.user.groups.filter(name=self.group_name).exists())


class IsCourier(UserBelongsToGroup):
    group_name = COURIER_GROUP


class IsReviewer(UserBelongsToGroup):
    group_name = REVIEWER_GROUP
