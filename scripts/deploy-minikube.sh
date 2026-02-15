#!/bin/bash
# Phase V - Minikube Deployment Script
# This script automates the deployment of the Todo app with event-driven architecture to Minikube

set -e  # Exit on error

echo "🚀 Starting Phase V Deployment to Minikube..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v minikube >/dev/null 2>&1 || { echo -e "${RED}❌ minikube is required but not installed.${NC}" >&2; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}❌ kubectl is required but not installed.${NC}" >&2; exit 1; }
command -v helm >/dev/null 2>&1 || { echo -e "${RED}❌ helm is required but not installed.${NC}" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ docker is required but not installed.${NC}" >&2; exit 1; }
echo -e "${GREEN}✅ All prerequisites installed${NC}"
echo ""

# Start Minikube
echo "🎯 Starting Minikube..."
if minikube status | grep -q "Running"; then
    echo -e "${YELLOW}⚠️  Minikube is already running${NC}"
else
    minikube start --cpus=4 --memory=8192 --driver=docker
    echo -e "${GREEN}✅ Minikube started${NC}"
fi
echo ""

# Configure Docker to use Minikube's daemon
echo "🐳 Configuring Docker to use Minikube's daemon..."
eval $(minikube docker-env)
echo -e "${GREEN}✅ Docker configured${NC}"
echo ""

# Install Strimzi Kafka Operator
echo "📦 Installing Strimzi Kafka Operator..."
kubectl create namespace kafka --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f https://strimzi.io/install/latest?namespace=kafka -n kafka
echo "⏳ Waiting for Strimzi operator to be ready..."
kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n kafka --timeout=300s
echo -e "${GREEN}✅ Strimzi operator installed${NC}"
echo ""

# Deploy Kafka Cluster
echo "☕ Deploying Kafka cluster..."
kubectl apply -f kubernetes/kafka/kafka-cluster.yaml
kubectl apply -f kubernetes/kafka/topics.yaml
echo "⏳ Waiting for Kafka cluster to be ready (this may take 2-3 minutes)..."
kubectl wait kafka/todo-kafka --for=condition=Ready --timeout=300s -n kafka
echo -e "${GREEN}✅ Kafka cluster deployed${NC}"
echo ""

# Install Dapr
echo "🔷 Installing Dapr..."
helm repo add dapr https://dapr.github.io/helm-charts/ 2>/dev/null || true
helm repo update
if helm list -n dapr-system | grep -q dapr; then
    echo -e "${YELLOW}⚠️  Dapr is already installed${NC}"
else
    helm install dapr dapr/dapr --namespace dapr-system --create-namespace --wait
    echo -e "${GREEN}✅ Dapr installed${NC}"
fi
echo ""

# Create namespace and secrets
echo "🔐 Creating namespace and secrets..."
kubectl create namespace todo-app --dry-run=client -o yaml | kubectl apply -f -

# Prompt for secrets if not provided
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set in environment${NC}"
    read -p "Enter DATABASE_URL (or press Enter to use default): " DATABASE_URL
    DATABASE_URL=${DATABASE_URL:-"postgresql://user:pass@host:5432/todo"}
fi

if [ -z "$BETTER_AUTH_SECRET" ]; then
    echo -e "${YELLOW}⚠️  BETTER_AUTH_SECRET not set in environment${NC}"
    read -p "Enter BETTER_AUTH_SECRET (or press Enter to generate): " BETTER_AUTH_SECRET
    BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-$(openssl rand -hex 32)}
fi

kubectl create secret generic todo-secrets \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=GEMINI_API_KEYS="${GEMINI_API_KEYS:-dummy-key}" \
  --from-literal=BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  -n todo-app \
  --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✅ Secrets created${NC}"
echo ""

# Deploy infrastructure
echo "🏗️  Deploying infrastructure (Redis, Dapr components)..."
kubectl apply -f kubernetes/redis/redis-deployment.yaml
kubectl apply -f kubernetes/dapr/kafka-pubsub.yaml
kubectl apply -f kubernetes/dapr/statestore.yaml
kubectl apply -f kubernetes/dapr/secrets.yaml
echo -e "${GREEN}✅ Infrastructure deployed${NC}"
echo ""

# Build Docker images
echo "🔨 Building Docker images..."
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend
docker build -t recurring-task-service:latest ./services/recurring-task
docker build -t notification-service:latest ./services/notification
docker build -t audit-service:latest ./services/audit
docker build -t websocket-service:latest ./services/websocket
echo -e "${GREEN}✅ Docker images built${NC}"
echo ""

# Load images into Minikube
echo "📥 Loading images into Minikube..."
minikube image load todo-backend:latest
minikube image load todo-frontend:latest
minikube image load recurring-task-service:latest
minikube image load notification-service:latest
minikube image load audit-service:latest
minikube image load websocket-service:latest
echo -e "${GREEN}✅ Images loaded${NC}"
echo ""

# Deploy microservices
echo "🚢 Deploying microservices..."
kubectl apply -f kubernetes/services/recurring-task-deployment.yaml
kubectl apply -f kubernetes/services/notification-deployment.yaml
kubectl apply -f kubernetes/services/audit-deployment.yaml
kubectl apply -f kubernetes/services/websocket-deployment.yaml
echo -e "${GREEN}✅ Microservices deployed${NC}"
echo ""

# Deploy main application with Helm
echo "⎈ Deploying main application with Helm..."
if helm list -n todo-app | grep -q todo; then
    helm upgrade todo ./todo-chart -n todo-app
    echo -e "${GREEN}✅ Application upgraded${NC}"
else
    helm install todo ./todo-chart -n todo-app
    echo -e "${GREEN}✅ Application installed${NC}"
fi
echo ""

# Wait for all pods to be ready
echo "⏳ Waiting for all pods to be ready..."
kubectl wait --for=condition=ready pod --all -n todo-app --timeout=300s
echo -e "${GREEN}✅ All pods are ready${NC}"
echo ""

# Display deployment status
echo "📊 Deployment Status:"
echo ""
kubectl get pods -n todo-app
echo ""
kubectl get svc -n todo-app
echo ""

# Setup port forwarding
echo "🔌 Setting up port forwarding..."
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:8000"
echo "   WebSocket: ws://localhost:8004"
echo ""
echo "Run the following commands in separate terminals:"
echo "   kubectl port-forward svc/todo-frontend 3000:3000 -n todo-app"
echo "   kubectl port-forward svc/todo-backend 8000:8000 -n todo-app"
echo "   kubectl port-forward svc/websocket-service 8004:8004 -n todo-app"
echo ""

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set up port forwarding (see commands above)"
echo "2. Access the application at http://localhost:3000"
echo "3. Check logs: kubectl logs -f deployment/todo-backend -n todo-app"
echo "4. Monitor pods: kubectl get pods -n todo-app -w"
echo ""
echo "To verify the deployment, run: ./scripts/verify-deployment.sh"
