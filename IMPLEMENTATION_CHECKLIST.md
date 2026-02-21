# Implementation Checklist — Foodlobbyin Incidents System

**Version**: 1.0  
**Date**: February 2026  
**Audience**: Developers  

This checklist guides the step-by-step implementation of the Incidents System. Work through phases in order. Each phase builds on the previous one.

**Reference documents**:
- `DATABASE_ARCHITECTURE_FINAL.md` — Full schema, SQL, and design decisions
- `USER_FLOWS.md` — Flowcharts for all user journeys
- `FEATURE_SPECIFICATIONS.md` — Plain-English feature descriptions

---

## Phase 1: Database Setup

### 1.1 Run Migrations

- [ ] Create migration file `004_final_incidents_schema.sql` based on `DATABASE_ARCHITECTURE_FINAL.md`
- [ ] Create table: `incidents` with all columns, CHECK constraints, and FK relationships
- [ ] Create table: `incident_evidence` with file size constraint (`<= 1048576` bytes)
- [ ] Create table: `incident_responses` with all response types
- [ ] Create table: `incident_moderation_log` with all action types
- [ ] Create table: `contact_persons` with mobile format validation
- [ ] Create table: `incident_penalties` with penalty types
- [ ] Create table: `exchange_rates` with unique constraint on (from_currency, to_currency, effective_date)
- [ ] Run `ALTER TABLE users ADD COLUMN trust_level ...` (and the other 3 new columns)
- [ ] Apply migration to development database
- [ ] Verify: `\dt` in psql shows all 7 new tables

### 1.2 Create All Indexes

- [ ] Create all single-column indexes (see `DATABASE_ARCHITECTURE_FINAL.md` → Performance Optimization)
- [ ] Create all composite indexes (`idx_incidents_gstn_status_date`, `idx_incidents_reporter_created`)
- [ ] Create all partial indexes (`idx_incidents_approved` with `WHERE status = 'approved' AND is_deleted = FALSE`)
- [ ] Verify with `\di incidents*` in psql

### 1.3 Test with Sample Data

- [ ] Insert one GST-registered company incident — verify GSTN constraint passes
- [ ] Insert one unregistered company incident (`is_gst_registered = FALSE`, `company_gstn = NULL`) — verify passes
- [ ] Try to insert GST-registered incident without GSTN — verify constraint violation
- [ ] Try to insert invalid GSTN format — verify regex constraint rejects it
- [ ] Insert 3 evidence files for one incident — verify success
- [ ] Try to insert evidence file > 1 MB (`file_size_bytes = 1048577`) — verify constraint rejects it
- [ ] Insert 2 penalty records for one incident — verify success
- [ ] Insert exchange rate for USD/INR — verify success
- [ ] Verify soft delete: `UPDATE incidents SET is_deleted = TRUE` → record hidden from `WHERE is_deleted = FALSE` queries
- [ ] Verify moderation log: every status update inserts a row in `incident_moderation_log`

---

## Phase 2: Backend Models (TypeScript)

### 2.1 Create TypeScript Interfaces / Types

- [ ] `Incident` interface matching all columns in `incidents` table
- [ ] `IncidentEvidence` interface matching `incident_evidence` table
- [ ] `IncidentResponse` interface matching `incident_responses` table
- [ ] `IncidentModerationLog` interface matching `incident_moderation_log` table
- [ ] `ContactPerson` interface matching `contact_persons` table
- [ ] `IncidentPenalty` interface matching `incident_penalties` table
- [ ] `ExchangeRate` interface matching `exchange_rates` table
- [ ] Update `User` interface with `trust_level`, `approved_incidents_count`, `incidents_always_anonymous`, `forums_default_anonymous`

### 2.2 Create Repository / Data Access Layer

- [ ] `IncidentRepository.create(data)` — insert new draft incident
- [ ] `IncidentRepository.findByGstn(gstn, filters)` — gated search by GSTN
  - Must filter `is_deleted = FALSE` and `status = 'approved'` for non-admin users
