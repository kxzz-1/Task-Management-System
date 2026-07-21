from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db import DatabaseError
import logging

logger = logging.getLogger('tms')

class TMSApiException(Exception):
    """
    A single, unified custom exception class representing all custom 
    business rule and validation violations in the TMS application.
    """
    def __init__(self, detail, status_code=status.HTTP_400_BAD_REQUEST, code="bad_request"):
        self.detail = detail
        self.status_code = status_code
        self.code = code
        super().__init__(detail)

def global_api_exception_handler(exc, context):
    """
    Global exception handler that maps native crashes and custom exceptions
    to standard, presentable JSON responses for the frontend.
    """
    # 1. If it is our unified TMSApiException, map it to the API response format
    if isinstance(exc, TMSApiException):
        return Response(
            {
                "detail": exc.detail,
                "code": exc.code
            },
            status=exc.status_code
        )

    # 2. If it is a database crash (Postgres offline), map it to a 503 response
    if isinstance(exc, DatabaseError):
        logger.critical(f"[GLOBAL_DATABASE_FAILURE] Database connection crash: {exc}", exc_info=True)
        return Response(
            {
                "is_database_down": True,
                "error": "The system database is currently unreachable. Please try again later."
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    # 3. Otherwise, delegate to Django REST Framework's default exception mapping
    return exception_handler(exc, context)
