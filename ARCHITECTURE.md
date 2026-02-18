# Foodlobbyin Architecture Documentation

**Last Updated**: February 17, 2026  
**Status**: Development (MVP Phase)

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FOODLOBBYIN                             │
│              B2B Market Insights Platform                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │  HTTP   │   Backend    │  SQL    │  PostgreSQL  │
│ React + TS   │◄────────│ Express + TS │◄────────│   Database   │
│   (Vite)     │  REST   │    (Node)    │         │   (Docker)   │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │
       │                        │
       ▼                        ▼
┌──────────────┐         ┌──────────────┐
│   Tailwind   │         │   Swagger    │
│     CSS      │         │     UI       │
│   Recharts   │         │   OpenAPI    │
└──────────────┘         └──────────────┘
```

---

## 📦 Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **Language**: TypeScript 4.9.0
- **Build Tool**: Vite 4.4.9
- **Styling**: Tailwind CSS 3.3.0
- **Charts**: Recharts 2.10.3
- **Icons**: Lucide React 0.294.0
- **Routing**: React Router 6.16.0
- **HTTP Client**: Axios 1.5.0

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 4.18.2
- **Language**: TypeScript 5.2.2
- **Database**: PostgreSQL 15
- **ORM/Query**: node-postgres (pg)
- **Authentication**: JWT (jsonwebtoken)
- **Password**: bcrypt
- **Validation**: Custom validation service
- **Email**: nodemailer
- **Documentation**: Swagger (swagger-jsdoc, swagger-ui-express)
- **Security**: express-rate-limit, reCAPTCHA v3

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15 (official image)
- **DB Admin**: pgAdmin 4
- **Reverse Proxy**: None (TODO: Nginx)
- **Process Manager**: None (TODO: PM2)

### Development
- **Monorepo**: npm workspaces
- **Package Manager**: npm
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Jest (backend), Vitest (frontend)
- **Version Control**: Git + GitHub

---

## 🗂️ Project Structure

```
foodlobbyin/
├── backend/                      # Backend API
│   ├── src/
│   │   ├── __tests__/           # Unit tests
│   │   │   └── services/        # Service tests
│   │   ├── config/              # Configuration
│   │   │   ├── database.ts      # Database connection
│   │   │   └── swagger.ts       # OpenAPI config
│   │   ├── controllers/         # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── secure-auth.controller.ts
│   │   │   ├── referral.controller.ts
│   │   │   ├── company.controller.ts
│   │   │   └── invoice.controller.ts
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   └── rateLimiter.ts
│   │   ├── models/              # TypeScript interfaces
│   │   │   ├── User.ts
│   │   │   ├── Company.ts
│   │   │   ├── Invoice.ts
│   │   │   ├── Referral.ts
│   │   │   └── Attempt.ts
│   │   ├── repositories/        # Database layer
│   │   │   ├── user.repository.ts
│   │   │   ├── company.repository.ts
│   │   │   ├── invoice.repository.ts
│   │   │   ├── referral.repository.ts
│   │   │   └── attempt.repository.ts
│   │   ├── routes/              # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── secure-auth.routes.ts
│   │   │   ├── referral.routes.ts
│   │   │   ├── company.routes.ts
│   │   │   ├── invoice.routes.ts
│   │   │   └── insights.routes.ts
│   │   ├── services/            # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── secure-auth.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── otp.service.ts
│   │   │   ├── validation.service.ts
│   │   │   ├── captcha.service.ts
│   │   │   ├── referral.service.ts
│   │   │   ├── company.service.ts
│   │   │   └── invoice.service.ts
│   │   ├── index.ts             # App entry point
│   │   └── setupTests.ts        # Test setup
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── __tests__/           # Frontend tests
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── services/
│   │   ├── components/
│   │   │   ├── app/             # App-specific components
│   │   │   │   ├── DashboardKPIs.tsx
│   │   │   │   ├── SearchPanel.tsx
│   │   │   │   ├── SubmitDataForm.tsx
│   │   │   │   ├── ForumSection.tsx
│   │   │   │   ├── ForumTopicList.tsx
│   │   │   │   ├── ForumTopicDetail.tsx
│   │   │   │   ├── CreateTopicModal.tsx
│   │   │   │   └── SearchSubmitSection.tsx
│   │   │   ├── ui/              # Design system components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   └── LoadingSpinner.tsx
│   │   │   ├── Layout.tsx       # Main layout (legacy)
│   │   │   ├── Navigation.tsx   # Main nav (legacy)
│   │   │   ├── PublicLayout.tsx # Public pages layout
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Global auth state
│   │   ├── pages/
│   │   │   ├── Homepage.tsx     # Marketing page
│   │   │   ├── NewsPage.tsx     # News & updates
│   │   │   ├── LoginPage.tsx    # Login (dual mode)
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   ├── VerifyEmailPage.tsx
│   │   │   ├── AppShell.tsx     # Main app container
│   │   │   ├── Dashboard.tsx    # Dashboard (legacy)
│   │   │   ├── CompanyProfile.tsx
│   │   │   ├── InvoiceList.tsx
│   │   │   └── InsightsPage.tsx
│   │   ├── services/            # API clients
│   │   │   ├── api.ts           # Axios config
│   │   │   ├── authService.ts
│   │   │   ├── companyService.ts
│   │   │   ├── invoiceService.ts
│   │   │   ├── insightsService.ts (mock)
│   │   │   └── forumService.ts    (mock)
│   │   ├── App.tsx              # Root component
│   │   ├── index.tsx            # Entry point
│   │   ├── index.css            # Global styles
│   │   └── vite-env.d.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── vitest.config.ts
│
├── infrastructure/               # DevOps & DB
│   ├── db/
│   │   ├── init.sql             # Initial schema
│   │   ├── migrate.sh           # Migration runner
│   │   ├── seed.sh              # Seed data runner
│   │   ├── seed.sql             # Sample data
│   │   └── migrations/
│   │       ├── 001_add_auth_features.sql
│   │       └── 002_add_referral_system.sql
│   ├── docker-compose.yml       # Container orchestration
│   └── .env.example             # Environment template
│
├── .gitignore
├── .editorconfig
├── .eslintrc.json
├── .prettierrc.json
├── package.json                  # Workspace root
├── tsconfig.json
│
└── Documentation/
    ├── README.md
    ├── API_DOCUMENTATION.md
    ├── AUTHENTICATION.md
    ├── SECURE_REGISTRATION_API.md
    ├── FRONTEND_IMPLEMENTATION.md
    ├── TESTING_GUIDE.md
    ├── AUDIT_REPORT.md
    ├── PROJECT_ASSESSMENT.md
    └── ARCHITECTURE.md (this file)
