# Phase V Deployment Guide

## Prerequisites

### Required Software
- Docker Desktop (with Kubernetes enabled) OR Minikube
- kubectl CLI
- Helm 3.x
- Python 3.11+
- Node.js 18+
- Git

### Cloud Accounts (for production)
- Oracle Cloud (OKE) OR Google Cloud (GKE) OR Azure (AKS)
- Neon PostgreSQL database (or any PostgreSQL 14+)

## Local Development Setup

### 1. Database Setup

**Option A: Use Neon (Recommended)**
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string

**Option B: Local PostgreSQL**
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=todo \
  -p 5432:5432 \
  postgres:14
```

### 2. Configure Environment Variables

**Backend (.env)**
```bash
cd backend
cp .env.example .env
# Edit .env with your values:
# DATABASE_URL=postgresql://user:pass@host:5432/todo
# BETTER_AUTH_SECRET=your-secret-here
```

**Frontend (.env.local)**
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_WEBSOCKET_URL=localhost:8004
```

### 3. Run Database Migrations

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
```

### 4. Start Backend (Development)

```bash
cd backend
source venv/bin/activate
uvicorn src.main:app --reload --port 8000
```

Backend will be available at http://localhost:8000

### 5. Start Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:3000

## Kubernetes Deployment (Local with Minikube)

### 1. Start Minikube

```bash
minikube start --cpus=4 --memory=8192 --driver=docker
eval $(minikube docker-env)  # Use Minikube's Docker daemon
```

### 2. Install Strimzi Kafka Operator

```bash
kubectl create namespace kafka
kubectl apply -f https://strimzi.io/install/latest?namespace=kafka -n kafka

# Wait for operator to be ready
kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n kafka --timeout=300s
```

### 3. Deploy Kafka Cluster

```bash
kubectl apply -f kubernetes/kafka/kafka-cluster.yaml
kubectl apply -f kubernetes/kafka/topics.yaml

# Wait for Kafka to be ready (takes 2-3 minutes)
kubectl wait kafka/todo-kafka --for=condition=Ready --timeout=300s -n kafka
```

### 4. Install Dapr

```bash
helm repo add dapr https://dapr.github.io/helm-charts/
helm repo update
helm install dapr dapr/dapr --namespace dapr-system --create-namespace --wait

# Verify Dapr installation
kubectl get pods -n dapr-system
```

### 5. Create Namespace and Secrets

```bash
kubectl create namespace todo-app

# Create secrets
kubectl create secret generic todo-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@host:5432/todo' \
  --from-literal=GEMINI_API_KEYS='your-api-keys' \
  --from-literal=BETTER_AUTH_SECRET='your-secret' \
  -n todo-app
```

### 6. Deploy Infrastructure

```bash
# Deploy Redis
kubectl apply -f kubernetes/redis/redis-deployment.yaml

# Deploy Dapr components
kubectl apply -f kubernetes/dapr/kafka-pubsub.yaml
kubectl apply -f kubernetes/dapr/statestore.yaml
kubectl apply -f kubernetes/dapr/secrets.yaml

# Verify components
kubectl get components -n todo-app
```

### 7. Build and Load Docker Images

```bash
# Build all images
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend
docker build -t recurring-task-service:latest ./services/recurring-task
docker build -t notification-service:latest ./services/notification
docker build -t audit-service:latest ./services/audit
docker build -t websocket-service:latest ./services/websocket

# Load into Minikube
minikube image load todo-backend:latest
minikube image load todo-frontend:latest
minikube image load recurring-task-service:latest
minikube image load notification-service:latest
minikube image load audit-service:latest
minikube image load websocket-service:latest
```

### 8. Deploy Application Services

```bash
# Deploy microservices
kubectl apply -f kubernetes/services/recurring-task-deployment.yaml
kubectl apply -f kubernetes/services/notification-deployment.yaml
kubectl apply -f kubernetes/services/audit-deployment.yaml
kubectl apply -f kubernetes/services/websocket-deployment.yaml

