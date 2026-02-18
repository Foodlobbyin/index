# Foodlobbyin - Data Privacy & Access Control Policy

## 🔒 Core Privacy Principle

**"Access by Legitimate Interest Only"**

Foodlobbyin operates on a privacy-first model where data is shared **only** when there is a legitimate business interest. Users can only access information about companies they are actively considering doing business with, evidenced by possessing their GSTN or mobile number.

---

## 🎯 Privacy Architecture

### No Public Data

**Everything is Private by Default:**
- No public company profiles
- No public incident reports
- No public search functionality
- No browsing or discovery features
- No data exports for non-members
- No API access without authentication

**Only Public Content:**
- Marketing homepage
- Platform features description
- How it works guide
- Contact information
- Legal documents (Terms, Privacy Policy)

### Members-Only Access

**Authenticated users can:**
- ✅ Submit incident reports
- ✅ Search specific companies (with GSTN/mobile)
- ✅ View reports for searched companies
- ✅ Upload evidence
- ✅ Participate in private forum
- ✅ Receive fraud alerts

**Authenticated users cannot:**
- ❌ Browse all companies
- ❌ Search without valid GSTN/mobile
- ❌ Export bulk data
- ❌ Share data outside platform
- ❌ Use data for non-business purposes
- ❌ Scrape or automate access

---

## 🚪 Access Control Levels

### Level 1: Public (Non-Authenticated)

**Access:**
- Marketing website
- Platform description
- Registration page
- Login page

**No Access:**
- Any company data
- Any incident reports
- Search functionality
- Member forums

### Level 2: Registered Member

**Requirements:**
- Valid email verification
- Phone number verification
- GSTN verification
- Referral code from existing member
- Accepted terms of service

**Access:**
- Search by GSTN/mobile (gated)
- View incidents for searched companies
- Submit incident reports
- Upload evidence
- Read private forum
- Receive email alerts

**Limitations:**
- Cannot search without GSTN/mobile
- Cannot bulk export data
- Limited to 50 searches per day
- Evidence downloads watermarked
- All actions logged

### Level 3: Verified Member

**Additional Requirements:**
- GSTN verified via government API
- Company profile completed
- 3+ verified reports submitted
- Account age > 30 days
- No violations

**Additional Access:**
- Priority in search results
- Enhanced incident details
- Advanced filtering
- 200 searches per day
- Export individual reports (PDF)
- Trusted contributor badge
- Early fraud alerts

**Additional Responsibilities:**
- Higher moderation standards
- Evidence quality expectations
- Response time obligations

### Level 4: Trusted Partner

**Requirements:**
- Industry association member
- 100+ verified reports
- 90+ day account age
- Verified business credentials
- Partnership agreement

**Additional Access:**
- API access (limited)
- Bulk incident submission
- Custom fraud alerts
- Priority support
- White-label options
- Analytics dashboard

### Level 5: Platform Admin

**Requirements:**
- Platform employee
- Background check
- Training completed
- Admin privileges granted

**Access:**
- All data (read-only)
- Moderation tools
- User management
- Report management
- Audit logs
- System configuration

**Restrictions:**
- All actions logged
- No data export
- No personal use
- No external sharing
- Audit trail review

---

## 🔍 Gated Search Model

### How Gated Search Works

**Step 1: User Has Contact**
- User encounters a company in business
- Obtains GSTN number or mobile number
- Has legitimate interest in checking reputation

**Step 2: Legitimate Interest Declaration**
```
Before searching, user must confirm:
☑️ I have business relationship or potential deal with this company
☑️ I have obtained their GSTN or mobile through legitimate means
☑️ I will use this information only for business due diligence
☑️ I will not share this information outside the platform
```

**Step 3: Search Execution**
- User enters 15-digit GSTN or 10-digit mobile
- System validates format
- Checks user's daily search limit
- Logs search with timestamp and IP
- Returns results if valid

**Step 4: View Results**
- Incident reports for that specific company
- Company verification status
- Reputation score
- Response from company (if any)
- Timeline of incidents

**Step 5: Audit Trail**
```
Logged Information:
- User ID
- Searched GSTN/Mobile
- Timestamp
- IP Address
- User Agent
- Action taken (viewed, exported, etc.)
```

### Search Validation

**GSTN Validation:**
```typescript
Format: XX-XXXXX-XXXX-XXX
- 2 chars: State code (01-37)
- 10 chars: PAN
- 1 char: Entity number
- 1 char: 'Z' (default)
- 1 char: Checksum

Example: 27AAPFU0939F1ZV
```

