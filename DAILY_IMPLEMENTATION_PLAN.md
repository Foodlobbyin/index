# Daily Implementation Plan - Foodlobbyin

## Overview

This document provides a **day-by-day task breakdown** for implementing the Foodlobbyin fraud prevention platform over 40 working days (~8 weeks).

### Principles
- **Quality over speed** - No deadline pressure
- **Security first** - Zero vulnerabilities goal
- **Thorough testing** - Test each component before moving forward
- **Clear deliverables** - Measurable progress each day

### Time Commitment
- **2-4 hours per day** of focused development
- **1 hour per day** for testing and documentation
- **Friday reviews** to assess weekly progress

---

## Phase 1: Database Foundation & Privacy (Days 1-10)

### Day 1: Incidents Table & Schema Design

**Goal**: Create core incidents table for fraud reporting

**Tasks** (3-4 hours):
1. Design incidents table schema
2. Create migration script
3. Add indexes for performance
4. Write seed data
5. Test locally

**Code**:
```sql
CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  company_gstn VARCHAR(15),
  company_mobile VARCHAR(15),
  company_name VARCHAR(255) NOT NULL,
  incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN 
    ('payment_default', 'fraud', 'quality_issue', 'contract_breach', 'communication_issue')),
  incident_date DATE NOT NULL,
  amount_involved DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'INR',
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN 
    ('pending', 'verified', 'resolved', 'disputed', 'rejected')),
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN 
    ('low', 'medium', 'high', 'critical')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT has_gstn_or_mobile CHECK (company_gstn IS NOT NULL OR company_mobile IS NOT NULL)
);

CREATE INDEX idx_incidents_company_gstn ON incidents(company_gstn) WHERE company_gstn IS NOT NULL;
CREATE INDEX idx_incidents_company_mobile ON incidents(company_mobile) WHERE company_mobile IS NOT NULL;
CREATE INDEX idx_incidents_reporter ON incidents(reporter_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created ON incidents(created_at DESC);
```

**Testing**:
- [ ] Table creates successfully
- [ ] Indexes created
- [ ] Constraints work correctly
- [ ] Can insert test data
- [ ] Can query by GSTN/mobile

**Deliverables**:
- `003_add_incidents_table.sql` migration
- Test seed data file
- Updated ARCHITECTURE.md

---

### Day 2: Evidence & Responses Tables

**Goal**: Create tables for evidence attachments and company responses

**Tasks** (3-4 hours):
1. Design incident_evidence table
2. Design incident_responses table
3. Create migration script
4. Add foreign key relationships
5. Test with sample data

**Code**:
```sql
-- Evidence attachments
CREATE TABLE incident_evidence (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100),
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT false
);

CREATE INDEX idx_evidence_incident ON incident_evidence(incident_id);
CREATE INDEX idx_evidence_uploaded ON incident_evidence(uploaded_at DESC);

-- Company responses
CREATE TABLE incident_responses (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  responder_id INTEGER NOT NULL REFERENCES users(id),
  responder_type VARCHAR(20) CHECK (responder_type IN ('company', 'reporter', 'admin')),
  response_text TEXT NOT NULL,
  response_evidence TEXT[], -- URLs to supporting documents
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_responses_incident ON incident_responses(incident_id);
CREATE INDEX idx_responses_responder ON incident_responses(responder_id);
CREATE INDEX idx_responses_created ON incident_responses(created_at DESC);
```

**Testing**:
- [ ] Tables create successfully
- [ ] Foreign keys work
- [ ] Cascade delete works
- [ ] Can link evidence to incidents
- [ ] Can add multiple responses

**Deliverables**:
- Migration script
- Sample data for testing
- API endpoint design doc

---

### Day 3: Search Audit Log & Rate Limiting

**Goal**: Implement privacy controls with search audit trail

**Tasks** (3-4 hours):
1. Create search_audit_log table
2. Create user_rate_limits table
3. Design audit logging strategy
4. Test logging performance
5. Document privacy controls