```

---

## 🔄 Request Flow

### 1. User Registration Flow

```
┌─────────┐    1. POST /api/secure-auth/register     ┌──────────┐
│ Browser │──────────────────────────────────────────►│  Express │
│         │                                           │  Server  │
└─────────┘                                           └──────────┘
                                                           │
                                                           ▼
                      ┌────────────────────────────────────────────┐
                      │ SecureAuthController.register()            │
                      │  - Validate inputs (email, phone, GSTN)    │
                      │  - Check referral code                     │
                      │  - Verify reCAPTCHA                        │
                      └────────────────────────────────────────────┘
                                            │
                                            ▼
                      ┌────────────────────────────────────────────┐
                      │ SecureAuthService.register()               │
                      │  - Hash password (bcrypt)                  │
                      │  - Begin DB transaction                    │
                      │  - Create user (account_activated=false)   │
                      │  - Increment referral used_count           │
                      │  - Log registration attempt                │
                      │  - Commit transaction                      │
                      └────────────────────────────────────────────┘
                                            │
                                            ▼
                      ┌────────────────────────────────────────────┐
                      │ OTPService.generateAndSend()               │
                      │  - Generate 6-digit OTP                    │
                      │  - Save to users.email_otp                 │
                      │  - Set expiry (10 minutes)                 │
                      │  - Send email via EmailService             │
                      └────────────────────────────────────────────┘
                                            │
                                            ▼
                      ┌────────────────────────────────────────────┐
                      │ PostgreSQL Database                        │
                      │  - users table                             │
                      │  - referrals table                         │
                      │  - registration_attempts table             │
                      └────────────────────────────────────────────┘
