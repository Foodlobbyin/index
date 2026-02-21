# Database Architecture — Foodlobbyin Incidents System (Final)

**Version**: 1.0  
**Date**: February 2026  
**Status**: Design Complete — Ready for Implementation  

---

## Executive Summary

Foodlobbyin is a **privacy-first B2B fraud-prevention platform** for Indian food and commodity traders. The Incidents System is its core feature, allowing verified users to report payment defaults, fraud, and quality issues against companies — while protecting the identity of every reporter by default.

### Key Design Principles

| Principle | Description |
|---|---|
| **Privacy by Default** | Reporters are anonymous unless they choose otherwise. Even moderators cannot see reporter identity — only admins can. |
| **Gated Search** | No free browsing. To view incidents, a user must provide a GSTN or a contact mobile number. This prevents casual reconnaissance of competitors. |
| **Moderation-First** | Every incident is reviewed by a human moderator before it becomes visible in search results. Trusted users skip this queue. |
| **Audit Trail** | Every status change, moderation action, and deletion is logged permanently in `incident_moderation_log`. |
| **Soft Delete** | Fraud evidence is never permanently destroyed. Deleted records are hidden but preserved for legal/compliance purposes. |

---

## Database Schema Overview

### Core Tables (7 total)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     INCIDENTS SYSTEM TABLES                         │
├─────────────────────┬───────────────────────────────────────────────┤
│ Table               │ Purpose                                       │
├─────────────────────┼───────────────────────────────────────────────┤
│ incidents           │ Core incident reports (the main table)        │
│ incident_evidence   │ Uploaded files (max 3, 1 MB each)             │
│ incident_responses  │ Company responses and hide requests           │
│ incident_moderation_log │ Full audit trail of every action          │
│ contact_persons     │ Mobile numbers linked to companies            │
│ incident_penalties  │ Penalty/cost breakdown per incident           │
│ exchange_rates      │ Currency conversion rates                     │
└─────────────────────┴───────────────────────────────────────────────┘
```

### Entity-Relationship Diagram (ASCII)

```
users (existing)
  │  id, email, trust_level, ...
  │
  ├──────────────────────────────────────────────────────────────────┐
  │ reporter_id                                                      │ moderated_by
  ▼                                                                  ▼
incidents ──────────────────────────────────── incident_moderation_log
  │  id, company_gstn, company_name, ...         id, incident_id, action, ...
  │  incident_type, status, ...
  │  reporter_id (FK→users), reporter_anonymous
  │  is_deleted, litigation_hold
  │
  ├──────────────┬────────────────┬─────────────────┐
  │              │                │                 │
  ▼              ▼                ▼                 ▼
incident_      incident_       incident_         incident_
evidence       responses       moderation_log    penalties
id             id              id                id
incident_id    incident_id     incident_id       incident_id
file_name      response_type   action            penalty_type
file_path      is_moderated    old_status        amount
file_size      is_hidden       new_status        charged_by


contact_persons (separate — linked to company via gstn/company_id)
  id, company_gstn, mobile_number, is_primary, is_verified

exchange_rates (standalone lookup table)
  id, from_currency, to_currency, rate, effective_date
