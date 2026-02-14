---
id: 1
title: update-kubernetes
stage: constitution
date: 2026-02-04
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: main
user: Noman Traders
command: sp.constitution
labels: [constitution,kubernetes,deployment]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
tests:
---

## Prompt

Update the existing constitution to add Phase IV requirements. Keep all Phase I, II, and III content unchanged. Append the following:

sp.constitution

---ADD TO CONSTITUTION---

## Phase IV: Local Kubernetes Deployment

### Infrastructure Principles
- **Containerization-First**: Every service must run inside a Docker container
- **Declarative Infrastructure**: All Kubernetes resources defined as YAML manifests
- **Helm-Managed**: All deployments managed through Helm charts, no raw kubectl apply
- **AI-Assisted DevOps**: Use Gordon, kubectl-ai, and kagent for all infrastructure operations
- **Stateless Pods**: Pods must be stateless; all state lives in external Neon DB
- **Health-Aware**: All deployments must include health checks (livenessProbe, readinessProbe)
- **Secret Safety**: Zero hardcoded credentials; all secrets via Kubernetes Secrets managed by Helm

### Phase IV Tech Stack Additions
- **Containerization**: Docker (Docker Desktop 4.53+)
- **Docker AI**: Gordon (Docker AI Agent)
- **Orchestration**: Kubernetes via Minikube
- **Package Manager**: Helm 3
- **AI DevOps**: kubectl-ai, Kagent
- **Local Cluster**: Minikube

### Container Standards
- Frontend image: multi-stage build (build stage + production stage)
- Backend image: slim Python base image
- Both images must have .dockerignore to minimize build context
- Images tagged with version numbers (latest + semantic version)
- Container ports must match service ports in Helm templates

### Kubernetes Resource Standards
- All resources must have proper labels: app, version, component
- Resource limits and requests must be defined for all containers
- Namespaces: use "todo-app" namespace for all resources
- Services: frontend = NodePort (external access), backend = ClusterIP (internal only)
- ConfigMaps for non-sensitive env vars, Secrets for sensitive data

### Helm Chart Standards
- Single Helm chart covers frontend + backend
- values.yaml is single source of truth for all configuration
- Templates must use values references, zero hardcoded values in templates
- Chart must be installable with single command: helm install todo ./todo-chart
- Chart must support upgrade: helm upgrade todo ./todo-chart

### Health Check Standards
- Frontend: GET /health returns 200
- Backend: GET /health returns 200 (already exists from Phase III)
- LivenessProbe: checks if container is alive
- ReadinessProbe: checks if container is ready to receive traffic
- Initial delay: 10 seconds, period: 30 seconds

### Non-Negotiables for Phase IV
1. ❌ NEVER hardcode secrets in Dockerfiles or manifests
2. ❌ NEVER deploy without resource limits on containers
3. ❌ NEVER skip health probes on deployments
4. ❌ NEVER use raw kubectl apply — use Helm only
5. ❌ NEVER write Dockerfiles or manifests manually — use Claude Code
6. ✅ MUST keep Phase III application code completely unchanged
7. ✅ MUST use Gordon for Docker operations
8. ✅ MUST use kubectl-ai or kagent for Kubernetes operations
9. ✅ MUST maintain connection to external Neon database
10. ✅ MUST be deployable with single helm install command

---END ADDITIONS---

## Response snapshot

Updated the constitution file to include Phase IV: Local Kubernetes Deployment requirements while preserving all existing content. The new Phase IV section includes infrastructure principles, tech stack additions, container standards, Kubernetes resource standards, Helm chart standards, health check standards, and non-negotiables as specified. The constitution version was updated to 1.0.0, and a sync impact report was added at the top of the file.

## Outcome

- ✅ Impact: Updated constitution with Phase IV Kubernetes deployment requirements
- 🧪 Tests: No tests required for documentation update
- 📁 Files: Modified .specify/memory/constitution.md
- 🔁 Next prompts: None needed
- 🧠 Reflection: Successfully integrated new phase requirements while maintaining backward compatibility

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): Standard constitution update
- Next experiment (smallest change to try): N/A