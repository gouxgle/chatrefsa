#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "==> Verificando cambios en GitHub..."
git fetch origin main -q

CHANGED=$(git diff --name-only HEAD origin/main)

if [ -z "$CHANGED" ]; then
    echo "   Sin cambios — nada que actualizar."
    docker compose ps
    exit 0
fi

echo "   Archivos modificados:"
echo "$CHANGED" | sed 's/^/     /'

echo "==> Aplicando cambios..."
git pull origin main -q

REBUILD_FRONTEND=false
REBUILD_BACKEND=false

if echo "$CHANGED" | grep -qE "^frontend/"; then
    REBUILD_FRONTEND=true
fi

if echo "$CHANGED" | grep -qE "^backend/|^prisma/|docker-compose\.yml|\.env"; then
    REBUILD_BACKEND=true
fi

if $REBUILD_BACKEND && $REBUILD_FRONTEND; then
    echo "==> Rebuild completo (frontend + backend)..."
    docker compose up -d --build frontend backend
elif $REBUILD_FRONTEND; then
    echo "==> Rebuild frontend..."
    docker compose up -d --build frontend
elif $REBUILD_BACKEND; then
    echo "==> Rebuild backend..."
    docker compose up -d --build backend
else
    echo "==> Solo config — reinicio simple..."
    docker compose restart
fi

echo ""
echo "✅ Deploy completado."
docker compose ps
