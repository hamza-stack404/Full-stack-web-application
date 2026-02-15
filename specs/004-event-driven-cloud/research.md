# Phase V Research: Event-Driven Cloud Architecture

**Date**: 2026-02-14
**Feature**: 004-event-driven-cloud
**Status**: Complete

## Research Objectives

1. Analyze current Task model schema and identify migration path
2. Review existing MCP server tools and event publishing integration points
3. Research Kafka topic design patterns for multi-tenant applications
4. Investigate Dapr sidecar configuration and resource requirements
5. Study WebSocket scaling patterns in Kubernetes
6. Review Strimzi operator installation and configuration
7. Analyze frontend state management for real-time updates
8. Research browser notification API and permission handling

---

## 1. Current Task Model Analysis

### Existing Schema (Phase IV)

```python
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Migration Path

**New Fields to Add**:
- `priority` (String, default="medium") - Enum: low, medium, high, urgent
- `category` (String, nullable=True) - Optional category
- `tags` (ARRAY(String) or JSON) - PostgreSQL ARRAY or JSON field
- `due_date` (DateTime, nullable=True) - Optional deadline
- `remind_before_minutes` (Integer, default=30) - Reminder offset
- `is_recurring` (Boolean, default=False) - Recurring flag
- `recurrence_pattern` (JSON, nullable=True) - Pattern details
- `parent_task_id` (Integer, ForeignKey, nullable=True) - Link to original recurring task

**Migration Strategy**:
- All new fields are nullable or have defaults → backward compatible
- Existing tasks get default values (priority=medium, is_recurring=False)
- Use Alembic for online schema migration (no downtime)
- Add indexes on: priority, due_date, is_recurring for query performance

**Estimated Downtime**: None (online migration)

---

## 2. MCP Server Integration Points

### Current MCP Tools (Phase IV)

```python
# backend/services/mcp_server.py
@server.call_tool()
async def add_task(title: str, description: str = "") -> str:
    # Creates task in database
    # Returns success message

@server.call_tool()
async def update_task(task_id: int, title: str = None, description: str = None) -> str:
    # Updates task fields

@server.call_tool()
async def complete_task(task_id: int) -> str:
    # Marks task as completed

@server.call_tool()
async def delete_task(task_id: int) -> str:
    # Deletes task
```

### Event Publishing Integration

**Approach**: Add event publishing after each database operation

```python
from services.event_publisher import publish_task_event, publish_task_update

@server.call_tool()
async def add_task(title: str, description: str = "", priority: str = "medium",
                   tags: list = None, due_date: str = None, ...) -> str:
    # 1. Create task in database
    task = Task(...)
    db.add(task)
    db.commit()

    # 2. Publish events
    await publish_task_event("created", task.id, user_id, task.to_dict())
    await publish_task_update(user_id, task.id, "created", task.to_dict())

    # 3. Schedule reminder if due_date set
    if task.due_date:
        await schedule_reminder(task.id, user_id, task.title,
                               task.due_date, task.remind_before_minutes)

    return f"Task created: {task.title}"
```

**Key Findings**:
- Minimal changes to existing tool signatures (add optional parameters)
- Event publishing is async, non-blocking
- Dapr SDK provides publish_event() method
- Error handling: Log failures but don't block user operation

---

## 3. Kafka Topic Design

### Multi-Tenant Considerations

**Partitioning Strategy**: Partition by `user_id` hash
- Ensures all events for a user go to same partition → ordering guaranteed
- Allows parallel processing across users
- 3 partitions provides good balance for initial scale

**Topic Configuration**:

```yaml
# tasks.events
partitions: 3
replication-factor: 3
retention.ms: 604800000  # 7 days
cleanup.policy: delete
compression.type: snappy

# tasks.reminders
partitions: 3
replication-factor: 3
retention.ms: 86400000   # 24 hours
cleanup.policy: delete

