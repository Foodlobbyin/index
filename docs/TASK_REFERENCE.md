# Task Reference — Foodlobbyin Index

> **Owner's master reference document.**  
> This file is your single source of truth for the current state of the project and what needs to be done. Update the checkboxes as you complete each task.

Last updated: 28 March 2026

---

## Project Completion Overview

| Area | Status |
|---|---|
| Core features (incidents, evidence, moderation) | ✅ Complete |
| Reputation system (weighted by severity + recency decay) | ✅ Complete |
| Audit log search UI | ✅ Complete |
| Rate limiting on all API routes | ✅ Complete |
| RBAC — DB schema (trust_level column) | ✅ Complete |
| RBAC — JWT includes trust_level | ✅ Complete |
| RBAC — requireTrustLevel / requireMinTrustLevel middleware | ✅ Complete |
| RBAC — Audit log routes protected | ✅ Complete |
| RBAC — Moderation routes protected | ✅ Complete |
| RBAC — Frontend hides Audit Logs & Moderation for regular users | ✅ Complete |
| Navigation.tsx — Audit Logs conditional link | ✅ Complete |
| Admin API for trust level management | ✅ Complete |
| Admin API — promotion candidates endpoint | ✅ Complete |
| Unit tests for all services (incl. recency decay) | ✅ Complete |
| CI/CD pipeline (GitHub Actions) | ✅ Complete |
| Database migrations written (000–009) | ✅ Written — needs to be run |
| Database migrations run on local/production DB | ❌ Must do before launch |
| Admin account bootstrapped | ❌ Must do before launch |
| End-to-end smoke test | ❌ Must do before launch |
| Production deployment config | ❌ Future |
| Terms of Service and Privacy Policy | ❌ Future |
| Beta testing program | ❌ Future |

---

## CRITICAL — Must do before any production deployment

### Task 1: Run database migrations on your database

- [ ] **Files to run (in order):** `infrastructure/database/migrations/000_*.sql` → `001` → … → `009`
- [ ] **How:**
  1. Start Docker: `docker-compose up -d` from the `infrastructure/` folder.
  2. Connect to the database:
     ```
     docker exec -it foodlobbyin_db psql -U postgres -d foodlobbyin
     ```
  3. Run each migration file:
     ```
     \i /migrations/006_add_trust_level_to_users.sql
     ```
  4. Verify: `SELECT trust_level FROM users LIMIT 5;`
- **Effort:** 30 minutes

---

### Task 2: Bootstrap admin account

- [ ] After running migration 006, promote your own account:
  ```sql
  UPDATE users SET trust_level = 'admin' WHERE username = 'your_username';
  ```
- [ ] Optionally set a moderator account:
  ```sql
  UPDATE users SET trust_level = 'moderator' WHERE username = 'moderator_username';
  ```
- **Effort:** 5 minutes

---

### Task 3: Run end-to-end smoke test

- [ ] Start the app (`start.bat` on Windows, `./start.sh` on Mac/Linux)
- [ ] Register a new user account
- [ ] Log in and submit a test incident
- [ ] Log in as moderator → approve the incident
- [ ] Search by GSTN → confirm the incident appears in results
- [ ] Log in as regular user → confirm Audit Logs and Moderation links are NOT visible
- [ ] Log in as moderator/admin → confirm both links ARE visible
- [ ] Call `GET /api/moderation/queue` with a regular user JWT → should return 403
- [ ] Call `PUT /api/admin/users/:id/trust-level` with a moderator JWT → should return 403
- [ ] Call `PUT /api/admin/users/:id/trust-level` with an admin JWT → should succeed
- **Effort:** 2–4 hours

---

## HIGH PRIORITY — Before beta launch

### Task 4: Production environment setup

- [ ] Configure Nginx as a reverse proxy (frontend on port 80, API proxied from `/api/`)
- [ ] Set up PM2 for Node.js process management (auto-restart on crash)
- [ ] Create production `.env` files (use `backend/.env.example` as the template)
- [ ] Enable HTTPS (Let's Encrypt via Certbot)
- **Effort:** 1–2 days

---

### Task 5: Draft legal documents

- [ ] Terms of Service (`TERMS_OF_SERVICE.md`) — covers user conduct, incident reporting guidelines, IP, disclaimers
- [ ] Privacy Policy (`PRIVACY_POLICY_DRAFT.md`) — covers data collection, PDPA/IT Act compliance for India, user rights
- [ ] Get both reviewed by a lawyer before public launch
- **Effort:** 3–5 days (writing) + legal review time

---

## MEDIUM PRIORITY — Quality improvements

### Task 6: Improve incident frontend pages

- [ ] **File:** `frontend/src/pages/IncidentListPage.tsx`
- [ ] Add status filter (all / pending / approved / rejected / resolved)
- [ ] Add incident date range filter
- [ ] Add status timeline component to `IncidentDetailPage.tsx`
- [ ] Add bulk approve / reject UI to `ModerationQueuePage.tsx` (for moderators)
- **Effort:** 3–5 days

---

### Task 7: Set up monitoring and alerting

- [ ] Configure uptime monitoring (e.g., UptimeRobot free tier) for `GET /api/health`
- [ ] Add alert: if a single user performs >500 searches in one day, notify admin
- [ ] Set up basic error logging (Sentry free tier or server-side log file rotation)
- **Effort:** 1 day

---

## LOWER PRIORITY — Future enhancements

### Task 8: Beta testing program

- [ ] Write recruitment email templates (warm intro, cold outreach, follow-up)
- [ ] Create `BETA_TESTING_GUIDE.md` with onboarding process and feedback forms
- [ ] Recruit 10 initial beta users from food/spice industry contacts
- [ ] Collect structured feedback and iterate

---

### Task 9: Advanced reputation features

- [ ] Add multi-company reputation comparison view on company profile page
- [ ] Surface reputation score in GSTN search results
- [ ] Add audit trail when a reputation score changes (record what triggered the recalculation)

---

### Task 10: Search improvements

- [ ] Add mobile-number search disambiguation UI to the frontend
- [ ] Add "age warning" banner on search results for incidents older than 10 years
- [ ] Show remaining daily search count to the user in the search UI

---

*For the full technical roadmap, see [ROADMAP.md](./ROADMAP.md). For the project overview, see [PROJECT_OVERVIEW_AND_STATUS.md](./PROJECT_OVERVIEW_AND_STATUS.md).*
