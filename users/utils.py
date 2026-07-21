import logging
import traceback
from django.db import DatabaseError
from .models import AuditLog, SystemErrorLog

logger = logging.getLogger('tms')

def log_event(user, action, description, is_error=False, tb_data=None):
    """
    Hybrid Logging Coordinator.
    1. Write standard log message to the log file (tms.log) on disk.
    2. Try to write a structured event to the database.
    3. If database writing fails, write a critical fallback warning to the log file on disk.
    """
    # Step A: Format and write the message to tms.log on disk
    username = user.username if user and user.is_authenticated else 'System'
    log_msg = f"[{action}] - User: {username} - {description}"
    
    if is_error:
        logger.error(log_msg)
        if tb_data:
            logger.error(f"Traceback:\n{tb_data}")
    else:
        logger.info(log_msg)

    # Step B: Try writing structured log/error to SQL database
    try:
        if is_error:
            SystemErrorLog.objects.create(
                error_message=description,
                traceback_summary=tb_data or ""
            )
        else:
            AuditLog.objects.create(
                user=user if user and user.is_authenticated else None,
                action=action,
                description=description
            )
    except DatabaseError as db_err:
        # Step C: Fallback. Database is offline or locked.
        # Log the failure of the logger itself + original error to disk so nothing is lost.
        logger.critical(
            f"[DATABASE_FALLBACK_FAIL] Could not save {action} to database. "
            f"Original Event: {description}. Error: {db_err}"
        )
        logger.critical(f"Database Exception Detail:\n{traceback.format_exc()}")
