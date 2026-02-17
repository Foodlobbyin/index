# API Documentation Guide

## Overview

The Foodlobbyin API provides comprehensive endpoints for managing B2B company profiles, invoices, and accessing market insights. This guide covers how to use the interactive Swagger documentation.

## 🚀 Quick Start

### Access Swagger UI

**URL**: http://localhost:5000/api-docs

The Swagger UI provides an interactive interface to:
- Browse all API endpoints
- Test endpoints directly from your browser
- View request/response schemas
- Manage JWT authentication

### OpenAPI Specification

**JSON Format**: http://localhost:5000/api-docs.json

Download the OpenAPI 3.0 specification to:
- Generate API clients in any language
- Import into Postman, Insomnia, or other tools
- Create custom documentation
- Set up automated testing

---

## 🔐 Authentication

Most endpoints require authentication via JWT (JSON Web Token).

### Getting a Token

**Option 1: Register and Login**
```bash
# Register a new user
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "mobile_number": "+1234567890"
}

# Login to get token
POST /api/auth/login
{
  "username": "john_doe",
  "password": "SecurePass123!"
}

# Response includes token
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Option 2: Email OTP Login**
```bash
# Request OTP
POST /api/auth/request-email-otp
{
  "email": "john@example.com"
}

# Login with OTP
POST /api/auth/login-with-otp
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Using the Token in Swagger

1. Click the **🔒 Authorize** button at the top right of Swagger UI
2. In the "Value" field, enter: `Bearer YOUR_TOKEN_HERE`
3. Click **Authorize**
4. Click **Close**

All subsequent requests will automatically include this token.

### Using the Token in Code

Include the token in the Authorization header:

```javascript
// JavaScript/TypeScript
fetch('http://localhost:5000/api/company', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  }
})
```

```python
# Python
import requests

headers = {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
}
response = requests.get('http://localhost:5000/api/company', headers=headers)
```

```bash
# cURL
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     http://localhost:5000/api/company
```

---

## 📚 API Endpoints Reference

### Authentication (`/api/auth`)

Legacy authentication endpoints with basic features:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login with username/password | No |
| GET | `/verify-email?token=...` | Verify email address | No |
| POST | `/request-password-reset` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| POST | `/request-email-otp` | Request OTP for login | No |
| POST | `/login-with-otp` | Login with email OTP | No |
| GET | `/profile` | Get user profile | Yes |

### Secure Auth (`/api/secure-auth`)

Enhanced authentication with referral validation and GSTN:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register with referral code | No |
| POST | `/verify-otp` | Verify OTP and activate account | No |
| POST | `/request-otp` | Request new OTP | No |
| POST | `/login` | Login (requires activated account) | No |
| GET | `/profile` | Get user profile | Yes |

**Secure Registration Requirements:**
- Valid referral code (required)
- GSTN (15-character with checksum validation)
- Phone number (Indian 10-digit or E.164 format)
- Strong password (8+ chars, 3/4 complexity types)
- reCAPTCHA token
- Email OTP verification

### Referrals (`/api/referrals`)

Manage referral codes for invite-only registration:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/validate` | Validate referral code | No |
| POST | `/` | Create new referral code | Yes |
| GET | `/my-referrals` | List your referral codes | Yes |
| GET | `/:code/stats` | Get referral statistics | Yes |
| PATCH | `/:id/activate` | Activate referral code | Yes |
| PATCH | `/:id/deactivate` | Deactivate referral code | Yes |

### Company (`/api/company`)

Manage company profiles:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create company profile | Yes |
| GET | `/` | Get your company profile | Yes |
| PUT | `/:id` | Update company profile | Yes |
| DELETE | `/:id` | Delete company profile | Yes |

### Invoices (`/api/invoices`)

Manage invoices:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create invoice | Yes |
| GET | `/` | List all invoices | Yes |
| GET | `/:id` | Get invoice by ID | Yes |
| PUT | `/:id` | Update invoice | Yes |
| DELETE | `/:id` | Delete invoice | Yes |

**Query Parameters for GET `/`:**
- `status`: Filter by status (pending, paid, overdue, cancelled)
- `category`: Filter by category

### Insights (`/api/insights`)

Get market analytics:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get market insights | No |

**Query Parameters:**
- `industry`: Filter by specific industry

### Health (`/api/health`)

API health check:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API health status | No |

---

## 📊 Data Models

### User
```typescript
{
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  mobile_number?: string;
  phone_number?: string;
  gstn?: string;  // 15-character GSTN format
  email_verified: boolean;
  account_activated: boolean;
  created_at: string;  // ISO 8601 date-time
}
```

### Company
```typescript
{
  id: number;
  user_id: number;
  name: string;
  industry: string;
  revenue?: number;
  employees?: number;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}
