#!/usr/bin/env bash
# Deploy the Internus site + form handler to the VPS.
#
# Usage: ./deploy.sh
# First-time server setup steps are in README.md.

set -euo pipefail

HOST="root@72.62.0.124"
SITE_DIR="/var/www/internus"
HANDLER_DIR="/var/www/internus-form"

cd "$(dirname "$0")"

echo "==> Syncing static site to $HOST:$SITE_DIR"
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'form-handler' \
  --exclude 'deploy' \
  --exclude 'deploy.sh' \
  --exclude 'README.md' \
  ./ "$HOST:$SITE_DIR/"

echo "==> Syncing form handler to $HOST:$HANDLER_DIR"
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.env.example' \
  form-handler/ "$HOST:$HANDLER_DIR/"

echo "==> Installing handler deps and restarting service"
ssh "$HOST" "cd $HANDLER_DIR && npm install --omit=dev --no-fund --no-audit && systemctl restart internus-form && systemctl --no-pager --lines=5 status internus-form"

echo "==> Done. If the Caddyfile changed, also run: ssh $HOST 'caddy reload --config /root/loodus/Caddyfile'"
