#!/bin/bash
# Script to seed the database with sample data

set -e

echo "🌱 Seeding database with sample data..."

# Wait for PostgreSQL to be ready
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Run seed.sql
echo "📋 Inserting seed data..."
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /seeds/seed.sql

echo "✅ Database seeded successfully"
