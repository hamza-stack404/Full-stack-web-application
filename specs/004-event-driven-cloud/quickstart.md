# Phase V Quickstart Guide

**Date**: 2026-02-14
**Feature**: 004-event-driven-cloud
**Status**: Complete

## Overview

This guide helps you set up a local development environment for Phase V with Kafka, Dapr, Redis, and all microservices running on Minikube or Kind.

---

## Prerequisites

### Required Software

- **Docker Desktop**: 4.25+ with Kubernetes enabled
- **kubectl**: 1.28+
- **Helm**: 3.13+
- **Minikube** or **Kind**: Latest version
- **Python**: 3.11+
- **Node.js**: 20+
- **Git**: Latest version

### Optional Tools

- **k9s**: Kubernetes CLI UI
- **Lens**: Kubernetes IDE
- **Postman**: API testing
- **kafkacat/kcat**: Kafka CLI tool

---

## Quick Start (15 minutes)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/todo-app.git
cd todo-app
git checkout 004-event-driven-cloud
```

---

### 2. Start Kubernetes Cluster

**Option A: Minikube**
```bash
minikube start --cpus=4 --memory=8192 --disk-size=20g
minikube addons enable ingress
```

**Option B: Kind**
```bash
kind create cluster --name todo-cluster --config kind-config.yaml
```

**Verify**:
```bash
kubectl cluster-info
kubectl get nodes
```

---

### 3. Install Infrastructure

**Install Strimzi Operator (Kafka)**:
```bash
kubectl create namespace kafka
helm repo add strimzi https://strimzi.io/charts/
helm install strimzi-kafka-operator strimzi/strimzi-kafka-operator \
  --namespace kafka \
  --wait
```

**Deploy Kafka Cluster**:
```bash
kubectl apply -f kubernetes/kafka/kafka-cluster.yaml
kubectl wait kafka/todo-kafka --for=condition=Ready --timeout=300s -n kafka
```

**Create Kafka Topics**:
```bash
kubectl apply -f kubernetes/kafka/topics.yaml
```

**Verify Kafka**:
```bash
kubectl get kafka -n kafka
kubectl get kafkatopic -n kafka
```

---

**Install Dapr**:
```bash
helm repo add dapr https://dapr.github.io/helm-charts/
helm repo update
helm install dapr dapr/dapr \
  --namespace dapr-system \
  --create-namespace \
  --wait
```

**Verify Dapr**:
```bash
kubectl get pods -n dapr-system
# Should see: dapr-operator, dapr-sidecar-injector, dapr-sentry, dapr-placement
```

---

**Deploy Redis**:
```bash
kubectl create namespace todo-app
kubectl apply -f kubernetes/redis/redis-deployment.yaml
kubectl wait --for=condition=ready pod -l app=redis -n todo-app --timeout=120s
```

**Verify Redis**:
```bash
kubectl get pods -n todo-app -l app=redis
```

---

**Deploy Dapr Components**:
```bash
kubectl apply -f kubernetes/dapr/kafka-pubsub.yaml
kubectl apply -f kubernetes/dapr/statestore.yaml
kubectl apply -f kubernetes/dapr/secrets.yaml
```

**Verify Dapr Components**:
```bash
kubectl get components -n todo-app
```

---

### 4. Database Setup

**Set Environment Variables**:
```bash
export DATABASE_URL="postgresql://user:password@host:5432/todo_db"
```

**Run Migrations**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
```

**Verify Migration**:
```bash
alembic current
# Should show: phase5_event_driven (head)
```

---

### 5. Build and Deploy Services

**Build Docker Images**:
```bash
# Backend
docker build -t todo-backend:phase5 ./backend

# Frontend
docker build -t todo-frontend:phase5 ./frontend

# Microservices
docker build -t recurring-task-service:phase5 ./services/recurring-task
docker build -t notification-service:phase5 ./services/notification
docker build -t audit-service:phase5 ./services/audit
docker build -t websocket-service:phase5 ./services/websocket
```

**Load Images into Cluster**:

**Minikube**:
```bash
minikube image load todo-backend:phase5
minikube image load todo-frontend:phase5
minikube image load recurring-task-service:phase5
minikube image load notification-service:phase5
minikube image load audit-service:phase5
minikube image load websocket-service:phase5
```

**Kind**:
```bash
kind load docker-image todo-backend:phase5 --name todo-cluster
kind load docker-image todo-frontend:phase5 --name todo-cluster
kind load docker-image recurring-task-service:phase5 --name todo-cluster
kind load docker-image notification-service:phase5 --name todo-cluster
kind load docker-image audit-service:phase5 --name todo-cluster
kind load docker-image websocket-service:phase5 --name todo-cluster
```

---

**Deploy Application**:
```bash
helm upgrade --install todo-app ./todo-chart \
  --namespace todo-app \
  --set backend.image.tag=phase5 \
  --set frontend.image.tag=phase5 \
  --set backend.image.pullPolicy=Never \
  --set frontend.image.pullPolicy=Never \
  --set recurringTask.image.tag=phase5 \
  --set notification.image.tag=phase5 \
  --set audit.image.tag=phase5 \
  --set websocket.image.tag=phase5 \
  --wait
```

