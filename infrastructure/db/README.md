# Database Migrations

## Authoritative Migrations Folder

The `infrastructure/db/migrations/` directory is the **authoritative** source of truth for the database schema.

## How Migrations Run

On first container initialization, Docker mounts this folder into the Postgres container at `/docker-entrypoint-initdb.d`:

```yaml
volumes:
  - ./db/migrations:/docker-entrypoint-initdb.d
```

Postgres automatically executes all `.sql` files in alphabetical order when the data directory is empty (i.e., on the very first `docker compose up`). This means migrations run **once**, at container creation time.

## Migration Files

| File | Description |
|------|-------------|
| `000_base_schema.sql` | Core tables: users, company_profiles, invoices |
| `001_add_auth_features.sql` | Email verification, OTP, password reset |
| `002_add_referral_system.sql` | Referral tracking tables |
| `003_add_incidents_schema.sql` | Incident reporting and moderation |
| `004_add_reputation_score.sql` | User reputation scoring |

## Adding New Migrations

1. Create a new numbered file: `NNN_description.sql`
2. To apply against an existing running container, exec into it:
   ```bash
   docker exec -i foodlobbyin_db psql -U postgres -d foodlobbyin < infrastructure/db/migrations/NNN_description.sql
   ```
3. To fully reset and re-run all migrations from scratch:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

## Archived / Draft Migrations

Files in `infrastructure/database/drafts/` are archived backups and MySQL-syntax drafts that are **not** applied to the Postgres instance. They are kept for reference only.
