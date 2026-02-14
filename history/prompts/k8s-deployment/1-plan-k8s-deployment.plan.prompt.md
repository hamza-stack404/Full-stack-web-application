---
id: 1
title: plan-k8s-deployment
stage: plan
date: 2026-02-04
surface: agent
model: claude-sonnet-4-5-20250929
feature: k8s-deployment
branch: 003-k8s-deployment
user: Noman Traders
command: sp.plan
labels: [kubernetes,docker,helm,architecture]
links:
  spec: specs/003-k8s-deployment/spec.md
  plan: specs/003-k8s-deployment/plan.md
  adr: null
  pr: null
files:
 - specs/003-k8s-deployment/plan.md
 - specs/003-k8s-deployment/research.md
 - specs/003-k8s-deployment/data-model.md
 - specs/003-k8s-deployment/quickstart.md
 - specs/003-k8s-deployment/contracts/api-contracts.md
tests:
---

## Prompt

---START PLAN---

# Phase IV Architecture Plan: Local Kubernetes Deployment

## High-Level Architecture

```
Developer Machine
│
├── Docker Desktop (Gordon enabled)
│   └── Builds images: todo-frontend, todo-backend
│
└── Minikube Cluster
    │
    ├── Namespace: todo-app
    │   │
    │   ├── ConfigMap (non-sensitive config)
    │   ├── Secret (DATABASE_URL, OPENAI_API_KEY, BETTER_AUTH_SECRET)
    │   │
    │   ├── Frontend Deployment (2 replicas)
    │   │   └── Pods: todo-frontend:latest (port 3000)
    │   ├── Frontend Service (NodePort → 3000)
    │   │
    │   ├── Backend Deployment (2 replicas)
    │   │   └── Pods: todo-backend:latest (port 8000)
    │   └── Backend Service (ClusterIP → 8000)
    │
    └── (No database inside cluster)

External Services (Outside Cluster)
├── Neon PostgreSQL (DATABASE_URL)
└── OpenAI API (OPENAI_API_KEY)
```

---

## Phase 1: Docker Configuration

### Frontend Dockerfile (Multi-Stage Build)

**Stage 1: Builder**
- Base: node:20-alpine
- WORKDIR: /app
- COPY package.json + package-lock.json
- RUN npm ci
- COPY all frontend source code
- RUN npm run build (Next.js production build)

**Stage 2: Runner (Production)**
- Base: node:20-alpine
- WORKDIR: /app
- COPY from builder: /app/node_modules, /app/.next, /app/public, /app/package.json
- EXPOSE 3000
- CMD: ["npm", "start"]

### Frontend .dockerignore
```
node_modules
.next
.env
.env.local
*.log
```

### Backend Dockerfile

- Base: python:3.13-slim
- WORKDIR: /app
- RUN pip install uv
- COPY pyproject.toml + uv.lock
- RUN uv sync
- COPY all backend source code
- EXPOSE 8000
- CMD: ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

### Backend .dockerignore
```
__pycache__
.env
*.pyc
.venv
```

---

## Phase 2: Helm Chart Structure

### Chart.yaml
```yaml
apiVersion: v2
name: todo-chatbot
description: Todo AI Chatbot - Local Kubernetes Deployment
type: application
version: 0.1.0
appVersion: "1.0.0"
```

### values.yaml
```yaml
# Namespace
namespace: todo-app

# Frontend
frontend:
  replicaCount: 2
  image:
    name: todo-frontend
    tag: latest
  port: 3000
  service:
    type: NodePort
    port: 80
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 250m
      memory: 256Mi
  health:
    path: /health
    initialDelaySeconds: 10
    periodSeconds: 30

# Backend
backend:
  replicaCount: 2
  image:
    name: todo-backend
    tag: latest
  port: 8000
  service:
    type: ClusterIP
    port: 8000
  resources:
    limits:
      cpu: 1000m
      memory: 1024Mi
    requests:
      cpu: 500m
      memory: 512Mi
  health:
    path: /health
    initialDelaySeconds: 10
    periodSeconds: 30

# Secrets (base64 encoded values — replace with your actual base64 values)
secrets:
  databaseUrl: <base64-encoded-neon-url>
  openaiApiKey: <base64-encoded-openai-key>
  betterAuthSecret: <base64-encoded-auth-secret>

# Config
config:
  backendUrl: http://todo-backend:8000
```

### templates/_helpers.tpl
```
Reusable helpers:
- {{ .Release.Name }} for resource naming
- Common labels: app.kubernetes.io/name, app.kubernetes.io/instance
- Selector labels
```

