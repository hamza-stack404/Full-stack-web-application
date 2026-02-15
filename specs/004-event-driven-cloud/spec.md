# Feature Specification: Phase V - Event-Driven Cloud Architecture

**Feature Branch**: `004-event-driven-cloud`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "Phase V: Advanced Cloud Deployment with Event-Driven Architecture - Extend the Phase IV Todo Chatbot with advanced features (recurring tasks, reminders, priorities, tags, search/filter/sort) and deploy to production cloud Kubernetes with event-driven architecture using Kafka and Dapr"

## Overview

Phase V extends the Phase IV Todo Chatbot application with advanced task management features and transforms it into a production-ready, event-driven microservices architecture deployed on cloud Kubernetes. This phase adds recurring tasks, due dates with reminders, priorities, tags, advanced search/filter/sort capabilities, real-time synchronization across devices, and comprehensive audit logging.

## User Scenarios & Testing

### User Story 1 - Task Priorities and Organization (Priority: P1)

Users need to organize their tasks by importance and categorize them for better workflow management.

**Why this priority**: Core organizational features that provide immediate value and are foundational for other features. Users can start benefiting from better task management immediately.

**Independent Test**: Can be fully tested by creating tasks with different priorities and tags, then verifying they display correctly with visual indicators. Delivers immediate organizational value.

**Acceptance Scenarios**:

1. **Given** a user is creating a new task, **When** they select a priority level (low/medium/high/urgent), **Then** the task is saved with that priority and displays with appropriate visual indicator
2. **Given** a user is creating a task, **When** they add up to 10 tags (max 20 chars each), **Then** the tags are saved and displayed as chips on the task
3. **Given** a user has tasks with different priorities, **When** they view their task list, **Then** tasks are sorted by priority (urgent→high→medium→low) by default
4. **Given** a user assigns a category to a task, **When** they save it, **Then** the category is displayed and can be used for filtering

---

### User Story 2 - Search and Filter Tasks (Priority: P1)

Users need to quickly find specific tasks among potentially hundreds of items using search and multiple filter criteria.

**Why this priority**: Essential for usability as task lists grow. Without search/filter, the app becomes unusable at scale.

**Independent Test**: Can be tested by creating diverse tasks and verifying search returns correct results and filters work individually and in combination.

**Acceptance Scenarios**:

1. **Given** a user has multiple tasks, **When** they type keywords in the search bar, **Then** tasks matching the keyword in title or description appear in real-time (case-insensitive)
2. **Given** a user applies multiple filters (status, priority, category, tags, due date), **When** filters are combined, **Then** only tasks matching ALL criteria are shown (AND logic)
3. **Given** a user has filtered tasks, **When** they clear filters, **Then** all tasks are displayed again
4. **Given** a user searches or filters, **When** results update, **Then** the count of matching tasks is displayed

---

### User Story 3 - Sort Tasks by Multiple Criteria (Priority: P2)

Users need to view their tasks in different orders based on their current workflow needs (by due date, priority, creation date, or alphabetically).

**Why this priority**: Enhances usability but not critical for MVP. Users can still function with default sorting.

**Independent Test**: Can be tested by creating tasks with various attributes and verifying sort order changes correctly when different sort options are selected.

**Acceptance Scenarios**:

1. **Given** a user views their task list, **When** they select a sort option (due date/priority/created date/title), **Then** tasks reorder accordingly
2. **Given** a user has selected a sort option, **When** they toggle ascending/descending, **Then** the order reverses
3. **Given** no sort is explicitly selected, **When** user views tasks, **Then** default sort is priority (high→low) then due date (soonest first)

---

### User Story 4 - Due Dates and Reminders (Priority: P2)

Users need to set deadlines for tasks and receive timely reminders so they don't miss important commitments.

**Why this priority**: High value feature but requires notification infrastructure. Can be added after core organizational features.

**Independent Test**: Can be tested by setting due dates and reminder times, then verifying browser notifications appear at the correct time.

**Acceptance Scenarios**:

1. **Given** a user creates a task, **When** they set a due date and time, **Then** the task displays the due date and is included in due date filters
2. **Given** a task has a due date, **When** the user sets a reminder time (default: 30 min before), **Then** a browser notification is sent at the specified time
3. **Given** a user views their tasks, **When** they filter by due date (today/tomorrow/this week), **Then** only tasks with matching due dates appear
4. **Given** a task is past its due date, **When** the user views it, **Then** it is visually highlighted as overdue
5. **Given** a user receives a reminder notification, **When** they click it, **Then** they are taken to the task details

---

### User Story 5 - Recurring Tasks (Priority: P3)

Users need tasks that automatically repeat on a schedule (daily, weekly, monthly) so they don't have to manually recreate regular tasks.

