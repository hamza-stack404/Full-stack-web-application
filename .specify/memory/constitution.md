<!-- SYNC IMPACT REPORT
Version change: 1.0.0 → 1.1.0 (Phase V addition)
Added sections: ## Phase V: Advanced Cloud Deployment with Event-Driven Architecture
Modified principles: None (Phase I-IV unchanged)
Removed sections: None
Templates requiring updates:
  ⚠ pending - .specify/templates/plan-template.md (add Phase V architecture checks)
  ⚠ pending - .specify/templates/spec-template.md (add event-driven requirements)
  ⚠ pending - .specify/templates/tasks-template.md (add Dapr/Kafka task types)
Follow-up TODOs: None
Rationale: MINOR version bump - additive new phase with event-driven architecture principles
-->
# Todo web full Stack Constitution

## Core Principles

### Phase I: Foundation
All code follows established patterns and standards; consistent architecture patterns required across all components; clear separation of concerns with modular, reusable components.

### Phase II: API-First Development
All services expose functionality via RESTful APIs; consistent API design patterns across all services; comprehensive API documentation with OpenAPI specifications.

### Phase III: Real-time Collaboration
Real-time updates using WebSocket connections; collaborative features must be concurrent-safe; event-driven architecture for real-time synchronization.

### Phase IV: Local Kubernetes Deployment

#### Infrastructure Principles
- **Containerization-First**: Every service must run inside a Docker container
- **Declarative Infrastructure**: All Kubernetes resources defined as YAML manifests
- **Helm-Managed**: All deployments managed through Helm charts, no raw kubectl apply
- **AI-Assisted DevOps**: Use Gordon, kubectl-ai, and kagent for all infrastructure operations
- **Stateless Pods**: Pods must be stateless; all state lives in external Neon DB
- **Health-Aware**: All deployments must include health checks (livenessProbe, readinessProbe)
- **Secret Safety**: Zero hardcoded credentials; all secrets via Kubernetes Secrets managed by Helm

#### Phase IV Tech Stack Additions
- **Containerization**: Docker (Docker Desktop 4.53+)
- **Docker AI**: Gordon (Docker AI Agent)
- **Orchestration**: Kubernetes via Minikube
- **Package Manager**: Helm 3
- **AI DevOps**: kubectl-ai, Kagent
- **Local Cluster**: Minikube

#### Container Standards
- Frontend image: multi-stage build (build stage + production stage)
- Backend image: slim Python base image
- Both images must have .dockerignore to minimize build context
- Images tagged with version numbers (latest + semantic version)
- Container ports must match service ports in Helm templates

#### Kubernetes Resource Standards
- All resources must have proper labels: app, version, component
- Resource limits and requests must be defined for all containers
- Namespaces: use "todo-app" namespace for all resources
- Services: frontend = NodePort (external access), backend = ClusterIP (internal only)
- ConfigMaps for non-sensitive env vars, Secrets for sensitive data

#### Helm Chart Standards
- Single Helm chart covers frontend + backend
- values.yaml is single source of truth for all configuration
- Templates must use values references, zero hardcoded values in templates
- Chart must be installable with single command: helm install todo ./todo-chart
- Chart must support upgrade: helm upgrade todo ./todo-chart

#### Health Check Standards
- Frontend: GET /health returns 200
- Backend: GET /health returns 200 (already exists from Phase III)
- LivenessProbe: checks if container is alive
- ReadinessProbe: checks if container is ready to receive traffic
- Initial delay: 10 seconds, period: 30 seconds

#### Non-Negotiables for Phase IV
1. ❌ NEVER hardcode secrets in Dockerfiles or manifests
2. ❌ NEVER deploy without resource limits on containers
3. ❌ NEVER skip health probes on deployments
4. ❌ NEVER use raw kubectl apply — use Helm only
5. ❌ NEVER write Dockerfiles or manifests manually — use Claude Code
6. ✅ MUST keep Phase III application code completely unchanged
7. ✅ MUST use Gordon for Docker operations
8. ✅ MUST use kubectl-ai or kagent for Kubernetes operations
9. ✅ MUST maintain connection to external Neon database
10. ✅ MUST be deployable with single helm install command

### Phase V: Advanced Cloud Deployment with Event-Driven Architecture

#### Event-Driven Architecture Principles
- **Event Sourcing**: All significant actions must publish events to Kafka
- **Asynchronous Processing**: Background services consume events without blocking main app
- **Event Immutability**: Events are append-only, never modified or deleted
- **Schema Evolution**: Event payloads must support versioning for backward compatibility
- **Idempotency**: Event consumers must handle duplicate events gracefully
- **Eventual Consistency**: Accept that data may be temporarily out of sync across services
- **Pub/Sub Pattern**: Services communicate via Kafka topics, not direct API calls

