from rest_framework.routers import DefaultRouter
from .views import UserViewSet, CustomRoleViewSet, SystemPermissionViewSet

router = DefaultRouter()
router.register("users", UserViewSet)
router.register("roles", CustomRoleViewSet)
router.register("system-permissions", SystemPermissionViewSet)

urlpatterns = router.urls