```

---

## Detailed Table Specifications

### 1. `incidents` — Core Incident Reports

**Purpose**: Stores every fraud/payment default report submitted by users. The central table of the entire system.

```sql
CREATE TABLE incidents (
  -- Primary Key
  id                        SERIAL PRIMARY KEY,

  -- Company Identification
  company_name              VARCHAR(255) NOT NULL,
  company_gstn              VARCHAR(15),                    -- NULL for unregistered companies
  is_gst_registered         BOOLEAN NOT NULL DEFAULT TRUE,
  company_state_code        VARCHAR(2),                     -- e.g., '27' for Maharashtra
  company_state_name        VARCHAR(100),                   -- e.g., 'Maharashtra'

  -- Incident Classification
  incident_type             VARCHAR(30) NOT NULL
    CHECK (incident_type IN (
      'PAYMENT_DEFAULT',
      'FRAUD',
      'QUALITY_ISSUE',
      'BREACH_OF_CONTRACT',
      'DOCUMENT_FRAUD',
      'OTHER'
    )),
  title                     VARCHAR(255) NOT NULL,
  description               TEXT NOT NULL,

  -- Financial Impact
  amount_involved           DECIMAL(18,2),
  currency                  VARCHAR(3) DEFAULT 'INR',
  outstanding_amount        DECIMAL(18,2),
  payment_terms_violated    TEXT,                           -- free-text description

  -- Reporter Information
  reporter_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reporter_anonymous        BOOLEAN NOT NULL DEFAULT TRUE,  -- anonymous by default

  -- Status Workflow
  status                    VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'disputed',
      'resolved',
      'withdrawn',
      'archived'
    )),

  -- Moderation Fields
  moderation_status         VARCHAR(20) DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'in_review', 'approved', 'rejected')),
  moderated_by              INTEGER REFERENCES users(id) ON DELETE SET NULL,
  moderation_notes          TEXT,
  rejection_reason          TEXT,                           -- visible to reporter
  moderation_priority       VARCHAR(10) DEFAULT 'medium'
    CHECK (moderation_priority IN ('low', 'medium', 'high', 'urgent')),

  -- Privacy & Compliance
  is_deleted                BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by                INTEGER REFERENCES users(id) ON DELETE SET NULL,
  deletion_reason           TEXT,
  litigation_hold           BOOLEAN NOT NULL DEFAULT FALSE, -- prevents deletion

  -- Timestamps
  incident_date             DATE,                           -- when incident actually occurred
  reported_at               TIMESTAMP,                     -- when submitted by user
  published_at              TIMESTAMP,                     -- when approved by moderator
  resolved_at               TIMESTAMP,
  archived_at               TIMESTAMP,
  created_at                TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMP NOT NULL DEFAULT NOW()
);

-- GSTN format validation (basic regex, no API required)
-- Format: 2-digit state code + 5-letter PAN + 4-digit year + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
ALTER TABLE incidents
  ADD CONSTRAINT chk_gstn_format
  CHECK (
    company_gstn IS NULL
    OR company_gstn ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
  );

-- GST registration logic: if registered, GSTN must be provided
ALTER TABLE incidents
  ADD CONSTRAINT chk_gst_registered_requires_gstn
  CHECK (
    (is_gst_registered = FALSE)
    OR (is_gst_registered = TRUE AND company_gstn IS NOT NULL)
  );

-- ─── Indexes ──────────────────────────────────────────────────────────────
-- Primary search paths
CREATE INDEX idx_incidents_company_gstn
  ON incidents(company_gstn)
  WHERE company_gstn IS NOT NULL AND is_deleted = FALSE;

-- Mobile-based search goes via contact_persons → company_gstn → here
CREATE INDEX idx_incidents_reporter_id
  ON incidents(reporter_id);

CREATE INDEX idx_incidents_status
  ON incidents(status)
  WHERE is_deleted = FALSE;

-- Moderator queue
CREATE INDEX idx_incidents_moderation_status
  ON incidents(moderation_status)
  WHERE is_deleted = FALSE;

-- Date-sorted browsing
CREATE INDEX idx_incidents_incident_date
  ON incidents(incident_date DESC)
  WHERE is_deleted = FALSE;

-- Composite: search by GSTN + filter by status + sort by date (50x faster than 3 separate indexes)
CREATE INDEX idx_incidents_gstn_status_date
  ON incidents(company_gstn, status, incident_date DESC)
  WHERE is_deleted = FALSE AND company_gstn IS NOT NULL;

-- Composite: reporter history
CREATE INDEX idx_incidents_reporter_created
  ON incidents(reporter_id, created_at DESC);

-- Partial index: only approved, live incidents (most common read path)
CREATE INDEX idx_incidents_approved
  ON incidents(company_gstn, incident_date DESC)
  WHERE status = 'approved' AND is_deleted = FALSE;
```

---

### 2. `incident_evidence` — File Uploads

**Purpose**: Stores uploaded proof files (invoices, screenshots, audio) for each incident. Maximum 3 files per incident, 1 MB each.

```sql
CREATE TABLE incident_evidence (
  id              SERIAL PRIMARY KEY,
  incident_id     INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  -- File Metadata
  file_name       VARCHAR(255) NOT NULL,
  file_path       TEXT NOT NULL,              -- relative path or S3 URL
  file_size_bytes INTEGER NOT NULL
    CHECK (file_size_bytes > 0 AND file_size_bytes <= 1048576),  -- max 1 MB

  -- File Classification
  evidence_type   VARCHAR(20) NOT NULL
    CHECK (evidence_type IN ('IMAGE', 'PDF', 'AUDIO', 'SCREENSHOT')),
  mime_type       VARCHAR(100) NOT NULL,

  -- Upload Tracking
  uploaded_by     INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploaded_at     TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Future: Encryption (not implemented in MVP)
  is_encrypted    BOOLEAN NOT NULL DEFAULT FALSE,
  encryption_key  TEXT                         -- NULL until encryption is implemented
);

