"""Audit Service - Phase V Event-Driven Architecture

This microservice listens to all task events and writes them to the audit log
for compliance, debugging, and analytics purposes.

For every task event, this service:
1. Receives the event from Kafka
2. Extracts relevant information
3. Writes an immutable audit log entry to the database
"""

from fastapi import FastAPI, Request
from dapr.ext.fastapi import DaprApp
from datetime import datetime, UTC
from typing import Dict, Any, Optional
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Audit Service", version="1.0.0")
dapr_app = DaprApp(app)

DAPR_HTTP_PORT = 3500
DAPR_BASE_URL = f"http://localhost:{DAPR_HTTP_PORT}"


def extract_changes(event_type: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extract before/after changes from the event payload.

    Args:
        event_type: Type of event (created, updated, completed, deleted)
        payload: Event payload containing task data

    Returns:
        Dictionary with before/after values for updates, None for other events
    """
    if event_type == "updated":
        # For updates, payload should contain 'before' and 'after' states
        return {
            "before": payload.get("before", {}),
            "after": payload.get("after", {})
        }
    elif event_type == "completed":
        return {
            "before": {"is_completed": False},
            "after": {"is_completed": True}
        }
    else:
        # For created/deleted, no changes to track
        return None


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

    Write every event to the audit log for compliance and debugging.
    """
    try:
        event = await request.json()
        event_id = event.get("event_id")
        event_type = event.get("event_type")
        task_id = event.get("task_id")
        user_id = event.get("user_id")
        payload = event.get("payload", {})

        logger.info(f"Received event: {event_type} for task {task_id}")

        # Extract changes if applicable
        changes = extract_changes(event_type, payload)

        # Create audit log entry
        audit_entry = {
            "event_id": event_id,
            "task_id": task_id,
            "user_id": user_id,
            "action": event_type,
            "changes": changes,
            "timestamp": datetime.now(UTC).isoformat()
        }

        # Write to database via backend service
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{DAPR_BASE_URL}/v1.0/invoke/backend-service/method/api/v1/audit-logs",
                    json=audit_entry,
                    timeout=10.0
                )
                response.raise_for_status()
                logger.info(f"Wrote audit log for event {event_id}")
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")
            # Return RETRY to have Kafka retry this message
            return {"status": "RETRY", "message": str(e)}

        return {"status": "SUCCESS", "message": f"Audit log created for event {event_id}"}

    except Exception as e:
        logger.error(f"Failed to process task event: {e}", exc_info=True)
        return {"status": "RETRY", "message": str(e)}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "audit-service",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "audit-service",
        "description": "Writes immutable audit logs for all task events",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
