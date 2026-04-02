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
  # Added --yes to prevent the "Ok to proceed?" prompt
  npx --yes prisma@4 generate --schema=./prisma/schema.prisma || true
fi

if command -v npx >/dev/null 2>&1 && [ -n "$PRISMA_MIGRATE" ]; then
  # Added --yes here as well
  npx --yes prisma@4 migrate deploy --schema=./prisma/schema.prisma || true
fi

# Ensure Python Prisma client is generated when running with a bind-mounted
# workspace (the image may build the client, but a host bind mount can hide it).
if command -v python >/dev/null 2>&1; then
  python -m prisma generate --schema=./prisma/schema.prisma || true
fi

echo "PATH=$PATH"
if command -v uvicorn >/dev/null 2>&1; then
  echo "uvicorn found at: $(command -v uvicorn)"
else
  echo "uvicorn not found"
fi
echo "Execing: $@"
exec "$@"