**Mobile Validation:**
```typescript
Format: Indian mobile number
- 10 digits
- Starts with 6, 7, 8, or 9
- Format: XXXXX-XXXXX

Example: 98765-43210
```

**Search Rate Limits:**
- Regular members: 50 searches/day
- Verified members: 200 searches/day
- Trusted partners: 1000 searches/day
- API access: Custom limits

### What Search Returns

**Company Overview:**
- Company name (from GSTN)
- Registration date
- Location (state)
- Business type
- Verification status

**Incident Summary:**
- Total incidents reported
- Incident breakdown by type
- Severity distribution
- Resolution rate
- Latest incident date

**Reputation Score:**
- Overall score (0-100)
- Risk level
- Trend (improving/declining)
- Trust badges
- Community feedback

**Incident Details:**
- Date of incident
- Type (payment default, fraud, quality)
- Amount involved
- Status (ongoing, resolved)
- Reporter (anonymous or named)
- Evidence attached (count)
- Company response

**What's Hidden:**
- Reporter personal details (unless public)
- Other companies involved
- Unverified allegations
- Soft-deleted content

---

## 📝 Incident Reporting

### Who Can Report

**Requirements:**
- Verified member
- Active account
- No pending violations
- First-hand experience only

**Cannot Report:**
- Hearsay or rumors
- Competitor complaints
- Personal grievances
- Non-business issues

### Report Structure

**Required Information:**
- Your relationship to incident (supplier, trader, etc.)
- Company GSTN or mobile number
- Incident type (dropdown)
- Date of incident
- Amount involved (if financial)
- Brief description (100-500 words)

**Optional Information:**
- Invoice numbers
- Contract references
- Communication screenshots
- Photos/videos
- Third-party documentation
- Police complaint (if filed)

**Categorization:**
- **Payment Default**: Unpaid invoices, delayed payments
- **Fraud**: Fake companies, identity theft, advance payment scams
- **Quality Issues**: Substandard goods, wrong products, short delivery
- **Breach of Contract**: Unilateral changes, broken promises
- **Other**: Specify custom category

### Report Lifecycle

**1. Submission**
- User submits incident report
- System validates GSTN/mobile
- Evidence uploaded
- Confirmation email sent

**2. Moderation Review**
- Platform moderator reviews within 24-48 hours
- Checks for:
  - Validity of claim
  - Evidence quality
  - Terms compliance
  - Potential defamation
- May request additional information

**3. Company Notification**
- Accused company notified via registered email
- Given 7 days to respond
- Can upload counter-evidence
- Response published alongside report

**4. Publication**
- Report goes live (visible in searches)
- Added to company's incident history
- Contributes to reputation score
- Searchable by GSTN/mobile

**5. Community Validation**
- Other members can corroborate
- Can add similar experiences
- Vote on resolution fairness
- Report updates or resolutions

**6. Resolution Tracking**
- Reporter updates status
- Company marks as resolved (with proof)
- Mediator involved if needed
- Final status determined

**7. Long-term Status**
- Resolved incidents remain visible
- Marked as "Resolved"
- Resolution details shown
- Contributes positively to reputation

### Report Moderation

**Approved If:**
- Valid GSTN/mobile
- First-hand experience
- Reasonable evidence
- Follows guidelines
- No defamation
- Business-related

**Rejected If:**
- Hearsay or rumors
- Personal attack
- Insufficient detail
- Competitor sabotage
- Terms violation
- Duplicate report

**Flagged for Review If:**
- Very serious allegations
- Large amounts involved
- Legal proceedings mentioned
- Media attention
- Government involvement
- Pattern of abuse

---

## 🛡️ Privacy Protections

### Data Minimization

**Collect Only What's Needed:**
- User: Email, phone, GSTN (for verification)
- Company: GSTN or mobile (for search)
- Incident: Type, date, amount, description
- Evidence: Files directly related to incident

**Do Not Collect:**
- Sensitive personal data
- Financial account details
- Passwords or credentials
- Social media profiles
- Family information
- Health data

### Data Security

**Encryption:**
- All data encrypted at rest (AES-256)
- All data encrypted in transit (TLS 1.3)
- Evidence files encrypted
- Database encrypted
- Backups encrypted

