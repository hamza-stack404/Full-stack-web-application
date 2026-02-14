---
id: 003
title: Add Phase V Event-Driven Architecture
stage: constitution
date: 2026-02-14
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 003-k8s-deployment
user: Noman Traders
command: /sp.constitution
labels: ["constitution", "phase-v", "event-driven", "dapr", "kafka", "cloud-deployment"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

Update the existing constitution to add Phase V requirements. Keep all Phase I-IV content unchanged. Append the following:

---ADD TO CONSTITUTION---

## Phase V: Advanced Cloud Deployment with Event-Driven Architecture

### Event-Driven Architecture Principles
- **Event Sourcing**: All significant actions must publish events to Kafka
- **Asynchronous Processing**: Background services consume events without blocking main app
- **Event Immutability**: Events are append-only, never modified or deleted
- **Schema Evolution**: Event payloads must support versioning for backward compatibility
- **Idempotency**: Event consumers must handle duplicate events gracefully
- **Eventual Consistency**: Accept that data may be temporarily out of sync across services
- **Pub/Sub Pattern**: Services communicate via Kafka topics, not direct API calls

### Dapr Principles
- **Sidecar Architecture**: Every service pod runs Dapr sidecar for runtime capabilities
- **Component Abstraction**: Never import Kafka/Redis/cloud SDKs directly - use Dapr HTTP API
- **Declarative Configuration**: All Dapr components defined in YAML, not code
- **Service Mesh Patterns**: Use Dapr for service invocation, state management, pub/sub
- **Secrets Externalization**: All credentials managed via Dapr secrets component
- **Observability First**: Leverage Dapr's built-in tracing, metrics, and logging

### Phase V Tech Stack Additions
- **Event Streaming**: Apache Kafka (Strimzi on K8s or Redpanda Cloud)
- **Microservices Runtime**: Dapr (sidecars on all pods)
- **Cloud Kubernetes**: Azure (AKS), Google (GKE), or Oracle (OKE)
- **State Store**: Redis (for Dapr state management)
- **Monitoring**: Prometheus + Grafana
- **Tracing**: Jaeger (distributed tracing)
- **CI/CD**: GitHub Actions
- **Secrets**: Kubernetes Secrets + Dapr Secrets API

### Kafka Topic Standards
- **Naming Convention**: `<domain>.<entity>.<action>` (e.g., `tasks.task.created`)
- **Required Topics**:
  - `tasks.events` - All task CRUD operations
  - `tasks.reminders` - Scheduled reminder events
  - `tasks.updates` - Real-time sync events
- **Partitioning**: Partition by `user_id` for ordering guarantees per user
- **Retention**: 7 days minimum for audit trail
- **Replication**: 3 replicas minimum in production

### Event Schema Standards
Every event must include:
- `event_id` (UUID) - Unique event identifier
- `event_type` (string) - Action type (created/updated/completed/deleted)
- `event_version` (string) - Schema version (e.g., "1.0")
- `timestamp` (ISO8601) - When event occurred
- `user_id` (string) - Who triggered the event
- `correlation_id` (UUID) - Request trace ID
- `payload` (object) - Event-specific data

### Dapr Component Standards
- **Pub/Sub Component**: kafka-pubsub (type: pubsub.kafka)
- **State Store Component**: statestore (type: state.redis)
- **Secrets Component**: kubernetes-secrets (type: secretstores.kubernetes)
- **Jobs Component**: Use Dapr Jobs API for scheduled reminders
- **Service Invocation**: Use Dapr sidecar for inter-service calls

### New Service Architecture

**Recurring Task Service:**
- Consumes: `tasks.events` (filter: event_type="completed" + is_recurring=true)
- Produces: `tasks.events` (event_type="created" for next occurrence)
- State: Tracks next occurrence timestamps
- Scaling: Stateless, horizontal scaling

**Notification Service:**
- Consumes: `tasks.reminders` (scheduled reminder events)
- Produces: Push notifications (external)
- State: Tracks sent notifications
- Scaling: Stateless, horizontal scaling

**Audit Service:**
- Consumes: `tasks.events` (all events)
- Produces: None (sink service)
- State: Writes to audit log table
- Scaling: Stateless, horizontal scaling

**WebSocket Service:**
- Consumes: `tasks.updates` (real-time sync events)
- Produces: WebSocket messages to connected clients
- State: Active WebSocket connections (in-memory)
- Scaling: Sticky sessions required

### Advanced Features Standards

**Recurring Tasks:**
- Field: `recurrence_pattern` (JSON)
- Format: `{"frequency": "daily|weekly|monthly", "interval": 1, "end_date": "2026-12-31"}`
- Behavior: On completion, Recurring Task Service creates next occurrence

**Due Dates & Reminders:**
- Fields: `due_date` (datetime), `remind_before_minutes` (int, default: 30)
- Behavior: Schedule reminder via Dapr Jobs API at `due_date - remind_before_minutes`

**Priorities:**
- Field: `priority` (enum: "low", "medium", "high", "urgent")
- Default: "medium"

**Tags/Categories:**
- Fields: `tags` (array), `category` (string)
- Validation: Max 10 tags per task, each max 20 chars

**Search & Filter:**
- Search fields: `title`, `description`, `tags`
- Filter fields: `status`, `priority`, `category`, `due_date_range`, `tags`

### Cloud Deployment Standards
- **Environment**: Production (AKS/GKE/OKE)
- **Namespaces**: Separate per environment (dev/staging/prod)
- **TLS**: All external traffic HTTPS (cert-manager + Let's Encrypt)
- **Resource Limits**: All pods must have CPU/memory limits
- **Autoscaling**: HPA configured for all services
- **Health Checks**: All services have /health and /ready endpoints

### CI/CD Pipeline Standards
- **Trigger**: On push to `main` branch
- **Stages**: Build → Test → Push → Deploy staging → Smoke test → Deploy prod
- **Rollback**: Automatic on health check failure
- **Secrets**: Store in GitHub Secrets

### Monitoring Standards
- **Metrics**: Prometheus scrapes all pods
- **Dashboards**: Grafana for each service
- **Alerts**: Pod crashes, high error rate, Kafka lag, high latency
- **Tracing**: Jaeger for distributed traces

### Non-Negotiables for Phase V
1. ❌ NEVER call Kafka directly - always use Dapr Pub/Sub API
2. ❌ NEVER store state in pod memory - use Dapr state or database
3. ❌ NEVER hardcode service URLs - use Dapr service invocation
4. ❌ NEVER expose secrets in env vars - use Dapr secrets
5. ❌ NEVER deploy without resource limits and health checks
6. ❌ NEVER process events synchronously in main API
7. ✅ MUST maintain backward compatibility with Phase IV
8. ✅ MUST publish events for every task operation
9. ✅ MUST use Spec-Driven Development
10. ✅ MUST test locally on Minikube before cloud
11. ✅ MUST implement idempotent event consumers
12. ✅ MUST configure CI/CD pipeline

---END ADDITIONS---

## Response snapshot

Constitution updated successfully from version 1.0.0 to 1.1.0. Added comprehensive Phase V requirements covering:

- Event-Driven Architecture principles (event sourcing, async processing, immutability, idempotency)
- Dapr sidecar architecture and component abstraction patterns
- Kafka topic standards with naming conventions and required topics
- Event schema standards with versioning support
- Four new microservices: Recurring Task, Notification, Audit, and WebSocket services
- Advanced features: recurring tasks, due dates/reminders, priorities, tags/categories, search/filter
- Cloud deployment standards for AKS/GKE/OKE with TLS, autoscaling, health checks
- CI/CD pipeline standards with GitHub Actions
- Monitoring standards with Prometheus, Grafana, and Jaeger
- 12 non-negotiable rules for Phase V implementation

All Phase I-IV content preserved unchanged. Version bump rationale: MINOR (additive new phase).

## Outcome

- ✅ Impact: Constitution v1.1.0 established with Phase V event-driven architecture principles
- 🧪 Tests: N/A (documentation update)
- 📁 Files: Updated .specify/memory/constitution.md
- 🔁 Next prompts: Run /sp.specify or /sp.plan for Phase V feature implementation
- 🧠 Reflection: Successfully added comprehensive event-driven architecture standards while maintaining backward compatibility with all previous phases

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Template updates for plan/spec/tasks to include Phase V checks
