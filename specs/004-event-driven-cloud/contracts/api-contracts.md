# Phase V API Contracts

**Date**: 2026-02-14
**Feature**: 004-event-driven-cloud
**Status**: Complete

## Overview

This document defines all API contracts for Phase V, including REST APIs, Kafka event schemas, and WebSocket message protocols.

---

## REST API Endpoints

### Base URL
- **Local**: `http://localhost:8000`
- **Production**: `https://api.todo.example.com`

### Authentication
All endpoints require JWT authentication via Better Auth.

**Header**:
```
Authorization: Bearer <jwt_token>
```

---

## Task Management API (Extended)

### 1. Create Task

**Endpoint**: `POST /api/tasks`

**Request Body**:
```json
{
  "title": "Task title",
  "description": "Task description",
  "priority": "medium",
  "category": "work",
  "tags": ["urgent", "backend"],
  "due_date": "2026-02-20T17:00:00Z",
  "remind_before_minutes": 60,
  "is_recurring": false,
  "recurrence_pattern": null
}
```

**Request Schema**:
```typescript
interface CreateTaskRequest {
  title: string;                    // Required, max 255 chars
  description?: string;              // Optional
  priority?: "low" | "medium" | "high" | "urgent";  // Default: "medium"
  category?: string;                 // Optional, max 50 chars
  tags?: string[];                   // Optional, max 10 tags, each max 20 chars
  due_date?: string;                 // Optional, ISO 8601 format
  remind_before_minutes?: number;    // Optional, default: 30, min: 0
  is_recurring?: boolean;            // Optional, default: false
  recurrence_pattern?: RecurrencePattern;  // Required if is_recurring=true
}

interface RecurrencePattern {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;                  // Min: 1
  day_of_week?: number;              // 0-6, required if frequency=weekly
  day_of_month?: number;             // 1-31, required if frequency=monthly
  end_date?: string;                 // Optional, ISO 8601 format
}
```

**Response** (201 Created):
```json
{
  "id": 123,
  "user_id": "user_abc",
  "title": "Task title",
  "description": "Task description",
  "completed": false,
  "priority": "medium",
  "category": "work",
  "tags": ["urgent", "backend"],
  "due_date": "2026-02-20T17:00:00Z",
  "remind_before_minutes": 60,
  "is_recurring": false,
  "recurrence_pattern": null,
  "parent_task_id": null,
  "created_at": "2026-02-14T10:00:00Z",
  "updated_at": "2026-02-14T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input (e.g., invalid priority, too many tags)
- `401 Unauthorized`: Missing or invalid JWT token
- `422 Unprocessable Entity`: Validation errors

---

### 2. Update Task

**Endpoint**: `PATCH /api/tasks/{task_id}`

**Request Body** (all fields optional):
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "high",
  "category": "personal",
  "tags": ["urgent"],
  "due_date": "2026-02-21T17:00:00Z",
  "remind_before_minutes": 120,
  "is_recurring": false,
  "recurrence_pattern": null
}
```