### templates/namespace.yaml
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: {{ .Values.namespace }}
  labels:
    app.kubernetes.io/name: todo-app
```

### templates/configmap.yaml
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: todo-config
  namespace: {{ .Values.namespace }}
data:
  BACKEND_URL: "{{ .Values.config.backendUrl }}"
```

### templates/secret.yaml
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: todo-secrets
  namespace: {{ .Values.namespace }}
type: Opaque
data:
  DATABASE_URL: {{ .Values.secrets.databaseUrl }}
  OPENAI_API_KEY: {{ .Values.secrets.openaiApiKey }}
  BETTER_AUTH_SECRET: {{ .Values.secrets.betterAuthSecret }}
```

### templates/frontend-deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-frontend
  namespace: {{ .Values.namespace }}
  labels:
    app: todo-frontend
    version: "1.0"
spec:
  replicas: {{ .Values.frontend.replicaCount }}
  selector:
    matchLabels:
      app: todo-frontend
  template:
    metadata:
      labels:
        app: todo-frontend
    spec:
      containers:
      - name: frontend
        image: {{ .Values.frontend.image.name }}:{{ .Values.frontend.image.tag }}
        ports:
        - containerPort: {{ .Values.frontend.port }}
        env:
        - name: NEXT_PUBLIC_API_URL
          valueFrom:
            configMapKeyRef:
              name: todo-config
              key: BACKEND_URL
        resources:
          limits:
            cpu: {{ .Values.frontend.resources.limits.cpu }}
            memory: {{ .Values.frontend.resources.limits.memory }}
          requests:
            cpu: {{ .Values.frontend.resources.requests.cpu }}
            memory: {{ .Values.frontend.resources.requests.memory }}
        livenessProbe:
          httpGet:
            path: {{ .Values.frontend.health.path }}
            port: {{ .Values.frontend.port }}
          initialDelaySeconds: {{ .Values.frontend.health.initialDelaySeconds }}
          periodSeconds: {{ .Values.frontend.health.periodSeconds }}
        readinessProbe:
          httpGet:
            path: {{ .Values.frontend.health.path }}
            port: {{ .Values.frontend.port }}
          initialDelaySeconds: {{ .Values.frontend.health.initialDelaySeconds }}
          periodSeconds: {{ .Values.frontend.health.periodSeconds }}
```

### templates/frontend-service.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: todo-frontend
  namespace: {{ .Values.namespace }}
spec:
  type: {{ .Values.frontend.service.type }}
  selector:
    app: todo-frontend
  ports:
  - port: {{ .Values.frontend.service.port }}
    targetPort: {{ .Values.frontend.port }}
    protocol: TCP
```

### templates/backend-deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-backend
  namespace: {{ .Values.namespace }}
  labels:
    app: todo-backend
    version: "1.0"
spec:
  replicas: {{ .Values.backend.replicaCount }}
  selector:
    matchLabels:
      app: todo-backend
  template:
    metadata:
      labels:
        app: todo-backend
    spec:
      containers:
      - name: backend
        image: {{ .Values.backend.image.name }}:{{ .Values.backend.image.tag }}
        ports:
        - containerPort: {{ .Values.backend.port }}
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: DATABASE_URL
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: OPENAI_API_KEY
        - name: BETTER_AUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: BETTER_AUTH_SECRET
        resources:
          limits:
            cpu: {{ .Values.backend.resources.limits.cpu }}
            memory: {{ .Values.backend.resources.limits.memory }}
          requests:
            cpu: {{ .Values.backend.resources.requests.cpu }}
            memory: {{ .Values.backend.resources.requests.memory }}
        livenessProbe:
          httpGet:
            path: {{ .Values.backend.health.path }}
            port: {{ .Values.backend.port }}
          initialDelaySeconds: {{ .Values.backend.health.initialDelaySeconds }}
          periodSeconds: {{ .Values.backend.health.periodSeconds }}
        readinessProbe:
          httpGet:
            path: {{ .Values.backend.health.path }}
            port: {{ .Values.backend.port }}
          initialDelaySeconds: {{ .Values.backend.health.initialDelaySeconds }}
          periodSeconds: {{ .Values.backend.health.periodSeconds }}
```

### templates/backend-service.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: todo-backend
  namespace: {{ .Values.namespace }}
spec:
  type: {{ .Values.backend.service.type }}
  selector:
    app: todo-backend
  ports:
  - port: {{ .Values.backend.service.port }}
    targetPort: {{ .Values.backend.port }}
    protocol: TCP