#### Dapr Principles
- **Sidecar Architecture**: Every service pod runs Dapr sidecar for runtime capabilities
- **Component Abstraction**: Never import Kafka/Redis/cloud SDKs directly - use Dapr HTTP API
- **Declarative Configuration**: All Dapr components defined in YAML, not code
- **Service Mesh Patterns**: Use Dapr for service invocation, state management, pub/sub
- **Secrets Externalization**: All credentials managed via Dapr secrets component
- **Observability First**: Leverage Dapr's built-in tracing, metrics, and logging

#### Phase V Tech Stack Additions
- **Event Streaming**: Apache Kafka (Strimzi on K8s or Redpanda Cloud)
- **Microservices Runtime**: Dapr (sidecars on all pods)
- **Cloud Kubernetes**: Azure (AKS), Google (GKE), or Oracle (OKE)
- **State Store**: Redis (for Dapr state management)
- **Monitoring**: Prometheus + Grafana
- **Tracing**: Jaeger (distributed tracing)
- **CI/CD**: GitHub Actions
- **Secrets**: Kubernetes Secrets + Dapr Secrets API

#### Kafka Topic Standards
- **Naming Convention**: `<domain>.<entity>.<action>` (e.g., `tasks.task.created`)
- **Required Topics**:
  - `tasks.events` - All task CRUD operations
  - `tasks.reminders` - Scheduled reminder events
  - `tasks.updates` - Real-time sync events
- **Partitioning**: Partition by `user_id` for ordering guarantees per user
- **Retention**: 7 days minimum for audit trail
- **Replication**: 3 replicas minimum in production

#### Event Schema Standards
Every event must include:
- `event_id` (UUID) - Unique event identifier
- `event_type` (string) - Action type (created/updated/completed/deleted)
- `event_version` (string) - Schema version (e.g., "1.0")
- `timestamp` (ISO8601) - When event occurred
- `user_id` (string) - Who triggered the event
- `correlation_id` (UUID) - Request trace ID
- `payload` (object) - Event-specific data

#### Dapr Component Standards
- **Pub/Sub Component**: kafka-pubsub (type: pubsub.kafka)
- **State Store Component**: statestore (type: state.redis)
- **Secrets Component**: kubernetes-secrets (type: secretstores.kubernetes)
- **Jobs Component**: Use Dapr Jobs API for scheduled reminders
- **Service Invocation**: Use Dapr sidecar for inter-service calls

#### New Service Architecture

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

#### Advanced Features Standards

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

#### Cloud Deployment Standards
- **Environment**: Production (AKS/GKE/OKE)
- **Namespaces**: Separate per environment (dev/staging/prod)
- **TLS**: All external traffic HTTPS (cert-manager + Let's Encrypt)
- **Resource Limits**: All pods must have CPU/memory limits
- **Autoscaling**: HPA configured for all services
- **Health Checks**: All services have /health and /ready endpoints

#### CI/CD Pipeline Standards
- **Trigger**: On push to `main` branch
- **Stages**: Build → Test → Push → Deploy staging → Smoke test → Deploy prod
- **Rollback**: Automatic on health check failure
- **Secrets**: Store in GitHub Secrets

#### Monitoring Standards
- **Metrics**: Prometheus scrapes all pods
- **Dashboards**: Grafana for each service
- **Alerts**: Pod crashes, high error rate, Kafka lag, high latency
- **Tracing**: Jaeger for distributed traces

#### Non-Negotiables for Phase V
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

## Additional Constraints

Technology stack requirements include modern web frameworks, secure authentication mechanisms, and scalable database solutions. All services must be container-ready and follow 12-factor app methodology. Performance standards require sub-second response times for core functionality and horizontal scalability for load handling.

## Development Workflow

Development workflow follows trunk-based development with feature flags for safe deployments. Code review requirements mandate at least one approval before merging. Testing gates require all automated tests to pass before deployment. Deployment approval process includes security scanning and performance validation.

## Governance

Constitution supersedes all other development practices and standards. All amendments to this document require formal documentation, team approval, and migration plan for existing code. All pull requests and code reviews must verify compliance with these principles. Complexity must be justified with clear benefits outweighing costs. Use CLAUDE.md for runtime development guidance and best practices.

**Version**: 1.1.0 | **Ratified**: 2026-02-04 | **Last Amended**: 2026-02-14