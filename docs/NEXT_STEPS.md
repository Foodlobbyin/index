# Next Steps

Last updated: 14 March 2026

Use this guide to decide what to work on next. Tasks are grouped by urgency. For the full technical roadmap, see [ROADMAP.md](./ROADMAP.md). For a quick-reference checklist for the project owner, see [TASK_REFERENCE.md](./TASK_REFERENCE.md).

---

## If you have 30 minutes — Run and verify the app

Run the project locally and confirm the main pages are working.

1. Follow the steps in [START_HERE.md](../START_HERE.md) to start the app.
2. Open your browser and visit:
   - http://localhost:3000/ — home page
   - http://localhost:3000/login — login page
   - http://localhost:3000/news — news page
   - http://localhost:5000/api-docs — API documentation
3. Confirm each page loads without errors.
4. Stop the app when done (`stop.bat` on Windows, `./stop.sh` on Mac/Linux).

---

## If you have 2–4 hours — Run the smoke test

Run a full smoke test to confirm the core workflows are functioning end-to-end.

1. Start the app (see [START_HERE.md](../START_HERE.md)).
2. Register a new account on the login page.
3. Log in with the account you just created.
4. Create a company profile.
5. Add at least one invoice.
6. View the market insights page.
7. Log out and confirm you are redirected correctly.
8. Log in with a moderator or admin account and verify the Audit Logs tab is visible.
9. Log in with a regular (`new`) account and verify the Audit Logs tab is NOT visible.
10. Note any errors, broken pages, or unexpected behavior.

---

## If you want to build next — Remaining tasks by priority

### CRITICAL — Do before any production deployment

**Task 1: Protect moderation routes with trust level check**

- **What:** `moderation.routes.ts` currently uses only `authMiddleware` (token check). Any logged-in user can call approve, reject, and penalty endpoints.
- **Why it matters:** This is a security vulnerability. Regular users should not be able to moderate incidents.
- **Where to start:** Open `backend/src/routes/moderation.routes.ts`. Import `requireTrustLevel` from `trustLevel.middleware` and add it to all four routes:
  ```ts
  import { requireTrustLevel } from '../middleware/trustLevel.middleware';
  router.get('/queue', requireTrustLevel('moderator', 'admin'), ...);
  router.put('/incidents/:id/approve', requireTrustLevel('moderator', 'admin'), ...);
  router.put('/incidents/:id/reject', requireTrustLevel('moderator', 'admin'), ...);
  router.post('/incidents/:id/penalty', requireTrustLevel('moderator', 'admin'), ...);
  ```
- **Estimated effort:** 30 minutes.

**Task 2: Run the database migration**

- **What:** The migration file `infrastructure/database/migrations/006_add_trust_level_to_users.sql` exists but has not been run against the database yet.
- **Why it matters:** Without running this migration, the `trust_level` column does not exist in the database and RBAC will not function.
- **Where to start:** Connect to the database and run the migration SQL file. Then manually set at least one admin account:
  ```sql
  UPDATE users SET trust_level = 'admin' WHERE username = 'your_admin_username';
  ```
- **Estimated effort:** 15 minutes.

---

### HIGH PRIORITY — Do before beta launch

**Task 3: Add Audit Logs link to main navigation**

- **What:** `Navigation.tsx` shows Dashboard, Company, Invoices, and Insights — but has no link to the Audit Logs page for moderators/admins.
- **Where to start:** Open `frontend/src/components/Navigation.tsx`. Import `useAuth` from `../contexts/AuthContext`. Add a conditional link:
  ```tsx
  const { user } = useAuth();
  const canSeeAuditLogs = ['moderator', 'admin'].includes(user?.trust_level);
  // Then in JSX:
  {canSeeAuditLogs && <Link to="/audit-logs">Audit Logs</Link>}
  ```
- **Estimated effort:** 1 hour.

**Task 4: Create admin endpoint for trust level management**

- **What:** Currently admin and moderator accounts can only be set via raw SQL. An API endpoint is needed so admins can promote/demote users from the application itself.
- **Where to start:** Create `backend/src/routes/admin.routes.ts` with a `PUT /api/admin/users/:id/trust-level` route protected by `requireTrustLevel('admin')`. Register it in `index.ts`.
- **Estimated effort:** 2–3 hours.

---

### MEDIUM PRIORITY — Quality improvements

**Task 5: Add recency decay to reputation scoring**

- **What:** The reputation service currently weights incidents by type only. Older incidents should count less than recent ones.
- **Where to start:** Open `backend/src/services/reputation.service.ts`. Add a time-decay multiplier, for example:
  - Incidents in the last 6 months: 100% weight
  - Incidents 6–12 months old: 75% weight
  - Incidents 1–2 years old: 50% weight
  - Incidents older than 2 years: 25% weight
- **Estimated effort:** 2 hours.

**Task 6: Improve incident frontend pages**

- **What:** The backend incident and moderation APIs are fully built, but the frontend experience is basic with no filtering, status timeline, or bulk actions.
- **Where to start:** Review `frontend/src/pages/` and add filtering, a status timeline component, and bulk approve/reject UI.
- **Estimated effort:** 3–5 days.

---

### LOWER PRIORITY — Infrastructure

**Task 7: Set up CI/CD pipeline**

- **What:** There is no `.github/workflows/` directory. Tests and linting are not run automatically on code changes.
- **Where to start:** Create `.github/workflows/ci.yml` with a workflow that installs dependencies and runs `npm test` for both `backend` and `frontend` on every push to `main`.
- **Estimated effort:** 2–3 hours.

---

## When something breaks

1. Look at the terminal window for an error message.
2. Take a screenshot of the error, including the full message.
3. Note what you were doing when it broke (which page, which action).
4. Check the troubleshooting section in [START_HERE.md](../START_HERE.md) for common fixes.
5. For deeper issues, check the logs:
   - Backend logs: visible in the terminal window running the backend server.
   - Docker/database logs: run `docker logs foodlobbyin_db` in a terminal.
6. If you need to ask for help, share: the error message, a screenshot, and what steps led to the error.
