# API Contracts for Phase IV: Local Kubernetes Deployment

## Health Check Endpoints

### Frontend Health Endpoint
- **Path**: `/health`
- **Method**: GET
- **Response**: 200 OK with JSON payload
- **Payload**: `{"status": "ok", "timestamp": "ISO8601 timestamp"}`
- **Purpose**: Kubernetes liveness and readiness probe endpoint

### Backend Health Endpoint
- **Path**: `/health`
- **Method**: GET
- **Response**: 200 OK with JSON payload
- **Payload**: `{"status": "healthy"}` (as implemented in Phase III)
- **Purpose**: Kubernetes liveness and readiness probe endpoint

## Service Communication

### Frontend to Backend
- **Environment Variable**: `NEXT_PUBLIC_API_URL`
- **Default Value**: `http://todo-backend:8000` (within cluster)
- **Purpose**: Enables frontend to communicate with backend service

## Kubernetes Service Configuration

### Frontend Service
- **Type**: NodePort
- **Port**: 80 → 3000
- **Selector**: `app=todo-frontend`
- **Access**: External via NodePort

### Backend Service
- **Type**: ClusterIP
- **Port**: 8000 → 8000
- **Selector**: `app=todo-backend`
- **Access**: Internal cluster only