# tasks.updates
partitions: 3
replication-factor: 3
retention.ms: 3600000    # 1 hour
cleanup.policy: delete
```

**Consumer Groups**:
- `recurring-task-service`: Subscribes to tasks.events (filter: completed + is_recurring)
- `audit-service`: Subscribes to tasks.events (all events)
- `websocket-service`: Subscribes to tasks.updates
- `notification-service`: Subscribes to tasks.reminders

**Key Findings**:
- 3 partitions sufficient for 10K users (3,333 users per partition)
- Retention policies match data lifecycle needs
- Compression reduces network/storage costs
- Consumer groups enable independent scaling

---

## 4. Dapr Sidecar Configuration

### Resource Requirements

**Per Pod**:
- CPU: 0.5 cores (request), 1 core (limit)
- Memory: 256Mi (request), 512Mi (limit)
- Adds ~50ms latency for service invocation
- Adds ~10ms latency for pub/sub

**Annotations**:

```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "backend"
  dapr.io/app-port: "8000"
  dapr.io/log-level: "info"
  dapr.io/enable-metrics: "true"
  dapr.io/metrics-port: "9090"
```

**Components**:
- Pub/Sub: Kafka (kafka-pubsub)
- State Store: Redis (statestore)
- Secret Store: Kubernetes secrets (kubernetes-secrets)

**Key Findings**:
- Sidecar adds ~200MB memory per pod (6 pods = 1.2GB total)
- mTLS enabled by default (no config needed)
- Metrics exposed for Prometheus scraping
- Graceful shutdown handled automatically

---

## 5. WebSocket Scaling Patterns

### Connection Management

**Pattern**: Sticky sessions with horizontal scaling

```
                    LoadBalancer
                         |
        +----------------+----------------+
        |                |                |
   WS Pod 1         WS Pod 2         WS Pod 3
   (5K conns)       (5K conns)       (5K conns)
```

**Implementation**:
- Use Kubernetes Service with `sessionAffinity: ClientIP`
- Each pod maintains in-memory connection map: `user_id -> [WebSocket]`
- On event, query Redis for user's pod assignment
- Broadcast to all connections for that user

**Scaling Strategy**:
- Horizontal Pod Autoscaler based on connection count
- Target: 5,000 connections per pod (leaves headroom)
- Scale up when avg > 4,000, scale down when avg < 2,000

**Key Findings**:
- Node.js/FastAPI can handle 10K+ WebSocket connections per pod
- Memory: ~10KB per connection = 50MB for 5K connections
- Sticky sessions prevent connection churn during scaling
- Redis pub/sub can coordinate cross-pod broadcasts if needed

---

## 6. Strimzi Operator

### Installation

```bash
# Add Strimzi Helm repo
helm repo add strimzi https://strimzi.io/charts/

# Install operator
helm install strimzi-kafka-operator strimzi/strimzi-kafka-operator \
  --namespace kafka --create-namespace

# Deploy Kafka cluster
kubectl apply -f kafka-cluster.yaml
```

### Cluster Configuration

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: todo-kafka
  namespace: kafka
spec:
  kafka:
    version: 3.6.0
    replicas: 3
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
    config:
      offsets.topic.replication.factor: 3
      transaction.state.log.replication.factor: 3
      transaction.state.log.min.isr: 2
    storage:
      type: persistent-claim
      size: 10Gi
  zookeeper:
    replicas: 3
    storage:
      type: persistent-claim
      size: 5Gi
```

**Key Findings**:
- Strimzi simplifies Kafka management on Kubernetes
- Persistent storage required for production
- 3 replicas provides high availability
- Internal listener sufficient (no external access needed)

---

## 7. Frontend State Management

### Current Approach (Phase IV)

- React state with useState/useEffect
- API calls via fetch
- No real-time updates (manual refresh)

### Phase V Approach

**WebSocket Integration**:

```typescript
// lib/websocket.ts
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string) {
    this.ws = new WebSocket(`ws://backend/ws/${userId}`);

    this.ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      // Dispatch to React state
      this.handleUpdate(update);
    };

    this.ws.onclose = () => {
      // Auto-reconnect with exponential backoff
      this.reconnect();
    };
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(userId), delay);
      this.reconnectAttempts++;
    }
  }
}
```

**State Updates**:
- WebSocket messages trigger React state updates
- Optimistic UI updates (immediate feedback)
- Server confirmation via WebSocket (reconciliation)

**Key Findings**:
- WebSocket API is well-supported in modern browsers
- Auto-reconnect essential for reliability
- Exponential backoff prevents thundering herd
- Optimistic updates improve perceived performance

---

## 8. Browser Notification API

### Permission Handling

```typescript
// Request permission on app load
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Send notification
function sendNotification(title: string, body: string, taskId: number) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/icon.png',
      tag: `task-${taskId}`,  // Prevents duplicates
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      // Navigate to task
      window.location.href = `/tasks/${taskId}`;
    };
  }
}
```

### Service Worker (Optional)

For background notifications when tab is closed:

```javascript
// service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon.png'
  });
});
```

**Key Findings**:
- Permission must be requested explicitly (user gesture)
- Notifications work when tab is active (no service worker needed initially)
- Service worker enables background notifications (Phase VI enhancement)
- Tag prevents duplicate notifications for same task

---

## Integration Points Summary

### Backend → Kafka
- Dapr SDK: `dapr_client.publish_event(pubsub_name, topic, data)`
- Async/await pattern (non-blocking)
- Error handling: Log and continue

### Kafka → Microservices
- Dapr subscription: `@app.subscribe(pubsub_name, topic)`
- Automatic deserialization
- At-least-once delivery

### Microservices → Database
- SQLAlchemy ORM (same as backend)
- Connection pooling
- Transaction management

### Microservices → WebSocket Service
- Dapr service invocation: `dapr_client.invoke_method(app_id, method, data)`
- Or publish to tasks.updates topic (preferred)

### WebSocket Service → Frontend
- WebSocket protocol
- JSON message format
- Auto-reconnect on disconnect

### Frontend → Backend
- REST API (existing)
- WebSocket for real-time updates (new)

---

## Risks and Mitigations

### Risk: Event Ordering
**Mitigation**: Kafka partitioning by user_id ensures per-user ordering

### Risk: WebSocket Scalability
**Mitigation**: Horizontal scaling with sticky sessions, 5K connections per pod

### Risk: Notification Reliability
**Mitigation**: Retry logic, in-app fallback, failure logging

### Risk: Kafka Consumer Lag
**Mitigation**: Monitoring, auto-scaling, optimized processing

### Risk: Data Migration
**Mitigation**: Online migration, backward-compatible changes, staging tests

### Risk: Microservice Coordination
**Mitigation**: Dapr reliability, circuit breakers, dead letter queues

### Risk: Cloud Costs
**Mitigation**: Resource limits, cost monitoring, right-sizing

---

## Technology Decisions

| Decision | Chosen | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Event Streaming | Kafka | Redis Pub/Sub, RabbitMQ | Persistence, replay, scalability |
| Service Mesh | Dapr | Istio, Linkerd | Simpler, language-agnostic, built-in pub/sub |
| State Store | Redis | PostgreSQL, etcd | Fast, Dapr-native, good for WebSocket state |
| WebSocket Library | Native API | Socket.io, ws | No extra dependencies, sufficient for needs |
| Kafka Operator | Strimzi | Confluent, Manual | Open-source, Kubernetes-native, well-maintained |

---

## Next Steps

1. Create data-model.md with complete schema definitions
2. Create contracts/api-contracts.md with REST and event schemas
3. Create quickstart.md for local development setup
4. Proceed to Phase 2: Task breakdown (`/sp.tasks`)

---

## References

- Kafka Documentation: https://kafka.apache.org/documentation/
- Dapr Documentation: https://docs.dapr.io/
- Strimzi Documentation: https://strimzi.io/docs/
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- Notification API: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
