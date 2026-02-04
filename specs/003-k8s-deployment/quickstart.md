# Quickstart Guide: Phase IV: Local Kubernetes Deployment

## Prerequisites
- Docker Desktop with Gordon enabled
- Minikube installed and working
- Helm 3 installed
- kubectl installed

## Setup Instructions

### 1. Clone and Navigate to Repository
```bash
git clone <repository-url>
cd <repository-root>
git checkout 003-k8s-deployment
```

### 2. Start Minikube
```bash
minikube start
minikube addons enable ingress
```

### 3. Build Docker Images Using Gordon
```bash
# Navigate to frontend directory
cd frontend
docker ai "Build a production Docker image for this Next.js app" --tag todo-frontend:latest

# Navigate to backend directory
cd ../backend
docker ai "Build a production Docker image for this FastAPI app" --tag todo-backend:latest
```

### 4. Prepare Helm Values
```bash
# Generate base64 encoded secrets
echo -n "your-neon-database-url" | base64
echo -n "your-openai-api-key" | base64
echo -n "your-better-auth-secret" | base64

# Update todo-chart/values.yaml with these base64 values
```

### 5. Load Images into Minikube
```bash
minikube image load todo-frontend:latest
minikube image load todo-backend:latest
```

### 6. Deploy with Helm
```bash
cd todo-chart
helm install todo . -n todo-app --create-namespace
```

### 7. Verify Deployment
```bash
kubectl get pods -n todo-app
kubectl get services -n todo-app
kubectl get all -n todo-app
```

### 8. Access the Application
```bash
minikube service todo-frontend -n todo-app --url
```

## Verification Steps
1. All pods should show "Running" status
2. Services should be created and accessible
3. Frontend should be accessible via browser
4. Health endpoints should return 200 status
5. Chat functionality should work end-to-end
6. Tasks should persist in Neon database

## Troubleshooting
- If images don't load to minikube: Ensure Docker Desktop is running and minikube context is set
- If deployment fails: Check that all required secrets are properly base64 encoded in values.yaml
- If frontend can't connect to backend: Verify service networking and environment variables
- If health checks fail: Check that health endpoints are properly implemented and accessible