```

### 2. Dashboard Data Flow

```
┌─────────┐    1. GET /api/insights         ┌──────────┐
│ Browser │─────────────────────────────────►│  Express │
│         │    + JWT Token in header        │  Server  │
└─────────┘                                  └──────────┘
                                                  │
                                                  ▼
                   ┌──────────────────────────────────────────┐
                   │ AuthMiddleware.authenticate()            │
                   │  - Verify JWT token                      │
                   │  - Extract user ID                       │
                   └──────────────────────────────────────────┘
                                                  │
                                                  ▼
                   ┌──────────────────────────────────────────┐
                   │ InsightsController.getMarketInsights()   │
                   │  - Parse query params (industry filter)  │
                   └──────────────────────────────────────────┘
                                                  │
                                                  ▼
                   ┌──────────────────────────────────────────┐
                   │ InsightsService.getAggregatedData()      │
                   │  - Query company_profiles (GROUP BY)     │
                   │  - Query invoices (SUM, COUNT)           │
                   │  - Calculate averages, trends            │
                   │  - Anonymize sensitive data              │
                   └──────────────────────────────────────────┘
                                                  │
                                                  ▼
                   ┌──────────────────────────────────────────┐
                   │ PostgreSQL Database                      │
                   │  - Aggregation queries                   │
                   │  - Join tables                           │
                   │  - Return anonymous stats                │
                   └──────────────────────────────────────────┘
```

### 3. Authentication Flow

```
User enters credentials
        │
        ▼
POST /api/auth/login
        │
        ▼
AuthController.login()
        │
        ▼
AuthService.login()
        │
        ├─► UserRepository.findByUsername()
        │   └─► PostgreSQL
        │
        ├─► bcrypt.compare(password, hash)
        │
        └─► jwt.sign({ userId, email }, secret, { expiresIn: '7d' })
                │
                ▼
        Return { token, user }
                │
                ▼
        Frontend stores token
                │
                ▼
        Future requests include:
        Authorization: Bearer <token>
```

---

## 🗄️ Database Schema

### Current Tables (3)

#### users
```sql
id                          SERIAL PRIMARY KEY
username                    VARCHAR(255) UNIQUE NOT NULL
mobile_number               VARCHAR(20) UNIQUE
phone_number                VARCHAR(20)
email                       VARCHAR(255) UNIQUE NOT NULL
password_hash               VARCHAR(255)
first_name                  VARCHAR(100)
last_name                   VARCHAR(100)
gstn                        VARCHAR(15)
email_verified              BOOLEAN DEFAULT FALSE
account_activated           BOOLEAN DEFAULT FALSE
email_verification_token    VARCHAR(255)
email_verification_expires  TIMESTAMP
password_reset_token        VARCHAR(255)
password_reset_expires      TIMESTAMP
email_otp                   VARCHAR(10)
email_otp_expires           TIMESTAMP
otp_generation_count        INTEGER DEFAULT 0
otp_verification_count      INTEGER DEFAULT 0
otp_last_generated_at       TIMESTAMP
otp_last_verified_at        TIMESTAMP
created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### company_profiles
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE
company_name    VARCHAR(255) NOT NULL
industry        VARCHAR(100)
revenue         DECIMAL(15, 2)
employees       INTEGER
address         TEXT
city            VARCHAR(100)
country         VARCHAR(100)
website         VARCHAR(255)
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### invoices
```sql
id              SERIAL PRIMARY KEY
company_id      INTEGER REFERENCES company_profiles(id) ON DELETE CASCADE
invoice_number  VARCHAR(50) UNIQUE NOT NULL
amount          DECIMAL(15, 2) NOT NULL
issue_date      DATE NOT NULL
due_date        DATE NOT NULL
status          VARCHAR(20) DEFAULT 'pending'
category        VARCHAR(50)
description     TEXT
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Missing Tables (4)

#### referrals (⚠️ In migration but not in init.sql)
```sql
id                      SERIAL PRIMARY KEY
code                    VARCHAR(50) UNIQUE NOT NULL
created_by_user_id      INTEGER REFERENCES users(id)
max_uses                INTEGER DEFAULT 10
used_count              INTEGER DEFAULT 0
expires_at              TIMESTAMP
allowed_email_domain    VARCHAR(255)
is_active               BOOLEAN DEFAULT TRUE
created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### registration_attempts (❌ Not implemented)
```sql
id              SERIAL PRIMARY KEY
email           VARCHAR(255)
ip_address      VARCHAR(45)
user_agent      TEXT
referral_code   VARCHAR(50)
success         BOOLEAN
error_message   TEXT
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### otp_attempts (❌ Not implemented)
```sql
id          SERIAL PRIMARY KEY
email       VARCHAR(255)
ip_address  VARCHAR(45)
otp_type    VARCHAR(20)  -- 'generation' or 'verification'
success     BOOLEAN
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### forum_topics (❌ Not implemented)
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER REFERENCES users(id)
category_id     INTEGER REFERENCES forum_categories(id)
title           VARCHAR(255) NOT NULL
content         TEXT NOT NULL
view_count      INTEGER DEFAULT 0
reply_count     INTEGER DEFAULT 0
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## 🔐 Security Architecture

