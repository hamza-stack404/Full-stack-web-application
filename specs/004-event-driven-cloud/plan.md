# Implementation Plan: Phase V - Event-Driven Cloud Architecture

**Branch**: `004-event-driven-cloud` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-event-driven-cloud/spec.md`

## Summary

Phase V transforms the Todo Chatbot into a production-ready, event-driven microservices architecture deployed on cloud Kubernetes. This phase adds advanced task management features (recurring tasks, reminders, priorities, tags, search/filter/sort), real-time synchronization across devices, and comprehensive audit logging. The technical approach uses Kafka for event streaming, Dapr for service communication, Redis for state management, and WebSockets for real-time updates.

## Technical Context

**Language/Version**: Python 3.11 (backend/services), TypeScript/Next.js 14 (frontend)
**Primary Dependencies**:
- Backend: FastAPI, SQLAlchemy, Alembic, Dapr SDK, aiokafka
- Frontend: Next.js, React, WebSocket API, Notifications API
- Infrastructure: Kafka 3.0+, Dapr 1.12+, Redis 6.0+, Strimzi Operator

**Storage**: Neon PostgreSQL (extended schema), Redis (Dapr state), Kafka (event log)
**Testing**: pytest (backend), Jest/React Testing Library (frontend), integration tests
**Target Platform**: Cloud Kubernetes (AKS/GKE/OKE), Linux containers
**Project Type**: Web application with microservices architecture
**Performance Goals**:
- API: p95 < 200ms
- Search: < 500ms
- Real-time sync: < 2 seconds
- Event processing: < 1 second
- 10,000 concurrent users, 1,000 ops/sec

**Constraints**:
- Kafka consumer lag < 100 messages
- WebSocket: 5,000 connections/pod
- 99.9% uptime
- Zero data loss on pod restart
- Backward compatible with Phase I-IV

**Scale/Scope**:
- 6 services (2 existing + 4 new microservices)
- 3 Kafka topics with 3 partitions each
- 8 new database fields, 2 new tables
- 34 functional requirements across 7 user stories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ **Simplicity**: Event-driven architecture justified by real-time sync and audit requirements
- ✅ **Testability**: Each microservice independently testable, clear contracts
- ✅ **Minimal Dependencies**: Kafka/Dapr are industry-standard, well-supported
- ✅ **Clear Boundaries**: Each service has single responsibility
- ⚠️ **Complexity**: 4 new microservices adds operational complexity - justified by scalability needs
- ✅ **Performance**: Architecture designed for 10K concurrent users
- ✅ **Security**: Dapr mTLS, secrets management, Kafka partitioning by user_id

## High-Level Architecture

```
CLOUD KUBERNETES CLUSTER
│
├── Namespace: kafka
│   └── Kafka Cluster (Strimzi)
│       ├── 3 Brokers
│       ├── 3 Zookeeper
│       └── Topics: tasks.events, tasks.reminders, tasks.updates
│
├── Namespace: dapr-system
│   └── Dapr Control Plane
│
├── Namespace: todo-app
│   ├── Dapr Components (kafka-pubsub, statestore, secrets)
│   ├── Redis (state management)
│   ├── Frontend (+ Dapr sidecar)
│   ├── Backend (+ Dapr sidecar)
│   ├── Recurring Task Service (+ Dapr sidecar)
│   ├── Notification Service (+ Dapr sidecar)
│   ├── Audit Service (+ Dapr sidecar)
│   └── WebSocket Service (+ Dapr sidecar)
│
├── Namespace: monitoring
│   ├── Prometheus
│   ├── Grafana
│   └── Jaeger
│
└── External: Neon PostgreSQL
```

## Project Structure

### Documentation (this feature)

```text
specs/004-event-driven-cloud/
├── plan.md              # This file (/sp.plan command output)
├── spec.md              # Feature specification (completed)
├── research.md          # Phase 0 output (to be created)
├── data-model.md        # Phase 1 output (to be created)
├── quickstart.md        # Phase 1 output (to be created)
├── contracts/           # Phase 1 output (to be created)
│   └── api-contracts.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (completed)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
# Web application structure (frontend + backend + microservices)

