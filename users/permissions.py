from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to Admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsPM(permissions.BasePermission):
    """
    Allows access only to PM users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PM')

class IsDeveloper(permissions.BasePermission):
    """
    Allows access only to Developer users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'DEVELOPER')

class IsAdminOrSelf(permissions.BasePermission):
    """
    Allows access to Admin, or the user themselves (for editing profile).
    """
    def has_object_permission(self, request, view, obj):
        # Admin can do anything
        if request.user and request.user.is_authenticated and request.user.role == 'ADMIN':
            return True
        # Users can edit their own profile
        return obj == request.user