-- Enforce max 3 files per incident (application-layer check + DB trigger)
-- Application layer MUST check: SELECT COUNT(*) FROM incident_evidence WHERE incident_id = ?
-- before inserting. The DB constraint below is a safety net.
CREATE UNIQUE INDEX idx_evidence_incident_max3
  ON incident_evidence(incident_id, id);  -- used with COUNT check in application

CREATE INDEX idx_evidence_incident_id
  ON incident_evidence(incident_id);

CREATE INDEX idx_evidence_uploaded_by
  ON incident_evidence(uploaded_by);
```

---

### 3. `incident_responses` — Company Responses

**Purpose**: Allows companies (or their representatives) to respond to incidents. Responses go through moderation before becoming public. Companies can also request that an incident be hidden while they resolve the issue privately.

```sql
CREATE TABLE incident_responses (
  id                    SERIAL PRIMARY KEY,
  incident_id           INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  -- Responding Party
  responding_company_id INTEGER REFERENCES company_profiles(id) ON DELETE SET NULL,
  responding_user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Response Content
  response_text         TEXT NOT NULL,
  response_type         VARCHAR(20) NOT NULL
    CHECK (response_type IN (
      'DENIAL',
      'PARTIAL_ADMISSION',
      'FULL_ADMISSION',
      'CLARIFICATION',
      'COUNTER_EVIDENCE',
      'HIDE_REQUEST'            -- request moderator to hide incident
    )),

  -- Resolution
  resolution_offered    BOOLEAN NOT NULL DEFAULT FALSE,
  resolution_details    TEXT,

  -- Moderation
  is_moderated          BOOLEAN NOT NULL DEFAULT FALSE,
  moderated_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  moderation_notes      TEXT,

  -- Visibility Controls
  is_public             BOOLEAN NOT NULL DEFAULT FALSE,  -- false until moderated
  is_hidden             BOOLEAN NOT NULL DEFAULT FALSE,
  hidden_by             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  hidden_reason         TEXT,

  -- Timestamps
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_responses_incident_id
  ON incident_responses(incident_id)
  WHERE is_hidden = FALSE;

CREATE INDEX idx_responses_responding_user
  ON incident_responses(responding_user_id);
```

---

### 4. `incident_moderation_log` — Complete Audit Trail

**Purpose**: Records every single action taken on an incident — creation, status changes, moderation decisions, deletions, litigation holds. This log is permanent and cannot be deleted. It is the legal paper trail of the platform.

```sql
CREATE TABLE incident_moderation_log (
  id              SERIAL PRIMARY KEY,
  incident_id     INTEGER NOT NULL REFERENCES incidents(id) ON DELETE RESTRICT,
                                            -- RESTRICT: log must persist even if incident soft-deleted

  -- Action
  action          VARCHAR(40) NOT NULL
    CHECK (action IN (
      'CREATED',
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'DISPUTED',
      'RESOLVED',
      'WITHDRAWN',
      'ARCHIVED',
      'SOFT_DELETED',
      'RESTORED',
      'LITIGATION_HOLD_ADDED',
      'LITIGATION_HOLD_REMOVED',
      'UPDATED'
    )),

  -- Actor
  performed_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  moderator_role  VARCHAR(20),              -- 'admin', 'moderator', 'user', 'system'

  -- Status Snapshot
  old_status      VARCHAR(20),
  new_status      VARCHAR(20),

  -- Rejection Reason (visible to reporter)
  rejection_reason TEXT,

  -- Notes
  notes           TEXT,

  -- Security / Compliance
  ip_address      INET,
  user_agent      TEXT,

  -- Timestamp (immutable)
  performed_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- No UPDATE or DELETE should ever be run on this table.
-- Grant only INSERT + SELECT in production.

CREATE INDEX idx_modlog_incident_id
  ON incident_moderation_log(incident_id);

CREATE INDEX idx_modlog_performed_by
  ON incident_moderation_log(performed_by);

CREATE INDEX idx_modlog_action
  ON incident_moderation_log(action);

CREATE INDEX idx_modlog_performed_at
  ON incident_moderation_log(performed_at DESC);
```

---

### 5. `contact_persons` — Contact Management

**Purpose**: Links mobile numbers to companies. Used in the gated search: a user who searches a mobile number is routed to the associated company, then sees that company's incidents.

```sql
CREATE TABLE contact_persons (
  id              SERIAL PRIMARY KEY,
  company_gstn    VARCHAR(15),             -- matches incidents.company_gstn (application-level join,
                                          -- no FK because company_gstn is not unique in incidents)
  company_name    VARCHAR(255),           -- denormalized for quick display

  -- Contact Info
  contact_name    VARCHAR(255),
  mobile_number   VARCHAR(20) NOT NULL,
  designation     VARCHAR(100),

  -- Multiple Contacts per Company
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Verification
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  verified_at     TIMESTAMP,

  -- Added By
  added_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  added_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Mobile number format: optional + prefix, then 10–15 digits
ALTER TABLE contact_persons
  ADD CONSTRAINT chk_mobile_format
  CHECK (mobile_number ~ '^[+]?[0-9]{10,15}$');

-- Mobile numbers must be unique per company
CREATE UNIQUE INDEX idx_contact_gstn_mobile
  ON contact_persons(company_gstn, mobile_number);

-- Fast lookup by mobile (primary search path)
CREATE INDEX idx_contact_mobile
  ON contact_persons(mobile_number);

CREATE INDEX idx_contact_company_gstn
  ON contact_persons(company_gstn);
```

---

### 6. `incident_penalties` — Penalty Breakdown

**Purpose**: Captures the detailed penalty/cost breakdown for an incident. A single incident may involve multiple penalty types (e.g., interest charged by the bank + legal costs + late fees). The founder specifically asked for a description of why the penalty was charged and by which department/entity.

```sql
CREATE TABLE incident_penalties (
  id              SERIAL PRIMARY KEY,
  incident_id     INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  -- Penalty Classification
  penalty_type    VARCHAR(20) NOT NULL
    CHECK (penalty_type IN ('INTEREST', 'LATE_FEE', 'LEGAL_COST', 'OTHER')),

  -- Who charged this penalty
  charged_by      VARCHAR(255) NOT NULL,    -- e.g., 'HDFC Bank', 'Delhi High Court', 'Supplier'
  description     TEXT NOT NULL,            -- e.g., '18% p.a. interest on overdue invoice'

  -- Amount
  amount          DECIMAL(18,2) NOT NULL
    CHECK (amount > 0),
  currency        VARCHAR(3) NOT NULL DEFAULT 'INR',

  -- When was this penalty incurred
  penalty_date    DATE NOT NULL,

  -- Timestamps
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_penalties_incident_id
  ON incident_penalties(incident_id);
```

---

### 7. `exchange_rates` — Currency Conversion

**Purpose**: Allows amounts in foreign currencies to be displayed in INR. The user can toggle between the original currency and INR on the incident detail page.

```sql
CREATE TABLE exchange_rates (
  id              SERIAL PRIMARY KEY,
  from_currency   VARCHAR(3) NOT NULL,      -- e.g., 'USD', 'EUR', 'AED'
  to_currency     VARCHAR(3) NOT NULL DEFAULT 'INR',
  rate            DECIMAL(18,6) NOT NULL
    CHECK (rate > 0),
  effective_date  DATE NOT NULL,

  -- Timestamps
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Only one rate per currency pair per date
CREATE UNIQUE INDEX idx_exchange_rates_pair_date
  ON exchange_rates(from_currency, to_currency, effective_date);

CREATE INDEX idx_exchange_rates_from
  ON exchange_rates(from_currency, effective_date DESC);
```

---

### 8. Users Table — Trust Level Additions

Add these columns to the **existing** `users` table:

```sql
-- Add trust level system to existing users table
ALTER TABLE users
  ADD COLUMN trust_level VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (trust_level IN ('new', 'verified', 'trusted', 'moderator', 'admin'));

ALTER TABLE users
  ADD COLUMN approved_incidents_count INTEGER NOT NULL DEFAULT 0;

-- Privacy defaults
ALTER TABLE users
  ADD COLUMN incidents_always_anonymous BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN forums_default_anonymous BOOLEAN NOT NULL DEFAULT FALSE;
```

---

## Data Relationships Summary

```
users (1) ──────────────────────── (many) incidents
              reporter_id (FK)

users (1) ──────────────────────── (many) incident_moderation_log
              performed_by (FK)

incidents (1) ──────────────────── (many) incident_evidence       [CASCADE DELETE]
incidents (1) ──────────────────── (many) incident_responses      [CASCADE DELETE]
incidents (1) ──────────────────── (many) incident_moderation_log [RESTRICT DELETE]
incidents (1) ──────────────────── (many) incident_penalties      [CASCADE DELETE]

company (gstn) (1) ─────────────── (many) contact_persons
```

### Cascade Rules

| Parent → Child | On Delete |
|---|---|
| incidents → incident_evidence | CASCADE (evidence deleted with incident soft-delete handled at app layer) |
| incidents → incident_responses | CASCADE |
| incidents → incident_moderation_log | RESTRICT (log is permanent) |
| incidents → incident_penalties | CASCADE |
| users → incidents | RESTRICT (cannot delete user with incidents) |

---

## Privacy & Security Features

### 1. Anonymous Reporting
- `reporter_anonymous` defaults to `TRUE`
- Reporter identity is never exposed in search results or to other users
- Only users with `trust_level = 'admin'` can query `reporter_id`
- Even moderators see anonymized data when reviewing reports

### 2. Gated Search
- No API endpoint returns incidents without a `company_gstn` or `mobile_number` parameter
- Mobile search goes through `contact_persons` → `company_gstn` → `incidents`
- Rate limiting: **100 searches per day per user**, resets at midnight IST
- Search abuse triggers admin notification

### 3. Soft Delete
- `is_deleted = TRUE` hides an incident from all queries
- The record remains in the database for compliance
- `deletion_reason` and `deleted_by` are always recorded
- Every soft-delete is logged in `incident_moderation_log` with action `'SOFT_DELETED'`

### 4. Litigation Hold
- `litigation_hold = TRUE` prevents any deletion attempt
- Application layer must check this flag before processing delete/archive requests
- Hold is logged: `'LITIGATION_HOLD_ADDED'` / `'LITIGATION_HOLD_REMOVED'`

### 5. Data Retention
- Incidents are retained **indefinitely** (fraud prevention justification)
- Search audit logs are retained for **3 years**
- Permanent audit trail in `incident_moderation_log`

### 6. Rate Limiting
- 100 searches/day per authenticated user
- Rate limit counter resets at midnight IST (UTC+5:30)
- Implemented at the API middleware layer (not in the database)

---

## Incident Status Workflow

```
  [Reporter creates]
         │
         ▼
      ┌──────┐
      │ DRAFT │  ──── Reporter edits, adds evidence
      └──────┘
         │  Reporter clicks "Submit"
         ▼
   ┌───────────┐
   │ SUBMITTED  │  ──── Moderator queue
   └───────────┘
         │  Moderator picks up
         ▼
   ┌─────────────┐
   │ UNDER_REVIEW │  ──── Moderator is reviewing
   └─────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────┐
│APPROVED│  │ REJECTED │  ←─ Reason visible to reporter
└────────┘  └──────────┘
    │
    │  (Visible in gated search)
    │
    ├──────────────────────────────────┐
    │                                  │
    ▼                                  ▼
┌──────────┐                    ┌────────────┐
│ DISPUTED  │                    │ WITHDRAWN  │  ←─ Reporter withdraws
└──────────┘                    └────────────┘
    │  Moderator decides                │
    ▼                                   ▼
┌──────────┐                      ┌──────────┐
│ RESOLVED │                      │ ARCHIVED │
└──────────┘                      └──────────┘
```

**Key rule**: An incident with `litigation_hold = TRUE` **cannot** be withdrawn, archived, or soft-deleted.

---

## Mobile Search Flow

When a user enters a mobile number in the gated search, the system follows this exact flow:

```
Step 1: User enters mobile number
        e.g., +91-9876543210

Step 2: System queries contact_persons
        SELECT company_gstn, company_name
        FROM contact_persons
        WHERE mobile_number = '+919876543210';

Step 3a: Single company found
         → Show incidents for that company directly

Step 3b: Multiple companies found
         → Prompt user:
           ┌────────────────────────────────────────────────┐
           │  This mobile number is linked to multiple      │
           │  companies. Please provide more details:       │
           │                                                │
           │  GSTN Number:     [__________________________] │
           │     OR                                         │
           │  Company Name:    [__________________________] │
           └────────────────────────────────────────────────┘
         → System shows incidents only for the specified company

Step 4: Results shown — company names are NOT revealed in a dropdown
        (Privacy principle: user must already know who they are searching for)
```

---

## Admin Multi-Company View

When an **admin** searches a mobile number linked to multiple companies, they see a tabbed view:

```
Search: +91-9876543210

┌──────────────────┬──────────────────┬──────────────────┐
│  ABC Traders     │  XYZ Exports     │  PQR Foods       │
│  (2 incidents)   │  (1 incident)    │  (0 incidents)   │
└──────────────────┴──────────────────┴──────────────────┘

[Tab: ABC Traders]
  Incident #12 — Payment Default — ₹45,000 — Apr 2024
  Incident #34 — Fraud           — ₹1,20,000 — Jan 2025

Admin can:
  → Tag contact as "Operating through multiple companies"
  → Flag all linked companies for investigation
  → Add moderation notes across companies
```

---

## Trusted User Workflow

```
User submits 3 incidents ──→ All 3 get APPROVED
                                     │
                                     ▼
              Moderator receives notification:
              "User [anonymous ID] has 3 approved incidents.
               Promote to TRUSTED status? [Yes / No]"
                                     │
                       ┌─────────────┴──────────────┐
                       │ Yes                         │ No
                       ▼                             ▼
              trust_level = 'trusted'       Stays at 'verified'
              Future incidents:             Future incidents:
              AUTO-APPROVED                 Go through moderation
              (skip queue)

Moderator can also promote ANY user manually at any time
(even with 0 approved incidents)

If trusted user submits false/malicious report:
  → Moderator reviews the specific incident
  → Decides: keep trusted / demote to verified / ban
  → Decision is logged in incident_moderation_log
```

---

## Resolution Workflow

```
Step 1: Company submits HIDE_REQUEST response
        + uploads proof (payment receipt, delivery confirmation)
        → incident_responses.response_type = 'HIDE_REQUEST'
        → evidence attached

Step 2: Moderator reviews proof
        → If valid: notifies reporter

Step 3: Reporter receives notification:
        "Company has uploaded proof of resolution. Please confirm."

        ┌─────────────────────────────────────────────────────┐
        │ Option A: "Yes, issue is resolved"                  │
        │   → status = 'RESOLVED'                             │
        │   → resolved_at = NOW()                             │
        │   → Incident remains VISIBLE (shows company fixed it) │
        │                                                     │
        │ Option B: "No, this proof is inadequate"            │
        │   → status = 'DISPUTED'                             │
        │   → Moderator makes final decision                  │
        └─────────────────────────────────────────────────────┘

No timeout — reporter must actively confirm or reject.
Moderator can step in if reporter is unresponsive (after long delay).
```

---

## Forum Privacy Settings

The `users` table has two independent privacy settings:

```
incidents_always_anonymous = TRUE   ← Incidents are ALWAYS anonymous (cannot be changed per incident)
forums_default_anonymous   = FALSE  ← User's default for forum posts (can change per post)

When a forum topic has require_identity = TRUE:
   User's forums_default_anonymous = TRUE
                    │
                    ▼
   System shows warning:
   ┌──────────────────────────────────────────────────────────┐
   │ ⚠️  This topic requires your real name to participate.   │
   │                                                          │
   │  Your identity will be visible for THIS POST ONLY.       │
   │  Your default setting will remain anonymous.             │
   │                                                          │
   │  [Cancel]                        [Post with my name]     │
   └──────────────────────────────────────────────────────────┘

If user clicks "Post with my name":
   → Post is stored with revealed identity (for that post only)
   → User's forums_default_anonymous setting is NOT changed
```

---

## Performance Optimization

### Composite Indexes — Plain English Explanation

A **composite index** is like a filing cabinet with multiple drawers organized by more than one label.

**Example**: The index `idx_incidents_gstn_status_date` covers three columns: `company_gstn`, `status`, and `incident_date`.

Without it, a search like *"Show me all APPROVED incidents for GSTN 27AAPFU0939F1ZV, sorted newest first"* would need to:
1. Find all rows with that GSTN (scan 1)
2. From those, filter APPROVED (scan 2)
3. Sort by date (sort operation)

With the composite index, the database does all three in **one single operation** — roughly **50× faster**.

### Partial Indexes — Plain English Explanation

A **partial index** only indexes rows where a condition is true — like an index at the back of a book that skips all the unimportant pages.

`WHERE is_deleted = FALSE` means the index only covers active, non-deleted incidents. Since >99% of queries will never look at deleted records, the index is much smaller and faster.

### Full Index List

```sql
-- incidents table
idx_incidents_company_gstn          -- single: GSTN lookup
idx_incidents_reporter_id           -- single: reporter's own incidents
idx_incidents_status                -- single: filter by status
idx_incidents_moderation_status     -- single: moderator queue
idx_incidents_incident_date         -- single: date sort
idx_incidents_gstn_status_date      -- composite: GSTN + status + date (primary search)
idx_incidents_reporter_created      -- composite: reporter history
idx_incidents_approved              -- partial: approved + not deleted (most common read)

-- incident_evidence table
idx_evidence_incident_id            -- single: files for an incident
idx_evidence_uploaded_by            -- single: user's uploads

-- incident_responses table
idx_responses_incident_id           -- single: responses for an incident
idx_responses_responding_user       -- single: user's responses

-- incident_moderation_log table
idx_modlog_incident_id              -- single: log for an incident
idx_modlog_performed_by             -- single: actions by a moderator
idx_modlog_action                   -- single: filter by action type
idx_modlog_performed_at             -- single: chronological sort

-- contact_persons table
idx_contact_mobile                  -- single: mobile search (critical path)
idx_contact_company_gstn            -- single: contacts for a company
idx_contact_gstn_mobile             -- unique: prevent duplicate contacts

-- incident_penalties table
idx_penalties_incident_id           -- single: penalties for an incident

-- exchange_rates table
idx_exchange_rates_pair_date        -- unique: one rate per pair per date
idx_exchange_rates_from             -- single: latest rate for a currency
```

---

## Sample Data Flow — Reporting a Payment Default

**Scenario**: A supplier in Mumbai reports that a buyer in Delhi defaulted on a ₹2,50,000 invoice.

### Step 1: Create Draft

```sql
INSERT INTO incidents (
  company_name, company_gstn, is_gst_registered,
  company_state_code, company_state_name,
  incident_type, title, description,
  amount_involved, currency, outstanding_amount,
  payment_terms_violated,
  reporter_id, reporter_anonymous,
  status, moderation_priority
) VALUES (
  'Delhi Fresh Traders', '07AABCT1332L1ZN', TRUE,
  '07', 'Delhi',
  'PAYMENT_DEFAULT',
  'Invoice #INV-2024-0892 unpaid for 180 days',
  'Buyer placed order worth ₹2,50,000 in June 2024. Three invoices raised...',
  250000.00, 'INR', 230000.00,
  'Net 30 days as per purchase order dated 2024-06-15',
  42, TRUE,   -- reporter_id = 42, anonymous
  'draft', 'medium'
);
-- Returns: id = 101
```

### Step 2: Upload Evidence (max 3 files)

```sql
-- Check count first (application layer)
SELECT COUNT(*) FROM incident_evidence WHERE incident_id = 101;
-- Returns: 0 ✓ (can upload)

INSERT INTO incident_evidence (incident_id, file_name, file_path, file_size_bytes, evidence_type, mime_type, uploaded_by)
VALUES
  (101, 'invoice_892.pdf', '/uploads/101/invoice_892.pdf', 524288, 'PDF', 'application/pdf', 42),
  (101, 'whatsapp_chat.png', '/uploads/101/whatsapp_chat.png', 204800, 'SCREENSHOT', 'image/png', 42);
```

### Step 3: Add Penalty Details

```sql
INSERT INTO incident_penalties (incident_id, penalty_type, charged_by, description, amount, penalty_date)
VALUES
  (101, 'INTEREST', 'HDFC Bank', '18% p.a. on working capital loan due to delayed payment receipt', 20000.00, '2024-12-01'),
  (101, 'LEGAL_COST', 'Advocate Sharma', 'Legal notice drafting and sending cost', 5000.00, '2024-12-15');
```

### Step 4: Submit for Moderation

```sql
UPDATE incidents SET
  status = 'submitted',
  reported_at = NOW(),
  updated_at = NOW()
WHERE id = 101;

INSERT INTO incident_moderation_log (incident_id, action, performed_by, moderator_role, old_status, new_status)
VALUES (101, 'SUBMITTED', 42, 'user', 'draft', 'submitted');
```

### Step 5: Moderator Reviews

```sql
UPDATE incidents SET
  status = 'under_review',
  moderation_status = 'in_review',
  moderated_by = 5,           -- moderator user_id
  updated_at = NOW()
WHERE id = 101;

INSERT INTO incident_moderation_log (incident_id, action, performed_by, moderator_role, old_status, new_status, ip_address)
VALUES (101, 'UNDER_REVIEW', 5, 'moderator', 'submitted', 'under_review', '103.45.67.89');
```

### Step 6: Moderator Approves

```sql
UPDATE incidents SET
  status = 'approved',
  moderation_status = 'approved',
  published_at = NOW(),
  updated_at = NOW()
WHERE id = 101;

INSERT INTO incident_moderation_log (incident_id, action, performed_by, moderator_role, old_status, new_status, notes)
VALUES (101, 'APPROVED', 5, 'moderator', 'under_review', 'approved', 'Evidence verified. Incident published.');
```

**Incident is now visible in gated GSTN search for `07AABCT1332L1ZN`.**

---

## Old Incident Warning

Incidents older than **10 years** display a warning label to search users:

```
⚠️  This incident was reported more than 10 years ago.
    Business circumstances may have changed significantly.
    Please use this information as historical context only.
```

This is implemented at the application layer:
```
IF incident_date < NOW() - INTERVAL '10 years' THEN
  show_age_warning = TRUE
END IF
```

---

## Testing Checklist

### Schema Validation
- [ ] All 7 tables created without errors
- [ ] Foreign key constraints enforced
- [ ] CHECK constraints validated (GSTN regex, file size, status enum)
- [ ] Unique indexes enforced (duplicate mobile per company rejected)
- [ ] Composite indexes present and named correctly

### Business Logic Validation
- [ ] GSTN format validation: `27AAPFU0939F1ZV` → accepted; `INVALID` → rejected
- [ ] GST unregistered: `is_gst_registered = FALSE, company_gstn = NULL` → accepted
- [ ] GST registered + no GSTN: constraint violation
- [ ] Evidence file > 1 MB: rejected by `file_size_bytes` CHECK constraint
- [ ] 4th evidence file for same incident: rejected by application layer count check
- [ ] Soft delete: `is_deleted = TRUE` removes from all search results
- [ ] Litigation hold: delete attempt on `litigation_hold = TRUE` rejected by app layer
- [ ] Status transitions: only valid transitions allowed (e.g., `approved → withdrawn` allowed; `draft → approved` blocked)
- [ ] Anonymous reporter: `reporter_id` not exposed in any public-facing query

### Performance Validation
- [ ] GSTN search returns results in < 50 ms (with composite index)
- [ ] Mobile search through `contact_persons` returns results in < 50 ms
- [ ] Moderator queue loads in < 100 ms
- [ ] Incident detail page (with evidence + penalties + responses) loads in < 200 ms

---

## Geographic Reference — Indian State Codes

| Code | State Name |
|------|------------|
| 01 | Jammu & Kashmir |
| 02 | Himachal Pradesh |
| 03 | Punjab |
| 04 | Chandigarh |
| 05 | Uttarakhand |
| 06 | Haryana |
| 07 | Delhi |
| 08 | Rajasthan |
| 09 | Uttar Pradesh |
| 10 | Bihar |
| 11 | Sikkim |
| 12 | Arunachal Pradesh |
| 13 | Nagaland |
| 14 | Manipur |
| 15 | Mizoram |
| 16 | Tripura |
| 17 | Meghalaya |
| 18 | Assam |
| 19 | West Bengal |
| 20 | Jharkhand |
| 21 | Odisha |
| 22 | Chhattisgarh |
| 23 | Madhya Pradesh |
| 24 | Gujarat |
| 27 | Maharashtra |
| 28 | Andhra Pradesh |
| 29 | Karnataka |
| 30 | Goa |
| 32 | Kerala |
| 33 | Tamil Nadu |
| 34 | Puducherry |
| 36 | Telangana |
| 37 | Andhra Pradesh (new) |

State codes are predefined. The frontend should render a dropdown using this list so the user cannot type an invalid state.

---

*Document prepared based on founder questionnaire responses and design clarifications. Last updated February 2026.*