### Authentication
- **JWT Tokens**: 7-day expiry, HS256 algorithm
- **Password Hashing**: bcrypt with cost factor 12
- **Token Storage**: localStorage (client), no server storage

### Authorization
- **Middleware**: JWT verification on protected routes
- **User Context**: Extracted from token, injected into request

### Rate Limiting
- **Auth Endpoints**: 5 requests / 15 minutes per IP
- **OTP Endpoints**: 10 requests / 15 minutes per IP
- **Create Endpoints**: 10 requests / minute per IP
- **General API**: 100 requests / 15 minutes per IP

### Input Validation
- **Email**: RFC 5322 compliant regex
- **Phone**: Indian 10-digit or E.164 format
- **GSTN**: 15-character format with Luhn checksum
- **Password**: 8+ chars, 3/4 character types, no common passwords

### Bot Protection
- **reCAPTCHA v3**: On registration, OTP request, OTP verification
- **Threshold**: 0.5 (configurable)

### Security Headers
- ⚠️ **Missing**: helmet.js not configured
- ⚠️ **Missing**: CORS not configured for production

---

## 📡 API Endpoints

### Authentication (8 endpoints)

```
POST   /api/auth/register              Register new user
POST   /api/auth/login                 Login with username/password
POST   /api/auth/request-email-otp     Request OTP for email
POST   /api/auth/login-with-otp        Login with email OTP
POST   /api/auth/verify-email          Verify email with token
POST   /api/auth/request-password-reset Request password reset
POST   /api/auth/reset-password        Reset password with token
GET    /api/auth/profile               Get user profile (protected)
```

### Secure Auth (5 endpoints)

```
POST   /api/secure-auth/register       Enhanced registration with referral
POST   /api/secure-auth/verify-otp     Verify OTP and activate account
POST   /api/secure-auth/request-otp    Request new OTP
POST   /api/secure-auth/login          Login with activation check
GET    /api/secure-auth/profile        Get profile (protected)
```

### Referrals (6 endpoints)

```
POST   /api/referrals/validate         Validate referral code (public)
POST   /api/referrals                  Create referral code (protected)
GET    /api/referrals/my-referrals     List user's referrals
GET    /api/referrals/:code/stats      Get referral usage stats
PATCH  /api/referrals/:id/activate     Activate referral
PATCH  /api/referrals/:id/deactivate   Deactivate referral
```

### Company (4 endpoints)

```
GET    /api/company                    List user's companies
POST   /api/company                    Create company profile
GET    /api/company/:id                Get company by ID
PUT    /api/company/:id                Update company
```

### Invoices (5 endpoints)

```
GET    /api/invoices                   List user's invoices
POST   /api/invoices                   Create invoice
GET    /api/invoices/:id               Get invoice by ID
PUT    /api/invoices/:id               Update invoice
DELETE /api/invoices/:id               Delete invoice
```

### Insights (1 endpoint)

```
GET    /api/insights                   Get market insights (⚠️ Not implemented)
```

### Health (1 endpoint)

```
GET    /api/health                     API health check
```

---

## 🧪 Testing Strategy

### Current State
- **Backend Tests**: 18 tests (validation service only)
- **Frontend Tests**: 0 tests
- **Integration Tests**: 0 tests
- **E2E Tests**: 0 tests
- **Coverage**: <5%

### Target State
- **Backend Tests**: 100+ tests (target 70% coverage)
- **Frontend Tests**: 50+ tests (target 60% coverage)
- **Integration Tests**: 30+ tests (all routes)
- **E2E Tests**: 10+ tests (critical flows)
- **Coverage**: 70%+ overall

### Test Types

#### Unit Tests
- Services (business logic)
- Utilities (validation, formatting)
- Components (UI)

#### Integration Tests
- API routes (supertest)
- Database operations
- Service interactions

#### E2E Tests
- User registration flow
- Login flow
- Company search
- Invoice submission
- Dashboard loading

