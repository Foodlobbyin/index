# Roadmap

This document describes what has been completed, what needs attention, and what is planned next.

For the current project status summary, see [PROJECT_OVERVIEW_AND_STATUS.md](./PROJECT_OVERVIEW_AND_STATUS.md).

---

## Completed

These features are built and working:

- **Incident handling** — Users can report and track vendor incidents.
- **Evidence tracking** — Supporting documents and evidence can be attached to incidents.
- **Moderation features** — Moderators can review, approve, and act on reported incidents.
- **Reputation system** — Vendors are scored based on incident history. Scores are calculated and stored in the database, and displayed on company profiles.
- **Audit log search** — Moderators can search and filter the audit log by incident, moderator, action type, and date range via a dedicated UI tab.
- **Rate limiter** — All API routes are protected by a rate limiter.

---

## Needs attention

No critical issues at this time. The following are areas for future improvement:

- **Role-based access control** — The audit log tab is currently visible to all authenticated users. A proper admin/moderator role system does not yet exist in the user model or JWT. Future work should add a `role` field to the users table and restrict sensitive UI and API routes accordingly.

---

## Upcoming

The following enhancements are planned when the above is stable:

- **Enhanced reputation scoring** — Add weighting for incident severity and recency.
- **Role-based access control** — Add `role` field to users table, update JWT payload, and add role middleware to protect admin/moderator routes.
- **Incident UI improvements** — Enhanced filtering, status tracking, and bulk moderation actions.

---

## Next steps

1. Review and test the reputation system end-to-end in a running environment.
2. Review and test the audit log search UI with real moderation data.
3. Plan and implement role-based access control (RBAC).
4. Review and update this roadmap after each milestone.

For a practical guide on what to work on next, see [NEXT_STEPS.md](./NEXT_STEPS.md).