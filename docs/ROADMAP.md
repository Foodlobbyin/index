# Roadmap

This document describes what has been completed, what needs attention, and what is planned next.

Last updated: 14 March 2026

For the current project status summary, see [PROJECT_OVERVIEW_AND_STATUS.md](./PROJECT_OVERVIEW_AND_STATUS.md).

---

## Completed

All of the following features are built, tested, and merged into `main`:

- **Incident handling** — Users can report and track vendor incidents.
- **Evidence tracking** — Supporting documents and evidence can be attached to incidents.
- **Moderation features** — Moderators can review, approve, and act on reported incidents.
- **Reputation system** — Vendors are scored based on incident history. Scores are weighted by incident severity (FRAUD: 30pts, CONTRACT_BREACH: 25pts, PAYMENT_ISSUE: 20pts, QUALITY_ISSUE: 15pts, SERVICE_ISSUE: 10pts, OTHER: 5pts). Scores are stored in the database and displayed on company profiles.
- **Audit log search** — Moderators can search and filter the audit log by incident, moderator, action type, and date range via a dedicated UI tab.
- **Rate limiter** — All API routes are protected by a rate limiter.
- **Role-based access control (RBAC)** — A 5-tier trust level system (`new`, `verified`, `trusted`, `moderator`, `admin`) has been implemented. The `trust_level` column is added to the users table (migration 006), included in the JWT payload, and enforced via `requireTrustLevel` middleware on the audit log routes. The frontend AppShell conditionally shows the Audit Logs tab only to `moderator` and `admin` users.
- **Unit tests** — Comprehensive unit tests exist for all services including reputation, audit log, auth, moderation, incident, and validation.

---

## Needs Attention

The following issues must be resolved before the platform goes to production:

- **Moderation routes not protected by trust level** — `moderation.routes.ts` applies only `authMiddleware` (token check) but does NOT use `requireTrustLevel`. Any authenticated user can currently call approve, reject, and penalty endpoints. Add `requireTrustLevel('moderator', 'admin')` to all moderation routes.
- **No admin UI to manage user trust levels** — Admin/moderator accounts must currently be set manually via raw SQL. An admin API endpoint (`PUT /api/admin/users/:id/trust-level`) is needed so admins can promote/demote users without database access.
- **Audit Logs tab missing from main navigation** — `Navigation.tsx` does not include a conditional link to `/audit-logs` for moderator/admin users. The AppShell tab exists but the nav bar does not reflect it.

---

## Upcoming

The following enhancements are planned once the above is stable:

- **Reputation scoring — recency decay** — Currently scores are weighted by incident type only. Adding a time-decay multiplier (e.g., incidents older than 1 year count at 50%) will make scores more accurate.
- **Incident UI improvements** — Enhanced filtering, status timeline, and bulk moderation actions on the incidents pages. The backend APIs are complete but the frontend experience is basic.
- **CI/CD pipeline** — No `.github/workflows/` exists. Add a GitHub Actions workflow to run lint and tests on every push to `main`.
- **End-to-end smoke testing** — Run the full user flow (register → login → create company → add invoice → view insights → moderator audit log access → logout) in a live environment to confirm all features work together.

---

## Next Steps

1. Apply `requireTrustLevel('moderator', 'admin')` to all routes in `moderation.routes.ts`.
2. Run database migration `006_add_trust_level_to_users.sql` and set at least one user as `admin` via SQL.
3. Add conditional Audit Logs link in `Navigation.tsx` for moderator/admin users.
4. Create `PUT /api/admin/users/:id/trust-level` endpoint for user trust level management.
5. Run end-to-end smoke test to verify all features work together.
6. Add recency decay to reputation scoring in `reputation.service.ts`.
7. Improve incident frontend pages with filtering and status timeline.
8. Set up GitHub Actions CI/CD pipeline.
9. Review and update this document after each milestone.

For a practical guide on what to work on next, see [NEXT_STEPS.md](./NEXT_STEPS.md).