- [ ] `IncidentRepository.findByMobile(mobile)` — look up via `contact_persons`
- [ ] `IncidentRepository.findById(id, requestingUserId)` — single incident, check privacy
- [ ] `IncidentRepository.updateStatus(id, newStatus, moderatorId, notes)` — status transition + auto-log
- [ ] `IncidentRepository.softDelete(id, deletedBy, reason)` — sets `is_deleted = TRUE`, checks `litigation_hold`
- [ ] `EvidenceRepository.upload(incidentId, fileData, uploadedBy)` — check count < 3 before insert
- [ ] `ContactRepository.findCompaniesByMobile(mobile)` — returns array of companies

### 2.3 Test CRUD Operations

- [ ] Unit test: create incident → verify all fields stored correctly
- [ ] Unit test: upload 3 evidence files → success; 4th file → rejected
- [ ] Unit test: soft delete with `litigation_hold = TRUE` → throws error, no deletion
- [ ] Unit test: GSTN search returns only approved, non-deleted incidents for regular users
- [ ] Unit test: GSTN search for admin returns all statuses

---

## Phase 3: API Endpoints

### 3.1 Incident Submission

- [ ] `POST /api/incidents` — create draft
  - Validate request body (incident type, company details)
  - Validate GSTN format if `is_gst_registered = TRUE`
  - Set `reporter_anonymous = TRUE` by default
  - Return created incident ID
- [ ] `PUT /api/incidents/:id` — update draft (only while `status = 'draft'`)
- [ ] `POST /api/incidents/:id/submit` — change status from `draft` to `submitted`
  - Log `SUBMITTED` action in `incident_moderation_log`
- [ ] `DELETE /api/incidents/:id` — withdraw draft (only while `status = 'draft'`)

### 3.2 Evidence Upload

- [ ] `POST /api/incidents/:id/evidence` — upload a file
  - Validate file size ≤ 1 MB
  - Validate MIME type (images, PDF, audio only)
  - Reject if evidence count for this incident is already 3
  - Store file to local storage (or S3 in production)
  - Insert into `incident_evidence`
- [ ] `DELETE /api/incidents/:id/evidence/:evidenceId` — delete evidence (only while `status = 'draft'`)

### 3.3 Gated Search

- [ ] `GET /api/search/gstn?q=<GSTN>` — search by GSTN
  - Require authenticated user
  - Check rate limit (100/day, resets midnight IST)
  - Return only `status = 'approved'` and `is_deleted = FALSE` incidents for non-admins
  - Log search in analytics (internal use only)
- [ ] `GET /api/search/mobile?q=<mobile>` — search by mobile
  - Query `contact_persons` first
  - If multiple companies: return disambiguation prompt (list of companies NOT returned — just a flag `requires_disambiguation: true`)
  - `POST /api/search/mobile/disambiguate` — accepts `mobile + gstn` OR `mobile + company_name` to get specific company results

### 3.4 Moderation Endpoints

- [ ] `GET /api/moderation/queue` — list incidents with `status = 'submitted'` (moderator only)
- [ ] `PUT /api/moderation/incidents/:id/review` — set `status = 'under_review'`
- [ ] `PUT /api/moderation/incidents/:id/approve` — set `status = 'approved'`
  - Set `published_at = NOW()`
  - Log `APPROVED` action
  - If reporter is trusted user: this step is skipped (auto-approve path)
- [ ] `PUT /api/moderation/incidents/:id/reject` — set `status = 'rejected'`
  - `rejection_reason` field required in request body
  - Log `REJECTED` action
  - Notify reporter

### 3.5 Response & Resolution Endpoints

- [ ] `POST /api/incidents/:id/responses` — company submits a response
  - Allowed `response_type` values enforced
  - Goes into moderation queue (`is_moderated = FALSE`)
- [ ] `PUT /api/moderation/responses/:id/approve` — moderator approves response (sets `is_public = TRUE`)
- [ ] `POST /api/incidents/:id/resolve` — reporter confirms resolution
  - Sets `status = 'resolved'`, `resolved_at = NOW()`
- [ ] `POST /api/incidents/:id/dispute` — reporter disputes resolution attempt

