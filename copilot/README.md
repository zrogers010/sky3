# AWS Copilot Configuration

## Architecture

This deployment uses a **single Load Balanced Web Service** with one container running both the nginx web server and the Node.js API.

### Design Decision: One Container vs Two Services

**Chosen: One Container (nginx + Node API)**

Advantages:
- **Simpler**: Single service to manage, fewer moving parts
- **Cheaper**: 1 Fargate task instead of 2 (approximately 50% cost savings)
- **Consistent**: Mirrors the existing docker-compose.yml architecture
- **Lower latency**: nginx → API is localhost, not network hop
- **Easier debugging**: All logs in one place via `copilot svc logs`

Trade-offs:
- Cannot scale nginx and API independently (not needed for this workload)
- Both processes share the same CPU/memory allocation (256/512 is sufficient)

### Alternative Considered: Two Services

If workload characteristics change (e.g., API needs more resources than static serving), the architecture could be split into:
- `web` service: nginx only, minimal resources
- `api` service: Node.js API, can scale independently

This would require:
- Two `copilot svc init` commands
- ALB routing: `/api/*` → api service, `/*` → web service
- Service discovery for nginx → API communication
- Approximately 2x cost (two Fargate tasks minimum)

## Container Details

**Base Image**: `node:22-alpine`

**Installed**: nginx, supervisor, wget

**Ports**:
- 8080: nginx (public, via ALB)
- 3001: Node API (internal, accessed via nginx proxy)

**Process Management**: supervisord runs both nginx and Node.js, with automatic restarts

**Storage**: EFS volume mounted at `/data` for persistent SQLite database

## Files

- `manifest.yml` - Copilot service definition
- `nginx-copilot.conf` - nginx configuration for port 8080 with /api proxy
- `supervisord.conf` - Process manager configuration
- `.workspace` - Copilot app name reference

## Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete setup and deployment instructions.

## Monitoring

```bash
# Service status
copilot svc status --app sky3 --name web --env prod

# Live logs (both nginx and API)
copilot svc logs --app sky3 --name web --env prod --follow

# Database export
copilot svc exec --app sky3 --name web --env prod \
  --command 'cd /app && node export-csv.js && cat /tmp/waitlist-export.csv'
```
