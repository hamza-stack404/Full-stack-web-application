# Phase V Troubleshooting Guide

## Common Issues and Solutions

### 1. Pods Not Starting

#### Symptom
```bash
kubectl get pods -n todo-app
# Shows: CrashLoopBackOff, ImagePullBackOff, or Pending
```

#### Solutions

**A. ImagePullBackOff**
```bash
# Check image name
kubectl describe pod <pod-name> -n todo-app

# Common causes:
# 1. Image doesn't exist in registry
# 2. Wrong image name/tag
# 3. Private registry without credentials

# Fix: Update image in Helm values
# Edit todo-chart/values.yaml:
backend:
  image:
    name: your-registry/todo-backend
    tag: latest
```

**B. CrashLoopBackOff**
```bash
# Check logs
kubectl logs <pod-name> -n todo-app -c <container-name>

# Common causes:
# 1. Database connection failed
# 2. Missing environment variables
# 3. Application error

# Fix database connection:
kubectl get secret todo-secrets -n todo-app -o yaml
# Verify DATABASE_URL is correct

# Fix: Update secret
kubectl delete secret todo-secrets -n todo-app
kubectl create secret generic todo-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@host:5432/db' \
  -n todo-app
```

**C. Pending (Insufficient Resources)**
```bash
# Check node resources
kubectl top nodes

# Check pod resource requests
kubectl describe pod <pod-name> -n todo-app

# Fix: Reduce resource requests or add more nodes
```

---

### 2. Kafka Issues

#### Symptom
```bash
kubectl get kafka -n kafka
# Shows: NotReady or error
```

#### Solutions

**A. Kafka Cluster Not Ready**
```bash
# Check Strimzi operator
kubectl get pods -n kafka | grep strimzi

# If operator not running:
kubectl apply -f https://strimzi.io/install/latest?namespace=kafka -n kafka

# Wait for operator
kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n kafka --timeout=300s

# Reapply Kafka cluster
kubectl apply -f kubernetes/kafka/kafka-cluster.yaml
```

**B. Topics Not Created**
```bash
# Check topics
kubectl get kafkatopic -n kafka

# If missing, reapply:
kubectl apply -f kubernetes/kafka/topics.yaml

# Verify topics exist:
kubectl exec -it todo-kafka-kafka-0 -n kafka -- \
  bin/kafka-topics.sh --list --bootstrap-server localhost:9092
```

**C. Kafka Pods Crashing**
```bash
# Check logs
kubectl logs todo-kafka-kafka-0 -n kafka

# Common causes:
# 1. Insufficient memory (need 1Gi per broker)
# 2. Zookeeper not ready

# Check Zookeeper
kubectl get pods -n kafka | grep zookeeper

# Fix: Increase memory or wait for Zookeeper
```

---

### 3. Dapr Issues

#### Symptom
```bash
kubectl get components -n todo-app
# Shows: No resources found or component errors
```

#### Solutions

**A. Dapr Not Installed**
```bash
# Check Dapr control plane
kubectl get pods -n dapr-system

# If not found, install:
helm repo add dapr https://dapr.github.io/helm-charts/
helm install dapr dapr/dapr --namespace dapr-system --create-namespace
```

**B. Dapr Sidecar Not Injected**
```bash
# Check pod annotations
kubectl get pod <pod-name> -n todo-app -o yaml | grep dapr

# Should show:
#   dapr.io/enabled: "true"
#   dapr.io/app-id: "backend-service"

# If missing, check deployment annotations
kubectl get deployment <deployment-name> -n todo-app -o yaml

# Fix: Add annotations to deployment
kubectl patch deployment <deployment-name> -n todo-app -p '
spec:
  template:
    metadata:
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "backend-service"
        dapr.io/app-port: "8000"
'
```

**C. Component Not Loading**
```bash
# Check component status
kubectl describe component kafka-pubsub -n todo-app

# Check Dapr sidecar logs
kubectl logs <pod-name> -n todo-app -c daprd

# Common issues:
# 1. Kafka not accessible
# 2. Redis not running
# 3. Wrong component configuration

# Fix: Verify Kafka and Redis are running
kubectl get pods -n kafka
kubectl get pods -n todo-app | grep redis
```

---

### 4. Database Connection Issues

#### Symptom
```bash
# Backend logs show: "Database connection failed"
```

#### Solutions

**A. Wrong DATABASE_URL**
```bash
# Check secret
kubectl get secret todo-secrets -n todo-app -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# Should be: postgresql://user:pass@host:5432/dbname

# Fix: Update secret
kubectl delete secret todo-secrets -n todo-app
kubectl create secret generic todo-secrets \
  --from-literal=DATABASE_URL='postgresql://correct-url' \
  -n todo-app

# Restart pods
kubectl rollout restart deployment/todo-backend -n todo-app
```

**B. Database Not Accessible**
```bash
# Test connection from pod
kubectl exec -it <backend-pod> -n todo-app -c backend -- \
  python -c "
from sqlmodel import create_engine
import os
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    print('Connected!')
"

# If fails:
# 1. Check firewall rules (allow pod IPs)
# 2. Check database is running
# 3. Check credentials are correct
```