```

### Invoice
```typescript
{
  id: number;
  company_id: number;
  invoice_number: string;
  amount: number;
  issue_date: string;  // YYYY-MM-DD
  due_date: string;    // YYYY-MM-DD
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  category?: string;
  created_at: string;
  updated_at: string;
}
```

### Referral
```typescript
{
  id: number;
  code: string;  // e.g., "REF-ABC123XYZ"
  created_by_user_id: number;
  max_uses: number;
  used_count: number;
  expires_at: string;  // ISO 8601 date-time
  allowed_email_domain?: string;
  is_active: boolean;
  created_at: string;
}
```

### Market Insights
```typescript
{
  total_companies: number;
  average_revenue: number;
  average_employees: number;
  total_invoiced: number;
  by_industry: [
    {
      industry: string;
      count: number;
      avg_revenue: number;
      avg_employees: number;
    }
  ]
}
```

---

## 🔒 Security & Validation

### Password Requirements
- Minimum 8 characters
- Must include 3 of 4: uppercase, lowercase, numbers, special characters
- Cannot contain sequential characters (abc, 123)
- Not in common password blacklist

### GSTN Format
- Exactly 15 characters
- Format: `NNAAAAA9999A9A9A9`
  - First 2: State code (01-37)
  - Next 10: PAN number
  - Next 1: Entity number
  - Next 1: 'Z' (default)
  - Last 1: Checksum digit
- Example: `27AAPFU0939F1ZV`

### Phone Number Format
- **Indian Format**: 10 digits starting with 6-9
  - Example: `9876543210`
- **E.164 Format**: International format with country code
  - Example: `+919876543210`

### Email Format
- RFC 5322 compliant
- Maximum 254 characters
- Valid format: `user@domain.com`

---

## ⚡ Rate Limiting

To prevent abuse, the API implements rate limiting:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Auth endpoints (login, register) | 5 requests | 15 minutes |
| OTP endpoints | 10 requests | 15 minutes |
| Create endpoints (POST) | 10 requests | 1 minute |
| General API | 100 requests | 15 minutes |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1640000000
```

When rate limit is exceeded:
```json
{
  "error": "Too many requests, please try again later."
}
```

---

## 🧪 Testing with Swagger UI

### Step-by-Step Guide

1. **Open Swagger UI**
   - Navigate to http://localhost:5000/api-docs

2. **Browse Endpoints**
   - Endpoints are organized by tags (Authentication, Company, Invoices, etc.)
   - Click on a tag to expand and see all endpoints

3. **Test Public Endpoints** (No auth required)
   - Expand `/api/health` endpoint
   - Click "Try it out"
   - Click "Execute"
   - View the response

4. **Authenticate**
   - First, register or login to get a token
   - Click the 🔒 "Authorize" button
   - Enter: `Bearer YOUR_TOKEN`
   - Click "Authorize" then "Close"

5. **Test Protected Endpoints**
   - Expand any protected endpoint (has 🔒 icon)
   - Click "Try it out"
   - Fill in required fields
   - Click "Execute"
   - View response with status code and body

6. **View Schemas**
   - Scroll to bottom of page
   - Click "Schemas" section
   - View all data models (User, Company, Invoice, etc.)

### Example: Create a Company

1. Authenticate (see step 4 above)
2. Expand **Company** → **POST /api/company**
3. Click "Try it out"
4. Edit the request body:
```json
{
  "name": "My Tech Company",
  "industry": "Technology",
  "revenue": 5000000,
  "employees": 50,
  "city": "San Francisco",
  "country": "USA",
  "website": "https://mycompany.com"
}
```
5. Click "Execute"
6. View response (should be 201 Created)