**Why this priority**: Valuable for power users but not essential for initial launch. Requires event-driven architecture to be in place.

**Independent Test**: Can be tested by creating a recurring task, marking it complete, and verifying a new occurrence is automatically created with the correct next due date.

**Acceptance Scenarios**:

1. **Given** a user creates a task, **When** they enable recurrence and set a pattern (daily/weekly/monthly with optional end date), **Then** the task is marked as recurring
2. **Given** a recurring task is marked complete, **When** the completion is saved, **Then** a new task instance is automatically created with the next due date calculated from the pattern
3. **Given** a user views a recurring task, **When** they check upcoming occurrences, **Then** they can see future instances
4. **Given** a user wants to stop a recurrence, **When** they disable the recurring flag, **Then** no new instances are created after the current one is completed
5. **Given** a recurring task has a parent, **When** viewing the task, **Then** the relationship to the original recurring task is visible

---

### User Story 6 - Real-Time Synchronization (Priority: P3)

Users with multiple devices need to see task updates in real-time across all their devices without manual refresh.

**Why this priority**: Enhances user experience but requires WebSocket infrastructure. Users can still function with manual refresh.

**Independent Test**: Can be tested by opening the app on two devices, making a change on one, and verifying it appears on the other within 2 seconds.

**Acceptance Scenarios**:

1. **Given** a user has the app open on multiple devices, **When** they create/update/delete a task on one device, **Then** the change appears on all other devices within 2 seconds
2. **Given** a user loses connection, **When** connection is restored, **Then** the app automatically reconnects and syncs any missed updates
3. **Given** a user makes changes while offline, **When** they come back online, **Then** changes are synced to the server and other devices

---

### User Story 7 - Audit Trail (Priority: P3)

Users need to view the complete history of changes to any task for accountability and tracking purposes.

**Why this priority**: Important for enterprise use but not critical for initial consumer launch. Requires event sourcing infrastructure.

**Independent Test**: Can be tested by performing various operations on a task and verifying all actions are logged with timestamps and user information.

**Acceptance Scenarios**:

1. **Given** any task operation occurs (create/update/complete/delete), **When** the operation completes, **Then** an immutable audit log entry is created with timestamp, user, and action details
2. **Given** a user views a task, **When** they access the audit log, **Then** they see all historical changes in chronological order
3. **Given** an audit log entry exists, **When** viewed, **Then** it shows what changed (before/after values for updates)

---

### Edge Cases

- What happens when a user sets a reminder time that is in the past?
- How does the system handle recurring tasks when the user is offline during the scheduled creation time?
- What happens when a user tries to add more than 10 tags to a task?
- How does the system handle WebSocket disconnections during active editing?
- What happens when two devices update the same task simultaneously (conflict resolution)?
- How does the system handle tasks with due dates spanning multiple timezones?
- What happens when Kafka consumers lag behind producers during high load?
- How does the system recover if a microservice crashes while processing an event?

## Requirements

### Functional Requirements

**Task Management Extensions:**

- **FR-001**: System MUST allow users to assign one of four priority levels to each task: low, medium (default), high, or urgent
- **FR-002**: System MUST allow users to add up to 10 tags per task, with each tag limited to 20 characters
- **FR-003**: System MUST allow users to assign one category per task
- **FR-004**: System MUST allow users to set a due date and time for any task
- **FR-005**: System MUST allow users to configure a reminder time for tasks with due dates (default: 30 minutes before)
- **FR-006**: System MUST allow users to mark tasks as recurring with patterns: daily, weekly, or monthly
- **FR-007**: System MUST allow users to specify an optional end date for recurring tasks
- **FR-008**: System MUST automatically create the next occurrence of a recurring task when the current instance is marked complete

**Search and Filter:**

- **FR-009**: System MUST provide real-time search across task titles and descriptions (case-insensitive)
- **FR-010**: System MUST allow users to filter tasks by: status (complete/incomplete), priority, category, tags, and due date ranges
- **FR-011**: System MUST combine multiple filters using AND logic
- **FR-012**: System MUST display the count of tasks matching current search/filter criteria

**Sorting:**

- **FR-013**: System MUST allow users to sort tasks by: due date, priority, created date, or title
- **FR-014**: System MUST support both ascending and descending sort order
- **FR-015**: System MUST apply default sorting: priority (urgent→high→medium→low), then due date (soonest first)

**Notifications:**

- **FR-016**: System MUST send browser push notifications at the configured reminder time for tasks with due dates
- **FR-017**: System MUST visually highlight tasks that are past their due date
- **FR-018**: System MUST allow users to view tasks grouped by due date: today, tomorrow, this week

**Real-Time Synchronization:**

