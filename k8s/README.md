# OLMap Kubernetes Deployment

This directory contains Kubernetes manifests for deploying OLMap locally using Skaffold and Orbstack.

## Prerequisites

1. **Orbstack** installed and running
2. **Skaffold** installed (`brew install skaffold`)
3. **kubectl** configured to use Orbstack context

## Quick Start

### 1. Verify Orbstack Context
```bash
kubectl config current-context
# Should show orbstack context
```

### 2. Run with Skaffold
```bash
# From the project root
skaffold dev

# Or for production-like build
skaffold run
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/swagger-ui/

### 4. Optional: Use Ingress
If you want to use the ingress (requires nginx-ingress-controller):

```bash
# Install nginx-ingress-controller in Orbstack
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Add to /etc/hosts
echo "127.0.0.1 olmap.local" | sudo tee -a /etc/hosts

# Access via: http://olmap.local
```

## Development Workflow

### File Sync (Dev Profile)
```bash
# Use dev profile for faster development iteration
skaffold dev --profile=dev
```

This enables file sync for:
- Python files in the Django backend
- React source files in the frontend

### Database Access
```bash
# Connect to PostgreSQL
kubectl port-forward svc/postgres 5432:5432
# Then connect with: psql -h localhost -U olmap_user -d olmap_dev
```

### Logs
```bash
# Backend logs
kubectl logs -f deployment/olmap-backend

# Frontend logs
kubectl logs -f deployment/olmap-frontend

# Database logs
kubectl logs -f deployment/postgres
```

## Configuration

### Environment Variables
Edit `k8s/local/config.yaml` to modify:
- Django settings
- React environment variables
- API keys

### Secrets
Edit `k8s/local/config.yaml` (Secret section) for:
- Database credentials
- API tokens
- Django secret key

### Resources
Adjust resource limits in the deployment files:
- `k8s/local/backend.yaml`
- `k8s/local/frontend.yaml`
- `k8s/local/postgres.yaml`

## Troubleshooting

### Common Issues

1. **Images not building**: Ensure Docker is running in Orbstack
2. **Database connection failed**: Check if postgres pod is ready
3. **Port conflicts**: Stop any local services on ports 3000, 8000, 5432

### Debugging Commands
```bash
# Check pod status
kubectl get pods

# Describe pod issues
kubectl describe pod <pod-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Clean restart
skaffold delete
skaffold dev
```

### Health Checks
- Backend health: http://localhost:8000/health/
- Backend readiness: http://localhost:8000/ready/
- Frontend health: http://localhost:3000/health

## Cleanup

```bash
# Stop Skaffold (Ctrl+C) then:
skaffold delete

# Or manually cleanup
kubectl delete -f k8s/local/
```