**Response** (200 OK):
```json
{
  "id": 123,
  "user_id": "user_abc",
  "title": "Updated title",
  "description": "Updated description",
  "completed": false,
  "priority": "high",
  "category": "personal",
  "tags": ["urgent"],
  "due_date": "2026-02-21T17:00:00Z",
  "remind_before_minutes": 120,
  "is_recurring": false,
  "recurrence_pattern": null,
  "parent_task_id": null,
  "created_at": "2026-02-14T10:00:00Z",
  "updated_at": "2026-02-14T11:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Task not found or not owned by user

---

### 3. Complete Task

**Endpoint**: `POST /api/tasks/{task_id}/complete`

**Request Body**: None

**Response** (200 OK):
```json
{
  "id": 123,
  "user_id": "user_abc",
  "title": "Task title",
  "completed": true,
  "priority": "medium",
  "category": "work",
  "tags": ["urgent"],
  "due_date": "2026-02-20T17:00:00Z",
  "remind_before_minutes": 60,
  "is_recurring": false,
  "recurrence_pattern": null,
  "parent_task_id": null,
  "created_at": "2026-02-14T10:00:00Z",
  "updated_at": "2026-02-14T12:00:00Z"
}
```

**Note**: If task is recurring, a new task instance is automatically created by the Recurring Task Service.

---

### 4. Delete Task

**Endpoint**: `DELETE /api/tasks/{task_id}`

**Request Body**: None

**Response** (204 No Content)

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Task not found or not owned by user

---

### 5. Get Tasks (with filters and search)

**Endpoint**: `GET /api/tasks`

**Query Parameters**:
```
?search=keyword
&status=incomplete|complete
&priority=low|medium|high|urgent
&category=work
&tags=urgent,backend
&due_date=today|tomorrow|this_week
&sort_by=due_date|priority|created_at|title
&sort_order=asc|desc
&limit=50
&offset=0
```

**Query Schema**:
```typescript
interface GetTasksQuery {
  search?: string;                   // Search in title/description
  status?: "incomplete" | "complete";
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
  tags?: string;                     // Comma-separated
  due_date?: "today" | "tomorrow" | "this_week";
  sort_by?: "due_date" | "priority" | "created_at" | "title";
  sort_order?: "asc" | "desc";
  limit?: number;                    // Default: 50, max: 100
  offset?: number;                   // Default: 0
}
```

**Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": 123,
      "user_id": "user_abc",
      "title": "Task title",
      "description": "Task description",
      "completed": false,
      "priority": "high",
      "category": "work",
      "tags": ["urgent", "backend"],
      "due_date": "2026-02-20T17:00:00Z",
      "remind_before_minutes": 60,
      "is_recurring": false,
      "recurrence_pattern": null,
      "parent_task_id": null,
      "created_at": "2026-02-14T10:00:00Z",
      "updated_at": "2026-02-14T11:30:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

### 6. Get Task by ID

**Endpoint**: `GET /api/tasks/{task_id}`

**Response** (200 OK):
```json
{
  "id": 123,
  "user_id": "user_abc",
  "title": "Task title",
  "description": "Task description",
  "completed": false,
  "priority": "medium",
  "category": "work",
  "tags": ["urgent"],
  "due_date": "2026-02-20T17:00:00Z",
  "remind_before_minutes": 60,
  "is_recurring": false,
  "recurrence_pattern": null,
  "parent_task_id": null,
  "created_at": "2026-02-14T10:00:00Z",
  "updated_at": "2026-02-14T11:30:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Task not found or not owned by user

---

### 7. Get Task Audit History

**Endpoint**: `GET /api/tasks/{task_id}/audit`

**Response** (200 OK):
```json
{
  "audit_logs": [
    {
      "id": 1,
      "event_id": "550e8400-e29b-41d4-a716-446655440000",
      "task_id": 123,
      "user_id": "user_abc",
      "action": "created",
      "changes": null,
      "timestamp": "2026-02-14T10:00:00Z"
    },
    {
      "id": 2,
      "event_id": "550e8400-e29b-41d4-a716-446655440001",
      "task_id": 123,
      "user_id": "user_abc",
      "action": "updated",
      "changes": {
        "priority": {
          "old": "medium",
          "new": "high"
        },
        "tags": {
          "old": ["urgent"],
          "new": ["urgent", "backend"]
        }
      },
      "timestamp": "2026-02-14T11:30:00Z"
    },
    {
      "id": 3,
      "event_id": "550e8400-e29b-41d4-a716-446655440002",
      "task_id": 123,
      "user_id": "user_abc",
      "action": "completed",
      "changes": null,
      "timestamp": "2026-02-14T12:00:00Z"
    }
  ],
  "total": 3
}
```

---

## Dapr Jobs API (Internal)

### Schedule Reminder

**Endpoint**: `POST /api/jobs/schedule-reminder`

**Request Body**:
```json
{
  "task_id": 123,
  "user_id": "user_abc",
  "title": "Task title",
  "due_date": "2026-02-20T17:00:00Z",
  "remind_before_minutes": 60
}
```

**Response** (200 OK):
```json
{
  "job_id": "reminder-123-1708520400",
  "scheduled_at": "2026-02-20T16:00:00Z"
}
```

**Note**: This endpoint is called internally by the backend after task creation/update. Dapr Jobs will trigger the reminder at the scheduled time.

---

## Kafka Event Schemas

### Topic: tasks.events

**Purpose**: All task lifecycle events (created, updated, completed, deleted)

**Partition Key**: `user_id` (ensures ordering per user)

**Event Schema**:
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "created",
  "event_version": "1.0",
  "timestamp": "2026-02-14T10:00:00Z",
  "user_id": "user_abc",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_id": 123,
  "payload": {
    "task": {
      "id": 123,
      "user_id": "user_abc",
      "title": "Task title",
      "description": "Task description",
      "completed": false,
      "priority": "medium",
      "category": "work",
      "tags": ["urgent", "backend"],
      "due_date": "2026-02-20T17:00:00Z",
      "remind_before_minutes": 60,
      "is_recurring": false,
      "recurrence_pattern": null,
      "parent_task_id": null,
      "created_at": "2026-02-14T10:00:00Z",
      "updated_at": "2026-02-14T10:00:00Z"
    },
    "changes": null
  }
}
```

**Event Types**:

1. **created**: New task created
   - `payload.changes`: null

2. **updated**: Task modified
   - `payload.changes`: Object with before/after values
   ```json
   "changes": {
     "priority": {"old": "medium", "new": "high"},
     "tags": {"old": ["urgent"], "new": ["urgent", "backend"]}
   }
   ```

3. **completed**: Task marked as complete
   - `payload.changes`: null
   - `payload.task.completed`: true

4. **deleted**: Task deleted
   - `payload.changes`: null

**Consumers**:
- Recurring Task Service (filters: event_type=completed AND is_recurring=true)
- Audit Service (all events)

**Retention**: 7 days

---

### Topic: tasks.reminders

**Purpose**: Scheduled reminders for tasks with due dates

**Partition Key**: `user_id`

**Event Schema**:
```json
{
  "reminder_id": "reminder-123-1708520400",
  "task_id": 123,
  "user_id": "user_abc",
  "title": "Task title",
  "due_date": "2026-02-20T17:00:00Z",
  "remind_at": "2026-02-20T16:00:00Z",
  "timestamp": "2026-02-20T16:00:00Z"
}
```

**Producers**: Dapr Jobs (scheduled by backend)

**Consumers**: Notification Service

**Retention**: 24 hours

---

### Topic: tasks.updates

**Purpose**: Real-time task updates for WebSocket broadcasting

**Partition Key**: `user_id`

**Event Schema**:
```json
{
  "update_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_abc",
  "task_id": 123,
  "update_type": "created",
  "timestamp": "2026-02-14T10:00:00Z",
  "task": {
    "id": 123,
    "user_id": "user_abc",
    "title": "Task title",
    "description": "Task description",
    "completed": false,
    "priority": "medium",
    "category": "work",
    "tags": ["urgent"],
    "due_date": "2026-02-20T17:00:00Z",
    "remind_before_minutes": 60,
    "is_recurring": false,
    "recurrence_pattern": null,
    "parent_task_id": null,
    "created_at": "2026-02-14T10:00:00Z",
    "updated_at": "2026-02-14T10:00:00Z"
  }
}
```

**Update Types**: created, updated, completed, deleted

**Producers**: Backend (after each task operation)

**Consumers**: WebSocket Service

**Retention**: 1 hour

---

## WebSocket Protocol

### Connection

**Endpoint**: `ws://backend:8000/ws/{user_id}`

