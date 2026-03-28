# Project Overview and Status

Last updated: 28 March 2026

## Overview

**Foodlobbyin Index** is a B2B vendor intelligence platform for the food and spice industry. It enables users to report vendor incidents, attach evidence, track moderation decisions, view vendor reputation scores, and search the audit log. Access to sensitive features is governed by a 5-tier trust level system.

---

## Current Status

**Overall Completion: ~90%** — All core features, security layers, and the CI/CD pipeline are built and merged. The only remaining steps before production deployment are database migration execution, admin account bootstrap, and a final smoke test.

### What is built and working

- **Incident handling** — Report, track, and manage vendor incidents end-to-end.
- **Evidence tracking** — Attach supporting documents to incidents (max 3 files, 1 MB each).
- **Moderation features** — Moderator queue, approve/reject with reason, penalty tracking. All routes protected by `requireMinTrustLevel('moderator')`.
- **Reputation system** — Weighted scoring by incident type with recency decay (full weight within 6 months, tapering to 25% for incidents older than 2 years). Scores persisted in the database and shown on company profiles.
- **Audit log search** — Filter by incident, moderator, action type, and date range. Tab visible only to moderator/admin.
- **Rate limiter** — All API routes protected. Search rate limiting enforced.
- **RBAC — Complete** — 5-tier `trust_level` system (`new`, `verified`, `trusted`, `moderator`, `admin`) implemented end-to-end:
  - Database: `trust_level` column + CHECK constraint + index (migration 006).
  - Backend: `trust_level` in JWT payload; `requireTrustLevel` and `requireMinTrustLevel` middleware on all sensitive routes.
  - Frontend: Audit Logs tab and Moderation link conditionally rendered for moderator/admin only (in both `AppShell.tsx` and `Navigation.tsx`).
- **Admin trust-level management API** — `PUT /api/admin/users/:id/trust-level` (admin only). `GET /api/admin/users/promotion-candidates` (moderator/admin).
- **Unit tests** — Full coverage across all services: reputation (including recency decay), audit log, auth, moderation, incident, GSTN, OTP, referral, validation.
- **CI/CD pipeline** — GitHub Actions workflow runs lint + build + tests against PostgreSQL 15 on every push and PR.

---

## What Needs to Happen Before Production

| Step | What | How |
|------|------|-----|
| 1 | Run DB migrations 000–009 | `docker exec` into the DB container and apply each SQL file in `infrastructure/database/migrations/` |
| 2 | Bootstrap admin account | `UPDATE users SET trust_level = 'admin' WHERE username = 'your_username';` |
| 3 | Smoke test | Follow [NEXT_STEPS.md](./NEXT_STEPS.md) — register, log in, submit incident, approve as moderator, search, verify result |
| 4 | Production config | Docker + Nginx + PM2 + HTTPS + environment variables for production |
| 5 | Legal docs | Terms of Service and Privacy Policy before public-facing launch |

---

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full feature roadmap and upcoming enhancements.

---

## Next Steps

1. Run database migrations and set admin account.
2. Run full smoke test.
3. Set up production environment.
4. Draft legal documents.
5. Begin beta user recruitment.

For practical guidance, see [NEXT_STEPS.md](./NEXT_STEPS.md).  
For a quick-reference task checklist, see [TASK_REFERENCE.md](./TASK_REFERENCE.md).
