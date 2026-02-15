#!/bin/bash
# Phase V - Deployment Verification Script
# This script verifies that all Phase V components are deployed and working correctly

set -e

echo "🔍 Verifying Phase V Deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ERRORS=0

# Function to check and report
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ((ERRORS++))
    fi
}

# 1. Check Kafka
echo "📋 Checking Kafka..."
kubectl get kafka todo-kafka -n kafka &>/dev/null
check "Kafka cluster exists"

kubectl get kafka todo-kafka -n kafka -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' | grep -q "True"
check "Kafka cluster is Ready"

TOPICS=$(kubectl exec -it todo-kafka-kafka-0 -n kafka -- bin/kafka-topics.sh --list --bootstrap-server localhost:9092 2>/dev/null | tr -d '\r')
echo "$TOPICS" | grep -q "tasks.events"
check "Topic 'tasks.events' exists"
echo "$TOPICS" | grep -q "tasks.reminders"
check "Topic 'tasks.reminders' exists"
echo "$TOPICS" | grep -q "tasks.updates"
check "Topic 'tasks.updates' exists"
echo ""

# 2. Check Dapr
echo "📋 Checking Dapr..."
kubectl get pods -n dapr-system | grep -q "Running"
check "Dapr control plane is running"

kubectl get components -n todo-app | grep -q "kafka-pubsub"
check "Dapr kafka-pubsub component exists"
kubectl get components -n todo-app | grep -q "statestore"
check "Dapr statestore component exists"
echo ""

# 3. Check Infrastructure
echo "📋 Checking Infrastructure..."
kubectl get deployment redis -n todo-app &>/dev/null
check "Redis deployment exists"

kubectl get pods -n todo-app -l app=redis | grep -q "Running"
check "Redis pod is running"
echo ""

# 4. Check Microservices
echo "📋 Checking Microservices..."

SERVICES=("recurring-task-service" "notification-service" "audit-service" "websocket-service")
for service in "${SERVICES[@]}"; do
    kubectl get deployment $service -n todo-app &>/dev/null
    check "$service deployment exists"

    READY=$(kubectl get deployment $service -n todo-app -o jsonpath='{.status.readyReplicas}')
    DESIRED=$(kubectl get deployment $service -n todo-app -o jsonpath='{.spec.replicas}')
    if [ "$READY" = "$DESIRED" ]; then
        echo -e "${GREEN}✅ $service has $READY/$DESIRED pods ready${NC}"
    else
        echo -e "${RED}❌ $service has $READY/$DESIRED pods ready${NC}"
        ((ERRORS++))
    fi
done
echo ""

# 5. Check Main Application
echo "📋 Checking Main Application..."
kubectl get deployment todo-backend -n todo-app &>/dev/null
check "Backend deployment exists"
kubectl get deployment todo-frontend -n todo-app &>/dev/null
check "Frontend deployment exists"

BACKEND_READY=$(kubectl get deployment todo-backend -n todo-app -o jsonpath='{.status.readyReplicas}')
BACKEND_DESIRED=$(kubectl get deployment todo-backend -n todo-app -o jsonpath='{.spec.replicas}')
if [ "$BACKEND_READY" = "$BACKEND_DESIRED" ]; then
    echo -e "${GREEN}✅ Backend has $BACKEND_READY/$BACKEND_DESIRED pods ready${NC}"
else
    echo -e "${RED}❌ Backend has $BACKEND_READY/$BACKEND_DESIRED pods ready${NC}"
    ((ERRORS++))
fi

FRONTEND_READY=$(kubectl get deployment todo-frontend -n todo-app -o jsonpath='{.status.readyReplicas}')
FRONTEND_DESIRED=$(kubectl get deployment todo-frontend -n todo-app -o jsonpath='{.spec.replicas}')
if [ "$FRONTEND_READY" = "$FRONTEND_DESIRED" ]; then
    echo -e "${GREEN}✅ Frontend has $FRONTEND_READY/$FRONTEND_DESIRED pods ready${NC}"
else
    echo -e "${RED}❌ Frontend has $FRONTEND_READY/$FRONTEND_DESIRED pods ready${NC}"
    ((ERRORS++))
fi
echo ""

# 6. Check Dapr Sidecars
echo "📋 Checking Dapr Sidecars..."
PODS=$(kubectl get pods -n todo-app -o jsonpath='{.items[*].metadata.name}')
for pod in $PODS; do
    CONTAINERS=$(kubectl get pod $pod -n todo-app -o jsonpath='{.spec.containers[*].name}')
    if echo "$CONTAINERS" | grep -q "daprd"; then
        echo -e "${GREEN}✅ $pod has Dapr sidecar${NC}"
    else
        echo -e "${YELLOW}⚠️  $pod does not have Dapr sidecar${NC}"
    fi
done
echo ""

# 7. Check Services
echo "📋 Checking Services..."
kubectl get svc todo-backend -n todo-app &>/dev/null
check "Backend service exists"
kubectl get svc todo-frontend -n todo-app &>/dev/null
check "Frontend service exists"
kubectl get svc websocket-service -n todo-app &>/dev/null
check "WebSocket service exists"
echo ""

# 8. Test Backend Health
echo "📋 Testing Backend Health..."
BACKEND_POD=$(kubectl get pods -n todo-app -l app=todo-backend -o jsonpath='{.items[0].metadata.name}')
if [ -n "$BACKEND_POD" ]; then
    HEALTH=$(kubectl exec -it $BACKEND_POD -n todo-app -c backend -- curl -s http://localhost:8000/health 2>/dev/null | grep -o '"status":"healthy"')
    if [ -n "$HEALTH" ]; then
        echo -e "${GREEN}✅ Backend health check passed${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${RED}❌ No backend pod found${NC}"
    ((ERRORS++))
fi
echo ""

# 9. Check Database Connection
echo "📋 Checking Database Connection..."
if [ -n "$BACKEND_POD" ]; then
    DB_STATUS=$(kubectl exec -it $BACKEND_POD -n todo-app -c backend -- curl -s http://localhost:8000/health 2>/dev/null | grep -o '"database":"connected"')
    if [ -n "$DB_STATUS" ]; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        ((ERRORS++))
    fi
fi
echo ""

# 10. Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Deployment is healthy.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set up port forwarding:"
    echo "   kubectl port-forward svc/todo-frontend 3000:3000 -n todo-app"
    echo "   kubectl port-forward svc/todo-backend 8000:8000 -n todo-app"
    echo "   kubectl port-forward svc/websocket-service 8004:8004 -n todo-app"
    echo ""
    echo "2. Access the application at http://localhost:3000"
    echo ""
    echo "3. Test Phase V features:"
    echo "   - Create a task with due date and recurring enabled"
    echo "   - Complete the task and verify next occurrence is created"
    echo "   - Check real-time updates in multiple browser tabs"
    echo "   - Verify reminder notifications appear"
    exit 0
else
    echo -e "${RED}❌ $ERRORS check(s) failed. Please review the errors above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check pod logs: kubectl logs -f <pod-name> -n todo-app"
    echo "2. Check pod events: kubectl describe pod <pod-name> -n todo-app"
    echo "3. Check Dapr sidecar logs: kubectl logs <pod-name> -n todo-app -c daprd"
    echo "4. Verify secrets: kubectl get secret todo-secrets -n todo-app"
    exit 1
fi
