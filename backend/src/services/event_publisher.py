"""Event Publisher Service for Phase V Event-Driven Architecture

This module provides functions to publish task events to Kafka via Dapr,
schedule reminders using Dapr Jobs API, and broadcast real-time updates.
"""

import httpx
from datetime import datetime, timedelta, UTC
from uuid import uuid4
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Dapr sidecar port
DAPR_HTTP_PORT = 3500
DAPR_BASE_URL = f"http://localhost:{DAPR_HTTP_PORT}"

# Kafka topics
TOPIC_EVENTS = "tasks.events"
TOPIC_REMINDERS = "tasks.reminders"
TOPIC_UPDATES = "tasks.updates"


async def publish_task_event(
    event_type: str,
    task_id: int,
    user_id: int,
    payload: Dict[str, Any],
    correlation_id: Optional[str] = None
) -> bool:
    """
    Publish a task lifecycle event to Kafka via Dapr.

    Args:
        event_type: Type of event (created, updated, completed, deleted)
        task_id: ID of the task
        user_id: ID of the user who triggered the event
        payload: Full task data at time of event
        correlation_id: Optional correlation ID for tracing

    Returns:
        True if published successfully, False otherwise
    """
    event = {
        "event_id": str(uuid4()),
        "event_type": event_type,
        "event_version": "1.0",
        "timestamp": datetime.now(UTC).isoformat(),
        "user_id": user_id,
        "correlation_id": correlation_id or str(uuid4()),
        "task_id": task_id,
        "payload": payload
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DAPR_BASE_URL}/v1.0/publish/kafka-pubsub/{TOPIC_EVENTS}",
                json=event,
                timeout=5.0
            )
            response.raise_for_status()
            logger.info(f"Published {event_type} event for task {task_id}")
            return True
    except Exception as e:
        logger.error(f"Failed to publish event: {e}")
        return False


async def publish_task_update(
    user_id: int,
    task_id: int,
    action: str,
    task: Dict[str, Any]
) -> bool:
    """
    Publish a task update for real-time synchronization.

    Args:
        user_id: ID of the user who owns the task
        task_id: ID of the task
        action: Action performed (created, updated, completed, deleted)
        task: Current task data

    Returns:
        True if published successfully, False otherwise
    """
    update = {
        "user_id": user_id,
        "task_id": task_id,
        "action": action,
        "task": task,
        "timestamp": datetime.now(UTC).isoformat()
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DAPR_BASE_URL}/v1.0/publish/kafka-pubsub/{TOPIC_UPDATES}",
                json=update,
                timeout=5.0
            )
            response.raise_for_status()
            logger.info(f"Published update for task {task_id}")
            return True
    except Exception as e:
        logger.error(f"Failed to publish update: {e}")
        return False


async def schedule_reminder(
    task_id: int,
    user_id: int,
    title: str,
    due_date: datetime,
    remind_before_minutes: int = 30
) -> bool:
    """
    Schedule a reminder using Dapr Jobs API.

    Args:
        task_id: ID of the task
        user_id: ID of the user who owns the task
        title: Task title
        due_date: When the task is due
        remind_before_minutes: Minutes before due date to send reminder

    Returns:
        True if scheduled successfully, False otherwise
    """
    remind_at = due_date - timedelta(minutes=remind_before_minutes)

    # Don't schedule reminders in the past
    if remind_at <= datetime.now(UTC):
        logger.warning(f"Reminder time is in the past for task {task_id}")
        return False

    job_data = {
        "task_id": task_id,
        "user_id": user_id,
        "title": title,
        "due_at": due_date.isoformat()
    }

    job_name = f"reminder-task-{task_id}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DAPR_BASE_URL}/v1.0-alpha1/jobs/{job_name}",
                json={
                    "dueTime": remind_at.isoformat(),
                    "data": job_data
                },
                timeout=5.0
            )
            response.raise_for_status()
            logger.info(f"Scheduled reminder for task {task_id} at {remind_at}")
            return True
    except Exception as e:
        logger.error(f"Failed to schedule reminder: {e}")
        return False


async def cancel_reminder(task_id: int) -> bool:
    """
    Cancel a scheduled reminder.

    Args:
        task_id: ID of the task

    Returns:
        True if cancelled successfully, False otherwise
    """
    job_name = f"reminder-task-{task_id}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{DAPR_BASE_URL}/v1.0-alpha1/jobs/{job_name}",
                timeout=5.0
            )
            response.raise_for_status()
            logger.info(f"Cancelled reminder for task {task_id}")
            return True
    except Exception as e:
        logger.error(f"Failed to cancel reminder: {e}")
        return False
