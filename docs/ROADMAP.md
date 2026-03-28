# Roadmap

This document describes what has been completed, what needs attention, and what is planned next.

Last updated: 28 March 2026

For the current project status summary, see [PROJECT_OVERVIEW_AND_STATUS.md](./PROJECT_OVERVIEW_AND_STATUS.md).

---

## Completed

All of the following features are built, tested, and merged into `main`:

- **Incident handling** — Users can report and track vendor incidents.
- **Evidence tracking** — Supporting documents and evidence can be attached to incidents.
- **Moderation features** — Moderators can review, approve, and act on reported incidents. All moderation routes are protected by `requireMinTrustLevel('moderator')`.
- **Reputation system** — Vendors are scored based on incident history. Scores are weighted by incident type (FRAUD: 30pts, CONTRACT_BREACH: 25pts, PAYMENT_ISSUE: 20pts, QUALITY_ISSUE: 15pts, SERVICE_ISSUE: 10pts, OTHER: 5pts). **Recency decay is now applied**: incidents in the last 6 months count at 100%, 6–12 months at 75%, 1–2 years at 50%, older than 2 years at 25%. Scores are stored in the database and displayed on company profiles.
- **Audit log search** — Moderators can search and filter the audit log by incident, moderator, action type, and date range via a dedicated UI tab.
- **Rate limiter** — All API routes are protected by a rate limiter.
- **Role-based access control (RBAC) — Complete** — A 5-tier trust level system (`new`, `verified`, `trusted`, `moderator`, `admin`) is implemented end-to-end:
  - Database: `trust_level` column added via migration `006_add_trust_level_to_users.sql` with CHECK constraint and index.
  - Backend: `trust_level` is included in the JWT payload. `requireTrustLevel` and `requireMinTrustLevel` middleware are created and applied to all sensitive routes.
  - Frontend: `AppShell.tsx` and `Navigation.tsx` both read `user.trust_level` from auth context and conditionally show the Audit Logs and Moderation links only for `moderator` and `admin` users.
- **Admin trust-level management API** — `PUT /api/admin/users/:id/trust-level` endpoint allows admins to promote or demote users without direct database access. `GET /api/admin/users/promotion-candidates` surfaces users with 3+ approved incidents who are eligible for promotion.
- **Unit tests** — Comprehensive unit tests exist for all services including reputation (with recency decay coverage), audit log, auth, moderation, incident, GSTN, OTP, referral, and validation.
- **CI/CD pipeline** — GitHub Actions workflow runs lint, build, and tests against a real PostgreSQL 15 container on every push to `main` and on every pull request.

---

## Needs Attention

The following steps must be completed locally before production deployment:

- **Run database migrations** — Migrations `000`–`009` must be applied to the production database. In particular, `006_add_trust_level_to_users.sql` adds the `trust_level` column, which is required for RBAC to work.
- **Bootstrap admin account** — After running migration 006, at least one admin account must be set via SQL:
  ```sql
  UPDATE users SET trust_level = 'admin' WHERE username = 'your_username';
  ```
- **End-to-end smoke test** — Run the full user flow (register → login → report incident → moderator approves → search result appears) in the local environment to confirm all features work together.

---

## Upcoming

The following enhancements are planned for future iterations:

- **Incident UI improvements** — Enhanced filtering, status timeline, and bulk moderation actions on the frontend incident pages.
- **Production deployment** — Nginx reverse proxy, PM2 process manager, environment-specific configs, and HTTPS setup.
- **Monitoring and alerting** — Set up uptime monitoring and an alert if a single user exceeds 500 searches per day (potential scraper).
- **Terms of Service and Privacy Policy** — Legal documents required before public launch.
- **Beta testing program** — Recruit 10–20 initial users, collect feedback, and iterate.

---

## Next Steps

1. Run all database migrations (`000`–`009`) on the local development database.
2. Bootstrap the admin account via SQL.
3. Run the end-to-end smoke test (see [NEXT_STEPS.md](./NEXT_STEPS.md)).
4. Prepare production environment: Docker, Nginx, PM2, HTTPS.
5. Draft Terms of Service and Privacy Policy for legal review.
6. Begin beta user recruitment.

For a practical guide on what to work on next, see [NEXT_STEPS.md](./NEXT_STEPS.md).
