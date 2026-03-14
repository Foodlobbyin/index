# Next Steps

Use this guide to decide what to do based on how much time you have. For full technical details, see [README.md](../README.md).

---

## If you have 30 minutes

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

## If you have 2–4 hours

Run a basic smoke test to confirm the core workflows are functioning.

1. Start the app (see [START_HERE.md](../START_HERE.md)).
2. Register a new account on the login page.
3. Log in with the account you just created.
4. Create a company profile.
5. Add at least one invoice.
6. View the market insights page.
7. Log out and confirm you are redirected correctly.
8. Note any errors, broken pages, or unexpected behavior.

---

## If you want to build next

All previously listed options (Reputation system and Audit log search) have been completed and merged. The next recommended areas to work on are:

**Option A: Role-based access control (RBAC)**
- What it does: Restricts sensitive routes and UI (e.g. Audit Logs tab, moderation endpoints) to admin/moderator users only.
- Why it matters: Currently all authenticated users can access the Audit Logs tab. The backend has no role enforcement beyond requiring a valid token.
- Where to start: Add a `role` column to the `users` table, include it in the JWT payload, create a role-check middleware, and update the frontend AppShell to conditionally show the Audit Logs tab.

**Option B: Enhanced reputation scoring**
- What it does: Refines the reputation score calculation to weight incidents by severity and recency, not just raw counts.
- Why it matters: A flat count of incidents does not distinguish between minor and major issues.
- Where to start: Review `backend/src/services/reputation.service.ts` and update the scoring formula.

**Option C: Incident UI improvements**
- What it does: Adds better filtering, status timeline, and bulk moderation actions to the incidents pages.
- Why it matters: The backend incident and moderation APIs are complete but the frontend experience is basic.
- Where to start: Review `frontend/src/pages/` for any existing incident-related pages and plan enhancements.

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
