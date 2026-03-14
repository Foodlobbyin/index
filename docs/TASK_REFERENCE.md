# Task Reference — Foodlobbyin Index

> **Owner's master reference document.**
> This file is your single source of truth for the current state of the project and what needs to be done. Update the checkboxes as you complete each task.

Last updated: 14 March 2026

---

## Project Completion Overview

| Area | Status |
|---|---|
| Core features (incidents, evidence, moderation) | ✅ Complete |
| Reputation system (weighted by severity) | ✅ Complete |
| Audit log search UI | ✅ Complete |
| Rate limiting on all API routes | ✅ Complete |
| RBAC — DB schema (trust_level column) | ✅ Complete |
| RBAC — JWT includes trust_level | ✅ Complete |
| RBAC — requireTrustLevel middleware | ✅ Complete |
| RBAC — Audit log routes protected | ✅ Complete |
| RBAC — Frontend hides Audit Logs for regular users | ✅ Complete |
| Unit tests for all services | ✅ Complete |
| RBAC — Moderation routes protected | ❌ Not done — CRITICAL |
| Database migration 006 run on live DB | ❌ Not done — CRITICAL |
| Admin account bootstrapped | ❌ Not done — CRITICAL |
| Audit Logs link in Navigation.tsx | ❌ Not done |
| Admin API for trust level management | ❌ Not done |
| Recency decay in reputation scoring | ❌ Not done |
| Incident frontend improvements | ❌ Not done |
| CI/CD pipeline | ❌ Not done |
| End-to-end smoke test | ❌ Not done |

---

## CRITICAL — Must do before any production deployment

### Task 1: Protect moderation routes with trust level

- [ ] **File to edit:** `backend/src/routes/moderation.routes.ts`
- [ ] **What to do:**
  1. Add import at top: `import { requireTrustLevel } from '../middleware/trustLevel.middleware';`
  2. Add `requireTrustLevel('moderator', 'admin')` as middleware to these 4 routes:
     - `router.get('/queue', ...)`
     - `router.put('/incidents/:id/approve', ...)`
     - `router.put('/incidents/:id/reject', ...)`
     - `router.post('/incidents/:id/penalty', ...)`
- [ ] **Why:** Any logged-in user can currently call these endpoints. This is the biggest security gap.
- [ ] **Effort:** 30 minutes
- [ ] **Test by:** Using a `new`-level user's JWT to call `GET /api/moderation/queue` — should get 403 after the fix.

---

### Task 2: Run database migration 006

- [ ] **File to run:** `infrastructure/database/migrations/006_add_trust_level_to_users.sql`
- [ ] **What to do:**
  1. Connect to the PostgreSQL database (use `docker exec` or a DB client).
  2. Run the SQL file against the database.
  3. Verify the `trust_level` column was added: `SELECT trust_level FROM users LIMIT 5;`
- [ ] **Effort:** 15 minutes

---

### Task 3: Bootstrap admin account

- [ ] **What to do:** After running migration 006, set your own account as admin:
  ```sql
  UPDATE users SET trust_level = 'admin' WHERE username = 'your_username';
  ```
  And set your moderator account(s):
  ```sql
  UPDATE users SET trust_level = 'moderator' WHERE username = 'moderator_username';
  ```
- [ ] **Why:** Without an admin account, no one can access the Audit Logs tab or moderate incidents.
- [ ] **Effort:** 5 minutes

---

## HIGH PRIORITY — Do before beta launch

### Task 4: Add Audit Logs link to main navigation

- [ ] **File to edit:** `frontend/src/components/Navigation.tsx`
- [ ] **What to do:**
  1. Import `useAuth`: `import { useAuth } from '../contexts/AuthContext';`
  2. Inside the component, add: `const { user } = useAuth();`
  3. Add constant: `const canSeeAuditLogs = ['moderator', 'admin'].includes(user?.trust_level);`
  4. In the JSX nav links, add: `{canSeeAuditLogs && <Link to="/audit-logs">Audit Logs</Link>}`
- [ ] **Effort:** 1 hour
- [ ] **Test by:** Logging in as `moderator`/`admin` — link should appear. Logging in as `new` user — link should NOT appear.

---

### Task 5: Build admin trust-level management API

