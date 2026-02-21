# User Flows — Foodlobbyin Incidents System

**Version**: 1.0  
**Date**: February 2026  

All diagrams use Mermaid syntax (rendered on GitHub) with ASCII fallback descriptions.

---

## 1. Incident Submission Flow

```mermaid
flowchart TD
    A([User logs in]) --> B[Go to 'Report Incident']
    B --> C[Fill company details\nName, GSTN / unregistered flag\nState, Incident Type]
    C --> D{Is company\nGST registered?}
    D -- Yes --> E[Enter GSTN\nValidate regex format]
    D -- No --> F[Mark as unregistered\nGSTN not required]
    E --> G[Fill financial details\nAmount, currency, outstanding,\npayment terms violated]
    F --> G
    G --> H[Add penalty breakdown\nOptional: type, amount,\ncharged by, description]
    H --> I[Upload evidence\nMax 3 files, 1 MB each\nIMAGE / PDF / AUDIO / SCREENSHOT]
    I --> J{Evidence count\n< 3?}
    J -- No → limit reached --> K[Show: Maximum 3 files allowed]
    K --> L[Save as DRAFT]
    J -- Yes --> L
    L --> M{User ready\nto submit?}
    M -- No, save for later --> N([Draft saved — can return later])
    M -- Yes --> O[Click 'Submit for Review']
    O --> P[status → submitted\nreported_at = NOW\nLog: SUBMITTED]
    P --> Q([Moderator notified])
```

**ASCII Fallback**

```
User Login
    │
    ▼
Fill Incident Form
(Company Details + Financial Impact + Penalties + Evidence)
    │
    ├─── Save as DRAFT (can return later)
    │
    └─── Submit for Review
              │
              ▼
         status = 'submitted'
         Moderator queue notified
```

---

## 2. Mobile Search with Multiple Companies

```mermaid
flowchart TD
    A([Authenticated user]) --> B[Enter mobile number in search\ne.g. +91-9876543210]
    B --> C[System queries contact_persons]
    C --> D{How many companies\nlinked to this mobile?}
    D -- Zero --> E[Show: No records found]
    D -- One company --> F[Show incidents for that company]
    D -- Multiple companies --> G[Show disambiguation prompt:\n'This number is linked to\nmultiple companies.\nPlease provide more details.']
    G --> H{User provides...}
    H -- GSTN number --> I[Match GSTN in contact_persons\nfor this mobile]
    H -- Company name --> J[Match company name\ncase-insensitive]
    I --> K{Match found?}
    J --> K
    K -- Yes --> F
    K -- No --> L[Show: No matching company found\nfor the details you provided]
    F --> M[Display approved incidents\nFiltered by is_deleted = FALSE\nSorted by incident_date DESC]
    M --> N{Incident older\nthan 10 years?}
    N -- Yes --> O[Show age warning banner]
    N -- No --> P([View incident details])
    O --> P
```

**Key Privacy Rule**: The system never shows a dropdown list of company names associated with a mobile number. The user must already know the company they are searching for.

---

## 3. Trusted User Promotion Flow

```mermaid
flowchart TD
    A([User submits incident]) --> B[Incident goes through moderation]
    B --> C{Moderator decision}
    C -- Rejected --> D[User notified with reason\nApproved count unchanged]
    C -- Approved --> E[approved_incidents_count + 1]
    E --> F{Count == 3?}
    F -- No --> G([Normal — continue submitting])
    F -- Yes --> H[System sends notification to\nall moderators/admins:\nUser X has 3 approved incidents.\nPromote to Trusted?]
    H --> I{Moderator decision}
    I -- Promote --> J[trust_level = 'trusted'\nFuture incidents: AUTO-APPROVED]
    I -- Not yet --> K([User stays at 'verified'\nModerator can revisit later])
    J --> L([User notified: You are now a Trusted Reporter])

    M([Moderator manual action]) --> N[Admin panel: Select any user]
    N --> O[Click Promote to Trusted\nno count requirement]
    O --> J

    P([Trusted user submits\nbad/false incident]) --> Q[Moderator reviews the incident]
    Q --> R{Decision}
    R -- Keep trusted + reject incident --> S[Incident rejected\nTrust level unchanged]
    R -- Demote --> T[trust_level back to 'verified'\nIncident rejected]
    R -- Ban --> U[User banned\nAll incidents soft-deleted\nLogged in moderation_log]
```

---

## 4. Resolution with Proof Upload Flow