# Deploy main application (using Helm)
helm install todo ./todo-chart -n todo-app

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod --all -n todo-app --timeout=300s
```

### 9. Verify Deployment

```bash
# Check all pods (should show 2/2 for each - app + dapr sidecar)
kubectl get pods -n todo-app

# Check services
kubectl get svc -n todo-app

# Check Dapr components
kubectl get components -n todo-app

# Check Kafka topics
kubectl exec -it todo-kafka-kafka-0 -n kafka -- bin/kafka-topics.sh --list --bootstrap-server localhost:9092
```

### 10. Access the Application

```bash
# Get Minikube IP
minikube ip

# Port forward services
kubectl port-forward svc/todo-frontend 3000:3000 -n todo-app &
kubectl port-forward svc/todo-backend 8000:8000 -n todo-app &
kubectl port-forward svc/websocket-service 8004:8004 -n todo-app &

# Access application
open http://localhost:3000
```

## Cloud Deployment (Oracle Cloud OKE)

### 1. Create OKE Cluster

**Via OCI Console:**
1. Navigate to: Developer Services → Kubernetes Clusters (OKE)
2. Click "Create Cluster" → Quick Create
3. Configure:
   - Cluster name: `todo-cluster`
   - Kubernetes version: v1.28 or latest
   - Node pool: VM.Standard.E2.1.Micro (Always Free)
   - Number of nodes: 2
4. Click "Create Cluster" (takes 5-10 minutes)

**Via OCI CLI:**
```bash
oci ce cluster create \
  --compartment-id <COMPARTMENT_OCID> \
  --name todo-cluster \
  --kubernetes-version v1.28.2 \
  --vcn-id <VCN_OCID> \
  --service-lb-subnet-ids '["<SUBNET_OCID>"]'
```

### 2. Download kubeconfig

```bash
# Via OCI Console: Cluster Details → Access Cluster → Copy command
# Or via CLI:
oci ce cluster create-kubeconfig \
  --cluster-id <CLUSTER_OCID> \
  --file $HOME/.kube/config \
  --region us-ashburn-1

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### 3. Follow Steps 2-9 from Minikube Deployment

The deployment steps are identical, but images need to be pushed to a container registry:

```bash
# Tag images for Oracle Container Registry (OCIR)
docker tag todo-backend:latest <region>.ocir.io/<tenancy>/todo-backend:latest
docker tag todo-frontend:latest <region>.ocir.io/<tenancy>/todo-frontend:latest
# ... tag other images

# Login to OCIR
docker login <region>.ocir.io

# Push images
docker push <region>.ocir.io/<tenancy>/todo-backend:latest
docker push <region>.ocir.io/<tenancy>/todo-frontend:latest
# ... push other images

# Update image references in Helm values or deployment manifests
```

### 4. Configure LoadBalancer

```bash
# Frontend and WebSocket services will get public IPs automatically
kubectl get svc -n todo-app

# Wait for EXTERNAL-IP to be assigned
kubectl get svc todo-frontend -n todo-app -w
kubectl get svc websocket-service -n todo-app -w
```

### 5. Configure DNS (Optional)

Point your domain to the LoadBalancer IPs:
- `app.yourdomain.com` → Frontend LoadBalancer IP
- `ws.yourdomain.com` → WebSocket LoadBalancer IP

## Testing the Deployment

### 1. Test Backend Health

```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","database":"connected"}
```

### 2. Test Kafka

```bash
# Exec into Kafka pod
kubectl exec -it todo-kafka-kafka-0 -n kafka -- bash

# List topics
bin/kafka-topics.sh --list --bootstrap-server localhost:9092
# Should show: tasks.events, tasks.reminders, tasks.updates

# Test produce/consume
bin/kafka-console-producer.sh --topic tasks.events --bootstrap-server localhost:9092
# Type a message and press Enter

bin/kafka-console-consumer.sh --topic tasks.events --from-beginning --bootstrap-server localhost:9092
# Should see your message
```

### 3. Test Dapr Components