### 3.6 Contact Person Endpoints

- [ ] `POST /api/contacts` — any user can add a contact person
- [ ] `PUT /api/contacts/:id/verify` — admin/moderator marks contact as verified
- [ ] `GET /api/contacts?mobile=<mobile>` — admin-only: see all companies for a mobile

### 3.7 Trust Level Endpoints

- [ ] `PUT /api/admin/users/:id/trust-level` — admin promotes/demotes user trust level
  - Log the change in `incident_moderation_log`
- [ ] `GET /api/admin/users/promotion-candidates` — list users with 3+ approved incidents who are not yet trusted

### 3.8 Rate Limiting Middleware

- [ ] Implement search rate limiting middleware
  - Track `user_id + date (IST)` → count
  - Block once count exceeds 100 (i.e., the 101st attempt receives HTTP 429)
  - Users get exactly 100 successful searches per day
  - Reset key at midnight IST (UTC+5:30)

---

## Phase 4: Frontend

### 4.1 Report Incident Form

- [ ] Multi-step form (wizard):
  - Step 1: Company Details (name, GST status toggle, GSTN input with live validation, state dropdown)
  - Step 2: Incident Details (type dropdown, title, description)
  - Step 3: Financial Details (amount, currency, outstanding amount, payment terms)
  - Step 4: Penalty Breakdown (add/remove rows: type, charged by, description, amount, date)
  - Step 5: Evidence Upload (drag-and-drop, shows file count 0/3, rejects files > 1 MB)
  - Step 6: Review & Submit
- [ ] GSTN live validation (regex check with visual feedback: green tick / red cross)
- [ ] State dropdown populated from predefined list (see `DATABASE_ARCHITECTURE_FINAL.md` → Geographic Reference)
- [ ] Save as Draft button available at every step
- [ ] Evidence upload: show file name, size, type; allow deletion before submission
- [ ] Anonymous indicator: show "Your identity is protected" message prominently

### 4.2 Search Interface

- [ ] Search bar with toggle: "Search by GSTN" / "Search by Mobile"
- [ ] For mobile search: show disambiguation prompt when `requires_disambiguation: true` returned
  - Two input fields: GSTN or Company Name
  - Do NOT show a dropdown of company names
- [ ] Search results list:
  - Company name, incident type, amount, date, status badge
  - Age warning banner for incidents > 10 years old
- [ ] Incident detail page:
  - Title, description, financial summary
  - Penalty breakdown table
  - Currency toggle (original ↔ INR)
  - Evidence list (file names, types — no direct download for unverified users)
  - Company responses (visible ones only)
  - Resolution status
- [ ] Rate limit warning: show remaining daily searches in search UI

### 4.3 Moderation Dashboard

- [ ] Moderation queue table (submitted + under_review incidents)
- [ ] Incident detail view (same as user view plus reporter anonymous ID)
- [ ] Approve / Reject buttons with confirmation modal
- [ ] Rejection reason text field (required on rejection)
- [ ] Response moderation queue (approve/reject company responses)
- [ ] Trusted user promotion notifications panel
  - "User #X has 3 approved incidents — Promote to Trusted? [Yes / No]"
- [ ] Admin tab: search by mobile (tabbed multi-company view)

### 4.4 User Profile & Privacy Settings

- [ ] Privacy settings page:
  - "Always keep my incident reports anonymous" toggle (default: ON)
  - "Post anonymously in forums by default" toggle (default: OFF)
- [ ] My Incidents page: list of user's own reports with status badges
- [ ] Trust level badge display

---

## Phase 5: Testing

### 5.1 Unit Tests

- [ ] GSTN validation function: test 10 valid and 10 invalid formats
- [ ] Mobile number validation: test international formats (+1, +44, +91)
- [ ] Evidence count limit: mock DB, verify rejection on 4th file
- [ ] Rate limit logic: simulate 100 searches, verify 101st is blocked
- [ ] Soft delete: verify `is_deleted = TRUE` hides record from all search queries
- [ ] Litigation hold: verify delete attempt throws appropriate error
- [ ] Status transition: verify invalid transitions are rejected (e.g., `draft → approved` not allowed)
- [ ] Anonymous reporter: verify `reporter_id` is not included in any public-facing query response

