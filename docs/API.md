# API Documentation

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://your-api-domain.com`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

### Success Response
```json
{
  "data": { ... },
  "status": "success"
}
```

### Error Response
```json
{
  "detail": "Error message"
}
```

## Endpoints

### Authentication

#### POST /api/signup
Register a new user account.

**Request Body:**
```json
{
  "username": "string (required, min 1 char)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com"
}
```

**Error Responses:**
- `400 Bad Request` - Email/username already registered, password too short
- `422 Unprocessable Entity` - Invalid email format

---

#### POST /api/login
Login and receive JWT token.

**Request Body:** (application/x-www-form-urlencoded)
```
username=john@example.com&password=yourpassword
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- `400 Bad Request` - Incorrect username or password

---

### Tasks

#### GET /api/tasks
Get all tasks for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `skip` (optional): Number of tasks to skip (default: 0)
- `limit` (optional): Maximum number of tasks to return (default: 100)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "is_completed": false,
    "priority": "high",
    "category": "work",
    "due_date": "2024-02-01T10:00:00Z",
    "tags": ["documentation", "urgent"],
    "subtasks": [
      {
        "id": 1,
        "title": "Write endpoint descriptions",
        "is_completed": true
      }
    ],
    "is_recurring": false,
    "recurrence_pattern": null,
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-15T09:00:00Z",
    "owner_id": 1
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

#### POST /api/tasks
Create a new task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "string (required, non-empty)",
  "description": "string (optional)",
  "priority": "low | medium | high (optional, default: medium)",
  "category": "string (optional)",
  "due_date": "ISO 8601 datetime (optional)",
  "tags": ["string"] (optional, max 10 tags, max 30 chars each),
  "subtasks": [
    {
      "title": "string",
      "is_completed": false
    }
  ] (optional),
  "is_recurring": false (optional),
  "recurrence_pattern": "daily | weekly | monthly (optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": 2,
  "title": "New task",
  "description": null,
  "is_completed": false,
  "priority": "medium",
  "category": null,
  "due_date": null,
  "tags": [],
  "subtasks": [],
  "is_recurring": false,
  "recurrence_pattern": null,
  "created_at": "2024-01-20T14:30:00Z",
  "updated_at": "2024-01-20T14:30:00Z",
  "owner_id": 1
}
```

**Error Responses:**
- `400 Bad Request` - Empty title, invalid priority, too many tags
- `401 Unauthorized` - Missing or invalid token

---

#### GET /api/tasks/{task_id}
Get a specific task by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `task_id`: Integer task ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Task title",
  ...
}
```

**Error Responses:**
- `404 Not Found` - Task not found or doesn't belong to user
- `401 Unauthorized` - Missing or invalid token

---

#### PUT /api/tasks/{task_id}
Update an existing task.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `task_id`: Integer task ID

**Request Body:** (all fields optional)
```json
{
  "title": "string",
  "description": "string",
  "is_completed": true,
  "priority": "high",
  "category": "personal",
  "due_date": "2024-02-15T10:00:00Z",
  "tags": ["updated", "important"],
  "subtasks": [
    {
      "id": 1,
      "title": "Updated subtask",
      "is_completed": true
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Updated title",
  ...
}
```

**Error Responses:**
- `404 Not Found` - Task not found
- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Missing or invalid token

---

#### DELETE /api/tasks/{task_id}
Delete a task.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `task_id`: Integer task ID

**Response:** `200 OK`
```json
{
  "message": "Task deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Task not found
- `401 Unauthorized` - Missing or invalid token

---

#### POST /api/tasks/bulk-delete
Delete multiple tasks at once.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "task_ids": [1, 2, 3, 4]
}
```

**Response:** `200 OK`
```json
{
  "deleted_count": 4,
  "message": "4 tasks deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

### AI Chatbot

#### GET /api/conversations
Get all conversations for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Task Planning",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T11:30:00Z",
    "user_id": 1
  }
]
```

---

#### POST /api/conversations
Create a new conversation.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "string (optional, default: 'New Conversation')"
}
```

**Response:** `200 OK`
```json
{
  "id": 2,
  "title": "New Conversation",
  "created_at": "2024-01-20T15:00:00Z",
  "updated_at": "2024-01-20T15:00:00Z",
  "user_id": 1
}
```

---

#### GET /api/conversations/{conversation_id}
Get a conversation with its messages.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `conversation_id`: Integer conversation ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Task Planning",
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "Create a task for tomorrow",
      "created_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "I've created a task for tomorrow. What would you like to name it?",
      "created_at": "2024-01-15T10:00:05Z"
    }
  ],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:05Z",
  "user_id": 1
}
```

---

#### POST /api/conversations/{conversation_id}/messages
Send a message in a conversation.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `conversation_id`: Integer conversation ID

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Response:** `200 OK`
```json
{
  "user_message": {
    "id": 3,
    "role": "user",
    "content": "Show me my high priority tasks",
    "created_at": "2024-01-15T11:00:00Z"
  },
  "assistant_message": {
    "id": 4,
    "role": "assistant",
    "content": "Here are your high priority tasks: ...",
    "created_at": "2024-01-15T11:00:02Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Conversation not found
- `503 Service Unavailable` - AI service unavailable

---

#### DELETE /api/conversations/{conversation_id}
Delete a conversation and all its messages.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `conversation_id`: Integer conversation ID

**Response:** `200 OK`
```json
{
  "message": "Conversation deleted successfully"
}
```

---

### Health & Monitoring

#### GET /health
Basic health check endpoint.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected"
}
```

---

#### GET /api/health
Comprehensive health check with detailed status.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "service": "todo-backend",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    },
    "environment": {
      "status": "healthy",
      "message": "All required environment variables present"
    },
    "ai_service": {
      "status": "available",
      "message": "AI service configured"
    }
  }
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default Limit**: 100 requests per minute per IP address
- **Response**: `429 Too Many Requests` when limit exceeded

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642345678
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - External service down |

---

## Data Models

### Task
```typescript
{
  id: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: "low" | "medium" | "high";
  category: string | null;
  due_date: string | null; // ISO 8601
  tags: string[];
  subtasks: Subtask[];
  is_recurring: boolean;
  recurrence_pattern: "daily" | "weekly" | "monthly" | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  owner_id: number;
}
```

### Subtask
```typescript
{
  id: number;
  title: string;
  is_completed: boolean;
}
```

### User
```typescript
{
  id: number;
  username: string;
  email: string;
}
```

### Conversation
```typescript
{
  id: number;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  user_id: number;
}
```

### Message
```typescript
{
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
```

---

## Examples

### Complete Task Creation Flow

```bash
# 1. Sign up
curl -X POST http://localhost:8000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepass123"
  }'

# 2. Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john@example.com&password=securepass123"

# Response: {"access_token": "eyJ...", "token_type": "bearer"}

# 3. Create a task
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete API documentation",
    "description": "Write comprehensive docs",
    "priority": "high",
    "tags": ["documentation", "urgent"],
    "due_date": "2024-02-01T17:00:00Z"
  }'

# 4. Get all tasks
curl -X GET http://localhost:8000/api/tasks \
  -H "Authorization: Bearer eyJ..."

# 5. Update task
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "is_completed": true
  }'
```

---

For interactive API documentation, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
