# Kubernetes Secrets Management Guide

## Overview

This guide explains how to securely manage secrets for the Todo App Kubernetes deployment.

## ⚠️ Security Warning

**NEVER commit actual secrets to git!** The `values.yaml` file contains only placeholders. Use one of the methods below to provide real secrets.

## Method 1: Helm Values File (Recommended for Development)

1. Create a secrets file (already in .gitignore):
```bash
cp secrets.yaml.example secrets.yaml
```

2. Edit `secrets.yaml` with your actual values:
```yaml
secrets:
  databaseUrl: "postgresql://user:pass@host/db"
  geminiApiKeys: "key1,key2"
  betterAuthSecret: "your-secret-here"
```

3. Deploy with the secrets file:
```bash
helm install todo-app ./todo-chart -f secrets.yaml
```

## Method 2: Helm Command Line (Quick Testing)

Pass secrets directly during installation:

```bash
helm install todo-app ./todo-chart \
  --set secrets.databaseUrl="postgresql://..." \
  --set secrets.geminiApiKeys="AIza..." \
  --set secrets.betterAuthSecret="your-secret"
```

## Method 3: Kubernetes Secrets (Recommended for Production)

### Create Secret Manually

```bash
kubectl create secret generic todo-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=gemini-api-keys="AIza..." \
  --from-literal=better-auth-secret="your-secret" \
  -n todo-app
```

### Update Helm Template

Modify `todo-chart/templates/secret.yaml` to reference the existing secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Release.Name }}-secrets
  namespace: {{ .Values.namespace }}
type: Opaque
data:
  {{- if .Values.secrets.databaseUrl }}
  database-url: {{ .Values.secrets.databaseUrl | b64enc | quote }}
  {{- end }}
  # ... rest of the secrets
```

## Method 4: Sealed Secrets (Production - GitOps Friendly)

Sealed Secrets allow you to encrypt secrets and commit them safely to git.

### Install Sealed Secrets Controller

```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
```

### Install kubeseal CLI

```bash
# macOS
brew install kubeseal

# Linux
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-linux-amd64 -O kubeseal
chmod +x kubeseal
sudo mv kubeseal /usr/local/bin/
```

### Create and Seal Secrets

```bash
# Create a regular secret (don't apply it)
kubectl create secret generic todo-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=gemini-api-keys="AIza..." \
  --from-literal=better-auth-secret="your-secret" \
  --dry-run=client -o yaml > secret.yaml

# Seal the secret
kubeseal -f secret.yaml -w sealed-secret.yaml

# Now you can safely commit sealed-secret.yaml to git
git add sealed-secret.yaml
git commit -m "Add sealed secrets"

# Apply the sealed secret
kubectl apply -f sealed-secret.yaml -n todo-app
```

## Method 5: External Secrets Operator (Production - Cloud Integration)

For AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, HashiCorp Vault, etc.

### Install External Secrets Operator

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace
```

### Create SecretStore (Example for AWS)

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: todo-app
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
```

### Create ExternalSecret

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: todo-secrets
  namespace: todo-app
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: todo-secrets
    creationPolicy: Owner
  data:
  - secretKey: database-url
    remoteRef:
      key: todo-app/database-url
  - secretKey: gemini-api-keys
    remoteRef:
      key: todo-app/gemini-api-keys
  - secretKey: better-auth-secret
    remoteRef:
      key: todo-app/auth-secret
```

## Generating Strong Secrets

### Auth Secret
```bash
openssl rand -base64 32
```

### Database Password
```bash
openssl rand -base64 24
```

## Rotating Secrets

### Update Kubernetes Secret
```bash
kubectl create secret generic todo-secrets \
  --from-literal=database-url="new-value" \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Restart Pods to Pick Up New Secrets
```bash
kubectl rollout restart deployment/todo-backend -n todo-app
kubectl rollout restart deployment/todo-frontend -n todo-app
```

## Verification

Check that secrets are properly mounted:

```bash
# View secret (base64 encoded)
kubectl get secret todo-secrets -n todo-app -o yaml

# Decode a specific secret
kubectl get secret todo-secrets -n todo-app -o jsonpath='{.data.database-url}' | base64 -d

# Check environment variables in pod
kubectl exec -it deployment/todo-backend -n todo-app -- env | grep DATABASE_URL
```

## Security Best Practices

1. **Never commit secrets to git** - Use .gitignore for all secret files
2. **Use RBAC** - Limit who can read secrets in Kubernetes
3. **Rotate regularly** - Change secrets periodically (every 90 days)
4. **Use different secrets per environment** - Dev, staging, and production should have unique secrets
5. **Audit access** - Monitor who accesses secrets
6. **Encrypt at rest** - Enable Kubernetes encryption at rest for etcd
7. **Use managed services** - Cloud provider secret managers are more secure than DIY solutions

## Troubleshooting

### Secret not found
```bash
kubectl get secrets -n todo-app
kubectl describe secret todo-secrets -n todo-app
```

### Pod can't access secret
```bash
kubectl describe pod <pod-name> -n todo-app
kubectl logs <pod-name> -n todo-app
```

### Wrong secret value
```bash
# Delete and recreate
kubectl delete secret todo-secrets -n todo-app
kubectl create secret generic todo-secrets --from-literal=...
```

## Additional Resources

- [Kubernetes Secrets Documentation](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)
- [HashiCorp Vault](https://www.vaultproject.io/)