**Code**:
```sql
-- Search audit trail
CREATE TABLE search_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  searched_gstn VARCHAR(15),
  searched_mobile VARCHAR(15),
  search_type VARCHAR(20) CHECK (search_type IN ('gstn', 'mobile', 'combined')),
  results_found INTEGER DEFAULT 0,
  search_timestamp TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  session_id VARCHAR(100),
  CONSTRAINT has_search_term CHECK (searched_gstn IS NOT NULL OR searched_mobile IS NOT NULL)
);

CREATE INDEX idx_audit_user ON search_audit_log(user_id);
CREATE INDEX idx_audit_gstn ON search_audit_log(searched_gstn) WHERE searched_gstn IS NOT NULL;
CREATE INDEX idx_audit_mobile ON search_audit_log(searched_mobile) WHERE searched_mobile IS NOT NULL;
CREATE INDEX idx_audit_timestamp ON search_audit_log(search_timestamp DESC);
CREATE INDEX idx_audit_ip ON search_audit_log(ip_address);

-- Rate limiting tracking
CREATE TABLE user_rate_limits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  action_count INTEGER DEFAULT 0,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  limit_exceeded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, action_type, window_start)
);

CREATE INDEX idx_rate_limits_user ON user_rate_limits(user_id);
CREATE INDEX idx_rate_limits_window ON user_rate_limits(window_end);
```

**Testing**:
- [ ] Audit log records every search
- [ ] Can query search history by user
- [ ] Rate limit tracking works
- [ ] Performance is acceptable (<10ms per log)
- [ ] Indexes improve query speed

**Deliverables**:
- Migration script
- Audit logging middleware (backend)
- Rate limiting service
- Privacy documentation update

---

### Day 4: Company Reputation Table

**Goal**: Track company reputation scores and incident statistics

**Tasks** (2-3 hours):
1. Design company_reputation table
2. Create aggregation queries
3. Build score calculation algorithm
4. Test with sample data
5. Document algorithm

**Code**:
```sql
CREATE TABLE company_reputation (
  id SERIAL PRIMARY KEY,
  company_gstn VARCHAR(15) UNIQUE,
  company_mobile VARCHAR(15),
  company_name VARCHAR(255),
  total_incidents INTEGER DEFAULT 0,
  resolved_incidents INTEGER DEFAULT 0,
  disputed_incidents INTEGER DEFAULT 0,
  pending_incidents INTEGER DEFAULT 0,
  total_amount_involved DECIMAL(18,2) DEFAULT 0,
  avg_resolution_days DECIMAL(10,2),
  reputation_score DECIMAL(5,2) DEFAULT 50.00, -- 0-100 scale
  risk_level VARCHAR(20) DEFAULT 'unknown' CHECK (risk_level IN 
    ('low', 'medium', 'high', 'critical', 'unknown')),
  last_incident_date DATE,
  first_incident_date DATE,
  verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN 
    ('verified', 'unverified', 'disputed', 'blacklisted')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT has_identifier CHECK (company_gstn IS NOT NULL OR company_mobile IS NOT NULL)
);

CREATE INDEX idx_reputation_gstn ON company_reputation(company_gstn) WHERE company_gstn IS NOT NULL;
CREATE INDEX idx_reputation_mobile ON company_reputation(company_mobile) WHERE company_mobile IS NOT NULL;
CREATE INDEX idx_reputation_score ON company_reputation(reputation_score);
CREATE INDEX idx_reputation_risk ON company_reputation(risk_level);
CREATE INDEX idx_reputation_updated ON company_reputation(updated_at DESC);

-- Trigger to update reputation when incidents change
CREATE OR REPLACE FUNCTION update_company_reputation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reputation record based on incident changes
  -- This will be implemented in the backend service
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Testing**:
- [ ] Reputation records created for each company
- [ ] Aggregation queries are fast
- [ ] Score calculation is accurate
- [ ] Can handle companies with no GSTN
- [ ] Updates automatically on incident changes

**Deliverables**:
- Migration script
- Reputation calculation service (backend)
- Algorithm documentation
- Test cases

---

### Day 5: Privacy Middleware & Authentication

**Goal**: Implement backend middleware for privacy controls

**Tasks** (3-4 hours):
1. Create audit logging middleware
2. Create rate limiting middleware
3. Create authentication checks
4. Add input validation
5. Test all middleware

**Code** (`backend/src/middleware/privacy.middleware.ts`):
```typescript
import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

