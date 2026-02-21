# Feature Specifications — Foodlobbyin Incidents System

**Version**: 1.0  
**Date**: February 2026  
**Audience**: Founders, Product Managers, Non-technical Stakeholders  

This document explains every major feature of the Incidents System in plain English, with real-world examples. No technical knowledge is required to read this document.

---

## 1. Gated Search — "You Must Identify Yourself to Search"

### What Is It?

Gated Search means that **nobody can browse incident reports without providing a specific identifier**. There is no page where someone can scroll through all incidents the way you might browse a news website.

To search, a user must enter one of:
- A **GSTN number** (the 15-digit GST registration number of the company they want to check)
- A **Mobile number** (of a person they have dealt with, which the system links to their associated company)

### Why Does It Matter?

Imagine a competitor who just wants to dig through your company's reputation for no good reason. Without gated search, they could browse all reports at will. With gated search:
- They must know *exactly* who they are looking for
- They must be a registered, logged-in user
- Their search is rate-limited (100 searches per day)
- Suspicious patterns can be flagged

**Real-world example**: A buyer in Pune is considering ordering ₹5,00,000 worth of spices from a seller in Delhi. Before paying the advance, he searches the seller's GSTN. If there are approved incidents, he sees them. If there are none, he gets a clean result. He cannot, however, browse "all incidents in Delhi" or "all incidents in the spice industry."

### How Does Rate Limiting Work?

Each user account can perform **100 searches per day**. The count resets every day at midnight Indian time (IST). If a user reaches 100, they see a message explaining the daily limit. This prevents automated scraping of the database.

---

## 2. Anonymous Reporting — "Your Identity Is Protected"

### What Is It?

When a user submits an incident report, their identity is **hidden from everyone by default** — including other users, moderators, and even the company being reported.

The only person who can ever look up who filed a report is a platform **admin** (and only when there is a very specific reason, such as a legal investigation).

### Why Does It Matter?

In Indian B2B trade, business relationships are complex. A supplier who reports a buyer's payment default might still need to do business with that buyer's contacts. Fear of retaliation stops many victims from reporting fraud.

By making anonymity the default, Foodlobbyin removes this fear:
- The reported company sees an incident but cannot identify the reporter
- The moderator sees the incident and evidence but not who filed it
- Other users searching the database see the incident details but not the reporter's name

### Can Reporters Choose to Be Public?

Yes. A reporter can choose to reveal their identity, but this is entirely optional and must be actively selected. The default is always anonymous.

---

## 3. Moderation Workflow — "Human Review Before Publication"

### What Is It?

Every incident report is reviewed by a **human moderator** before it appears in search results. An incident passes through these stages:

1. **Draft** — Reporter is still writing the report
2. **Submitted** — Reporter has finished and sent it for review
3. **Under Review** — A moderator has picked it up and is reading it
4. **Approved** — Moderator is satisfied and publishes it
5. **Rejected** — Moderator found a problem (reason is shared with the reporter)

### Why Does It Matter?

Without moderation, the platform could be misused by dishonest people to file false reports against competitors. Human moderation ensures:
- Evidence is real and relevant (not fabricated)
- The incident description is factual, not defamatory
- The company GSTN is correctly formatted
- The report serves the platform's purpose (fraud prevention)

### What Happens When a Report Is Rejected?

The reporter receives a clear explanation of why their report was rejected. Common reasons might be:
- "The evidence uploaded does not support the claim described"
- "The GSTN provided does not match the company name"
- "Insufficient detail provided — please describe the incident more specifically"

The reporter can then edit their report and resubmit it.

### There Is No Time Limit

Moderators work at their own pace. There is no 24-hour or 48-hour SLA built into the system. This is intentional — quality matters more than speed at the current stage of the platform.

---

## 4. Trusted Users — "Proven Reporters Skip the Queue"

### What Is It?

A **Trusted User** is a reporter who has built a track record of submitting accurate, high-quality incident reports. Trusted Users have their future reports **automatically approved** without needing to wait for moderation.

### How Does Someone Become Trusted?

**Path 1: After 3 Approved Incidents**
When a user has had exactly 3 incidents approved by a moderator, the moderator receives a suggestion notification: *"This user has 3 approved incidents. Would you like to promote them to Trusted status?"*

The moderator then decides — they are not forced to promote. They can review the user's history and make a judgment call.

**Path 2: Manual Promotion by Admin/Moderator**
A moderator can promote any user to Trusted at any time, even with zero approved incidents. For example, if a well-known and respected industry association joins the platform, an admin can immediately grant them Trusted status.

### What Happens If a Trusted User Abuses the System?

If a Trusted User submits a false or malicious report, a moderator reviews the specific incident and can:
- Reject the incident but keep the user's Trusted status (if it seems like an isolated mistake)
- Demote the user back to regular status
- Ban the user entirely (all their past reports are then hidden/soft-deleted)

Every such decision is recorded in the audit log.

---

## 5. Resolution Process — "Prove the Problem Is Solved"

### What Is It?

When a company wants to resolve an incident that has been published about them, they must **upload proof** that the issue has been fixed. The reporter then confirms whether the proof is satisfactory.

### Step-by-Step

1. **Company uploads proof**: The company (or their representative) submits a response with supporting documents — for example, a bank transfer receipt showing the payment was made, or a signed delivery confirmation.

2. **Moderator reviews proof**: Before the reporter is even notified, the moderator checks that the uploaded proof is real and relevant. Poor-quality or irrelevant uploads are rejected.

3. **Reporter is asked to confirm**: The reporter receives a notification: *"The company has uploaded proof of resolution. Please review and confirm."*

4. **Reporter confirms → Resolved**: The incident status changes to RESOLVED. The incident remains visible in search results — this is intentional. Showing that an issue was raised AND resolved is good for accountability. It shows the company took corrective action.

