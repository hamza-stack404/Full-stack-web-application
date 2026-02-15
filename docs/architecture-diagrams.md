# Phase V Architecture

## System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end

    subgraph "Frontend Layer"
        NextJS[Next.js Frontend<br/>+ Dapr Sidecar]
        WSClient[WebSocket Client<br/>Auto-reconnect]
    end

    subgraph "API Gateway"
        Backend[FastAPI Backend<br/>+ Dapr Sidecar]
        Jobs[Jobs Callback<br/>Endpoint]
    end

    subgraph "Message Queue"
        Kafka[Apache Kafka<br/>3 Brokers]
        Topics[3 Topics:<br/>tasks.events<br/>tasks.reminders<br/>tasks.updates]
    end

    subgraph "Microservices"
        RecurringTask[Recurring Task<br/>Service + Dapr]
        Notification[Notification<br/>Service + Dapr]
        Audit[Audit<br/>Service + Dapr]
        WebSocket[WebSocket<br/>Service + Dapr]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL<br/>Neon)]
        Redis[(Redis<br/>State Store)]
    end

    subgraph "Service Mesh"
        Dapr[Dapr Runtime<br/>Pub/Sub, State, Jobs]
    end

    Browser --> NextJS
    Mobile --> NextJS
    NextJS --> Backend
    WSClient -.WebSocket.-> WebSocket

    Backend --> Kafka
    Backend --> PostgreSQL
    Backend --> Dapr

    Kafka --> Topics
    Topics --> RecurringTask
    Topics --> Notification
    Topics --> Audit
    Topics --> WebSocket

    RecurringTask --> Backend
    Notification --> WebSocket
    Audit --> PostgreSQL
    WebSocket -.Real-time.-> WSClient

    Dapr --> Redis
    Dapr --> Kafka
    Jobs --> Kafka

    style Kafka fill:#ff6b6b
    style Dapr fill:#4ecdc4
    style PostgreSQL fill:#95e1d3
    style Redis fill:#f38181
```

## Event Flow Diagrams

### 1. Create Task with Reminder

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Kafka
    participant Dapr
    participant Audit
    participant WebSocket
    participant DB

    User->>Frontend: Create task with due date
    Frontend->>Backend: POST /api/v1/tasks
    Backend->>DB: Save task
    Backend->>Kafka: Publish tasks.events
    Backend->>Kafka: Publish tasks.updates
    Backend->>Dapr: Schedule reminder job

    Kafka->>Audit: Consume event
    Audit->>DB: Write audit log

    Kafka->>WebSocket: Consume update
    WebSocket->>Frontend: Broadcast via WebSocket
    Frontend->>User: Show task + "Live" indicator
```

### 2. Complete Recurring Task

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Kafka
    participant RecurringTask
    participant Audit
    participant WebSocket
    participant DB

    User->>Frontend: Mark task complete
    Frontend->>Backend: PATCH /api/v1/tasks/{id}
    Backend->>DB: Update is_completed=true
    Backend->>Kafka: Publish tasks.events (completed)

    Kafka->>RecurringTask: Consume event
    RecurringTask->>RecurringTask: Calculate next date
    RecurringTask->>Backend: POST /api/v1/tasks (next occurrence)
    Backend->>DB: Save new task
    Backend->>Kafka: Publish tasks.events (created)

    Kafka->>Audit: Consume events
    Audit->>DB: Write audit logs

    Kafka->>WebSocket: Consume updates
    WebSocket->>Frontend: Broadcast both tasks
    Frontend->>User: Show completed + new task
```

### 3. Reminder Notification

```mermaid
sequenceDiagram
    participant Dapr
    participant Backend
    participant Kafka
    participant Notification
    participant WebSocket
    participant Browser

    Dapr->>Backend: Trigger job callback
    Backend->>Kafka: Publish tasks.reminders

    Kafka->>Notification: Consume reminder
    Notification->>WebSocket: Send notification
    WebSocket->>Browser: Push notification
    Browser->>Browser: Show native notification
```

## Component Architecture

```mermaid
graph LR
    subgraph "Backend Services"
        B1[Backend API<br/>Port 8000]
        B2[Recurring Task<br/>Port 8001]
        B3[Notification<br/>Port 8002]
        B4[Audit<br/>Port 8003]
        B5[WebSocket<br/>Port 8004]
    end

    subgraph "Dapr Sidecars"
        D1[Dapr 3500]
        D2[Dapr 3500]
        D3[Dapr 3500]
        D4[Dapr 3500]
        D5[Dapr 3500]
    end

    B1 -.-> D1
    B2 -.-> D2
    B3 -.-> D3
    B4 -.-> D4
    B5 -.-> D5

    D1 --> Kafka[Kafka Cluster]
    D2 --> Kafka
    D3 --> Kafka
    D4 --> Kafka
    D5 --> Kafka

    D1 --> Redis[Redis State]
    D2 --> Redis
    D3 --> Redis
    D4 --> Redis
    D5 --> Redis

    style Kafka fill:#ff6b6b
    style Redis fill:#f38181
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Namespace: todo-app"
            FE[Frontend Pods<br/>2 replicas]
            BE[Backend Pods<br/>2 replicas]
            RT[Recurring Task Pods<br/>2 replicas]
            NT[Notification Pods<br/>2 replicas]
            AU[Audit Pods<br/>2 replicas]
            WS[WebSocket Pods<br/>2 replicas]
            RD[Redis Pod<br/>1 replica]
        end

        subgraph "Namespace: kafka"
            K1[Kafka Broker 1]
            K2[Kafka Broker 2]
            K3[Kafka Broker 3]
            Z1[Zookeeper 1]
            Z2[Zookeeper 2]
            Z3[Zookeeper 3]
        end

        subgraph "Namespace: dapr-system"
            DO[Dapr Operator]
            DS[Dapr Sidecar Injector]
            DP[Dapr Placement]
        end

        subgraph "Namespace: monitoring"
            PR[Prometheus]
            GR[Grafana]
        end
    end

    subgraph "External Services"
        DB[(Neon PostgreSQL)]
        LB[Load Balancer]
    end

    LB --> FE
    LB --> WS
    FE --> BE
    BE --> DB

    K1 -.-> K2
    K2 -.-> K3
    K1 -.-> Z1
    K2 -.-> Z2
    K3 -.-> Z3

    PR -.Monitor.-> FE
    PR -.Monitor.-> BE
    GR -.Query.-> PR

    style DB fill:#95e1d3
    style LB fill:#4ecdc4
```

## Data Flow

```mermaid
flowchart LR
    A[User Action] --> B{Action Type}

    B -->|Create| C[Backend API]
    B -->|Update| C
    B -->|Complete| C
    B -->|Delete| C

    C --> D[Save to PostgreSQL]
    C --> E[Publish to Kafka]

    E --> F[tasks.events]
    E --> G[tasks.updates]
    E --> H[tasks.reminders]

    F --> I[Audit Service]
    F --> J[Recurring Task Service]

    G --> K[WebSocket Service]
    H --> L[Notification Service]

    I --> M[Audit Logs DB]
    J --> C
    K --> N[Connected Clients]
    L --> K

    style D fill:#95e1d3
    style E fill:#ff6b6b
    style M fill:#95e1d3
```
