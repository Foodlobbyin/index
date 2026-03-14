# Project Overview and Status

Last updated: 14 March 2026

## Overview

This document consolidates all major project elements, summarising the current status, roadmap, and next steps. It is updated after each milestone.

**Foodlobbyin Index** is a B2B vendor intelligence platform for the food and spice industry. It enables users to report vendor incidents, attach evidence, track moderation decisions, view vendor reputation scores, and search the audit log. Access to sensitive features is governed by a 5-tier trust level system.

---

## Current Status

All originally planned features and the first phase of RBAC are now built, tested, and merged:

- **Incident handling** — Users can report and track vendor incidents.
- **Evidence tracking** — Supporting documents and evidence can be attached to incidents.
- **Moderation features** — Moderators can review, approve, and act on reported incidents.
- **Reputation system** — Vendor reputation scores are calculated using a weighted scoring model (FRAUD: 30pts, CONTRACT_BREACH: 25pts, PAYMENT_ISSUE: 20pts, QUALITY_ISSUE: 15pts, SERVICE_ISSUE: 10pts, OTHER: 5pts). Scores are stored in the database and displayed on company profiles.
- **Audit log search** — Administrators can search and filter the audit log by incident, moderator, action type, and date range via a dedicated UI tab.
- **Rate limiter** — All API routes are protected by a rate limiter.
- **Frontend shell** — Audit Log tab, Reputation Score card, and improved error messaging are all in place.
- **Role-based access control (RBAC) — Phase 1 complete** — A 5-tier `trust_level` system (`new`, `verified`, `trusted`, `moderator`, `admin`) is implemented end-to-end:
  - Database: `trust_level` column added via migration `006_add_trust_level_to_users.sql` with CHECK constraint and index.
  - Backend: `trust_level` is included in the JWT payload. `requireTrustLevel` middleware is created and applied to audit log routes.
  - Frontend: `AppShell.tsx` reads `user.trust_level` from auth context and conditionally renders the Audit Logs tab only for `moderator` and `admin` users.
- **Unit tests** — Comprehensive tests exist for all services: reputation, audit log, auth, moderation, incident, GSTN, OTP, referral, and validation.

---

## Needs Attention

The following must be resolved before the platform goes to production:

- **Moderation routes unprotected** — `moderation.routes.ts` uses only `authMiddleware` but does NOT apply `requireTrustLevel`. Any logged-in user can call approve, reject, and penalty endpoints. This is the single most critical security gap remaining.
- **No admin UI for trust level management** — Admin and moderator accounts must currently be promoted manually via raw SQL after running migration 006. An API endpoint is needed.
- **Audit Logs missing from main navigation** — `Navigation.tsx` does not include a conditional link to the Audit Logs page for moderator/admin users.

---

## Roadmap

### Immediate (Security — do before any production deployment)

- Apply `requireTrustLevel('moderator', 'admin')` to all routes in `moderation.routes.ts`.
- Run migration `006_add_trust_level_to_users.sql` against the production database.
- Bootstrap at least one admin account via SQL.

### Short-term

- Add conditional Audit Logs link in `Navigation.tsx`.
- Create `PUT /api/admin/users/:id/trust-level` endpoint for user promotion/demotion.
- Run end-to-end smoke test (register → login → create company → add invoice → view insights → audit log as moderator → logout).

### Medium-term

- Add recency decay to reputation scoring (incidents older than 1 year count at reduced weight).
- Improve incident frontend pages with filtering, status timeline, and bulk moderation.
- Set up GitHub Actions CI/CD pipeline.

---

## Next Steps

1. Fix moderation route security (add `requireTrustLevel`).
2. Run database migration 006 and set admin account.
3. Add Audit Logs nav link for privileged users.
4. Build admin trust-level management endpoint.
5. Run full smoke test.

For the full feature roadmap, see [ROADMAP.md](./ROADMAP.md).
For practical guidance on what to work on next, see [NEXT_STEPS.md](./NEXT_STEPS.md).
For a quick-reference task checklist for the project owner, see [TASK_REFERENCE.md](./TASK_REFERENCE.md).
