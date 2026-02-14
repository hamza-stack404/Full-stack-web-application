# Implementation Plan: Phase IV: Local Kubernetes Deployment

**Branch**: `003-k8s-deployment` | **Date**: 2026-02-04 | **Spec**: specs/003-k8s-deployment/spec.md
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deploy the existing Todo Chatbot application (frontend + backend) to a local Minikube Kubernetes cluster using Docker containers and Helm charts. The implementation will containerize the existing Phase III application without modifying application logic, providing a single-command deployment solution with proper health checks, resource management, and secret handling.

## Technical Context

**Language/Version**: JavaScript/TypeScript (Node.js 20 for Next.js frontend), Python 3.13 (FastAPI backend)
**Primary Dependencies**: Docker, Kubernetes, Helm 3, Minikube, Gordon (Docker AI), kubectl-ai, kagent
**Storage**: External Neon PostgreSQL database (not deployed in-cluster)
**Testing**: Manual verification of deployment, health checks, and functionality
**Target Platform**: Local Minikube cluster (Linux/Windows/macOS)
**Project Type**: web (frontend + backend architecture)
**Performance Goals**: Sub-2-minute full deployment, sub-3-minute image builds, stable operation on Minikube default resources (2 CPU, 2GB RAM)
**Constraints**: Must use Kubernetes native features (Deployments, Services, ConfigMaps, Secrets), single-command deployment with Helm, no hardcoded secrets in images or manifests
**Scale/Scope**: 2 frontend replicas, 2 backend replicas, designed for local development/testing environment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Containerization-First**: ✅ All services will run inside Docker containers as required
- **Declarative Infrastructure**: ✅ All Kubernetes resources defined as YAML manifests in Helm chart
- **Helm-Managed**: ✅ All deployments managed through Helm charts, no raw kubectl apply
- **AI-Assisted DevOps**: ✅ Gordon for Docker operations, kubectl-ai and kagent for Kubernetes operations
- **Stateless Pods**: ✅ Pods will be stateless; all state lives in external Neon DB
- **Health-Aware**: ✅ All deployments include health checks (livenessProbe, readinessProbe)
- **Secret Safety**: ✅ Zero hardcoded credentials; all secrets via Kubernetes Secrets managed by Helm
- **Single Command Deployment**: ✅ Chart installable with single command: helm install todo ./todo-chart
- **Resource Limits**: ✅ All containers have defined resource limits and requests
- **Application Code Unchanged**: ✅ Phase III application code remains completely unchanged

## Project Structure

### Documentation (this feature)

```text
specs/003-k8s-deployment/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
frontend/
├── Dockerfile                  # NEW: Multi-stage build for Next.js
├── .dockerignore              # NEW: Ignore build artifacts and env files
├── app/
│   ├── health/
│   │   └── route.ts          # NEW: Health endpoint
│   └── [existing Phase III files unchanged]
├── [other existing frontend files unchanged]

backend/
├── Dockerfile                 # NEW: Single-stage build for FastAPI
├── .dockerignore             # NEW: Ignore Python cache and env files
└── [existing Phase III files unchanged]

todo-chart/                    # NEW: Helm chart directory
├── Chart.yaml                # Chart metadata
├── values.yaml               # Configurable values
├── .helmignore               # Helm ignore patterns
└── templates/                # Kubernetes resource templates
    ├── _helpers.tpl          # Template helpers
    ├── namespace.yaml        # Namespace definition
    ├── configmap.yaml        # Non-sensitive config
    ├── secret.yaml           # Secret definitions
    ├── frontend-deployment.yaml
    ├── frontend-service.yaml
    ├── backend-deployment.yaml
    └── backend-service.yaml
```

**Structure Decision**: Web application structure with separate frontend (Next.js) and backend (FastAPI) services containerized and deployed via Helm chart to Kubernetes. This maintains the existing architecture while adding the required containerization and orchestration layers.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |