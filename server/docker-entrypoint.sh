#!/usr/bin/env bash
set -e

host="${POSTGRES_HOST:-postgres}"
port="${POSTGRES_PORT:-5432}"

echo "Waiting for Postgres at ${host}:${port}..."
until pg_isready -h "$host" -p "$port" >/dev/null 2>&1; do
  sleep 1
done
echo "Postgres is ready."

if command -v npx >/dev/null 2>&1; then
  npx prisma generate --schema=./prisma/schema.prisma || true
fi

if [ -n "$PRISMA_MIGRATE" ]; then
  npx prisma migrate deploy --schema=./prisma/schema.prisma || true
fi

exec "$@"