backend/
├── src/
│   ├── models.py                    # UPDATED: Add Task fields, TaskEvent, AuditLog
│   ├── services/
│   │   ├── mcp_server.py           # UPDATED: Add event publishing
│   │   └── event_publisher.py      # NEW: Kafka event publishing
│   ├── routes/
│   │   └── jobs.py                 # NEW: Dapr Jobs callback endpoint
│   └── main.py                     # UPDATED: Add Dapr integration
├── alembic/
│   └── versions/
│       └── XXX_phase5.py           # GENERATED: Database migration
├── tests/
│   ├── test_events.py              # NEW: Event publishing tests
│   └── test_models.py              # UPDATED: New model tests
├── Dockerfile                       # UPDATED: Add Dapr SDK
└── requirements.txt                 # UPDATED: Add dependencies

frontend/
├── src/
│   ├── components/
│   │   ├── TaskForm.tsx            # UPDATED: Add priority, tags, due date, recurring
│   │   ├── TaskList.tsx            # UPDATED: Add filters, sort, real-time updates
│   │   ├── TaskItem.tsx            # UPDATED: Display priority, tags, due date
│   │   ├── TaskFilters.tsx         # NEW: Filter panel component
│   │   └── TaskSort.tsx            # NEW: Sort dropdown component
│   ├── lib/
│   │   └── websocket.ts            # NEW: WebSocket client with auto-reconnect
│   ├── app/
│   │   └── layout.tsx              # UPDATED: Add notification permissions
│   └── hooks/
│       └── useWebSocket.ts         # NEW: WebSocket React hook
├── tests/
│   └── components/                 # UPDATED: Tests for new components
├── Dockerfile                       # No changes needed
└── package.json                     # UPDATED: Add dependencies

services/                            # NEW: Microservices directory
├── recurring-task/
│   ├── main.py                     # NEW: Recurring task service
│   ├── Dockerfile                  # NEW
│   ├── requirements.txt            # NEW
│   └── tests/
│       └── test_recurring.py       # NEW
├── notification/
│   ├── main.py                     # NEW: Notification service
│   ├── Dockerfile                  # NEW
│   ├── requirements.txt            # NEW
│   └── tests/
│       └── test_notification.py    # NEW
├── audit/
│   ├── main.py                     # NEW: Audit service
│   ├── Dockerfile                  # NEW
│   ├── requirements.txt            # NEW
│   └── tests/
│       └── test_audit.py           # NEW
└── websocket/
    ├── main.py                     # NEW: WebSocket service
    ├── Dockerfile                  # NEW
    ├── requirements.txt            # NEW
    └── tests/
        └── test_websocket.py       # NEW

kubernetes/                          # NEW: Kubernetes manifests
├── kafka/
│   ├── kafka-cluster.yaml          # NEW: Strimzi Kafka cluster
│   └── topics.yaml                 # NEW: Kafka topics
├── dapr/
│   ├── kafka-pubsub.yaml           # NEW: Dapr Kafka component
│   ├── statestore.yaml             # NEW: Dapr Redis state store
│   └── secrets.yaml                # NEW: Dapr secrets component
├── redis/
│   └── redis-deployment.yaml       # NEW: Redis deployment
└── monitoring/
    ├── prometheus.yaml             # NEW: Prometheus deployment
    ├── grafana.yaml                # NEW: Grafana deployment
    └── jaeger.yaml                 # NEW: Jaeger tracing

todo-chart/                          # UPDATED: Helm chart
├── Chart.yaml                       # UPDATED: Version 2.0.0
├── values.yaml                      # UPDATED: Add 4 services, Redis config
└── templates/
    ├── backend-deployment.yaml      # UPDATED: Add Dapr annotations
    ├── frontend-deployment.yaml     # UPDATED: Add Dapr annotations
    ├── recurring-task-deployment.yaml  # NEW
    ├── notification-deployment.yaml    # NEW
    ├── audit-deployment.yaml           # NEW
    ├── websocket-deployment.yaml       # NEW
    ├── websocket-service.yaml          # NEW: LoadBalancer service
    └── redis-deployment.yaml           # NEW

.github/
└── workflows/
    └── deploy.yml                   # NEW: CI/CD pipeline

tests/
└── integration/
    ├── test_event_flow.py          # NEW: End-to-end event tests
    ├── test_recurring_tasks.py     # NEW: Recurring task integration
    └── test_realtime_sync.py       # NEW: WebSocket sync tests