```bash
# Check component status
kubectl get components -n todo-app

# Test pub/sub
kubectl exec -it <backend-pod> -n todo-app -- curl -X POST http://localhost:3500/v1.0/publish/kafka-pubsub/tasks.events -H "Content-Type: application/json" -d '{"test":"message"}'
```

### 4. Test WebSocket Connection

Open browser console on http://localhost:3000 and check for:
```
WebSocket connected
Received WebSocket message: {type: "connection", status: "connected"}
```

### 5. Test End-to-End Flow

1. Create a task with due date and recurring enabled
2. Check that:
   - Task appears in UI immediately
   - Audit log entry created (check database)
   - Event published to Kafka (check consumer)
3. Complete the recurring task
4. Check that next occurrence is auto-created
5. Wait for reminder time
6. Check that browser notification appears

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n todo-app

# Check pod logs
kubectl logs <pod-name> -n todo-app -c <container-name>

# Check Dapr sidecar logs
kubectl logs <pod-name> -n todo-app -c daprd

# Describe pod for events
kubectl describe pod <pod-name> -n todo-app
```

### Kafka Issues

```bash
# Check Kafka cluster status
kubectl get kafka -n kafka

# Check Kafka logs
kubectl logs todo-kafka-kafka-0 -n kafka

# Check Zookeeper
kubectl get pods -n kafka | grep zookeeper
```

### Dapr Issues

```bash
# Check Dapr control plane
kubectl get pods -n dapr-system

# Check component status
kubectl get components -n todo-app

# Test Dapr sidecar
kubectl exec -it <pod-name> -n todo-app -- curl http://localhost:3500/v1.0/healthz
```

### Database Connection Issues

```bash
# Test connection from backend pod
kubectl exec -it <backend-pod> -n todo-app -- python -c "from src.database import engine; print(engine)"

# Check secret
kubectl get secret todo-secrets -n todo-app -o yaml
```

### WebSocket Not Connecting

1. Check WebSocket service is running:
   ```bash
   kubectl get svc websocket-service -n todo-app
   ```

2. Check browser console for errors

3. Verify NEXT_PUBLIC_WEBSOCKET_URL is correct

4. Test WebSocket endpoint:
   ```bash
   wscat -c ws://localhost:8004/ws/1
   ```

## Monitoring

### View Logs

```bash
# All pods in namespace
kubectl logs -f -l app=todo-backend -n todo-app

# Specific service
kubectl logs -f deployment/recurring-task-service -n todo-app

# Dapr sidecar
kubectl logs -f <pod-name> -n todo-app -c daprd
```

### Check Metrics

```bash
# Pod resource usage
kubectl top pods -n todo-app

# Node resource usage
kubectl top nodes
```

### Dapr Dashboard (Optional)

```bash
# Install Dapr dashboard
helm install dapr-dashboard dapr/dapr-dashboard --namespace dapr-system

# Port forward
kubectl port-forward svc/dapr-dashboard 8080:8080 -n dapr-system

# Access at http://localhost:8080
```

## Cleanup

### Minikube

```bash
# Delete application
helm uninstall todo -n todo-app
kubectl delete namespace todo-app

# Delete Kafka
kubectl delete -f kubernetes/kafka/
kubectl delete namespace kafka

# Delete Dapr
helm uninstall dapr -n dapr-system
kubectl delete namespace dapr-system

# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete
```

### Cloud (OKE)

```bash
# Delete application
helm uninstall todo -n todo-app
kubectl delete namespace todo-app

# Delete infrastructure
kubectl delete -f kubernetes/kafka/
kubectl delete namespace kafka
helm uninstall dapr -n dapr-system

# Delete cluster via OCI Console or CLI
oci ce cluster delete --cluster-id <CLUSTER_OCID>
```

## Next Steps

1. Set up CI/CD pipeline (see `.github/workflows/deploy.yml`)
2. Configure monitoring with Prometheus and Grafana
3. Set up distributed tracing with Jaeger
4. Configure SSL/TLS with cert-manager
5. Implement backup and disaster recovery
6. Set up log aggregation with ELK or Loki
7. Configure autoscaling (HPA)
8. Implement rate limiting and API gateway
