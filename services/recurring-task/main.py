"""Recurring Task Service - Phase V Event-Driven Architecture

This microservice listens to task completion events and automatically creates
the next occurrence for recurring tasks.

When a recurring task is marked as completed, this service:
1. Calculates the next occurrence date based on recurrence pattern
2. Creates a new task instance via Dapr service invocation
3. Links the new task to the original via parent_task_id
"""

from fastapi import FastAPI, Request
from dapr.ext.fastapi import DaprApp
from datetime import datetime, timedelta, UTC
from typing import Dict, Any
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Recurring Task Service", version="1.0.0")
dapr_app = DaprApp(app)

DAPR_HTTP_PORT = 3500
DAPR_BASE_URL = f"http://localhost:{DAPR_HTTP_PORT}"


def calculate_next_occurrence(due_date: str, recurrence_pattern: Dict[str, Any]) -> datetime:
    """
    Calculate the next occurrence date based on recurrence pattern.

    Args:
        due_date: ISO format date string of the completed task
        recurrence_pattern: Dict with 'type' (daily/weekly/monthly) and 'interval'

    Returns:
        Next occurrence datetime
    """
    current_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
    pattern_type = recurrence_pattern.get('type', 'daily')
    interval = recurrence_pattern.get('interval', 1)

    if pattern_type == 'daily':
        return current_date + timedelta(days=interval)
    elif pattern_type == 'weekly':
        return current_date + timedelta(weeks=interval)
    elif pattern_type == 'monthly':
        # Approximate month as 30 days
        return current_date + timedelta(days=30 * interval)
    elif pattern_type == 'yearly':
        return current_date + timedelta(days=365 * interval)
    else:
        # Default to daily
        return current_date + timedelta(days=interval)


@app.post("/dapr/subscribe")
async def subscribe():
    """
    Dapr subscription endpoint.
    Tells Dapr which topics this service wants to subscribe to.
    """
    return [{
        "pubsubname": "kafka-pubsub",
        "topic": "tasks.events",
        "route": "/task-event"
    }]


@app.post("/task-event")
async def handle_task_event(request: Request):
    """
    Handle task lifecycle events from Kafka.

    When a recurring task is completed, create the next occurrence.
    """
    try:
        event = await request.json()
        event_type = event.get("event_type")
        payload = event.get("payload", {})

        logger.info(f"Received event: {event_type} for task {payload.get('id')}")

        # Only process completion events for recurring tasks
        if event_type != "completed":
            return {"status": "SUCCESS", "message": "Event ignored (not a completion)"}

        if not payload.get("is_recurring"):
            return {"status": "SUCCESS", "message": "Event ignored (not recurring)"}

        # Extract task details
        task_id = payload.get("id")
        user_id = event.get("user_id")
        title = payload.get("title")
        description = payload.get("description", "")
        priority = payload.get("priority", "medium")
        category = payload.get("category")
        tags = payload.get("tags", [])
        due_date = payload.get("due_date")
        remind_before_minutes = payload.get("remind_before_minutes", 30)
        recurrence_pattern = payload.get("recurrence_pattern", {})

        if not due_date:
            logger.warning(f"Recurring task {task_id} has no due_date, cannot calculate next occurrence")
            return {"status": "SUCCESS", "message": "No due_date for recurring task"}

        # Calculate next occurrence
        next_due_date = calculate_next_occurrence(due_date, recurrence_pattern)

        # Create new task via Dapr service invocation to backend
        new_task_data = {
            "title": title,
            "description": description,
            "priority": priority,
            "category": category,
            "tags": tags,
            "due_date": next_due_date.isoformat(),
            "remind_before_minutes": remind_before_minutes,
            "is_recurring": True,
            "recurrence_pattern": recurrence_pattern,
            "parent_task_id": task_id,
            "is_completed": False
        }

        # Invoke backend service to create the task
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DAPR_BASE_URL}/v1.0/invoke/backend-service/method/api/v1/tasks",
                json=new_task_data,
                headers={"user-id": str(user_id)},
                timeout=10.0
            )
            response.raise_for_status()

        logger.info(f"Created next occurrence for recurring task {task_id}, due at {next_due_date}")

        return {"status": "SUCCESS", "message": f"Next occurrence created for task {task_id}"}

    except Exception as e:
        logger.error(f"Failed to process task event: {e}", exc_info=True)
        return {"status": "RETRY", "message": str(e)}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "recurring-task-service",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "recurring-task-service",
        "description": "Handles automatic creation of recurring task instances",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
