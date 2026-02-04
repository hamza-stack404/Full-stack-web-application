# Data Model for Phase IV: Local Kubernetes Deployment

## Kubernetes Resources

### Deployment
- **Name**: Unique identifier for the deployment
- **Namespace**: Logical grouping for resources (todo-app)
- **Replicas**: Number of pod instances to maintain
- **Selector**: Labels to match pods for this deployment
- **Template**: Pod template specification
  - **Labels**: Key-value pairs for identification
  - **Containers**: List of containers to run
    - **Image**: Container image reference
    - **Ports**: Ports to expose
    - **Environment**: Environment variables from ConfigMaps/Secrets
    - **Resources**: Resource limits and requests
    - **Probes**: Health check configurations

### Service
- **Name**: Unique identifier for the service
- **Namespace**: Logical grouping for resources (todo-app)
- **Type**: Service type (NodePort, ClusterIP)
- **Selector**: Labels to match pods for this service
- **Ports**: Port mappings
  - **Port**: Service port
  - **TargetPort**: Pod port
  - **Protocol**: Network protocol (TCP/UDP)

### ConfigMap
- **Name**: Unique identifier for the ConfigMap
- **Namespace**: Logical grouping for resources (todo-app)
- **Data**: Key-value pairs of non-sensitive configuration data
  - **BACKEND_URL**: Backend service URL for frontend communication

### Secret
- **Name**: Unique identifier for the Secret
- **Namespace**: Logical grouping for resources (todo-app)
- **Type**: Opaque for generic secrets
- **Data**: Base64 encoded sensitive data
  - **DATABASE_URL**: Neon database connection string
  - **OPENAI_API_KEY**: OpenAI API key
  - **BETTER_AUTH_SECRET**: Authentication secret

### Namespace
- **Name**: Logical isolation boundary (todo-app)
- **Labels**: Metadata for identification

## Helm Values Structure
- **namespace**: Target namespace for deployment
- **frontend**: Frontend service configuration
  - **replicaCount**: Number of frontend replicas
  - **image**: Image name and tag
  - **port**: Container port
  - **service**: Service configuration
  - **resources**: Resource limits and requests
  - **health**: Health check configuration
- **backend**: Backend service configuration
  - **replicaCount**: Number of backend replicas
  - **image**: Image name and tag
  - **port**: Container port
  - **service**: Service configuration
  - **resources**: Resource limits and requests
  - **health**: Health check configuration
- **secrets**: Base64 encoded secret values
- **config**: Non-sensitive configuration values