# OLMap Kubernetes Deployment

This directory contains Helm values for deploying OLMap to GKE via ArgoCD.

## Prerequisites

The following GCP infrastructure is managed via Terraform in [infrastructure/gcp/olmap.tf](https://github.com/ForumViriumHelsinki/infrastructure/blob/main/gcp/olmap.tf):

- GCP Service Account with Workload Identity
- Cloud SQL IAM database user
- Secret Manager secrets
- Sentry DSN

## Manual Setup Steps

### 1. Database Permissions

After Terraform creates the IAM database user, grant permissions by running this SQL as a superuser:

```sql
-- Connect to the database
\c api_olmap_org

-- Grant privileges to IAM user
GRANT ALL PRIVILEGES ON DATABASE api_olmap_org TO "olmap-app@fvh-project-containers-etc.iam";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "olmap-app@fvh-project-containers-etc.iam";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "olmap-app@fvh-project-containers-etc.iam";

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "olmap-app@fvh-project-containers-etc.iam";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "olmap-app@fvh-project-containers-etc.iam";
```

### 2. OAuth Credentials (if using Google OAuth)

Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and update the secrets:

```bash
# OAuth Client ID
echo -n "YOUR_CLIENT_ID" | gcloud secrets versions add olmap-oauth-client-id --data-file=-

# OAuth Client Secret
echo -n "YOUR_CLIENT_SECRET" | gcloud secrets versions add olmap-oauth-client-secret --data-file=-
```

### 3. Mapbox Token (for frontend maps)

If the frontend uses Mapbox:

```bash
echo -n "YOUR_MAPBOX_TOKEN" | gcloud secrets versions add olmap-mapbox-token --data-file=-
```

## Deployment

Deployment is managed by ArgoCD. The Application manifest is in:
- [infrastructure/argocd/apps/templates/olmap/backend.yaml](https://github.com/ForumViriumHelsinki/infrastructure/blob/main/argocd/apps/templates/olmap/backend.yaml)

ArgoCD will automatically:
1. Sync the Helm values from this file
2. Run database migrations via Helm hook (pre-install/pre-upgrade)
3. Deploy the application
4. Update image tags via ArgoCD Image Updater

## Image Updates

ArgoCD Image Updater automatically tracks new container images and creates PRs to update:
- `image.tag` - Main application container
- `migrations.image.tag` - Migration job container

Both track the same image (`ghcr.io/forumviriumhelsinki/olmap-backend`) but are written separately for visibility.

## Scaling

KEDA autoscaling is configured for office hours (Mon-Fri 7am-6pm Helsinki time):
- Scales to 0 replicas outside office hours
- Scales to 1-2 replicas during office hours

## Troubleshooting

### Check ArgoCD sync status
```bash
argocd app get olmap-backend
```

### Check migration job logs
```bash
kubectl logs -n olmap -l app.kubernetes.io/component=migration --tail=100
```

### Check External Secrets sync
```bash
kubectl get externalsecret -n olmap
kubectl describe externalsecret olmap-external-secret -n olmap
```

### Verify database connectivity
```bash
kubectl exec -it -n olmap deploy/olmap-backend -- python manage.py dbshell
```