**Authentication**: JWT token in query parameter
```
ws://backend:8000/ws/user_abc?token=<jwt_token>
```

**Connection Flow**:
1. Client connects with JWT token
2. Server validates token
3. Server adds connection to user's connection pool
4. Server sends connection confirmation

**Connection Confirmation**:
```json
{
  "type": "connected",
  "user_id": "user_abc",
  "timestamp": "2026-02-14T10:00:00Z"
}
```

---

### Message Types

#### 1. Task Update (Server → Client)

```json
{
  "type": "task_update",
  "update_type": "created",
  "task": {
    "id": 123,
    "user_id": "user_abc",
    "title": "Task title",
    "description": "Task description",
    "completed": false,
    "priority": "medium",
    "category": "work",
    "tags": ["urgent"],
    "due_date": "2026-02-20T17:00:00Z",
    "remind_before_minutes": 60,
    "is_recurring": false,
    "recurrence_pattern": null,
    "parent_task_id": null,
    "created_at": "2026-02-14T10:00:00Z",
    "updated_at": "2026-02-14T10:00:00Z"
  },
  "timestamp": "2026-02-14T10:00:00Z"
}
```

**Update Types**: created, updated, completed, deleted

---

#### 2. Ping/Pong (Keepalive)

**Client → Server**:
```json
{
  "type": "ping"
}
```

