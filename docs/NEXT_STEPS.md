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

Two areas are ready to be worked on. Choose one to focus on:

**Option A: Reputation system**
- What it does: Scores vendors based on incident history and community feedback.
- Why it matters: It is a core trust feature for the platform.
- Where to start: Review the existing reputation-related code in the backend. See [docs/ROADMAP.md](./ROADMAP.md) for context.

**Option B: Audit log search history**
- What it does: Lets administrators search and filter the audit log.
- Why it matters: Auditors need to be able to find specific events quickly.
- Where to start: Review the audit log routes and database tables. See [docs/ROADMAP.md](./ROADMAP.md) for context.

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