- **FR-019**: System MUST broadcast task changes to all connected devices for the same user within 2 seconds
- **FR-020**: System MUST automatically reconnect WebSocket connections when they drop
- **FR-021**: System MUST sync changes made while offline once connection is restored

**Audit Trail:**

- **FR-022**: System MUST log every task operation (create, update, complete, delete) with timestamp, user ID, and action details
- **FR-023**: System MUST store audit logs in an immutable format
- **FR-024**: System MUST allow users to view the complete audit history for any task
- **FR-025**: System MUST capture before/after values for update operations

**Event-Driven Architecture:**

- **FR-026**: System MUST publish events to Kafka topics for all task operations
- **FR-027**: System MUST use Dapr for service-to-service communication and pub/sub
- **FR-028**: System MUST implement at least-once event delivery semantics
- **FR-029**: System MUST partition Kafka topics by user_id for scalability
- **FR-030**: System MUST use Redis for distributed state management via Dapr

**Microservices:**

- **FR-031**: System MUST implement a Recurring Task Service that subscribes to task completion events and creates next occurrences
- **FR-032**: System MUST implement a Notification Service that subscribes to reminder events and sends browser notifications
- **FR-033**: System MUST implement an Audit Service that subscribes to all task events and writes to audit log
- **FR-034**: System MUST implement a WebSocket Service that subscribes to task update events and broadcasts to connected clients

### Key Entities

- **Task (Extended)**: Represents a user's todo item with new attributes: priority (low/medium/high/urgent), category (optional), tags (array, max 10), due_date (optional datetime), remind_before_minutes (integer, default 30), is_recurring (boolean), recurrence_pattern (JSON object with frequency/interval/end_date), parent_task_id (optional, links to original recurring task)

- **TaskEvent**: Represents an event in the task lifecycle with attributes: event_id (UUID), event_type (created/updated/completed/deleted), event_version (string), task_id (integer), user_id (string), correlation_id (UUID for tracing), payload (JSON with full task data), timestamp (datetime)

- **AuditLog**: Represents an immutable audit record with attributes: id (integer), event_id (FK to TaskEvent), task_id (integer), user_id (string), action (string), changes (JSON with before/after values), timestamp (datetime)

- **RecurrencePattern**: Represents the schedule for recurring tasks with attributes: frequency (daily/weekly/monthly), interval (integer, e.g., every 2 weeks), day_of_week (optional, for weekly), day_of_month (optional, for monthly), end_date (optional datetime)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a task with priority, tags, category, and due date in under 30 seconds
- **SC-002**: Search results appear within 500 milliseconds of typing
- **SC-003**: Filter operations complete and display results within 1 second
- **SC-004**: Task changes synchronize to other devices within 2 seconds
- **SC-005**: Browser notifications are delivered within 10 seconds of the scheduled reminder time
- **SC-006**: Recurring tasks are automatically created within 1 second of marking the previous instance complete
- **SC-007**: System supports 10,000 concurrent users without performance degradation
- **SC-008**: System processes 1,000 task operations per second
- **SC-009**: Kafka consumer lag remains below 100 messages during normal operation
- **SC-010**: WebSocket service maintains 5,000 concurrent connections per pod
- **SC-011**: System achieves 99.9% uptime
- **SC-012**: Zero data loss occurs during pod restarts or failures
- **SC-013**: All task operations are captured in the audit log with 100% accuracy
- **SC-014**: 95% of users successfully use advanced features (priorities, tags, filters) within first session
- **SC-015**: Task completion rate improves by 30% with due dates and reminders

## Assumptions

1. **Cloud Platform**: Deployment will target a managed Kubernetes service (AKS, GKE, or OKE) with standard networking and storage capabilities
2. **Kafka Infrastructure**: A managed Kafka service or self-hosted Kafka cluster with 3 brokers will be available
3. **Redis Availability**: A Redis instance (managed or self-hosted) will be available for Dapr state management
4. **Browser Support**: Users have modern browsers that support WebSockets and Push Notifications API
5. **Notification Permissions**: Users will grant browser notification permissions when prompted
6. **Timezone Handling**: All due dates and times are stored in UTC and converted to user's local timezone in the frontend
7. **Conflict Resolution**: Last-write-wins strategy for simultaneous updates from multiple devices
8. **Event Retention**: Kafka events are retained for 7 days for task.events, 24 hours for task.reminders, and 1 hour for task.updates
9. **Authentication**: Phase IV JWT authentication with Better Auth remains unchanged
10. **Database**: Neon PostgreSQL from Phase IV is extended with new columns and tables
11. **Backward Compatibility**: All Phase I-IV features remain fully functional
12. **Dapr Version**: Dapr 1.12+ is used with stable APIs
13. **Network Latency**: Average network latency between services is under 10ms within the same cloud region
14. **Monitoring**: Prometheus and Grafana (or cloud-native equivalents) are available for observability