```mermaid
flowchart TD
    A([Incident status = 'approved'\nVisible in search]) --> B[Company representative\nlogins or contacts moderator]
    B --> C[Company submits response\nresponse_type = 'HIDE_REQUEST'\nUploads proof:\npayment receipt OR delivery note]
    C --> D[Response goes to moderation queue]
    D --> E{Moderator reviews proof}
    E -- Proof insufficient --> F[Response rejected\nIncident stays approved\nCompany notified]
    E -- Proof looks valid --> G[Moderator notifies reporter:\nCompany has uploaded proof.\nPlease confirm resolution.]
    G --> H{Reporter response}
    H -- Confirms: Issue resolved --> I[status → RESOLVED\nresolved_at = NOW\nIncident remains VISIBLE\nshows company resolved it]
    H -- Rejects: Proof inadequate --> J[status → DISPUTED\nModerator makes final decision]
    J --> K{Moderator final decision}
    K -- Resolve it --> I
    K -- Keep as approved --> L([Incident stays approved\nDispute noted])
    H -- No response\nlong time --> M([Moderator may step in\nafter extended wait])
    M --> K
```

**Note**: There is no automatic timeout. The reporter must actively confirm or reject. The moderator can intervene if the reporter is unreachable after a prolonged period.

---

## 5. Forum Identity Disclosure Flow

```mermaid
flowchart TD
    A([User navigates to forum topic]) --> B{Topic has\nrequire_identity = TRUE?}
    B -- No --> C[User posts normally\nusing their default setting\nforums_default_anonymous]
    B -- Yes --> D{User's\nforums_default_anonymous?}
    D -- FALSE\nalready public --> E[Post submitted with real name\nno warning needed]
    D -- TRUE\nanonymous default --> F[Show warning dialog:\n⚠️ This topic requires your real name.\nYour identity will be visible\nfor THIS POST ONLY.\nYour default remains anonymous.\n\nCancel | Post with my name]
    F --> G{User clicks...}
    G -- Cancel --> H([Post cancelled\nUser returns to topic])
    G -- Post with my name --> I[Post stored with identity revealed\nfor this post ONLY]
    I --> J[User's forums_default_anonymous\nremains TRUE — unchanged]
    J --> K([User identity visible on this post\nbut protected on all future posts])
```

---

## 6. Admin Multi-Company View Flow

```mermaid
flowchart TD
    A([Admin logs in]) --> B[Admin enters mobile number\nin admin search panel]
    B --> C[System queries contact_persons\nno rate limiting for admin]
    C --> D{Companies linked\nto this mobile?}
    D -- One --> E[Standard incident view\nfor that company]
    D -- Multiple --> F[Display tabbed view:\nTab 1: Company A — N incidents\nTab 2: Company B — N incidents\nTab 3: Company C — N incidents]
    F --> G[Admin clicks a tab]
    G --> H[View all incidents for\nthat specific company]
    H --> I{Admin actions}
    I -- Tag contact --> J[Add note: Contact operates\nthrough multiple companies]
    I -- Flag companies --> K[Set moderation_priority = urgent\nfor all linked company incidents]
    I -- View audit trail --> L[See incident_moderation_log\nfor all incidents across tabs]
    I -- Promote/ban user --> M[Update trust_level\nLog in moderation_log]
    J --> N([Action logged\nin incident_moderation_log])
    K --> N
    M --> N
```

---

## Summary: Status Transitions Allowed

```
DRAFT         → submitted (reporter submits)
              → [deleted] (reporter deletes draft)

SUBMITTED     → under_review (moderator picks up)
              → withdrawn (reporter withdraws before moderation)

UNDER_REVIEW  → approved (moderator approves)
              → rejected (moderator rejects — reason required)

APPROVED      → disputed (company disputes via response flow)
              → withdrawn (reporter withdraws — only if no litigation_hold)
              → archived (admin action)
              → resolved (via resolution flow)

REJECTED      → submitted (reporter edits and resubmits)
              → withdrawn (reporter abandons)

DISPUTED      → resolved (reporter confirms or moderator resolves)
              → approved (moderator restores)

RESOLVED      → archived (admin action, optional)

WITHDRAWN     → submitted (reporter changes mind — moderator must approve reactivation)

ARCHIVED      → [permanent — no further transitions]
```

**Litigation hold rule**: If `litigation_hold = TRUE`, only `LITIGATION_HOLD_REMOVED` (admin action) and read operations are permitted. No status transitions or deletions.

---

*All flows incorporate the founder's clarifications from the questionnaire responses.*  
*Diagrams render in GitHub Markdown with Mermaid support.*
