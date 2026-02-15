# Tasks: Phase V - Event-Driven Cloud Architecture

**Input**: Design documents from `/specs/004-event-driven-cloud/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency updates

- [ ] T001 Update backend requirements.txt with Dapr SDK (dapr>=1.12.0), aiokafka>=0.8.0
- [ ] T002 Update frontend package.json with WebSocket dependencies
- [ ] T003 [P] Create services/ directory structure for 4 microservices
- [ ] T004 [P] Create kubernetes/ directory structure (kafka/, dapr/, redis/, monitoring/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [ ] T005 Add 8 new fields to Task model in backend/src/models.py (priority, category, tags, due_date, remind_before_minutes, is_recurring, recurrence_pattern, parent_task_id)
- [ ] T006 [P] Create TaskEvent model in backend/src/models.py
- [ ] T007 [P] Create AuditLog model in backend/src/models.py
- [ ] T008 Generate Alembic migration: `alembic revision --autogenerate -m "Phase V event-driven architecture"`
- [ ] T009 Review generated migration in backend/alembic/versions/XXX_phase5.py
- [ ] T010 Run migration: `alembic upgrade head` and verify schema in Neon PostgreSQL

### Kafka Infrastructure

- [ ] T011 Create kubernetes/kafka/kafka-cluster.yaml with Strimzi config (3 brokers, 3 zookeeper)
- [ ] T012 Create kubernetes/kafka/topics.yaml defining 3 topics (tasks.events, tasks.reminders, tasks.updates)
- [ ] T013 Install Strimzi operator: `kubectl create namespace kafka && kubectl apply -f strimzi-operator.yaml`
- [ ] T014 Deploy Kafka cluster: `kubectl apply -f kubernetes/kafka/kafka-cluster.yaml`
- [ ] T015 Create topics: `kubectl apply -f kubernetes/kafka/topics.yaml`
- [ ] T016 Verify Kafka cluster: `kubectl get kafka -n kafka` and `kubectl exec kafka-0 -- kafka-topics.sh --list`

### Dapr Infrastructure

- [ ] T017 Install Dapr: `helm install dapr dapr/dapr --namespace dapr-system --create-namespace`
- [ ] T018 Create kubernetes/redis/redis-deployment.yaml for state management
- [ ] T019 Deploy Redis: `kubectl apply -f kubernetes/redis/redis-deployment.yaml`
- [ ] T020 [P] Create kubernetes/dapr/kafka-pubsub.yaml component
- [ ] T021 [P] Create kubernetes/dapr/statestore.yaml component
- [ ] T022 [P] Create kubernetes/dapr/secrets.yaml component
- [ ] T023 Apply Dapr components: `kubectl apply -f kubernetes/dapr/`
- [ ] T024 Verify components: `kubectl get components -n todo-app`

### Event Publishing Infrastructure

- [ ] T025 Create backend/src/services/event_publisher.py with publish_task_event(), publish_task_update(), schedule_reminder()
- [ ] T026 Create backend/src/routes/jobs.py with POST /api/jobs/trigger endpoint for Dapr Jobs callbacks
- [ ] T027 Update backend/src/main.py to include jobs router
- [ ] T028 Add Dapr annotations to todo-chart/templates/backend-deployment.yaml

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Task Priorities and Organization (Priority: P1) 🎯 MVP

**Goal**: Enable users to organize tasks by priority (low/medium/high/urgent), add tags (max 10), and assign categories

**Independent Test**: Create tasks with different priorities and tags, verify they display with visual indicators and can be filtered

### Implementation for User Story 1

- [ ] T029 [P] [US1] Update add_task tool in backend/src/services/mcp_server.py to accept priority, category, tags parameters
- [ ] T030 [P] [US1] Update update_task tool in backend/src/services/mcp_server.py to accept priority, category, tags parameters
- [ ] T031 [US1] Add event publishing to add_task tool (publish to tasks.events and tasks.updates)
- [ ] T032 [US1] Add event publishing to update_task tool (publish to tasks.events and tasks.updates)
- [ ] T033 [P] [US1] Update TaskForm component in frontend/src/components/TaskForm.tsx to add priority dropdown, tags input, category selector
- [ ] T034 [P] [US1] Update TaskItem component in frontend/src/components/TaskItem.tsx to display priority badge and tag chips
- [ ] T035 [P] [US1] Update TaskList component in frontend/src/components/TaskList.tsx to apply default sort (priority high→low)
- [ ] T036 [US1] Test: Create task with priority=urgent, tags=["backend", "critical"], category="work" and verify display

**Checkpoint**: User Story 1 complete - users can organize tasks by priority, tags, and category

---

## Phase 4: User Story 2 - Search and Filter Tasks (Priority: P1)

**Goal**: Enable users to search tasks by keyword and filter by status, priority, category, tags, due date

**Independent Test**: Create diverse tasks, verify search returns correct results and filters work individually and in combination

### Implementation for User Story 2

- [ ] T037 [P] [US2] Update GET /api/tasks endpoint in backend to accept search, status, priority, category, tags, due_date query parameters
- [ ] T038 [US2] Implement search logic (case-insensitive, title + description) in backend
- [ ] T039 [US2] Implement filter logic (AND combination) in backend
- [ ] T040 [P] [US2] Create TaskFilters component in frontend/src/components/TaskFilters.tsx with all filter options
- [ ] T041 [P] [US2] Add search bar to TaskList component in frontend/src/components/TaskList.tsx
- [ ] T042 [US2] Integrate TaskFilters with TaskList, update API calls with query parameters
- [ ] T043 [US2] Display task count matching current filters
- [ ] T044 [US2] Test: Search for "urgent", filter by priority=high + category=work, verify correct results

**Checkpoint**: User Story 2 complete - users can search and filter tasks effectively

---

## Phase 5: User Story 3 - Sort Tasks by Multiple Criteria (Priority: P2)

**Goal**: Enable users to sort tasks by due date, priority, created date, or title (ascending/descending)

**Independent Test**: Create tasks with various attributes, verify sort order changes correctly when different options selected

### Implementation for User Story 3

- [ ] T045 [P] [US3] Update GET /api/tasks endpoint in backend to accept sort_by and sort_order query parameters
- [ ] T046 [US3] Implement sort logic in backend (due_date, priority, created_at, title)
- [ ] T047 [P] [US3] Create TaskSort component in frontend/src/components/TaskSort.tsx with sort dropdown and asc/desc toggle
- [ ] T048 [US3] Integrate TaskSort with TaskList, update API calls with sort parameters
- [ ] T049 [US3] Test: Sort by due_date asc, then priority desc, verify correct order

**Checkpoint**: User Story 3 complete - users can sort tasks by multiple criteria

---

## Phase 6: User Story 4 - Due Dates and Reminders (Priority: P2)

**Goal**: Enable users to set due dates/times and receive browser notifications at configured reminder time

**Independent Test**: Set due date with reminder, verify browser notification appears at correct time

### Backend Implementation for User Story 4

- [ ] T050 [P] [US4] Update add_task tool in backend/src/services/mcp_server.py to accept due_date, remind_before_minutes parameters
- [ ] T051 [P] [US4] Update update_task tool in backend/src/services/mcp_server.py to accept due_date, remind_before_minutes parameters
- [ ] T052 [US4] Add schedule_reminder() call in add_task when due_date is set
- [ ] T053 [US4] Add schedule_reminder() call in update_task when due_date changes
- [ ] T054 [US4] Implement Dapr Jobs callback handler in backend/src/routes/jobs.py to publish reminder events

### Notification Service for User Story 4

- [ ] T055 [US4] Create services/notification/main.py subscribing to tasks.reminders topic
- [ ] T056 [US4] Implement notification logic (Web Push API integration) in services/notification/main.py
- [ ] T057 [P] [US4] Create services/notification/Dockerfile
- [ ] T058 [P] [US4] Create services/notification/requirements.txt
- [ ] T059 [P] [US4] Create todo-chart/templates/notification-deployment.yaml with Dapr annotations
- [ ] T060 [US4] Deploy notification service and verify subscription to tasks.reminders

### Frontend Implementation for User Story 4

- [ ] T061 [P] [US4] Update TaskForm in frontend/src/components/TaskForm.tsx to add due date/time picker and reminder time input
- [ ] T062 [P] [US4] Update TaskItem in frontend/src/components/TaskItem.tsx to display due date and highlight overdue tasks
- [ ] T063 [US4] Add notification permission request in frontend/src/app/layout.tsx
- [ ] T064 [US4] Implement notification handler to show browser notifications
- [ ] T065 [US4] Test: Create task with due_date=tomorrow 5pm, remind_before_minutes=60, verify notification appears

**Checkpoint**: User Story 4 complete - users can set due dates and receive reminders

---

## Phase 7: User Story 5 - Recurring Tasks (Priority: P3)

**Goal**: Enable users to create tasks that automatically repeat on a schedule (daily/weekly/monthly)

**Independent Test**: Create recurring task, mark complete, verify next occurrence auto-created with correct due date

### Backend Implementation for User Story 5

- [ ] T066 [P] [US5] Update add_task tool in backend/src/services/mcp_server.py to accept is_recurring, recurrence_pattern parameters
- [ ] T067 [P] [US5] Update update_task tool in backend/src/services/mcp_server.py to accept is_recurring, recurrence_pattern parameters
- [ ] T068 [US5] Update complete_task tool in backend/src/services/mcp_server.py to publish completion events

### Recurring Task Service for User Story 5

- [ ] T069 [US5] Create services/recurring-task/main.py subscribing to tasks.events (filter: completed + is_recurring)
- [ ] T070 [US5] Implement recurrence calculation logic (daily/weekly/monthly) in services/recurring-task/main.py
- [ ] T071 [US5] Implement task creation via Dapr service invocation to backend
- [ ] T072 [P] [US5] Create services/recurring-task/Dockerfile
- [ ] T073 [P] [US5] Create services/recurring-task/requirements.txt
- [ ] T074 [P] [US5] Create todo-chart/templates/recurring-task-deployment.yaml with Dapr annotations
- [ ] T075 [US5] Deploy recurring task service and verify subscription to tasks.events

### Frontend Implementation for User Story 5

- [ ] T076 [P] [US5] Update TaskForm in frontend/src/components/TaskForm.tsx to add recurring pattern selector (daily/weekly/monthly, interval, end date)
- [ ] T077 [P] [US5] Update TaskItem in frontend/src/components/TaskItem.tsx to display recurring indicator
- [ ] T078 [US5] Test: Create recurring task (daily), mark complete, verify next occurrence created

**Checkpoint**: User Story 5 complete - users can create recurring tasks

---

## Phase 8: User Story 6 - Real-Time Synchronization (Priority: P3)

**Goal**: Enable real-time task updates across multiple devices via WebSocket (< 2 seconds)

**Independent Test**: Open app on 2 devices, modify task on one, verify update appears on other within 2 seconds

### Backend Implementation for User Story 6

- [ ] T079 [US6] Update all task operations (add/update/complete/delete) to publish to tasks.updates topic

### WebSocket Service for User Story 6

- [ ] T080 [US6] Create services/websocket/main.py with WebSocket endpoint /ws/{user_id}
- [ ] T081 [US6] Implement WebSocket connection management (user_id → connections map) in services/websocket/main.py
- [ ] T082 [US6] Subscribe to tasks.updates topic and broadcast to user's connections
- [ ] T083 [US6] Implement ping/pong keepalive mechanism
- [ ] T084 [P] [US6] Create services/websocket/Dockerfile
- [ ] T085 [P] [US6] Create services/websocket/requirements.txt
- [ ] T086 [P] [US6] Create todo-chart/templates/websocket-deployment.yaml with Dapr annotations
- [ ] T087 [P] [US6] Create todo-chart/templates/websocket-service.yaml (LoadBalancer)
- [ ] T088 [US6] Deploy WebSocket service and verify subscription to tasks.updates

### Frontend Implementation for User Story 6

- [ ] T089 [US6] Create frontend/src/lib/websocket.ts with WebSocket client class (connect, auto-reconnect, message handling)
- [ ] T090 [US6] Create frontend/src/hooks/useWebSocket.ts React hook
- [ ] T091 [US6] Integrate WebSocket in TaskList component to receive real-time updates
- [ ] T092 [US6] Test: Open 2 browser tabs, create task in tab 1, verify appears in tab 2 within 2 seconds

**Checkpoint**: User Story 6 complete - real-time synchronization working

---

## Phase 9: User Story 7 - Audit Trail (Priority: P3)

**Goal**: Enable users to view complete history of all task operations (immutable audit log)

**Independent Test**: Perform various operations on a task, verify all actions logged with timestamp/user/changes

### Audit Service for User Story 7

- [ ] T093 [US7] Create services/audit/main.py subscribing to tasks.events (all events)
- [ ] T094 [US7] Implement audit log writing logic (insert into AuditLog table) in services/audit/main.py
- [ ] T095 [US7] Extract before/after changes from event payload
- [ ] T096 [P] [US7] Create services/audit/Dockerfile
- [ ] T097 [P] [US7] Create services/audit/requirements.txt
- [ ] T098 [P] [US7] Create todo-chart/templates/audit-deployment.yaml with Dapr annotations
- [ ] T099 [US7] Deploy audit service and verify subscription to tasks.events

### Backend Implementation for User Story 7

- [ ] T100 [P] [US7] Create GET /api/tasks/{task_id}/audit endpoint in backend to retrieve audit logs
- [ ] T101 [US7] Implement audit log query logic (order by timestamp asc)

### Frontend Implementation for User Story 7

- [ ] T102 [P] [US7] Create AuditLog component in frontend/src/components/AuditLog.tsx to display history
- [ ] T103 [US7] Add "View History" button to TaskItem component
- [ ] T104 [US7] Test: Create task, update priority, complete, verify all 3 actions in audit log

**Checkpoint**: User Story 7 complete - audit trail functional

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: CI/CD, cloud deployment, monitoring, documentation

### Helm Chart Updates

- [ ] T105 Update todo-chart/values.yaml to include 4 new services (recurring-task, notification, audit, websocket) and Redis
- [ ] T106 Update todo-chart/Chart.yaml version to 2.0.0
- [ ] T107 Add Dapr annotations to todo-chart/templates/frontend-deployment.yaml

### CI/CD Pipeline

- [ ] T108 Create .github/workflows/deploy.yml with stages: build, test, push images, deploy to cluster
- [ ] T109 Add GitHub secrets: REGISTRY_USERNAME, REGISTRY_PASSWORD, KUBE_CONFIG
- [ ] T110 Test pipeline: push to main branch, verify all services deploy successfully

### Cloud Deployment

- [ ] T111 Provision Kubernetes cluster (AKS/GKE/OKE): 3 nodes, 2 CPU, 4GB RAM each
- [ ] T112 Deploy Kafka to cloud: `kubectl apply -f kubernetes/kafka/`
- [ ] T113 Deploy Dapr to cloud: `helm install dapr dapr/dapr --namespace dapr-system`
- [ ] T114 Deploy application to cloud: `helm install todo-app ./todo-chart --namespace todo-app`
- [ ] T115 Configure LoadBalancer for frontend and WebSocket services
- [ ] T116 Set up SSL/TLS: install cert-manager, configure Let's Encrypt certificates

### Monitoring

- [ ] T117 [P] Create kubernetes/monitoring/prometheus.yaml
- [ ] T118 [P] Create kubernetes/monitoring/grafana.yaml
- [ ] T119 [P] Create kubernetes/monitoring/jaeger.yaml
- [ ] T120 Deploy monitoring stack: `kubectl apply -f kubernetes/monitoring/`
- [ ] T121 Create Grafana dashboards for: API latency, Kafka consumer lag, WebSocket connections, event throughput
- [ ] T122 Configure alerts: high consumer lag, pod restarts, API errors

### Integration Testing

- [ ] T123 Test advanced task creation: create task with all new fields (priority, tags, category, due_date, recurring)
- [ ] T124 Test recurring tasks end-to-end: create daily recurring task, mark complete, verify next occurrence
- [ ] T125 Test reminders end-to-end: create task with due_date, wait for reminder time, verify notification
- [ ] T126 Test audit log: perform create/update/complete/delete, verify all logged
- [ ] T127 Test real-time sync: open 2 devices, modify task, verify sync < 2 seconds
- [ ] T128 Test filters: apply multiple filters (priority + category + tags), verify correct results
- [ ] T129 Test sort: sort by all options (due_date, priority, created_at, title), verify correct order
- [ ] T130 Load test: create 1000 tasks, verify performance targets (p95 < 200ms, search < 500ms)

### Documentation

- [ ] T131 [P] Update README.md with Phase V section (architecture overview, features, deployment)
- [ ] T132 [P] Create docs/architecture.md documenting event-driven architecture with diagrams
- [ ] T133 [P] Create docs/events.md documenting all event schemas (tasks.events, tasks.reminders, tasks.updates)
- [ ] T134 [P] Create docs/troubleshooting.md with common issues and solutions

---

## Task Summary

| Phase | User Story | Task Count |
|-------|------------|------------|
| Phase 1 | Setup | 4 |
| Phase 2 | Foundational | 24 |
| Phase 3 | US1 - Priorities & Organization (P1) | 8 |
| Phase 4 | US2 - Search & Filter (P1) | 8 |
| Phase 5 | US3 - Sort (P2) | 5 |
| Phase 6 | US4 - Due Dates & Reminders (P2) | 16 |
| Phase 7 | US5 - Recurring Tasks (P3) | 13 |
| Phase 8 | US6 - Real-Time Sync (P3) | 14 |
| Phase 9 | US7 - Audit Trail (P3) | 12 |
| Phase 10 | Polish & Cross-Cutting | 30 |
| **TOTAL** | | **134** |

---

## Dependencies & Execution Order

### Critical Path

1. **Phase 1 (Setup)** → **Phase 2 (Foundational)** → All user stories can proceed in parallel
2. **Phase 2 MUST complete** before any user story work begins
3. User stories are independent and can be implemented in any order after Phase 2

### User Story Dependencies

- **US1 (P1)**: No dependencies (can start after Phase 2)
- **US2 (P1)**: No dependencies (can start after Phase 2)
- **US3 (P2)**: No dependencies (can start after Phase 2)
- **US4 (P2)**: No dependencies (can start after Phase 2)
- **US5 (P3)**: No dependencies (can start after Phase 2)
- **US6 (P3)**: No dependencies (can start after Phase 2)
- **US7 (P3)**: No dependencies (can start after Phase 2)

### Parallel Execution Opportunities

**After Phase 2 completes, these can run in parallel**:

- **Team 1**: US1 (Priorities) + US2 (Search/Filter) + US3 (Sort) - Frontend-heavy, minimal backend
- **Team 2**: US4 (Reminders) - Requires Notification Service
- **Team 3**: US5 (Recurring) - Requires Recurring Task Service
- **Team 4**: US6 (Real-Time Sync) - Requires WebSocket Service
- **Team 5**: US7 (Audit Trail) - Requires Audit Service

**Within each phase, tasks marked [P] can run in parallel**

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Recommended MVP**: Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2)

This delivers:
- Task priorities, tags, categories (US1)
- Search and filter capabilities (US2)
- Event-driven infrastructure foundation
- Deployable to cloud Kubernetes

**Estimated effort**: 2-3 weeks with 2 developers

### Incremental Delivery

1. **Sprint 1**: Phase 1 + Phase 2 (Foundation) - 1 week
2. **Sprint 2**: Phase 3 (US1) + Phase 4 (US2) - MVP - 1 week
3. **Sprint 3**: Phase 5 (US3) + Phase 6 (US4) - 1 week
4. **Sprint 4**: Phase 7 (US5) + Phase 8 (US6) + Phase 9 (US7) - 2 weeks
5. **Sprint 5**: Phase 10 (Polish, monitoring, docs) - 1 week

**Total estimated effort**: 6 weeks with 2-3 developers

### Testing Strategy

- **Unit tests**: Write alongside implementation for each service
- **Integration tests**: After each user story phase completes
- **End-to-end tests**: Phase 10 (T123-T130)
- **Load tests**: Phase 10 (T130)

---

## Validation Checklist

- [x] All tasks follow format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [x] Tasks organized by user story (not technical category)
- [x] Each user story has clear goal and independent test criteria
- [x] Phase 2 (Foundational) clearly marked as blocking
- [x] Dependencies documented
- [x] Parallel execution opportunities identified ([P] markers)
- [x] MVP scope defined (US1 + US2)
- [x] File paths included in all implementation tasks
- [x] Total task count: 134 tasks
