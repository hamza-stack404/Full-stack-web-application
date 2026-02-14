---
id: 1
title: specify-k8s-deployment
stage: spec
date: 2026-02-04
surface: agent
model: claude-sonnet-4-5-20250929
feature: k8s-deployment
branch: 003-k8s-deployment
user: Noman Traders
command: sp.specify
labels: [kubernetes,docker,helm,deployment]
links:
  spec: specs/003-k8s-deployment/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/003-k8s-deployment/spec.md
 - specs/003-k8s-deployment/checklists/requirements.md
tests:
---

## Prompt

---START SPECIFICATION---

# Phase IV: Local Kubernetes Deployment Specification

## Overview
Containerize the Phase III Todo Chatbot (frontend + backend) and deploy it on a local Minikube Kubernetes cluster using Helm charts. No application code changes — only infrastructure additions.

---

## User Stories

### US-K8S-1: Developer Can Build Docker Images
**As a** developer
**I want to** build Docker images for frontend and backend with a single command
**So that** I can containerize the application easily

**Acceptance Criteria:**
- `docker build` works for both frontend and backend
- Images are tagged with "latest"
- Frontend image runs Next.js production server
- Backend image runs FastAPI with uvicorn
- Both images are minimal in size (multi-stage where applicable)

### US-K8S-2: Developer Can Deploy to Minikube with Helm
**As a** developer
**I want to** deploy the entire app with `helm install todo ./todo-chart`
**So that** the whole application is up in one command

**Acceptance Criteria:**
- Single helm install deploys frontend + backend
- Pods start and become Ready
- Services are created automatically
- Secrets and ConfigMaps are created from Helm values
- No manual kubectl apply needed

### US-K8S-3: User Can Access Chatbot via Browser
**As a** user
**I want to** access the Todo Chatbot through my browser after Minikube deployment
**So that** I can use the chatbot locally on Kubernetes

**Acceptance Criteria:**
- Frontend is accessible via minikube service URL or NodePort
- Frontend successfully communicates with backend inside cluster
- Backend connects to external Neon database
- Chat functionality works end-to-end
- Tasks created via chat persist in Neon DB

### US-K8S-4: Developer Can Monitor Cluster Health
**As a** developer
**I want to** check health of all pods and services using AI tools
**So that** I can quickly identify and fix deployment issues

**Acceptance Criteria:**
- kubectl-ai can show pod status
- kubectl-ai can show service status
- kagent can analyze cluster health
- Health endpoints return 200 for both services
- Logs are accessible via kubectl logs

### US-K8S-5: Developer Can Scale the Application
**As a** developer
**I want to** scale frontend and backend independently
**So that** I can test horizontal scaling

**Acceptance Criteria:**
- Frontend can scale to 2+ replicas
- Backend can scale to 2+ replicas
- Load balances across pods
- No data loss during scaling

---

## Functional Requirements

### FR-K8S-1: Docker Configuration
- **Frontend Dockerfile**: Multi-stage build
  - Stage 1: Install dependencies + build Next.js
  - Stage 2: Copy production build + run
  - Expose port 3000
- **Backend Dockerfile**: Single stage
  - Python 3.13 slim base
  - Install dependencies via uv
  - Copy application code
  - Expose port 8000
- **Both**: .dockerignore files to exclude node_modules, .env, __pycache__

### FR-K8S-2: Helm Chart Structure
```
todo-chart/
├── Chart.yaml              # Chart metadata (name, version, description)
├── values.yaml             # All configurable values
├── templates/
│   ├── _helpers.tpl        # Reusable template helpers
│   ├── namespace.yaml      # Namespace: todo-app
│   ├── configmap.yaml      # Non-sensitive env vars
│   ├── secret.yaml         # Sensitive env vars (base64)
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   └── ingress.yaml        # Optional: single entry point
└── .helmignore
```

### FR-K8S-3: Kubernetes Resources

**Namespace:**
- Name: todo-app
- All resources deployed here

**Frontend Deployment:**
- Replicas: 2
- Image: todo-frontend:latest
- Port: 3000
- Env vars from ConfigMap
- Health probes on /health
- Resource limits: CPU 500m, Memory 512Mi
- Resource requests: CPU 250m, Memory 256Mi