// Audit logging middleware
export async function auditSearch(req: Request, res: Response, next: NextFunction) {
  const { gstn, mobile } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    await pool.query(`
      INSERT INTO search_audit_log 
      (user_id, searched_gstn, searched_mobile, search_type, ip_address, user_agent, session_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      userId,
      gstn || null,
      mobile || null,
      gstn && mobile ? 'combined' : gstn ? 'gstn' : 'mobile',
      req.ip,
      req.get('User-Agent'),
      req.session?.id || null
    ]);
    
    next();
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't block request if logging fails
    next();
  }
}

// Rate limiting middleware
export async function checkRateLimit(
  actionType: string,
  limit: number,
  windowMinutes: number = 60
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);
      
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM user_rate_limits
        WHERE user_id = $1 
        AND action_type = $2 
        AND window_end > $3
      `, [userId, actionType, windowStart]);
      
      const count = parseInt(result.rows[0].count);
      
      if (count >= limit) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          limit,
          windowMinutes,
          retryAfter: windowMinutes * 60
        });
      }
      
      // Record this action
      await pool.query(`
        INSERT INTO user_rate_limits 
        (user_id, action_type, action_count, window_start, window_end)
        VALUES ($1, $2, 1, NOW(), NOW() + INTERVAL '${windowMinutes} minutes')
        ON CONFLICT (user_id, action_type, window_start)
        DO UPDATE SET action_count = user_rate_limits.action_count + 1
      `, [userId, actionType]);
      
      next();
    } catch (error) {
      console.error('Rate limiting check failed:', error);
      return res.status(500).json({ error: 'Rate limiting check failed' });
    }
  };
}

// Validate search input
export function validateSearchInput(req: Request, res: Response, next: NextFunction) {
  const { gstn, mobile } = req.params;
  
  if (!gstn && !mobile) {
    return res.status(400).json({
      error: 'Either GSTN or mobile number is required for search'
    });
  }
  
  if (gstn && !isValidGSTN(gstn)) {
    return res.status(400).json({
      error: 'Invalid GSTN format. Must be 15 characters.'
    });
  }
  
  if (mobile && !isValidMobile(mobile)) {
    return res.status(400).json({
      error: 'Invalid mobile number format.'
    });
  }
  
  next();
}

function isValidGSTN(gstn: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstn);
}

function isValidMobile(mobile: string): boolean {
  // Indian mobile: 10 digits starting with 6-9
  // Or E.164 format
  return /^[6-9]\d{9}$/.test(mobile) || /^\+[1-9]\d{1,14}$/.test(mobile);
}
```

**Testing**:
- [ ] Audit logging captures all searches
- [ ] Rate limiting blocks excessive requests
- [ ] Input validation rejects invalid formats
- [ ] Performance is fast (<5ms overhead)
- [ ] Error handling is robust

**Deliverables**:
- Privacy middleware module
- Rate limiting configuration
- Input validation utilities
- Unit tests for middleware

---

### Days 6-7: Testing & Documentation

**Goal**: Comprehensive testing of Phase 1 and documentation

**Day 6 Tasks** (3-4 hours):
1. Write unit tests for all new tables
2. Test database migrations (up and down)
3. Test privacy middleware
4. Test rate limiting
5. Test audit logging

**Day 7 Tasks** (3-4 hours):
1. Update API documentation
2. Update ARCHITECTURE.md
3. Update DATA_PRIVACY_POLICY.md
4. Write deployment guide
5. Create admin documentation

**Testing Checklist**:
- [ ] All migrations run successfully
- [ ] All tables have proper indexes
- [ ] All foreign keys work
- [ ] Cascade deletes work correctly
- [ ] Audit logging is comprehensive
- [ ] Rate limiting is enforced
- [ ] Input validation catches errors
- [ ] Performance is acceptable
- [ ] Security checks pass
- [ ] Documentation is complete

**Deliverables**:
- Test suite with 50+ tests
- Updated documentation (4 files)
- Deployment guide
- Performance benchmarks

---

### Days 8-10: Security Audit & Optimization

**Day 8**: SQL injection prevention
**Day 9**: Performance optimization
**Day 10**: Security review and fixes

**Security Checklist**:
- [ ] All queries use parameterized statements
- [ ] No raw SQL with user input
- [ ] All inputs validated
- [ ] All outputs sanitized
- [ ] Rate limiting enforced
- [ ] Authentication required
- [ ] Audit logging complete
- [ ] Error messages don't reveal system details
- [ ] Database permissions minimal
- [ ] Indexes optimized

**Performance Targets**:
- Search query: <50ms
- Audit log insert: <10ms
- Rate limit check: <5ms
- Reputation calculation: <100ms

**Deliverables**:
- Security audit report
- Performance benchmarks
- Optimization recommendations
- Phase 1 completion report

---

## Phase 2: Incident Reporting API (Days 11-15)

### Day 11: Incident Repository

**Goal**: Create database access layer for incidents

**Tasks** (3-4 hours):
1. Create incident repository class
2. Implement CRUD operations
3. Add search methods
4. Write unit tests
5. Document API

**Code** (`backend/src/repositories/incident.repository.ts`):
```typescript
import { pool } from '../config/database';
import { Incident, IncidentCreateInput, IncidentUpdateInput } from '../models/Incident';