5. **Reporter rejects → Disputed**: If the reporter believes the proof is inadequate (for example, a partial payment when full payment was owed), the incident moves to DISPUTED status. The moderator then makes the final decision.

### Why Is There No Time Limit?

Forcing a timeline would disadvantage reporters. A reporter might be busy, travelling, or dealing with the legal consequences of the original fraud. They should confirm resolution only when they are genuinely satisfied — not because a deadline expired.

---

## 6. Multi-Currency Support — "International Transactions in INR"

### What Is It?

For incidents involving international transactions, the system supports recording amounts in foreign currencies (USD, AED, EUR, etc.) while also displaying the equivalent in Indian Rupees (INR) for easy comparison.

### How It Works

When a reporter files an incident involving a foreign currency:
- They enter the original amount and select the currency (e.g., USD 10,000)
- The system stores this original amount
- Using the `exchange_rates` table, the system calculates the INR equivalent on the date of the incident

On the incident detail page, users can **toggle** between:
- Original amount: "USD 10,000"
- INR equivalent: "₹8,35,000 (rate on 2024-06-15)"

### Real-World Example

A textile exporter in Surat reports that a buyer in Dubai paid only $5,000 of a $15,000 invoice. The remaining $10,000 was never paid. The system shows:
- Outstanding: USD 10,000
- INR equivalent: ₹8,30,000 (at the exchange rate on the incident date)

This helps Indian traders, who typically think in rupees, understand the severity of the financial impact.

---

## 7. Contact Verification — "Linking People to Companies"

### What Is It?

The Contacts database links **mobile phone numbers** to companies. This allows users to search for a person's mobile number and find the company they are associated with — and then see that company's incident history.

### Who Can Add Contacts?

Any registered user can add a contact entry. This is intentional — in B2B trade, contacts change frequently, and a crowdsourced approach catches more connections than a curated one.

The trust-based system handles abuse: if a user adds false contact entries, they can be banned and their contributions removed.

### How Is Verification Done?

When a contact entry is first added by a user, it is marked `is_verified = FALSE`. A moderator or admin can later verify the contact (mark `is_verified = TRUE`) after checking that the mobile number genuinely belongs to the associated company.

Verified contacts are shown with a verified badge; unverified ones are shown with a disclaimer.

### Mobile Search with Multiple Companies

In Indian trade, the same individual sometimes works with or runs multiple companies. If a mobile number is linked to three different companies, the system does **not** reveal all three companies in a dropdown.

Instead, it asks the searching user to confirm which company they mean by providing the GSTN or company name. This protects the privacy of individuals who have legitimate business relationships with multiple companies.

---

## 8. Penalty Tracking — "Detailed Cost Breakdown"

### What Is It?

Beyond the main outstanding amount, incidents can include a detailed breakdown of all additional costs and penalties that arose because of the fraud or payment default.

### Types of Penalties

| Type | Example |
|---|---|
| **Interest** | 18% per year interest on a working capital loan that went into overdraft because the buyer didn't pay |
| **Late Fee** | Contractual late payment penalty of 2% per month |
| **Legal Cost** | Fees paid to a lawyer to send a legal notice, or court filing fees |
| **Other** | Any other cost that can be specifically attributed to the incident |

### How It Works

For each penalty, the reporter records:
- What type of penalty it is
- Who charged it (e.g., "HDFC Bank", "Delhi District Court", "Advocate Sharma")
- A description of why the penalty was charged
- The amount and the date it was incurred

### Real-World Example

A supplier in Ahmedabad reports a ₹3,00,000 payment default. Their actual financial loss is higher because:
- ₹27,000 — Interest charged by their bank on an overdraft used to cover the gap (charged by HDFC Bank)
- ₹15,000 — Legal notice cost (charged by their advocate)
- ₹5,000 — Late delivery penalty charged to them by their own client because they couldn't deliver on time

Total actual loss: ₹3,47,000. The penalty tracking feature makes this full picture visible.

---

## 9. Soft Delete and Litigation Hold — "Nothing Is Ever Truly Lost"

### Soft Delete

When an incident is "deleted" on Foodlobbyin, it is **not permanently removed from the database**. Instead, a flag (`is_deleted = TRUE`) hides it from all normal search results.

**Why this matters**: Fraud records are evidence. If a reporter is discovered to be malicious and is banned, their reports are soft-deleted — but the data is preserved in case it is needed for legal proceedings later.

**Who can soft-delete**: Only moderators and admins can soft-delete incidents. Reporters cannot delete their own published reports (they can only withdraw them while still in draft).

### Litigation Hold

If an incident becomes the subject of a legal case, an admin can place a **litigation hold** on it. This flag (`litigation_hold = TRUE`) prevents:
- Soft deletion
- Archiving
- Any status change that would hide the incident

The litigation hold ensures that the platform cannot be pressured into removing evidence that is relevant to an ongoing court case.

---

## 10. Old Incident Warning — "Context for Historical Records"

### What Is It?

Any incident report that is more than **10 years old** is shown with a visible warning banner:

> ⚠️ **This incident was reported more than 10 years ago.** Business circumstances may have changed significantly. Please use this information as historical context only.

### Why Show Old Incidents at All?

The founder's philosophy is that there is no statute of limitations for fraud. Past behaviour is relevant — *we only learn from our past*. However, it is also fair to note that a company that defaulted 12 years ago may have completely changed management, processes, and ownership.

The warning ensures transparency: old incidents are shown, but their age is prominently flagged.

---

*This document is intended for non-technical stakeholders. For the technical schema, refer to `DATABASE_ARCHITECTURE_FINAL.md`. For implementation steps, refer to `IMPLEMENTATION_CHECKLIST.md`.*