**Access Control:**
- Role-based access (RBAC)
- Principle of least privilege
- Multi-factor authentication for admins
- Session timeout (30 minutes)
- IP whitelisting for sensitive operations

**Audit Logging:**
- All data access logged
- Search queries logged
- Report submissions logged
- Admin actions logged
- Logs retained for 2 years
- Regular audit reviews

### Data Retention

**User Data:**
- Active accounts: Retained indefinitely
- Deleted accounts: 90 days grace period
- After deletion: Personal data removed, incidents anonymized

**Incident Reports:**
- Kept indefinitely (fraud prevention purpose)
- Soft-delete option (hidden but not removed)
- Hard-delete only for legal compliance

**Search Logs:**
- Retained for 2 years
- Used for audit and abuse detection
- Anonymized after 2 years
- Not shared externally

**Evidence Files:**
- Retained with incident report
- Watermarked on download
- Deleted with report (if hard-deleted)
- Backups for 1 year

---

## ⚖️ User Rights

### Right to Access
- Users can request all data we have about them
- Provided in machine-readable format (JSON)
- Within 30 days of request
- Free of charge

### Right to Rectification
- Users can correct personal information
- Can update company details (with proof)
- Cannot edit incident reports (maintain integrity)
- Can add clarifications or updates

### Right to Erasure
- Users can request account deletion
- Personal data removed within 90 days
- Incident reports anonymized (not deleted)
- Some data retained for legal compliance

### Right to Restriction
- Users can limit processing of their data
- Can hide profile from search
- Can opt-out of notifications
- Cannot opt-out of fraud alerts (safety)

### Right to Portability
- Users can export their data
- Provided in JSON or CSV format
- Includes: profile, reports, searches, forum posts
- Does not include: other users' data

### Right to Object
- Users can object to data processing
- Can opt-out of analytics
- Can refuse AI/automation decisions
- Cannot object to essential processing

---

## 🚨 Abuse Prevention

### Detecting Abuse

**Suspicious Patterns:**
- Excessive search volume
- Bulk GSTN collection
- Automated access attempts
- Competitor targeting
- False reporting patterns
- IP address patterns

**Automated Detection:**
- Rate limit violations
- Search pattern analysis
- Report clustering
- Evidence quality analysis
- Response time analysis
- Behavioral anomalies

### Handling Abuse

**Warning System:**
1. First violation: Warning email
2. Second violation: 7-day suspension
3. Third violation: 30-day suspension
4. Fourth violation: Permanent ban

**Immediate Ban:**
- Bulk data scraping
- Selling platform data
- Hacking attempts
- Impersonation
- Systematic false reporting
- Legal violations

**Appeals Process:**
- User can appeal within 30 days
- Must provide explanation
- Evidence reviewed
- Decision within 14 days
- Final decision binding

---

## 📋 Compliance

### Legal Framework

**India:**
- Information Technology Act, 2000
- Personal Data Protection Bill (when enacted)
- Companies Act, 2013
- Consumer Protection Act, 2019

**International (Future):**
- GDPR (European Union)
- CCPA (California)
- Other jurisdictions as needed

### Data Processing

**Lawful Basis:**
- Legitimate interest (fraud prevention)
- Contract (terms of service)
- Consent (optional features)
- Legal obligation (court orders)

**Purpose Limitation:**
- Data used only for stated purposes
- No secondary uses without consent
- No sale of data
- No marketing without opt-in

### Data Sharing

**We Do Not Share Data With:**
- ❌ Marketing companies
- ❌ Data brokers
- ❌ Social media platforms
- ❌ Advertisers (for targeting)
- ❌ Third parties (without consent)

**We May Share Data With:**
- ✅ Law enforcement (legal obligation)
- ✅ Courts (subpoena)
- ✅ Service providers (hosting, email)
- ✅ Industry associations (aggregate only)
- ✅ Researchers (anonymized data)

---

## 📞 Privacy Contact

**Data Protection Officer:**
- Email: privacy@foodlobbyin.com
- Response time: 48 hours
- Escalation: support@foodlobbyin.com

**For Privacy Concerns:**
- Report abuse
- Request data access
- Request data deletion
- File complaints
- Ask questions

---

## 📅 Updates

This policy may be updated periodically. Users will be notified of material changes via email. Continued use after changes constitutes acceptance.

**Last Updated:** [Current Date]
**Version:** 1.0

---

**Privacy is not an afterthought—it's our foundation.**