**Server → Client**:
```json
{
  "type": "pong",
  "timestamp": "2026-02-14T10:00:00Z"
}
```

**Frequency**: Every 30 seconds

---

#### 3. Error (Server → Client)

```json
{
  "type": "error",
  "code": "UNAUTHORIZED",
  "message": "Invalid or expired token",
  "timestamp": "2026-02-14T10:00:00Z"
}
```

**Error Codes**:
- `UNAUTHORIZED`: Invalid or expired JWT token
- `INTERNAL_ERROR`: Server error
- `RATE_LIMIT`: Too many messages

---

#### 4. Disconnect (Server → Client)

```json
{
  "type": "disconnect",
  "reason": "Server shutting down",
  "timestamp": "2026-02-14T10:00:00Z"
}
```

**Disconnect Reasons**:
- `SERVER_SHUTDOWN`: Graceful shutdown
- `IDLE_TIMEOUT`: No activity for 5 minutes
- `UNAUTHORIZED`: Token expired

---

## Dapr Service Invocation

### Recurring Task Service → Backend

**Method**: `POST /api/tasks` (via Dapr)

**Dapr Invocation**:
```python
response = dapr_client.invoke_method(
    app_id="backend",
    method_name="api/tasks",
    data=task_data,
    http_verb="POST"
)
```

---

### WebSocket Service → Redis (State)

**Get User Connections**:
```python
connections = await dapr_client.get_state(
    store_name="statestore",
    key=f"ws-connections-{user_id}"
)
```

**Save User Connections**:
```python
await dapr_client.save_state(
    store_name="statestore",
    key=f"ws-connections-{user_id}",
    value=connection_ids
)
```

---

## Error Response Format

All API errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "priority",
        "message": "Must be one of: low, medium, high, urgent"
      },
      {
        "field": "tags",
        "message": "Maximum 10 tags allowed"
      }
    ]
  },
  "timestamp": "2026-02-14T10:00:00Z"
}
```

**Error Codes**:
- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: Authentication failed
- `FORBIDDEN`: User not authorized for this resource
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (e.g., duplicate)
- `RATE_LIMIT`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Rate Limiting

**Limits**:
- REST API: 100 requests/minute per user
- WebSocket: 1 connection per user per device (max 5 devices)
- Kafka: No explicit limit (controlled by partition throughput)

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708520400
```

---

## Versioning

**API Version**: v1 (current)

**Version Header**:
```
Accept: application/vnd.todo.v1+json
```

**Deprecation Notice**:
- Breaking changes will be introduced in v2
- v1 will be supported for 6 months after v2 release

---

## Testing Contracts

### Contract Tests

Use Pact or similar for contract testing between services:

**Example (Backend → Kafka)**:
```python
def test_task_created_event_schema():
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "created",
        "event_version": "1.0",
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": "test_user",
        "correlation_id": str(uuid.uuid4()),
        "task_id": 123,
        "payload": {...}
    }

    # Validate against JSON schema
    validate(event, task_event_schema)
```

**Example (WebSocket Service → Frontend)**:
```typescript
test('task_update message schema', () => {
  const message = {
    type: 'task_update',
    update_type: 'created',
    task: {...},
    timestamp: new Date().toISOString()
  };

  expect(message).toMatchSchema(taskUpdateSchema);
});
```

---

## Next Steps

1. Create quickstart.md for local development setup
2. Proceed to Phase 2: Task breakdown (`/sp.tasks`)
3. Implement contract tests for all schemas
4. Set up API documentation (Swagger/OpenAPI)