**Verify Deployment**:
```bash
kubectl get pods -n todo-app
# Should see 6 pods: backend, frontend, recurring-task, notification, audit, websocket
```

---

### 6. Access Application

**Port Forward Services**:
```bash
# Frontend
kubectl port-forward -n todo-app svc/frontend 3000:3000 &

# Backend
kubectl port-forward -n todo-app svc/backend 8000:8000 &

# WebSocket
kubectl port-forward -n todo-app svc/websocket 8001:8001 &
```

**Access URLs**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- WebSocket: ws://localhost:8001/ws/{user_id}

---

### 7. Verify Everything Works

**Check Kafka Topics**:
```bash
kubectl exec -it -n kafka todo-kafka-kafka-0 -- bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
# Should see: tasks.events, tasks.reminders, tasks.updates
```

**Check Dapr Sidecars**:
```bash
kubectl get pods -n todo-app -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}'
# Each pod should have 2 containers: app + daprd
```

**Test API**:
```bash
# Create a task
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "priority": "high",
    "tags": ["test"]
  }'
```

**Check Kafka Events**:
```bash
kubectl exec -it -n kafka todo-kafka-kafka-0 -- bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic tasks.events \
  --from-beginning \
  --max-messages 1
```

**Check Logs**:
```bash
# Backend
kubectl logs -n todo-app -l app=backend -c backend --tail=50

# Recurring Task Service
kubectl logs -n todo-app -l app=recurring-task -c recurring-task --tail=50

# Audit Service
kubectl logs -n todo-app -l app=audit -c audit --tail=50
```

---

## Development Workflow

### Local Development (Without Kubernetes)

For faster iteration during development:

**1. Run Infrastructure Only in Kubernetes**:
```bash
# Keep Kafka, Dapr, Redis running in cluster
# Port forward Kafka
kubectl port-forward -n kafka svc/todo-kafka-kafka-bootstrap 9092:9092 &

# Port forward Redis
kubectl port-forward -n todo-app svc/redis 6379:6379 &
```

**2. Run Services Locally**:

**Backend**:
```bash
cd backend
source venv/bin/activate
export DATABASE_URL="postgresql://user:password@host:5432/todo_db"
export KAFKA_BOOTSTRAP_SERVERS="localhost:9092"
export REDIS_HOST="localhost"
uvicorn src.main:app --reload --port 8000
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

**Microservices** (in separate terminals):
```bash
# Recurring Task Service
cd services/recurring-task
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Notification Service
cd services/notification
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Audit Service
cd services/audit
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# WebSocket Service
cd services/websocket
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

---

### Hot Reload

**Backend**:
- Uses `uvicorn --reload` for automatic restart on code changes

**Frontend**:
- Uses Next.js Fast Refresh for instant updates

**Microservices**:
- Add `--reload` flag to uvicorn for hot reload

---

### Debugging

**Debug Backend**:
```bash
cd backend
python -m debugpy --listen 5678 --wait-for-client -m uvicorn src.main:app --reload
```

**Debug in VS Code** (launch.json):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Backend",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["src.main:app", "--reload"],
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "DATABASE_URL": "postgresql://user:password@host:5432/todo_db"
      }
    },
    {
      "name": "Next.js: Frontend",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/frontend"
    }
  ]
}
```

---

## Testing

### Unit Tests

**Backend**:
```bash
cd backend
pytest tests/unit/ -v
```

**Frontend**:
```bash
cd frontend
npm test
```

**Microservices**:
```bash
cd services/recurring-task
pytest tests/ -v
```

---

### Integration Tests

**End-to-End Event Flow**:
```bash
cd tests/integration
pytest test_event_flow.py -v
```

**Recurring Tasks**:
```bash
pytest test_recurring_tasks.py -v
```

**Real-Time Sync**:
```bash
pytest test_realtime_sync.py -v
```

---

### Load Testing

**Install k6**:
```bash
brew install k6  # macOS
# or download from https://k6.io/
```

**Run Load Test**:
```bash
k6 run tests/load/task-operations.js
```

---

## Monitoring

### Install Monitoring Stack

```bash
kubectl apply -f kubernetes/monitoring/prometheus.yaml
kubectl apply -f kubernetes/monitoring/grafana.yaml
kubectl apply -f kubernetes/monitoring/jaeger.yaml
```

### Access Dashboards

**Prometheus**:
```bash
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open http://localhost:9090
```

**Grafana**:
```bash
kubectl port-forward -n monitoring svc/grafana 3001:3000
# Open http://localhost:3001
# Default credentials: admin/admin
```

**Jaeger**:
```bash
kubectl port-forward -n monitoring svc/jaeger 16686:16686
# Open http://localhost:16686
```

---

## Troubleshooting

### Kafka Not Ready

**Check Kafka Status**:
```bash
kubectl get kafka -n kafka
kubectl describe kafka todo-kafka -n kafka
```

**Check Kafka Logs**:
```bash
kubectl logs -n kafka todo-kafka-kafka-0
```

**Common Issues**:
- Insufficient resources: Increase Minikube memory/CPU
- Zookeeper not ready: Wait for zookeeper pods to be ready first

---

### Dapr Sidecar Not Injecting

**Check Dapr Installation**:
```bash
kubectl get pods -n dapr-system
```

**Check Pod Annotations**:
```bash
kubectl get pod <pod-name> -n todo-app -o yaml | grep dapr
```

**Verify Annotations**:
```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "backend"
  dapr.io/app-port: "8000"
