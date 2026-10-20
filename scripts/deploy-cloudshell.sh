#!/bin/bash
# Sky3 Network deployment script for AWS CloudShell
# Usage: SHA=<40-char-commit-sha> ./deploy-cloudshell.sh

set -euo pipefail

# Configuration
REPO_URL="https://github.com/zrogers010/sky3.git"
APP_NAME="sky3"
SERVICE_NAME="web"
ENV_NAME="prod"

# Required: SHA environment variable (must be 40 hex characters)
if [ -z "${SHA:-}" ]; then
  echo "❌ Error: SHA environment variable is required"
  echo "Usage: SHA=<40-char-commit-sha> $0"
  exit 1
fi

# Validate SHA format (40 hexadecimal characters)
if ! [[ "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "❌ Error: SHA must be exactly 40 hexadecimal characters"
  echo "Provided: $SHA (${#SHA} characters)"
  exit 1
fi

echo "🚀 Sky3 Network Deployment"
echo "═══════════════════════════"
echo "SHA:     $SHA"
echo "App:     $APP_NAME"
echo "Service: $SERVICE_NAME"
echo "Env:     $ENV_NAME"
echo ""

# Create temporary working directory
WORK_DIR="/tmp/sky3-deploy-${SHA}"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "📦 Fetching code from GitHub..."
git clone "$REPO_URL" .
git fetch origin "$SHA"
git checkout "$SHA"

ACTUAL_SHA=$(git rev-parse HEAD)
if [ "$ACTUAL_SHA" != "$SHA" ]; then
  echo "❌ Error: Checked out SHA ($ACTUAL_SHA) doesn't match requested SHA ($SHA)"
  exit 1
fi

echo "✅ Repository cloned at commit $ACTUAL_SHA"
echo ""

echo "🏗️  Building and deploying to AWS Copilot..."
echo "This will:"
echo "  1. Build the Docker image from Dockerfile.copilot"
echo "  2. Push to ECR"
echo "  3. Deploy to Fargate"
echo "  4. Wait for service stability"
echo ""

copilot svc deploy \
  --name "$SERVICE_NAME" \
  --env "$ENV_NAME" \
  --app "$APP_NAME" \
  --tag "$SHA"

echo ""
echo "⏳ Waiting for service to stabilize..."

# Wait for service to be stable
copilot svc status --name "$SERVICE_NAME" --env "$ENV_NAME" --app "$APP_NAME"

echo ""
echo "🔍 Verifying deployment..."

# Get the service URL
SERVICE_URL=$(copilot svc show --name "$SERVICE_NAME" --app "$APP_NAME" --json | jq -r ".routes[0].url")
echo "Service URL: $SERVICE_URL"

# Health check with retries
MAX_RETRIES=12
RETRY_DELAY=10
HEALTH_URL="https://www.sky3.org/api/waitlist/health"

echo ""
echo "Testing $HEALTH_URL"
for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i/$MAX_RETRIES..."
  if curl -sf "$HEALTH_URL" > /tmp/health.json; then
    echo "✅ API health check passed:"
    cat /tmp/health.json | jq .
    break
  elif [ $i -eq $MAX_RETRIES ]; then
    echo "❌ Health check failed after $MAX_RETRIES attempts"
    exit 1
  else
    echo "   Waiting ${RETRY_DELAY}s before retry..."
    sleep $RETRY_DELAY
  fi
done

# Test homepage with retries
echo ""
echo "Testing https://www.sky3.org/"
for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i/$MAX_RETRIES..."
  HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" https://www.sky3.org/ || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Homepage returns 200"
    break
  elif [ $i -eq $MAX_RETRIES ]; then
    echo "❌ Homepage did not return 200 after $MAX_RETRIES attempts (got $HTTP_CODE)"
    exit 1
  else
    echo "   Got $HTTP_CODE, waiting ${RETRY_DELAY}s before retry..."
    sleep $RETRY_DELAY
  fi
done

echo ""
echo "═══════════════════════════"
echo "✅ Deployment successful!"
echo ""
echo "🌐 Production URL: https://www.sky3.org/"
echo "📊 Health endpoint: $HEALTH_URL"
echo "📝 Deployed SHA: $ACTUAL_SHA"
echo ""
echo "To view logs:       copilot svc logs --app $APP_NAME --name $SERVICE_NAME --env $ENV_NAME --follow"
echo "To view status:     copilot svc status --app $APP_NAME --name $SERVICE_NAME --env $ENV_NAME"
echo "To export waitlist: copilot svc exec --app $APP_NAME --name $SERVICE_NAME --env $ENV_NAME --command 'cd /app && node export-csv.js && cat /tmp/waitlist-export.csv'"