export class IncidentRepository {
  async create(data: IncidentCreateInput): Promise<Incident> {
    const result = await pool.query(`
      INSERT INTO incidents (
        reporter_id, company_gstn, company_mobile, company_name,
        incident_type, incident_date, amount_involved, currency,
        description, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      data.reporter_id,
      data.company_gstn,
      data.company_mobile,
      data.company_name,
      data.incident_type,
      data.incident_date,
      data.amount_involved,
      data.currency || 'INR',
      data.description,
      data.severity || 'medium'
    ]);
    
    return result.rows[0];
  }
  
  async findById(id: number): Promise<Incident | null> {
    const result = await pool.query(
      'SELECT * FROM incidents WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
  
  async findByGSTN(gstn: string): Promise<Incident[]> {
    const result = await pool.query(`
      SELECT i.*, u.username as reporter_username
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      WHERE i.company_gstn = $1
      ORDER BY i.created_at DESC
    `, [gstn]);
    return result.rows;
  }
  
  async findByMobile(mobile: string): Promise<Incident[]> {
    const result = await pool.query(`
      SELECT i.*, u.username as reporter_username
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      WHERE i.company_mobile = $1
      ORDER BY i.created_at DESC
    `, [mobile]);
    return result.rows;
  }
  
  async update(id: number, data: IncidentUpdateInput): Promise<Incident | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const result = await pool.query(`
      UPDATE incidents
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    
    return result.rows[0] || null;
  }
  
  async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM incidents WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
  
  async getStatsByCompany(gstn?: string, mobile?: string): Promise<any> {
    let query = `
      SELECT 
        COUNT(*) as total_incidents,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_incidents,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_incidents,
        COUNT(*) FILTER (WHERE status = 'disputed') as disputed_incidents,
        SUM(amount_involved) as total_amount_involved,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_resolution_days
      FROM incidents
      WHERE 1=1
    `;
    
    const params: any[] = [];
    if (gstn) {
      params.push(gstn);
      query += ` AND company_gstn = $${params.length}`;
    }
    if (mobile) {
      params.push(mobile);
      query += ` AND company_mobile = $${params.length}`;
    }
    
    const result = await pool.query(query, params);
    return result.rows[0];
  }
}

export const incidentRepository = new IncidentRepository();
```

**Testing**:
- [ ] Can create incidents
- [ ] Can find by ID
- [ ] Can search by GSTN
- [ ] Can search by mobile
- [ ] Can update incidents
- [ ] Can delete incidents
- [ ] Statistics are accurate
- [ ] Handles null values correctly

**Deliverables**:
- Repository module
- Unit tests (15+ tests)
- API documentation

---

### Day 12: Incident Service Layer

**Goal**: Implement business logic for incident management

**Tasks** (3-4 hours):
1. Create incident service
2. Add validation logic
3. Implement moderation queue
4. Add notification triggers
5. Write tests

**Code** (`backend/src/services/incident.service.ts`):
```typescript
import { incidentRepository } from '../repositories/incident.repository';
import { emailService } from './email.service';
import { Incident, IncidentCreateInput } from '../models/Incident';

export class IncidentService {
  async submitIncident(data: IncidentCreateInput, userId: number): Promise<Incident> {
    // Validate input
    this.validateIncidentData(data);
    
    // Add reporter
    data.reporter_id = userId;
    
    // Create incident
    const incident = await incidentRepository.create(data);
    
    // Queue for moderation
    await this.queueForModeration(incident.id);
    
    // Send confirmation email
    await emailService.sendIncidentConfirmation(userId, incident.id);
    
    // Update company reputation (async)
    this.updateCompanyReputation(data.company_gstn, data.company_mobile).catch(console.error);
    
    return incident;
  }
  