### 5.2 Integration Tests

- [ ] Full incident submission flow: create draft → add evidence → add penalties → submit → verify in moderation queue
- [ ] Moderation flow: pick up → approve → verify appears in GSTN search
- [ ] Moderation flow: pick up → reject with reason → verify reporter can see rejection reason
- [ ] Resolution flow: company submits response → moderator approves → reporter confirms → status = resolved
- [ ] Mobile search disambiguation: add contact linked to 2 companies → search mobile → confirm disambiguation prompt → provide GSTN → see correct company incidents
- [ ] Trusted user flow: approve 3 incidents for a user → verify moderator receives promotion notification → promote → verify next incident auto-approved
- [ ] Soft delete: moderator soft-deletes incident → verify it disappears from GSTN search results

### 5.3 End-to-End Tests (E2E)

- [ ] E2E: New user registers → submits incident → moderator approves → second user performs GSTN search → incident appears
- [ ] E2E: Company representative logs in → submits response with proof → reporter confirms → status changes to RESOLVED
- [ ] E2E: Admin searches mobile linked to 3 companies → sees tabbed view → tags contact
- [ ] E2E: User reaches 100 search limit → 101st search shows rate limit error → next day, searches again successfully

### 5.4 Performance Tests

- [ ] GSTN search on database with 10,000 incidents: response time < 50 ms
- [ ] Mobile search (through contact_persons): response time < 50 ms
- [ ] Moderator queue (500 pending items): page load < 100 ms
- [ ] Incident detail page (with 3 evidence files, 5 penalties, 2 responses): load < 200 ms

---

## Phase 6: Security & Compliance

- [ ] Verify no endpoint returns `reporter_id` or user identity in public-facing responses
- [ ] Verify admin-only routes are protected by `trust_level = 'admin'` middleware
- [ ] Verify moderator routes are protected by `trust_level IN ('moderator', 'admin')` middleware
- [ ] Test that a regular user cannot access `GET /api/moderation/queue`
- [ ] Verify `litigation_hold = TRUE` incidents cannot be deleted via API (not just application layer)
- [ ] Verify all user inputs are sanitised before being stored (prevent SQL injection, XSS)
- [ ] Confirm file upload: validate MIME type server-side (not just by file extension)
- [ ] Confirm file upload: validate actual file size server-side (not just client-side)
- [ ] Add HTTPS-only enforcement in production
- [ ] Confirm `incident_moderation_log` table has no DELETE grants in production DB role

---

## Phase 7: Deployment

- [ ] Apply migration `004_final_incidents_schema.sql` to staging database
- [ ] Run integration test suite against staging
- [ ] Apply migration to production database
- [ ] Verify production: create one test incident, approve, search, soft-delete
- [ ] Configure rate limiting (reset job at midnight IST — UTC+5:30)
- [ ] Configure file storage (local path for MVP, S3 path for production)
- [ ] Set up monitoring alert: if `> 500 searches from a single user in one day`, notify admin
- [ ] Document any deviations from this checklist in `PROJECT_STATUS_AND_NEXT_STEPS.md`

---

## Post-MVP Backlog (Do Not Implement Now)

These features are confirmed as future scope and should **not** be built during initial development:

- Notifications via email/SMS to companies
- Reputation score visible to users (keep under wraps until perfected)
- Advanced pattern detection (multiple victims, same GSTN)
- AI-assisted moderation
- Mediation workflow
- PDF export for legal proceedings (requires Legal Professional user type — design separately)
- Full-text search on incident descriptions
- Read replicas for search queries
- Redis caching for popular searches
- Search audit log visible to users (internal analytics only)
- Event linking (moderator creates bankruptcy/liquidation event, links incidents)

---

*Developers: refer to `DATABASE_ARCHITECTURE_FINAL.md` for the exact SQL for every table, index, and constraint mentioned in this checklist.*
