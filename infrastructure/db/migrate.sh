#!/bin/bash
# Script to run database migrations

set -e

echo "🔄 Running database migrations..."

# Wait for PostgreSQL to be ready
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Run init.sql (schema creation)
echo "📋 Creating database schema..."
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /migrations/init.sql

echo "✅ Migrations completed successfully"
