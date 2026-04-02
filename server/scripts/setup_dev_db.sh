#!/usr/bin/env bash
set -euo pipefail

# This script ensures the local development PostgreSQL database is created with a
# predictable user/owner so that Prisma can do migrations/resets reliably.
#
# Usage:
#   bash server/scripts/setup_dev_db.sh
#
# Requirements:
#   - You must be able to run `sudo -u postgres psql` (i.e., you have sudo rights).
#   - A local Postgres server must be running.

# Defaults (can be overridden with env vars)
DB_NAME=${DB_NAME:-agapai_db}
SHADOW_DB_NAME=${SHADOW_DB_NAME:-${DB_NAME}_shadow}
DB_USER=${DB_USER:-devuser}
DB_PASS=${DB_PASS:-devpass}

# Read .env (if present) to override defaults
if [ -f "server/.env" ]; then
  # shellcheck source=/dev/null
  set -o allexport
  source "server/.env"
  set +o allexport
  # Allow overriding via explicit env variables
  DB_NAME=${DB_NAME:-$DB_NAME}
  SHADOW_DB_NAME=${SHADOW_DB_NAME:-$SHADOW_DB_NAME}
  DB_USER=${DB_USER:-$DB_USER}
  DB_PASS=${DB_PASS:-$DB_PASS}
fi

echo "[info] Ensuring Postgres role '$DB_USER' exists with CREATEDB..."
role_exists=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER';")
if [ -z "$role_exists" ]; then
  sudo -u postgres psql -c "CREATE ROLE \"$DB_USER\" WITH LOGIN PASSWORD '$DB_PASS' CREATEDB;"
else
  sudo -u postgres psql -c "ALTER ROLE \"$DB_USER\" WITH PASSWORD '$DB_PASS';"
  sudo -u postgres psql -c "ALTER ROLE \"$DB_USER\" CREATEDB;"
fi

# Terminate existing connections so we can drop/recreate cleanly.
echo "[info] Terminating connections to '$DB_NAME'..."
sudo -u postgres psql -v ON_ERROR_STOP=1 -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Drop and recreate the main database and shadow database.
echo "[info] Recreating databases: $DB_NAME and $SHADOW_DB_NAME (owner=$DB_USER)..."
sudo -u postgres psql -v ON_ERROR_STOP=1 -d postgres <<'SQL'
DROP DATABASE IF EXISTS "$DB_NAME";
DROP DATABASE IF EXISTS "$SHADOW_DB_NAME";
CREATE DATABASE "$DB_NAME" OWNER "$DB_USER";
CREATE DATABASE "$SHADOW_DB_NAME" OWNER "$DB_USER";
SQL

# Ensure all existing tables (if any) in public are owned by the configured user.
# This avoids "must be owner of table" errors when Prisma resets the schema.
echo "[info] Fixing table ownership in $DB_NAME..."
TABLES=$(sudo -u postgres psql -qAt -d "$DB_NAME" -c "SELECT tablename FROM pg_tables WHERE schemaname='public';")
if [ -n "$TABLES" ]; then
  while read -r t; do
    if [ -n "$t" ]; then
      echo "  - Setting owner of public.$t to $DB_USER"
      sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -c "ALTER TABLE public.\"$t\" OWNER TO \"$DB_USER\";"
    fi
  done <<< "$TABLES"
else
  echo "  (no public tables found; skipping ownership fix)"
fi

# Print connection info for the developer
cat <<EOF
✅ Done.
You can now run Prisma migrations with:
  cd server
  npx prisma migrate dev

If you use .env, make sure it contains:
  DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME\"
EOF