**C. Migration Not Run**
```bash
# Check if tables exist
kubectl exec -it <backend-pod> -n todo-app -c backend -- \
  python -c "
from sqlmodel import create_engine, text
import os
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    result = conn.execute(text('SELECT tablename FROM pg_tables WHERE schemaname=\\'public\\''))
    print([row[0] for row in result])
"

# If tables missing, run migration:
# 1. Port forward to backend
kubectl port-forward deployment/todo-backend 8000:8000 -n todo-app

# 2. In another terminal, run migration
cd backend
alembic upgrade head
```

---

### 5. WebSocket Connection Issues

#### Symptom
- Browser console shows: "WebSocket connection failed"
- "Offline" indicator in UI

#### Solutions

**A. WebSocket Service Not Running**
```bash
# Check service
kubectl get pods -n todo-app | grep websocket

# Check logs
kubectl logs -f deployment/websocket-service -n todo-app

# If not running, check deployment
kubectl get deployment websocket-service -n todo-app
```

**B. Wrong WebSocket URL**
```bash
# Check frontend environment variable
# Should be: ws://your-ip:8004 or wss://your-domain

# For Minikube:
minikube ip  # Get IP
kubectl get svc websocket-service -n todo-app  # Get NodePort

# Update frontend .env.local:
NEXT_PUBLIC_WEBSOCKET_URL=<minikube-ip>:<nodeport>

# Rebuild frontend
cd frontend
npm run build
```

**C. CORS Issues**
```bash
# Check WebSocket service logs for CORS errors
kubectl logs deployment/websocket-service -n todo-app

# Fix: Update CORS in services/websocket/main.py
# Change allow_origins from ["*"] to specific domains
```

---

### 6. Events Not Processing

#### Symptom
- Tasks created but no audit logs
- Recurring tasks not auto-creating
- Reminders not triggering

#### Solutions

**A. Check Microservices**
```bash
# Check all microservices are running
kubectl get pods -n todo-app | grep -E "(recurring|notification|audit)"

# Check logs for errors
kubectl logs -f deployment/recurring-task-service -n todo-app
kubectl logs -f deployment/notification-service -n todo-app
kubectl logs -f deployment/audit-service -n todo-app
```

**B. Check Kafka Events**
```bash
# Consume events from Kafka
kubectl exec -it todo-kafka-kafka-0 -n kafka -- \
  bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic tasks.events \
  --from-beginning

# Should see events like:
# {"event_type":"created","task_id":123,...}

# If no events, check backend is publishing
kubectl logs deployment/todo-backend -n todo-app | grep "Published"
```

**C. Check Dapr Pub/Sub**
```bash
# Check Dapr component
kubectl get component kafka-pubsub -n todo-app

# Check Dapr sidecar logs
kubectl logs <microservice-pod> -n todo-app -c daprd

# Should see: "Subscribed to topic: tasks.events"
```

---

### 7. Performance Issues

#### Symptom
- Slow response times
- High CPU/memory usage
- Pods restarting frequently

#### Solutions

**A. Check Resource Usage**
```bash
# Check pod resources
kubectl top pods -n todo-app

# Check node resources
kubectl top nodes

# If high usage:
# 1. Increase resource limits
# 2. Add more replicas
# 3. Add more nodes
```

**B. Check Database Performance**
```bash
# Check slow queries in Neon dashboard
# Or connect to database:
psql $DATABASE_URL

# Run:
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Check for long-running queries
```

**C. Scale Services**
```bash
# Scale up replicas
kubectl scale deployment todo-backend --replicas=3 -n todo-app
kubectl scale deployment websocket-service --replicas=3 -n todo-app

# Or update Helm values:
backend:
  replicaCount: 3
```

---

### 8. Monitoring Not Working

#### Symptom
- Prometheus/Grafana not accessible
- No metrics showing

#### Solutions

**A. Check Monitoring Pods**
```bash
# Check pods
kubectl get pods -n monitoring

# If not found, deploy:
kubectl apply -f kubernetes/monitoring/prometheus.yaml
kubectl apply -f kubernetes/monitoring/grafana.yaml
```

**B. Access Grafana**
```bash
# Get Grafana URL
kubectl get svc grafana -n monitoring

# Port forward if needed
kubectl port-forward svc/grafana 3000:3000 -n monitoring

# Access: http://localhost:3000
# Default credentials: admin / admin
```

**C. Check Prometheus Targets**
```bash
# Port forward Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n monitoring

# Access: http://localhost:9090/targets
# All targets should be "UP"
```

---

## Quick Diagnostic Commands

```bash
# Check everything at once
kubectl get all -n todo-app
kubectl get all -n kafka
kubectl get all -n dapr-system
kubectl get all -n monitoring

# Check pod logs (all containers)
kubectl logs <pod-name> -n todo-app --all-containers=true

# Check events
kubectl get events -n todo-app --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n todo-app
kubectl top nodes

# Restart everything
kubectl rollout restart deployment -n todo-app

# Delete and recreate pod
kubectl delete pod <pod-name> -n todo-app
```

---

## Getting Help

If issues persist:

1. **Collect logs**:
   ```bash
   kubectl logs <pod-name> -n todo-app > pod.log
   kubectl describe pod <pod-name> -n todo-app > pod-describe.txt
   kubectl get events -n todo-app > events.txt
   ```

2. **Check GitHub Issues**: https://github.com/yourusername/todo-app/issues

3. **Create new issue** with:
   - Error message
   - Pod logs
   - Deployment configuration
   - Steps to reproduce
