from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, TaskStatusViewSet

router = DefaultRouter()
router.register("tasks", TaskViewSet)
router.register("task-statuses", TaskStatusViewSet)

urlpatterns = router.urls