**Frontend Service:**
- Type: NodePort
- Port: 80 → 3000
- Selector: app=todo-frontend

**Backend Deployment:**
- Replicas: 2
- Image: todo-backend:latest
- Port: 8000
- Env vars from ConfigMap + Secret
- Health probes on /health
- Resource limits: CPU 1000m, Memory 1024Mi
- Resource requests: CPU 500m, Memory 512Mi

**Backend Service:**
- Type: ClusterIP
- Port: 8000 → 8000
- Selector: app=todo-backend

**ConfigMap:**
- BACKEND_URL (frontend uses to call backend)
- Non-sensitive configuration

**Secret:**
- DATABASE_URL (Neon connection string)
- OPENAI_API_KEY
- BETTER_AUTH_SECRET
- All values base64 encoded

### FR-K8S-4: Health Endpoints
- Frontend: Add /health endpoint returning {"status": "ok"}
- Backend: Verify /health endpoint exists (Phase III)
- Both must return HTTP 200

### FR-K8S-5: Minikube Setup
- Minikube must be running: `minikube start`
- Docker must be the driver
- Ingress addon enabled: `minikube addons enable ingress`
- Images loaded into Minikube: `minikube image load`

---

## Integration with Phase III

### What Stays Exactly the Same
✅ All frontend code (Next.js, ChatKit, components)
✅ All backend code (FastAPI, MCP server, agent service)
✅ All database models and migrations
✅ Authentication (Better Auth JWT)
✅ External Neon database connection

### What Is Added (Infrastructure Only)
➕ frontend/Dockerfile
➕ frontend/.dockerignore
➕ backend/Dockerfile
➕ backend/.dockerignore
➕ todo-chart/ (entire Helm chart directory)
➕ frontend/app/health/route.ts (health endpoint only)

### Critical Rule
> DO NOT modify any Phase III application logic. Only add Docker and Kubernetes files.

---

## Non-Functional Requirements

### NFR-K8S-1: Deployment Speed
- Full deployment (helm install) under 2 minutes
- Image builds under 3 minutes each

### NFR-K8S-2: Resource Efficiency
- Runs on Minikube default resources (2 CPU, 2GB RAM)
- Pods fit within Minikube limits

### NFR-K8S-3: Reliability
- Pods auto-restart on crash (Kubernetes default)
- Health probes prevent traffic to unhealthy pods
- Rolling updates (no downtime during helm upgrade)

### NFR-K8S-4: Security
- No secrets in code or Dockerfiles
- Secrets managed by Kubernetes Secret resource
- Helm templates reference secrets, never hardcode

---

## Success Criteria
✅ Docker images build successfully
✅ Helm chart installs with single command
✅ All pods Running and Ready
✅ Frontend accessible via browser
✅ Chat works end-to-end on Kubernetes
✅ Tasks persist to Neon DB
✅ Health endpoints return 200
✅ Gordon used for Docker operations
✅ kubectl-ai/kagent used for K8s operations
✅ Zero manual coding — all via Claude Code

---END SPECIFICATION---
```

---

## Response snapshot

Created comprehensive specification for Phase IV: Local Kubernetes Deployment. The specification includes:

- 5 prioritized user stories covering deployment, containerization, access, scaling, and monitoring
- 12 functional requirements covering Docker, Helm, Kubernetes resources, and deployment processes
- Key entities defined (Deployment, Service, ConfigMap, Secret, Helm Chart)
- 10 measurable success criteria with specific metrics
- Edge cases addressing resource limitations, network issues, and scaling scenarios

Quality validation checklist confirms the specification meets all requirements with no implementation details leaking into the specification. The feature is ready for planning phase.

## Outcome

- ✅ Impact: Created complete Kubernetes deployment specification for Todo Chatbot
- 🧪 Tests: Created validation checklist for spec quality
- 📁 Files: Created spec.md and requirements checklist
- 🔁 Next prompts: Ready for /sp.plan to create implementation plan
- 🧠 Reflection: Specification maintains focus on user value while enabling Kubernetes deployment

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): Standard spec creation
- Next experiment (smallest change to try): Plan the Kubernetes implementation