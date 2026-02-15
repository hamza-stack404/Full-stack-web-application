"""Notification Service - Phase V Event-Driven Architecture

This microservice listens to reminder events and sends notifications to users.

When a reminder is due, this service:
1. Receives the reminder event from Kafka
2. Sends browser notification (via WebSocket to connected clients)
3. Could be extended to send email/SMS notifications
"""

from fastapi import FastAPI, Request
from dapr.ext.fastapi import DaprApp
from datetime import datetime, UTC
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Notification Service", version="1.0.0")
dapr_app = DaprApp(app)

DAPR_HTTP_PORT = 3500
DAPR_BASE_URL = f"http://localhost:{DAPR_HTTP_PORT}"


@app.post("/dapr/subscribe")
async def subscribe():
    """
    Dapr subscription endpoint.
    Tells Dapr which topics this service wants to subscribe to.
    """
    return [{
        "pubsubname": "kafka-pubsub",
        "topic": "tasks.reminders",
        "route": "/reminder-event"
    }]


@app.post("/reminder-event")
async def handle_reminder_event(request: Request):
    """
    Handle reminder events from Kafka.

    When a reminder is due, send notification to the user.
    """
    try:
        event = await request.json()
        event_type = event.get("event_type")
        payload = event.get("payload", {})
        user_id = event.get("user_id")

        logger.info(f"Received reminder event: {event_type} for task {payload.get('task_id')}")

        if event_type != "reminder.due":
            return {"status": "SUCCESS", "message": "Event ignored (not a reminder)"}

        # Extract reminder details
        task_id = payload.get("task_id")
        title = payload.get("title")
        due_at = payload.get("due_at")

        # Create notification message
        notification = {
            "type": "task_reminder",
            "user_id": user_id,
            "task_id": task_id,
            "title": title,
            "message": f"Task '{title}' is due soon!",
            "due_at": due_at,
            "timestamp": datetime.now(UTC).isoformat()
        }

        # Send notification via WebSocket service
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{DAPR_BASE_URL}/v1.0/invoke/websocket-service/method/notify",
                    json=notification,
                    timeout=5.0
                )
                response.raise_for_status()
                logger.info(f"Sent notification for task {task_id} to user {user_id}")
        except Exception as e:
            logger.error(f"Failed to send notification via WebSocket: {e}")
            # Don't fail the event processing if notification fails
            # Could implement retry logic or dead letter queue here

        # TODO: Add email/SMS notification support here
        # await send_email_notification(user_id, notification)
        # await send_sms_notification(user_id, notification)

        return {"status": "SUCCESS", "message": f"Notification sent for task {task_id}"}

    except Exception as e:
        logger.error(f"Failed to process reminder event: {e}", exc_info=True)
        return {"status": "RETRY", "message": str(e)}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "notification-service",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "notification-service",
        "description": "Handles sending notifications for task reminders",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