```

---

## Phase 3: Frontend Health Endpoint

**Add to existing Next.js app (only new code in Phase III):**

**File**: frontend/app/health/route.ts
```typescript
export async function GET() {
  return new Response(
    JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
```

---

## Phase 4: Deployment Workflow

### Step 1: Enable Gordon
```
docker ai "What can you do?"
```

### Step 2: Build Images Using Gordon
```
docker ai "Build a production Docker image for my Next.js frontend app located in ./frontend"
docker ai "Build a production Docker image for my FastAPI backend app located in ./backend"
```

### Step 3: Start Minikube
```bash
minikube start
minikube addons enable ingress
```

### Step 4: Load Images into Minikube
```bash
minikube image load todo-frontend:latest
minikube image load todo-backend:latest
```

### Step 5: Update values.yaml Secrets
```bash
# Generate base64 values for secrets
echo -n "your-neon-database-url" | base64
echo -n "your-openai-api-key" | base64
echo -n "your-better-auth-secret" | base64

# Put these base64 values into values.yaml under secrets
```

### Step 6: Deploy with Helm
```bash
helm install todo ./todo-chart
```

### Step 7: Verify with kubectl-ai
```
kubectl-ai "show me status of all pods in todo-app namespace"
kubectl-ai "show me all services in todo-app namespace"
kubectl-ai "check if frontend and backend are healthy"
```

### Step 8: Access Frontend
```bash
minikube service todo-frontend -n todo-app --url
# Opens browser or gives you the URL
```

### Step 9: Analyze with Kagent
```
kagent "analyze the health of todo-app namespace"
kagent "check resource usage of all pods in todo-app"
```

---

## File Changes Summary

### New Files (Infrastructure Only)
```
frontend/
├── Dockerfile                  # NEW
├── .dockerignore               # NEW
└── app/
    └── health/
        └── route.ts            # NEW (health endpoint only)

backend/
├── Dockerfile                  # NEW
└── .dockerignore               # NEW

todo-chart/                     # NEW (entire directory)
├── Chart.yaml
├── values.yaml
├── .helmignore
└── templates/
    ├── _helpers.tpl
    ├── namespace.yaml
    ├── configmap.yaml
    ├── secret.yaml
    ├── frontend-deployment.yaml
    ├── frontend-service.yaml
    ├── backend-deployment.yaml
    └── backend-service.yaml
```

### Unchanged Files
```
✅ frontend/app/        (all Phase III pages)
✅ frontend/components/ (all Phase III components)
✅ frontend/lib/        (all Phase III API clients)
✅ backend/main.py
✅ backend/models.py
✅ backend/routes/
✅ backend/services/
✅ specs/               (Phase I-III specs)
```

---

## Verification Checklist

After deployment, verify:
1. `kubectl get pods -n todo-app` → All pods Running
2. `kubectl get services -n todo-app` → All services created
3. `kubectl get configmaps -n todo-app` → ConfigMap exists
4. `kubectl get secrets -n todo-app` → Secret exists
5. Browser → Frontend loads
6. Chat → Create a task → Task appears
7. Health → /health returns 200 on both services

---END PLAN---
```

---

## Response snapshot

Successfully created the implementation plan for Phase IV: Local Kubernetes Deployment. The plan includes:

- Complete architecture overview with Docker, Kubernetes, and external services
- Detailed Docker configuration for both frontend (multi-stage) and backend (single-stage)
- Comprehensive Helm chart structure with all required templates
- Frontend health endpoint implementation
- Step-by-step deployment workflow using AI-assisted tools
- File changes summary showing new infrastructure files
- Verification checklist

Created supporting documents:
- research.md: Decision log with rationale for key architectural choices
- data-model.md: Kubernetes resources and Helm values structure
- quickstart.md: Step-by-step setup and deployment guide
- contracts/api-contracts.md: API contracts for health endpoints and service communication

The plan fully complies with the constitution requirements for Phase IV, ensuring containerization-first approach, declarative infrastructure, Helm-managed deployments, AI-assisted DevOps, stateless pods, health awareness, and secret safety.

## Outcome

- ✅ Impact: Complete Kubernetes deployment architecture defined
- 🧪 Tests: Manual verification procedures documented
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/api-contracts.md
- 🔁 Next prompts: Ready for /sp.tasks to generate implementation tasks
- 🧠 Reflection: Plan balances simplicity with production-readiness requirements

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): Standard plan generation
- Next experiment (smallest change to try): Generate tasks for implementation