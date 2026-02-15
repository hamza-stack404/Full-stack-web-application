"""WebSocket Service - Phase V Event-Driven Architecture

This microservice manages WebSocket connections for real-time task updates.

Features:
1. Maintains persistent WebSocket connections with clients
2. Listens to task update events from Kafka
3. Broadcasts updates to connected clients in real-time
4. Handles connection lifecycle (connect, disconnect, reconnect)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp
from datetime import datetime, UTC
from typing import Dict, Set
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WebSocket Service", version="1.0.0")
dapr_app = DaprApp(app)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active WebSocket connections by user_id
# Format: {user_id: Set[WebSocket]}
active_connections: Dict[int, Set[WebSocket]] = {}


class ConnectionManager:
    """Manages WebSocket connections for users."""

    def connect(self, user_id: int, websocket: WebSocket):
        """Register a new WebSocket connection for a user."""
        if user_id not in active_connections:
            active_connections[user_id] = set()
        active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected. Total connections: {len(active_connections[user_id])}")

    def disconnect(self, user_id: int, websocket: WebSocket):
        """Remove a WebSocket connection for a user."""
        if user_id in active_connections:
            active_connections[user_id].discard(websocket)
            if not active_connections[user_id]:
                del active_connections[user_id]
            logger.info(f"User {user_id} disconnected. Remaining connections: {len(active_connections.get(user_id, []))}")

    async def send_to_user(self, user_id: int, message: dict):
        """Send a message to all connections for a specific user."""
        if user_id not in active_connections:
            logger.debug(f"No active connections for user {user_id}")
            return

        disconnected = set()
        for websocket in active_connections[user_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")
                disconnected.add(websocket)

        # Clean up disconnected websockets
        for websocket in disconnected:
            self.disconnect(user_id, websocket)

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected users."""
        for user_id in list(active_connections.keys()):
            await self.send_to_user(user_id, message)


manager = ConnectionManager()


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """
    WebSocket endpoint for real-time task updates.

    Clients connect to this endpoint and receive real-time updates
    when their tasks are created, updated, completed, or deleted.
    """
    await websocket.accept()
    manager.connect(user_id, websocket)

    try:
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "user_id": user_id,
            "timestamp": datetime.now(UTC).isoformat()
        })

        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            # Echo back for ping/pong
            if data == "ping":
                await websocket.send_text("pong")
            else:
                logger.debug(f"Received message from user {user_id}: {data}")

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        logger.info(f"User {user_id} disconnected normally")
    except Exception as e:
        manager.disconnect(user_id, websocket)
        logger.error(f"WebSocket error for user {user_id}: {e}")


@app.post("/dapr/subscribe")
async def subscribe():
    """
    Dapr subscription endpoint.
    Tells Dapr which topics this service wants to subscribe to.
    """
    return [{
        "pubsubname": "kafka-pubsub",
        "topic": "tasks.updates",
        "route": "/task-update"
    }]


@app.post("/task-update")
async def handle_task_update(request: Request):
    """
    Handle task update events from Kafka.

    Broadcast updates to connected clients in real-time.
    """
    try:
        update = await request.json()
        user_id = update.get("user_id")
        task_id = update.get("task_id")
        action = update.get("action")
        task = update.get("task", {})

        logger.info(f"Received update: {action} for task {task_id} (user {user_id})")

        # Create WebSocket message
        ws_message = {
            "type": "task_update",
            "action": action,
            "task_id": task_id,
            "task": task,
            "timestamp": update.get("timestamp", datetime.now(UTC).isoformat())
        }

        # Send to specific user
        await manager.send_to_user(user_id, ws_message)

        return {"status": "SUCCESS", "message": f"Update sent to user {user_id}"}

    except Exception as e:
        logger.error(f"Failed to process task update: {e}", exc_info=True)
        return {"status": "RETRY", "message": str(e)}


@app.post("/notify")
async def send_notification(request: Request):
    """
    Send a notification to a user via WebSocket.

    This endpoint is called by the notification service.
    """
    try:
        notification = await request.json()
        user_id = notification.get("user_id")

        logger.info(f"Sending notification to user {user_id}")

        # Send notification via WebSocket
        await manager.send_to_user(user_id, notification)

        return {"status": "SUCCESS", "message": f"Notification sent to user {user_id}"}

    except Exception as e:
        logger.error(f"Failed to send notification: {e}", exc_info=True)
        return {"status": "ERROR", "message": str(e)}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "websocket-service",
        "version": "1.0.0",
        "active_users": len(active_connections),
        "total_connections": sum(len(conns) for conns in active_connections.values())
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "websocket-service",
        "description": "Manages WebSocket connections for real-time task updates",
        "version": "1.0.0",
        "websocket_endpoint": "/ws/{user_id}"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