```

---

### Events Not Publishing

**Check Kafka Connection**:
```bash
kubectl exec -it -n todo-app <backend-pod> -- curl localhost:9092
```

**Check Dapr Component**:
```bash
kubectl get component kafka-pubsub -n todo-app -o yaml
```

**Check Backend Logs**:
```bash
kubectl logs -n todo-app -l app=backend -c backend | grep "publish"
```

---

### WebSocket Not Connecting

**Check WebSocket Service**:
```bash
kubectl get svc websocket -n todo-app
kubectl get pods -l app=websocket -n todo-app
```

**Test WebSocket Connection**:
```bash
wscat -c ws://localhost:8001/ws/test_user?token=<jwt_token>
```

**Check Logs**:
```bash
kubectl logs -n todo-app -l app=websocket -c websocket --tail=50
```

---

### Database Migration Issues

**Check Current Version**:
```bash
cd backend
alembic current
```

**Rollback Migration**:
```bash
alembic downgrade -1
```

**Re-run Migration**:
```bash
alembic upgrade head
```

**Reset Database** (development only):
```bash
alembic downgrade base
alembic upgrade head
```

---

## Cleanup

### Stop Port Forwards

```bash
# Kill all port-forward processes
pkill -f "kubectl port-forward"
```

### Delete Application

```bash
helm uninstall todo-app -n todo-app
kubectl delete namespace todo-app
```

### Delete Infrastructure

```bash
kubectl delete -f kubernetes/kafka/
kubectl delete namespace kafka
helm uninstall dapr -n dapr-system
kubectl delete namespace dapr-system
```

### Delete Cluster

**Minikube**:
```bash
minikube delete
```

**Kind**:
```bash
kind delete cluster --name todo-cluster
```

---

## Environment Variables

### Backend

```bash
# Database
export DATABASE_URL="postgresql://user:password@host:5432/todo_db"

# Kafka
export KAFKA_BOOTSTRAP_SERVERS="localhost:9092"

# Redis
export REDIS_HOST="localhost"
export REDIS_PORT="6379"

# Dapr
export DAPR_HTTP_PORT="3500"
export DAPR_GRPC_PORT="50001"

# Auth
export JWT_SECRET="your-secret-key"
export BETTER_AUTH_URL="https://auth.example.com"
```

### Frontend

```bash
# API
export NEXT_PUBLIC_API_URL="http://localhost:8000"

# WebSocket
export NEXT_PUBLIC_WS_URL="ws://localhost:8001"

# Auth
export NEXT_PUBLIC_AUTH_URL="https://auth.example.com"
```

---

## Useful Commands

### Kubernetes

```bash
# Get all resources
kubectl get all -n todo-app

# Describe pod
kubectl describe pod <pod-name> -n todo-app

# Get logs
kubectl logs -n todo-app <pod-name> -c <container-name> --tail=100 -f

# Execute command in pod
kubectl exec -it -n todo-app <pod-name> -- /bin/bash

# Port forward
kubectl port-forward -n todo-app svc/<service-name> <local-port>:<remote-port>

# Restart deployment
kubectl rollout restart deployment/<deployment-name> -n todo-app
```

### Kafka

```bash
# List topics
kubectl exec -it -n kafka todo-kafka-kafka-0 -- bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list

# Consume messages
kubectl exec -it -n kafka todo-kafka-kafka-0 -- bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic tasks.events \
  --from-beginning

# Produce message
kubectl exec -it -n kafka todo-kafka-kafka-0 -- bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic tasks.events
```

### Dapr

```bash
# List components
kubectl get components -n todo-app

# Invoke service
dapr invoke --app-id backend --method api/tasks --verb GET

# Publish event
dapr publish --publish-app-id backend --pubsub kafka-pubsub --topic tasks.events --data '{}'
```

---

## Next Steps

1. **Run Tests**: `pytest tests/ -v`
2. **Create Sample Data**: Use Postman collection in `tests/postman/`
3. **Explore Monitoring**: Open Grafana dashboards
4. **Read Documentation**: Check `specs/004-event-driven-cloud/`
5. **Start Development**: Pick a task from `tasks.md` (after running `/sp.tasks`)

---

## Support

- **Documentation**: `specs/004-event-driven-cloud/`
- **Issues**: GitHub Issues
- **Slack**: #todo-app-dev channel

---

## Tips

- Use `k9s` for easier Kubernetes navigation
- Enable Minikube dashboard: `minikube dashboard`
- Use `stern` for multi-pod log tailing: `stern -n todo-app backend`
- Set up shell aliases for common commands
- Use `kubectx` and `kubens` for context/namespace switching