## Scope

### In Scope

- Task priority levels (low, medium, high, urgent)
- Task tags (up to 10 per task, max 20 chars each)
- Task categories (one per task)
- Due dates and times for tasks
- Configurable reminder times with browser notifications
- Recurring tasks (daily, weekly, monthly patterns)
- Real-time search across task titles and descriptions
- Multi-criteria filtering (status, priority, category, tags, due date)
- Multi-criteria sorting (due date, priority, created date, title)
- Real-time synchronization across multiple devices via WebSockets
- Complete audit trail for all task operations
- Event-driven architecture with Kafka and Dapr
- Four microservices: Recurring Task, Notification, Audit, WebSocket
- Cloud Kubernetes deployment (AKS/GKE/OKE)
- Helm chart updates for new services
- Database schema migrations for new fields and tables
- Frontend UI enhancements for new features
- Backend API extensions for new functionality

### Out of Scope

- Mobile native applications (web-only for Phase V)
- Task sharing and collaboration between users
- File attachments to tasks
- Email notifications (browser notifications only)
- Task templates
- Advanced analytics and reporting dashboards
- Integration with external calendar applications (Google Calendar, Outlook)
- Offline-first PWA capabilities (basic offline handling only)
- Custom recurrence patterns beyond daily/weekly/monthly
- Task dependencies and subtasks (may be added in Phase VI)
- Multi-language support (English only)
- Custom notification sounds
- Task import/export functionality
- Bulk task operations beyond existing bulk delete
- Advanced search with boolean operators (AND/OR/NOT)

## Dependencies

- **Phase IV Infrastructure**: All Phase IV Kubernetes deployment infrastructure must be in place
- **Kafka Cluster**: Requires Kafka 3.0+ with 3 brokers and appropriate topic configuration
- **Redis Instance**: Requires Redis 6.0+ for Dapr state store
- **Dapr Installation**: Requires Dapr 1.12+ installed on Kubernetes cluster
- **Cloud Provider**: Requires access to managed Kubernetes service (AKS/GKE/OKE)
- **Database Migration**: Requires Alembic migrations to extend Task model and add new tables
- **Browser APIs**: Requires modern browsers with WebSocket and Notifications API support
- **CI/CD Pipeline**: Requires automated deployment pipeline for multiple services
- **Monitoring Stack**: Requires observability tools (Prometheus, Grafana, or cloud equivalents)

## Risks and Mitigations

### Risk 1: Event Ordering and Consistency
**Risk**: Events may be processed out of order, leading to inconsistent state
**Mitigation**: Use Kafka partitioning by user_id to ensure ordering per user; implement idempotent event handlers; use correlation_id for tracing

### Risk 2: WebSocket Connection Scalability
**Risk**: Large number of concurrent WebSocket connections may overwhelm pods
**Mitigation**: Implement horizontal pod autoscaling; use connection pooling; set connection limits per pod; implement graceful degradation

### Risk 3: Notification Delivery Reliability
**Risk**: Browser notifications may fail due to permissions or browser state
**Mitigation**: Implement retry logic; provide in-app notification fallback; log notification failures for debugging

### Risk 4: Kafka Consumer Lag
**Risk**: High load may cause consumers to lag behind producers
**Mitigation**: Monitor consumer lag metrics; implement auto-scaling for consumer pods; optimize event processing; use appropriate partition count

### Risk 5: Data Migration Complexity
**Risk**: Adding new columns to existing Task table may cause downtime
**Mitigation**: Use online schema migration tools; implement backward-compatible changes; test migrations on staging environment; plan maintenance window if needed

### Risk 6: Microservice Coordination
**Risk**: Multiple services must coordinate for recurring tasks and notifications
**Mitigation**: Use Dapr service invocation for reliability; implement circuit breakers; use dead letter queues for failed events; comprehensive integration testing

### Risk 7: Cloud Cost Overruns
**Risk**: Kafka, Redis, and multiple microservices may increase cloud costs significantly
**Mitigation**: Set resource limits; implement cost monitoring; use spot instances where appropriate; optimize resource utilization

## Notes

- This specification focuses on WHAT users need and WHY, avoiding implementation details
- Technical decisions (Kafka, Dapr, Redis) are mentioned only as architectural constraints, not implementation details
- All success criteria are measurable and technology-agnostic from the user's perspective
- The feature is designed to be implemented incrementally by priority (P1 → P2 → P3)
- Each user story can be independently tested and delivers standalone value
- The event-driven architecture enables future scalability and feature additions
- Backward compatibility with Phase I-IV is a hard requirement