  async searchByGSTN(gstn: string, userId: number): Promise<Incident[]> {
    // Validate GSTN format
    if (!this.isValidGSTN(gstn)) {
      throw new Error('Invalid GSTN format');
    }
    
    // Log search (audit trail handled by middleware)
    
    // Get incidents
    const incidents = await incidentRepository.findByGSTN(gstn);
    
    // Filter based on privacy settings
    return incidents.filter(i => i.is_public || i.reporter_id === userId);
  }
  
  async searchByMobile(mobile: string, userId: number): Promise<Incident[]> {
    // Validate mobile format
    if (!this.isValidMobile(mobile)) {
      throw new Error('Invalid mobile number format');
    }
    
    // Get incidents
    const incidents = await incidentRepository.findByMobile(mobile);
    
    // Filter based on privacy settings
    return incidents.filter(i => i.is_public || i.reporter_id === userId);
  }
  
  async updateStatus(incidentId: number, status: string, userId: number): Promise<Incident> {
    const incident = await incidentRepository.findById(incidentId);
    
    if (!incident) {
      throw new Error('Incident not found');
    }
    
    // Check permissions
    if (incident.reporter_id !== userId) {
      throw new Error('Unauthorized');
    }
    
    // Update status
    const updated = await incidentRepository.update(incidentId, { status });
    
    if (!updated) {
      throw new Error('Update failed');
    }
    
    // Send notification if status changed to resolved
    if (status === 'resolved') {
      await emailService.sendIncidentResolved(incident.reporter_id, incidentId);
    }
    
    return updated;
  }
  
  private validateIncidentData(data: IncidentCreateInput): void {
    if (!data.company_gstn && !data.company_mobile) {
      throw new Error('Either GSTN or mobile number is required');
    }
    
    if (!data.company_name || data.company_name.trim().length < 2) {
      throw new Error('Company name is required');
    }
    
    if (!data.description || data.description.trim().length < 20) {
      throw new Error('Description must be at least 20 characters');
    }
    
    if (!['payment_default', 'fraud', 'quality_issue', 'contract_breach', 'communication_issue'].includes(data.incident_type)) {
      throw new Error('Invalid incident type');
    }
  }
  
  private async queueForModeration(incidentId: number): Promise<void> {
    // Add to moderation queue (implement later)
    console.log(`Incident ${incidentId} queued for moderation`);
  }
  
  private async updateCompanyReputation(gstn?: string, mobile?: string): Promise<void> {
    // Calculate and update company reputation (implement later)
    console.log(`Updating reputation for GSTN: ${gstn}, Mobile: ${mobile}`);
  }
  
  private isValidGSTN(gstn: string): boolean {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstn);
  }
  
  private isValidMobile(mobile: string): boolean {
    return /^[6-9]\d{9}$/.test(mobile) || /^\+[1-9]\d{1,14}$/.test(mobile);
  }
}

export const incidentService = new IncidentService();
```

**Testing**:
- [ ] Validation catches invalid data
- [ ] Incidents are created correctly
- [ ] Search returns correct results
- [ ] Privacy filters work
- [ ] Status updates work
- [ ] Notifications are sent
- [ ] Errors are handled gracefully

**Deliverables**:
- Service module
- Unit tests (20+ tests)
- Integration tests (5+ tests)

---

### Day 13: Incident API Endpoints

**Goal**: Create REST API endpoints for incident management

**Tasks** (3-4 hours):
1. Create incident controller
2. Add API routes
3. Wire up middleware
4. Test endpoints
5. Document API

**Code** (`backend/src/controllers/incident.controller.ts`):
```typescript
import { Request, Response } from 'express';
import { incidentService } from '../services/incident.service';

