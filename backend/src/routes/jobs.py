"""Jobs Callback Endpoint for Dapr Jobs API

This module handles callbacks from Dapr Jobs API for scheduled reminders.
When a reminder is due, Dapr calls this endpoint, and we publish the reminder event to Kafka.
"""

from fastapi import APIRouter, Request, HTTPException
from datetime import datetime, UTC
from uuid import uuid4
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

DAPR_HTTP_PORT = 3500
DAPR_BASE_URL = f"http://localhost:{DAPR_HTTP_PORT}"
TOPIC_REMINDERS = "tasks.reminders"


@router.post("/trigger")
async def handle_job_trigger(request: Request):
    """
    Handle Dapr Job trigger callback.

    This endpoint is called by Dapr when a scheduled job (reminder) is due.
    It publishes a reminder event to Kafka for the notification service to process.

    Expected job data format:
    {
        "task_id": int,
        "user_id": int,
        "title": str,
        "due_at": str (ISO format)
    }

    Returns:
        {"status": "SUCCESS"} on success
        {"status": "FAILURE", "error": str} on failure
    """
    try:
        # Parse job data from Dapr
        job_payload = await request.json()
        job_data = job_payload.get("data", {})

        if not job_data:
            logger.error("No job data in payload")
            raise HTTPException(status_code=400, detail="Missing job data")

        # Validate required fields
        required_fields = ["task_id", "user_id", "title", "due_at"]
        for field in required_fields:
            if field not in job_data:
                logger.error(f"Missing required field: {field}")
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")

        # Create reminder event
        reminder_event = {
            "event_id": str(uuid4()),
            "event_type": "reminder.due",
            "event_version": "1.0",
            "timestamp": datetime.now(UTC).isoformat(),
            "user_id": job_data["user_id"],
            "task_id": job_data["task_id"],
            "correlation_id": str(uuid4()),
            "payload": {
                "task_id": job_data["task_id"],
                "title": job_data["title"],
                "due_at": job_data["due_at"],
                "reminder_sent_at": datetime.now(UTC).isoformat()
            }
        }

        # Publish reminder event to Kafka via Dapr
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DAPR_BASE_URL}/v1.0/publish/kafka-pubsub/{TOPIC_REMINDERS}",
                json=reminder_event,
                timeout=5.0
            )
            response.raise_for_status()

        logger.info(f"Published reminder event for task {job_data['task_id']}")

        return {"status": "SUCCESS"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process job trigger: {e}")
        return {"status": "FAILURE", "error": str(e)}


@router.get("/health")
async def health_check():
    """Health check endpoint for jobs service."""
    return {"status": "healthy", "service": "jobs-callback"}
