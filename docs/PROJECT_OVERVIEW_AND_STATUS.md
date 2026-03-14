# Project Overview and Status

## Overview
This document consolidates all major project elements, summarising the current status, roadmap, and next steps. It is updated after each milestone.

## Current Status

All originally planned features are now built and working:

- Incident handling — Users can report and track vendor incidents.
- Evidence tracking — Supporting documents and evidence can be attached to incidents.
- Moderation features — Moderators can review, approve, and act on reported incidents.
- Reputation system — Vendor reputation scores are calculated from incident history and displayed on company profiles (PR #19).
- Audit log search — Administrators can search and filter the audit log via a dedicated UI tab with filters for incident, moderator, action, and date range (PRs #20, #21).
- Rate limiter — All API routes are protected (PR #20).
- Frontend improvements — Audit Log tab added to main app shell; Reputation Score card added to Company Profile; improved error messaging (PRs #21, #22).

## Needs Attention

- **Role-based access control** — No `role` field exists on users. The Audit Logs tab is visible to all authenticated users. The backend audit log route has no role enforcement beyond requiring a valid auth token. This should be addressed before the platform goes to production.

## Roadmap

### Upcoming Features
- Role-based access control (add `role` to users table, update JWT, add role middleware)
- Enhanced reputation scoring (weight by incident severity and recency)
- Incident UI improvements (better filtering, status timeline, bulk moderation)

### Next Steps
1. Test the reputation system and audit log search end-to-end in a running environment.
2. Plan and implement role-based access control.
3. Review and update this document after each milestone.

---

This document serves as the primary reference for project status, roadmap, and next steps moving forward.

- For the full feature roadmap, see [ROADMAP.md](./ROADMAP.md).
- For practical guidance on what to work on next, see [NEXT_STEPS.md](./NEXT_STEPS.md).