export class IncidentController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const incident = await incidentService.submitIncident(req.body, userId);
      
      res.status(201).json({
        success: true,
        message: 'Incident submitted successfully. It will be reviewed shortly.',
        data: incident
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async searchByGSTN(req: Request, res: Response): Promise<void> {
    try {
      const { gstn } = req.params;
      const userId = req.user!.id;
      
      const incidents = await incidentService.searchByGSTN(gstn, userId);
      
      res.json({
        success: true,
        count: incidents.length,
        data: incidents
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async searchByMobile(req: Request, res: Response): Promise<void> {
    try {
      const { mobile } = req.params;
      const userId = req.user!.id;
      
      const incidents = await incidentService.searchByMobile(mobile, userId);
      
      res.json({
        success: true,
        count: incidents.length,
        data: incidents
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const incident = await incidentService.getById(parseInt(id), userId);
      
      if (!incident) {
        res.status(404).json({
          success: false,
          error: 'Incident not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: incident
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.id;
      
      const incident = await incidentService.updateStatus(parseInt(id), status, userId);
      
      res.json({
        success: true,
        message: 'Incident status updated',
        data: incident
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const incidentController = new IncidentController();
```

**Routes** (`backend/src/routes/incident.routes.ts`):
```typescript
import { Router } from 'express';
import { incidentController } from '../controllers/incident.controller';
import { authenticate } from '../middleware/auth.middleware';
import { auditSearch, checkRateLimit, validateSearchInput } from '../middleware/privacy.middleware';

const router = Router();

/**
 * @swagger
 * /api/incidents:
 *   post:
 *     summary: Submit a new incident report
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - incident_type
 *               - incident_date
 *               - description
 *             properties:
 *               company_gstn:
 *                 type: string
 *               company_mobile:
 *                 type: string
 *               company_name:
 *                 type: string
 *               incident_type:
 *                 type: string
 *                 enum: [payment_default, fraud, quality_issue, contract_breach, communication_issue]
 *               incident_date:
 *                 type: string
 *                 format: date
 *               amount_involved:
 *                 type: number
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       201:
 *         description: Incident submitted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/', 
  authenticate,
  checkRateLimit('submit_incident', 10, 1440), // 10 per day
  incidentController.create
);

/**
 * @swagger
 * /api/incidents/search/gstn/{gstn}:
 *   get:
 *     summary: Search incidents by GSTN (gated search)
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gstn
 *         required: true
 *         schema:
 *           type: string
 *         description: 15-character GSTN
 *     responses:
 *       200:
 *         description: List of incidents
 *       400:
 *         description: Invalid GSTN
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded (50 searches/day)
 */
router.get('/search/gstn/:gstn',
  authenticate,
  validateSearchInput,
  checkRateLimit('search_gstn', 50, 1440), // 50 per day
  auditSearch,
  incidentController.searchByGSTN
);

/**
 * @swagger
 * /api/incidents/search/mobile/{mobile}:
 *   get:
 *     summary: Search incidents by mobile number (gated search)
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mobile
 *         required: true
 *         schema:
 *           type: string
 *         description: 10-digit mobile number
 *     responses:
 *       200:
 *         description: List of incidents
 *       400:
 *         description: Invalid mobile number
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded (50 searches/day)
 */
router.get('/search/mobile/:mobile',
  authenticate,
  validateSearchInput,
  checkRateLimit('search_mobile', 50, 1440), // 50 per day
  auditSearch,
  incidentController.searchByMobile
);

/**
 * @swagger
 * /api/incidents/{id}:
 *   get:
 *     summary: Get incident details by ID
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incident details
 *       404:
 *         description: Incident not found
 */
router.get('/:id',
  authenticate,
  incidentController.getById
);

/**
 * @swagger
 * /api/incidents/{id}/status:
 *   patch:
 *     summary: Update incident status
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, verified, resolved, disputed, rejected]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/status',
  authenticate,
  incidentController.updateStatus
);

export default router;
```

**Testing**:
- [ ] POST /api/incidents creates incident
- [ ] GET /api/incidents/search/gstn/:gstn returns incidents
- [ ] GET /api/incidents/search/mobile/:mobile returns incidents
- [ ] Rate limiting works on all endpoints
- [ ] Audit logging captures searches
- [ ] Authentication required
- [ ] Validation rejects invalid input

**Deliverables**:
- Controller module
- Routes module
- Updated index.ts with new routes
- API documentation updated
- Integration tests (10+ tests)

---

### Days 14-15: Evidence Upload & Testing

**Day 14**: File upload system
**Day 15**: Complete testing and documentation

**Features to implement**:
- [ ] File upload endpoint
- [ ] Storage configuration (S3 or local)
- [ ] File validation (type, size)
- [ ] Evidence linking to incidents
- [ ] Thumbnail generation
- [ ] Secure file access
- [ ] Delete capability

**Deliverables**:
- Evidence upload API
- File storage service
- Complete test suite (30+ tests)
- Updated documentation
- Phase 2 completion report

---

## Phase 3: Gated Search Frontend (Days 16-20)

*Detailed day-by-day tasks continue for Phases 3-7...*

---

## Phase 4: Reputation System (Days 21-25)
## Phase 5: Frontend Integration (Days 26-30)
## Phase 6: Response & Resolution (Days 31-35)
## Phase 7: Launch Preparation (Days 36-40)

---

## Daily Routine

### Morning (2 hours)
1. Review previous day's work
2. Check for any issues
3. Plan today's tasks
4. Start coding

### Afternoon (2 hours)
1. Complete main tasks
2. Write tests
3. Update documentation
4. Commit progress

### Evening (1 hour)
1. Review code
2. Run security checks
3. Update task list
4. Prepare for tomorrow

### Friday (3-4 hours)
1. Weekly review
2. Demo progress
3. Update roadmap
4. Security audit
5. Documentation review
6. Plan next week

---

## Progress Tracking

### Daily Report Template
```
Date: [DATE]
Phase: [PHASE] - Day [N]

✅ Completed:
- Task 1
- Task 2
- Task 3

🔄 In Progress:
- Task 4

⏳ Pending:
- Task 5
- Task 6

🐛 Issues Found:
- Issue 1 (resolved/pending)

🔒 Security:
- Checks passed: X/Y
- Vulnerabilities: 0

📝 Documentation:
- Files updated: X

⏱️ Time Spent: X hours

📊 Overall Progress: X%
```

### Weekly Review Template
```
Week: [N]
Phase: [PHASE]

Summary:
[Brief overview of week's accomplishments]

Completed Features:
- Feature 1
- Feature 2

Tests Added: X
Documentation Updated: Y pages
Security Score: 100%

Blockers:
- None / [List blockers]

Next Week Plan:
- Focus area 1
- Focus area 2

Estimated Completion: X%
```

---

## Success Metrics

### Phase Completion Criteria

**Phase 1**: 
- [ ] All database tables created
- [ ] Privacy middleware functional
- [ ] 50+ tests passing
- [ ] Security audit 100%

**Phase 2**:
- [ ] Incident API complete
- [ ] Evidence upload working
- [ ] 30+ new tests
- [ ] API documented

**Phase 3**:
- [ ] Gated search UI built
- [ ] Search audit working
- [ ] Rate limiting enforced
- [ ] User testing positive

**Phases 4-7**: Similar criteria for each phase

### Overall Success Metrics
- **Zero vulnerabilities** in security audit
- **90%+ test coverage** on critical paths
- **<100ms response time** on search
- **100% uptime** during beta
- **Positive feedback** from 80% of beta users

---

## Notes

- This plan is **flexible** - adjust as needed
- **Quality over quantity** - it's okay to take more time
- **Ask questions** if anything is unclear
- **Security first** - never compromise on security
- **Test thoroughly** - catch issues early
- **Document everything** - help future maintainers

**Remember**: Building a secure, reliable platform takes time. There's no rush to launch before it's ready!