---

## 🚀 Deployment Architecture (TODO)

### Current (Development)
```
Docker Compose
├── PostgreSQL (port 5432)
├── pgAdmin (port 5050)
└── API (port 5000)

Frontend Dev Server (port 3000)
```

### Target (Production)
```
                    ┌─────────────┐
                    │   Cloudflare│
                    │     CDN     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Nginx    │
                    │ Reverse Proxy│
                    └──────┬──────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
          ┌─────▼────┐ ┌──▼──────┐ ┌─▼─────────┐
          │ Frontend │ │ Backend │ │PostgreSQL │
          │  Static  │ │   API   │ │ (RDS/DO)  │
          │  (S3)    │ │ (EC2)   │ │           │
          └──────────┘ └─────────┘ └───────────┘
                           │
                    ┌──────┼──────┐
                    │      │      │
              ┌─────▼──┐ ┌─▼────┐ ┌▼─────┐
              │ Redis  │ │Email │ │Sentry│
              │ Cache  │ │SMTP  │ │Logs  │
              └────────┘ └──────┘ └──────┘
```

---

## 📊 Performance Considerations

### Current Bottlenecks
1. **No caching** - Every request hits database
2. **No connection pooling** - New connection per request
3. **No query optimization** - No indexes on foreign keys
4. **No CDN** - Static assets served by backend
5. **No compression** - Large JSON payloads

### Optimization Plan
1. Add Redis for caching
2. Configure pg connection pool
3. Add database indexes
4. Use CDN for static assets
5. Enable gzip compression
6. Implement pagination
7. Add query result caching
8. Lazy load frontend components

---

## 🔄 State Management

### Backend
- **Session**: Stateless (JWT in header)
- **Database**: PostgreSQL with pg client
- **Cache**: None (TODO: Redis)

### Frontend
- **Global**: AuthContext (React Context)
- **Local**: useState for component state
- **Forms**: Controlled components
- **API State**: useEffect + useState (TODO: React Query)

---

## 🌐 API Integration Patterns

### Request Pattern
```typescript
// Frontend service
export const getCompanies = async () => {
  const response = await api.get('/api/company');
  return response.data;
};

// With auth
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Error Handling
```typescript
try {
  const data = await companyService.getCompanies();
  setCompanies(data);
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
    navigate('/login');
  } else {
    setError(error.message);
  }
}
```

---

## 📝 Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/foodlobbyin

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@foodlobbyin.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# OTP
OTP_EXPIRY_MINUTES=10
MAX_OTP_GENERATION_PER_HOUR=5
MAX_OTP_VERIFICATION_ATTEMPTS=5

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
RECAPTCHA_THRESHOLD=0.5

# Server
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

---

## 🎯 Next Steps

### Immediate (This Week)
1. ✅ Complete database schema (add missing tables)
2. ✅ Implement insights API with aggregation queries
3. ✅ Connect dashboard to real backend API
4. ✅ Add 20 integration tests
5. ✅ Create this architecture document

### Short Term (2-4 Weeks)
1. Implement search functionality
2. Connect all frontend forms to backend
3. Add comprehensive testing (70% coverage)
4. Implement logging infrastructure
5. Add monitoring and health checks

### Medium Term (1-2 Months)
1. Production deployment setup
2. CI/CD pipeline
3. Performance optimization
4. Security hardening
5. User role system

### Long Term (3-6 Months)
1. Mobile app
2. Advanced analytics
3. Third-party integrations
4. Multi-language support
5. Scale to 1000+ users

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Write tests first (TDD)
3. Implement feature
4. Update documentation
5. Submit PR
6. Code review
7. Merge to main

### Code Style
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint + Prettier
- **Naming**: camelCase for functions, PascalCase for components
- **Comments**: JSDoc for public APIs
- **Commits**: Conventional commits (feat:, fix:, docs:)

---

## 📚 Additional Resources

- **Project Assessment**: See PROJECT_ASSESSMENT.md
- **API Documentation**: See API_DOCUMENTATION.md
- **Authentication Guide**: See AUTHENTICATION.md
- **Testing Guide**: See TESTING_GUIDE.md
- **Frontend Guide**: See FRONTEND_IMPLEMENTATION.md

---

**Last Updated**: February 17, 2026  
**Maintainer**: Foodlobbyin Team  
**Status**: Active Development