- [ ] **New file to create:** `backend/src/routes/admin.routes.ts`
- [ ] **New file to create:** `backend/src/controllers/admin.controller.ts`
- [ ] **What to do:**
  1. Create a `PUT /api/admin/users/:id/trust-level` endpoint.
  2. Protect with `requireTrustLevel('admin')`.
  3. Accept `{ trust_level: 'new' | 'verified' | 'trusted' | 'moderator' | 'admin' }` in the body.
  4. Update the user's `trust_level` in the database.
  5. Register the route in `backend/src/index.ts`.
- [ ] **Effort:** 2–3 hours

---

### Task 6: Run end-to-end smoke test

- [ ] Start the app locally (`start.bat` on Windows or `./start.sh` on Mac/Linux)
- [ ] Register a new user account
- [ ] Log in and create a company profile
- [ ] Add at least one invoice
- [ ] View the market insights page
- [ ] Log out
- [ ] Set the test account to `moderator` via SQL
- [ ] Log back in and verify the Audit Logs tab IS visible
- [ ] Create a new `new`-level user and verify the Audit Logs tab is NOT visible
- [ ] Try calling `POST /api/moderation/incidents/1/penalty` with a `new`-level JWT — should get 403
- [ ] Note any errors or broken pages

---

## MEDIUM PRIORITY — Quality improvements

### Task 7: Add recency decay to reputation scoring

- [ ] **File to edit:** `backend/src/services/reputation.service.ts`
- [ ] **What to do:** Apply a time-decay multiplier to incident weights:
  - Last 6 months: 100% weight (no change)
  - 6–12 months ago: 75% weight
  - 1–2 years ago: 50% weight
  - Older than 2 years: 25% weight
- [ ] **Also update:** `backend/src/__tests__/services/reputation.service.test.ts` to add test cases for recency decay.
- [ ] **Effort:** 2 hours

---

### Task 8: Improve incident frontend pages

- [ ] **Files to review/edit:** `frontend/src/pages/` (check for any existing incident pages)
- [ ] **What to build:**
  - [ ] Incident list with status filter (pending / approved / rejected)
  - [ ] Status timeline on incident detail page
  - [ ] Bulk select + bulk approve/reject for moderators
- [ ] **Effort:** 3–5 days

---

## LOWER PRIORITY — Infrastructure

### Task 9: Set up CI/CD pipeline

- [ ] **New file to create:** `.github/workflows/ci.yml`
- [ ] **What to do:** Create a GitHub Actions workflow:
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    test-backend:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
          with: { node-version: '18' }
        - run: cd backend && npm install && npm test
    test-frontend:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
          with: { node-version: '18' }
        - run: cd frontend && npm install && npm test
  ```
- [ ] **Effort:** 2–3 hours

---

## Quick Reference — Key Files

| What you want to change | File |
|---|---|
| Moderation route security | `backend/src/routes/moderation.routes.ts` |
| Trust level middleware | `backend/src/middleware/trustLevel.middleware.ts` |
| Reputation scoring weights | `backend/src/services/reputation.service.ts` |
| Audit log routes | `backend/src/routes/auditLog.routes.ts` |
| User model / trust_level type | `backend/src/models/User.ts` |
| Auth — JWT generation | `backend/src/services/auth.service.ts` |
| DB migration for trust_level | `infrastructure/database/migrations/006_add_trust_level_to_users.sql` |
| Frontend — nav bar | `frontend/src/components/Navigation.tsx` |
| Frontend — tab visibility (AppShell) | `frontend/src/pages/AppShell.tsx` |
| Frontend — auth context | `frontend/src/contexts/AuthContext.tsx` |
| Audit log page | `frontend/src/pages/AuditLogPage.tsx` |
| Company profile page | `frontend/src/pages/CompanyProfile.tsx` |

---

## Trust Level System Reference

| Level | Who it is | Can access |
|---|---|---|
| `new` | Newly registered user | Basic features only |
| `verified` | Email-verified user | Basic features |
| `trusted` | Established user | Extended features |
| `moderator` | Appointed moderator | Audit Logs + moderation queue |
| `admin` | Platform administrator | All features + user management |

**To promote a user manually via SQL:**
```sql
UPDATE users SET trust_level = 'moderator' WHERE username = 'username_here';
```

---

## Related Documents

- [PROJECT_OVERVIEW_AND_STATUS.md](./PROJECT_OVERVIEW_AND_STATUS.md) — Full project status and overview
- [ROADMAP.md](./ROADMAP.md) — Full feature roadmap
- [NEXT_STEPS.md](./NEXT_STEPS.md) — Detailed task guide with code examples
- [START_HERE.md](../START_HERE.md) — How to run the project locally