---

## 📥 Importing to Other Tools

### Postman

1. Open Postman
2. Click "Import" button
3. Select "Link" tab
4. Enter: `http://localhost:5000/api-docs.json`
5. Click "Continue" and then "Import"

All endpoints will be imported with:
- Request bodies
- Headers
- Response examples

### Insomnia

1. Open Insomnia
2. Click "Create" → "Import From" → "URL"
3. Enter: `http://localhost:5000/api-docs.json`
4. Click "Fetch and Import"

### VS Code REST Client

Create a `.http` file:
```http
### Variables
@baseUrl = http://localhost:5000
@token = your_jwt_token_here

### Health Check
GET {{baseUrl}}/api/health

### Login
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!"
}

### Get Profile (requires auth)
GET {{baseUrl}}/api/auth/profile
Authorization: Bearer {{token}}
```

---

## 🛠️ Generating API Clients

### TypeScript/JavaScript

Using OpenAPI Generator:
```bash
# Install generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:5000/api-docs.json \
  -g typescript-axios \
  -o ./generated-client
```

### Python

```bash
# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:5000/api-docs.json \
  -g python \
  -o ./python-client
```

### Other Languages

OpenAPI Generator supports 40+ languages including:
- Java
- C#
- Ruby
- Go
- PHP
- Swift
- Kotlin

See: https://openapi-generator.tech/docs/generators

---

## 🐛 Troubleshooting

### "Unauthorized" Error (401)

**Cause**: Missing or invalid JWT token

**Solution**:
1. Verify you have a valid token
2. Check token hasn't expired (7-day validity)
3. Re-authenticate to get a new token
4. Ensure "Bearer " prefix in Authorization header

### "Too Many Requests" Error (429)

**Cause**: Rate limit exceeded

**Solution**:
1. Wait for the rate limit window to reset (15 minutes)
2. Reduce request frequency
3. Check `X-RateLimit-Reset` header for reset time

### "Validation Error" (400)

**Cause**: Invalid request data

**Solution**:
1. Check Swagger UI for required fields
2. Verify data types match schema
3. Review validation rules (GSTN format, phone format, etc.)
4. Check error message for specific field issues

### Swagger UI Not Loading

**Cause**: Backend not running or port conflict

**Solution**:
1. Verify backend is running: `npm run dev` in backend folder
2. Check logs for errors
3. Ensure port 5000 is not in use
4. Try accessing: http://localhost:5000/api/health

---

## 📖 Additional Resources

- **Authentication Guide**: [AUTHENTICATION.md](./AUTHENTICATION.md)
- **Secure Registration API**: [SECURE_REGISTRATION_API.md](./SECURE_REGISTRATION_API.md)
- **Testing Guide**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **OpenAPI Specification**: https://swagger.io/specification/
- **Swagger UI Documentation**: https://swagger.io/tools/swagger-ui/

---

## 💡 Tips & Best Practices

1. **Use Swagger for Exploration**: Browse endpoints before writing code
2. **Test in Swagger First**: Verify endpoints work before integration
3. **Save Your Token**: Copy JWT token for use in code
4. **Check Response Schemas**: Understand data structures returned
5. **Review Rate Limits**: Plan API calls to stay within limits
6. **Handle Errors**: Check all possible status codes
7. **Validate Input**: Follow validation rules to avoid 400 errors
8. **Keep Token Secure**: Never commit tokens to version control
9. **Monitor Health**: Check `/api/health` for API status
10. **Use Type Safety**: Generate clients for type-safe API calls

---

## 🔄 API Versioning

Current API version: **1.0.0**

The API follows semantic versioning:
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes (backward compatible)

Version information is available in:
- Swagger UI header
- OpenAPI spec (`info.version`)
- Health check endpoint response

---

## 📞 Support

For issues or questions:
- Check Swagger UI documentation
- Review error messages and status codes
- Check health endpoint: `/api/health`
- Review this documentation

---

**Last Updated**: 2024
**API Version**: 1.0.0
