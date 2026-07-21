from rest_framework.routers import DefaultRouter
from .views import UserViewSet, CustomRoleViewSet, SystemPermissionViewSet, LogViewSet

router = DefaultRouter()
router.register("users", UserViewSet)
router.register("roles", CustomRoleViewSet)
router.register("system-permissions", SystemPermissionViewSet)
router.register("logs", LogViewSet, basename="logs")

urlpatterns = router.urls