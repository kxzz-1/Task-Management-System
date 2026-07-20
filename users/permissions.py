from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to Admin users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.name == 'ADMIN'
        )

class IsPM(permissions.BasePermission):
    """
    Allows access only to PM users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.name == 'PM'
        )

class IsDeveloper(permissions.BasePermission):
    """
    Allows access only to Developer users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.name == 'DEVELOPER'
        )

class IsAdminOrSelf(permissions.BasePermission):
    """
    Allows access to Admin, or the user themselves (for editing profile).
    """
    def has_object_permission(self, request, view, obj):
        # User with manage_users permission can edit anyone
        if request.user and request.user.is_authenticated and request.user.has_system_permission('manage_users'):
            return True
        # Users can edit their own profile
        return obj == request.user

def HasSystemPermission(codename):
    """
    Dynamic helper that returns a custom BasePermission class
    for checking a specific permission codename.
    """
    class DynamicPermission(permissions.BasePermission):
        def has_permission(self, request, view):
            return bool(
                request.user and 
                request.user.is_authenticated and 
                request.user.has_system_permission(codename)
            )
    return DynamicPermission
