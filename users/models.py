from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class Role(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    PM = "PM", "Project Manager"
    DEVELOPER = "DEVELOPER", "Developer"


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.DEVELOPER,
    )