```

**Structure Decision**: Web application with microservices architecture. The existing backend and frontend are extended with new features, while four new microservices handle event-driven workflows. Kubernetes manifests are organized by concern (kafka, dapr, redis, monitoring). Helm chart is updated to deploy all services together.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 4 new microservices | Real-time sync, recurring tasks, audit, and notifications require independent scaling and failure isolation | Monolithic approach would create tight coupling, single point of failure, and prevent independent scaling of high-load services (WebSocket, Audit) |
| Event-driven architecture | Real-time synchronization across devices and audit trail require event sourcing | Polling-based approach would be inefficient, increase database load, and fail to meet 2-second sync requirement |
| Kafka + Dapr | Need reliable event delivery, at-least-once semantics, and service mesh capabilities | Direct HTTP calls lack reliability guarantees; Redis pub/sub lacks persistence and replay capabilities needed for audit |

## Implementation Phases

### Phase 0: Research & Discovery

**Objective**: Understand existing codebase, validate technical approach, identify integration points

**Research Tasks**:
1. Analyze current Task model schema and identify migration path
2. Review existing MCP server tools and event publishing integration points
3. Research Kafka topic design patterns for multi-tenant applications
4. Investigate Dapr sidecar configuration and resource requirements
5. Study WebSocket scaling patterns in Kubernetes
6. Review Strimzi operator installation and configuration
7. Analyze frontend state management for real-time updates
8. Research browser notification API and permission handling

**Deliverables**:
- `research.md`: Technical findings, integration points, risks
- Architecture decision records (ADRs) for key choices

---

### Phase 1: Design & Contracts

**Objective**: Define data models, API contracts, event schemas, and service interfaces

**Design Tasks**:
1. Design extended Task model with 8 new fields
2. Design TaskEvent and AuditLog models
3. Define Kafka event schemas (tasks.events, tasks.reminders, tasks.updates)
4. Define Dapr component configurations
5. Design WebSocket message protocol
6. Define REST API extensions for new features
7. Design frontend component hierarchy
8. Create database migration strategy

**Deliverables**:
- `data-model.md`: Complete data model with relationships
- `contracts/api-contracts.md`: REST API and event schemas
- `quickstart.md`: Local development setup guide

---

### Phase 2: Task Breakdown

**Objective**: Create detailed, dependency-ordered task list

**Command**: `/sp.tasks` (generates tasks.md)

**Expected Output**: 50-60 tasks across 10 phases with clear dependencies

---

### Phase 3-12: Implementation (Defined in tasks.md)

The following phases will be detailed in `tasks.md` after running `/sp.tasks`:

**Phase 3: Database Schema** (7 tasks)
- Update Task model with 8 new fields
- Create TaskEvent and AuditLog models
- Generate and review Alembic migration
- Run migration and verify schema

**Phase 4: Kafka Setup** (5 tasks)
- Install Strimzi operator
- Deploy Kafka cluster (3 brokers, 3 zookeeper)
- Create topics with retention policies
- Verify cluster health

**Phase 5: Dapr Setup** (4 tasks)
- Install Dapr control plane
- Deploy Redis for state management
- Create Dapr component configurations
- Verify Dapr installation

**Phase 6: Backend Event Publishing** (7 tasks)
- Create event_publisher.py service
- Update MCP tools to publish events
- Add Dapr Jobs callback endpoint
- Add Dapr annotations to backend deployment
- Write event publishing tests

**Phase 7: Microservices Development** (12 tasks = 4 services × 3 files each)
- Recurring Task Service: Subscribe to completion events, create next occurrence
- Notification Service: Subscribe to reminder events, send browser notifications
- Audit Service: Subscribe to all events, write to audit log
- WebSocket Service: Subscribe to update events, broadcast to clients

**Phase 8: Frontend Updates** (8 tasks)
- Create WebSocket client with auto-reconnect
- Update TaskForm with new fields (priority, tags, due date, recurring)
- Update TaskList with filters and sort
- Create TaskFilters and TaskSort components
- Add notification permission handling
- Update TaskItem to display new fields
- Write component tests

**Phase 9: Helm Chart Updates** (3 tasks)
- Update values.yaml with new services
- Create deployment templates for 4 microservices
- Update Chart.yaml to version 2.0.0

**Phase 10: CI/CD Pipeline** (4 tasks)
- Create GitHub Actions workflow
- Configure build, test, push, deploy stages
- Add GitHub secrets
- Test pipeline

**Phase 11: Cloud Deployment** (6 tasks)
- Provision Kubernetes cluster (AKS/GKE/OKE)
- Deploy infrastructure (Kafka, Dapr, Redis)
- Deploy application via Helm
- Configure ingress and SSL/TLS
- Verify all services running

**Phase 12: Monitoring & Observability** (5 tasks)
- Deploy Prometheus for metrics
- Deploy Grafana with dashboards
- Deploy Jaeger for distributed tracing
- Configure alerts
- Verify monitoring stack

---

## Deployment Order

### Local Development (Minikube/Kind)

1. **Database Migration**
   ```bash
   cd backend
   alembic upgrade head
   ```

2. **Kafka Cluster**
   ```bash
   kubectl create namespace kafka
   kubectl apply -f kubernetes/kafka/
   ```

3. **Dapr Installation**
   ```bash
   helm repo add dapr https://dapr.github.io/helm-charts/
   helm install dapr dapr/dapr --namespace dapr-system --create-namespace
   ```

4. **Redis Deployment**
   ```bash
   kubectl apply -f kubernetes/redis/
   ```

5. **Dapr Components**
   ```bash
   kubectl apply -f kubernetes/dapr/
   ```

6. **Application Deployment**
   ```bash
   helm upgrade --install todo-app ./todo-chart \
     --set backend.image.tag=phase5 \
     --set frontend.image.tag=phase5
   ```

7. **Verify Deployment**
   ```bash
   kubectl get pods -n todo-app
   kubectl logs -n todo-app -l app=backend --tail=50
   ```

### Cloud Production Deployment

1. **Provision Cluster**
   ```bash
   # AKS example
   az aks create --name todo-cluster --resource-group todo-rg \
     --node-count 3 --node-vm-size Standard_D4s_v3
   ```

2. **Deploy Infrastructure**
   ```bash
   # Kafka
   kubectl apply -f kubernetes/kafka/

   # Dapr
   helm install dapr dapr/dapr --namespace dapr-system

   # Redis
   kubectl apply -f kubernetes/redis/

   # Dapr Components
   kubectl apply -f kubernetes/dapr/
   ```

3. **Deploy Application**
   ```bash
   helm upgrade --install todo-app ./todo-chart \
     --namespace todo-app --create-namespace \
     --set ingress.enabled=true \
     --set ingress.host=todo.example.com
   ```

4. **Configure SSL/TLS**
   ```bash
   kubectl apply -f kubernetes/cert-manager/
   ```

5. **Deploy Monitoring**
   ```bash
   kubectl apply -f kubernetes/monitoring/
   ```

6. **Enable CI/CD**
   - Configure GitHub secrets
   - Push to main branch triggers deployment

---

## Verification Checklist

### Infrastructure
- [ ] Kafka: 3 brokers running, all topics created
- [ ] Kafka: Topics have correct partition count (3) and retention
- [ ] Dapr: Control plane running in dapr-system namespace
- [ ] Dapr: All pods have sidecar containers
- [ ] Redis: Running and accessible by Dapr
- [ ] PostgreSQL: Schema migration completed successfully

### Services
- [ ] Backend: Dapr annotations present, publishing events
- [ ] Frontend: Dapr annotations present, WebSocket connected
- [ ] Recurring Task Service: Subscribed to tasks.events, creating occurrences
- [ ] Notification Service: Subscribed to tasks.reminders, sending notifications
- [ ] Audit Service: Subscribed to tasks.events, writing to audit log
- [ ] WebSocket Service: Subscribed to tasks.updates, broadcasting to clients

### Features (P1 - Core)
- [ ] Task priorities: Can create tasks with low/medium/high/urgent
- [ ] Task tags: Can add up to 10 tags per task
- [ ] Task categories: Can assign one category per task
- [ ] Search: Real-time search working, results < 500ms
- [ ] Filter: Can filter by status, priority, category, tags, due date
- [ ] Filter: Multiple filters combine with AND logic
- [ ] Sort: Can sort by due date, priority, created date, title
- [ ] Sort: Ascending/descending toggle working

### Features (P2 - High Value)
- [ ] Due dates: Can set due date and time
- [ ] Reminders: Browser notifications sent at configured time
- [ ] Reminders: Overdue tasks highlighted
- [ ] Due date filters: Can view today/tomorrow/this week

### Features (P3 - Advanced)
- [ ] Recurring tasks: Can create daily/weekly/monthly patterns
- [ ] Recurring tasks: Next occurrence auto-created on completion
- [ ] Real-time sync: Changes appear on other devices < 2 seconds
- [ ] Real-time sync: WebSocket auto-reconnects on disconnect
- [ ] Audit trail: All operations logged with timestamp/user
- [ ] Audit trail: Can view complete history for any task

### Performance
- [ ] API response time: p95 < 200ms
- [ ] Search response: < 500ms
- [ ] Filter response: < 1 second
- [ ] Real-time sync: < 2 seconds
- [ ] Event processing: < 1 second
- [ ] Kafka consumer lag: < 100 messages

### Scalability
- [ ] Load test: 10,000 concurrent users supported
- [ ] Load test: 1,000 task operations/second sustained
- [ ] WebSocket: 5,000 connections per pod maintained
- [ ] Horizontal scaling: Pods scale up/down based on load

### Reliability
- [ ] Uptime: 99.9% over 7-day period
- [ ] Data loss: Zero data loss during pod restarts
- [ ] Event delivery: At-least-once semantics verified
- [ ] Audit accuracy: 100% of operations captured

### Deployment
- [ ] Cloud cluster: Provisioned and accessible
- [ ] Ingress: External access configured with SSL/TLS
- [ ] CI/CD: Pipeline running, auto-deploys on merge to main
- [ ] Monitoring: Prometheus, Grafana, Jaeger deployed
- [ ] Dashboards: Key metrics visible (latency, throughput, errors)
- [ ] Alerts: Configured for critical issues

### Backward Compatibility
- [ ] Phase I-IV features: All existing features working
- [ ] Existing tasks: Migrated successfully with default values
- [ ] Authentication: Better Auth JWT still working
- [ ] Chatbot: AI assistant still functional

---

## Risk Mitigation Strategies

### Risk 1: Event Ordering and Consistency
**Mitigation**:
- Kafka partitioning by user_id ensures per-user ordering
- Idempotent event handlers prevent duplicate processing
- Correlation IDs enable end-to-end tracing
- Integration tests verify event ordering

### Risk 2: WebSocket Connection Scalability
**Mitigation**:
- Horizontal pod autoscaling based on connection count
- Connection limits per pod (5,000)
- Graceful degradation to polling if WebSocket fails
- Load testing to validate scaling behavior

### Risk 3: Notification Delivery Reliability
**Mitigation**:
- Retry logic with exponential backoff
- In-app notification fallback
- Notification failure logging for debugging
- User can manually check for missed notifications

### Risk 4: Kafka Consumer Lag
**Mitigation**:
- Monitor consumer lag metrics in Grafana
- Auto-scaling for consumer pods
- Optimize event processing (batch writes, async I/O)
- Appropriate partition count (3) for parallelism

### Risk 5: Data Migration Complexity
**Mitigation**:
- Online schema migration tools (no downtime)
- Backward-compatible changes (nullable fields, defaults)
- Test migrations on staging environment
- Rollback plan documented

### Risk 6: Microservice Coordination
**Mitigation**:
- Dapr service invocation for reliability
- Circuit breakers prevent cascade failures
- Dead letter queues for failed events
- Comprehensive integration tests

### Risk 7: Cloud Cost Overruns
**Mitigation**:
- Resource limits on all pods
- Cost monitoring dashboards
- Spot instances for non-critical workloads
- Right-sizing based on actual usage

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Run `/sp.tasks`** to generate detailed task breakdown
3. **Create ADRs** for key architectural decisions:
   - ADR-001: Kafka vs alternatives for event streaming
   - ADR-002: Dapr adoption for service mesh
   - ADR-003: Last-write-wins conflict resolution
   - ADR-004: WebSocket vs Server-Sent Events
4. **Set up local development environment** following quickstart.md
5. **Begin Phase 3** (Database Schema) after tasks.md is approved

---

## Notes

- This plan assumes Phase IV Kubernetes infrastructure is already in place
- All new services follow the same patterns as existing backend/frontend
- Event-driven architecture enables future features (analytics, ML, integrations)
- Incremental rollout by priority (P1 → P2 → P3) allows early value delivery
- Monitoring and observability are first-class concerns, not afterthoughts
- Backward compatibility is a hard requirement - no breaking changes to existing features
