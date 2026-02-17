# Secure Registration API Documentation

## Overview

This document describes the secure registration and authentication API with referral-based onboarding, GSTN validation, and OTP-based email verification.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Secure Authentication Endpoints

### 1. Register User

Create a new user account with referral code validation.

**Endpoint:** `POST /secure-auth/register`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "username": "john_doe",
  "phone_number": "9876543210",
  "email": "john@example.com",
  "password": "MySecure#Pass123",
  "confirm_password": "MySecure#Pass123",
  "first_name": "John",
  "last_name": "Doe",
  "gstn": "27AAPFU0939F1ZV",
  "referral_code": "REF123ABC",
  "captcha_token": "recaptcha_token_here"
}
```

**Validation Rules:**
- `username`: Required, unique
- `phone_number`: Required, unique, Indian 10-digit (6-9 start) or E.164 format
- `email`: Required, unique, RFC-compliant format
- `password`: Required, min 8 chars, 3 of 4 complexity types, not common
- `confirm_password`: Must match password
- `gstn`: Required, 15 characters, valid checksum
- `referral_code`: Required, must be valid and not expired
- `captcha_token`: Required in production

**Success Response:** `201 Created`
```json
{
  "message": "Registration successful! Please verify your email with the OTP sent to activate your account.",
  "requiresOTP": true
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded

---

### 2. Verify OTP

Verify email with OTP and activate account.

**Endpoint:** `POST /secure-auth/verify-otp`

**Rate Limit:** 10 requests per 15 minutes

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "captcha_token": "recaptcha_token_here"
}
```

**Success Response:** `200 OK`
```json
{
  "message": "Email verified successfully! Your account is now activated.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "phone_number": "9876543210",
    "gstn": "27AAPFU0939F1ZV",
    "first_name": "John",
    "last_name": "Doe",
    "email_verified": true,
    "account_activated": true,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired OTP
- `429 Too Many Requests`: Too many failed attempts

**OTP Rules:**
- Valid for 10 minutes
- Single use only
- Max 5 failed verification attempts per hour

---

### 3. Request OTP

Request a new OTP (for resend).

**Endpoint:** `POST /secure-auth/request-otp`

**Rate Limit:** 10 requests per 15 minutes

**Request Body:**
```json
{
  "email": "john@example.com",
  "captcha_token": "recaptcha_token_here"
}
```

**Success Response:** `200 OK`
```json
{
  "message": "OTP has been sent to your email."
}
```

**Rate Limits:**
- Max 5 OTP generation requests per hour per email
- Max 10 OTP generation requests per hour per IP

---

### 4. Login

Login with username and password.

**Endpoint:** `POST /secure-auth/login`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "MySecure#Pass123"
}
```

**Success Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "phone_number": "9876543210",
    "gstn": "27AAPFU0939F1ZV",
    "email_verified": true,
    "account_activated": true,
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials or account not activated

---

### 5. Get Profile

Get current user profile.

**Endpoint:** `GET /secure-auth/profile`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "phone_number": "9876543210",
    "gstn": "27AAPFU0939F1ZV",
    "first_name": "John",
    "last_name": "Doe",
    "email_verified": true,
    "account_activated": true,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Referral Endpoints

### 1. Validate Referral Code

Validate a referral code (public endpoint for registration form).

**Endpoint:** `POST /referrals/validate`

**Rate Limit:** 10 requests per 15 minutes

**Request Body:**
```json
{
  "code": "REF123ABC",
  "email": "user@example.com"
}
```

**Success Response:** `200 OK`
```json
{
  "valid": true,
  "message": "Referral code is valid"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "valid": false,
  "error": "Referral code has expired"
}
```

**Validation Checks:**
- Code exists
- Code is active
- Not expired
- used_count < max_uses
- Email domain matches (if restricted)

---

### 2. Create Referral Code

Create a new referral code (authenticated users only).

**Endpoint:** `POST /referrals`

**Authentication:** Required

**Rate Limit:** 10 requests per 15 minutes

**Request Body:**
```json
{
  "max_uses": 10,
  "expires_at": "2024-12-31T23:59:59.000Z",
  "allowed_email_domain": "company.com"
}
```

**Success Response:** `201 Created`
```json
{
  "message": "Referral code created successfully",
  "referral": {
    "id": 1,
    "code": "REFLNX3A7B",
    "created_by_user_id": 1,
    "max_uses": 10,
    "used_count": 0,
    "expires_at": "2024-12-31T23:59:59.000Z",
    "allowed_email_domain": "company.com",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Get My Referrals

Get all referral codes created by the current user.

**Endpoint:** `GET /referrals/my-referrals`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "referrals": [
    {
      "id": 1,
      "code": "REFLNX3A7B",
      "max_uses": 10,
      "used_count": 3,
      "expires_at": "2024-12-31T23:59:59.000Z",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 4. Get Referral Statistics

Get usage statistics for a specific referral code.

**Endpoint:** `GET /referrals/:code/stats`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "stats": {
    "used_count": 3,
    "max_uses": 10,
    "remaining": 7
  }
}
```

---

### 5. Activate/Deactivate Referral

Activate or deactivate a referral code.

**Endpoints:**
- `PATCH /referrals/:referralId/activate`
- `PATCH /referrals/:referralId/deactivate`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "message": "Referral code activated successfully"
}
```

---

## Validation Details

### Email Validation
- RFC 5322 compliant
- Maximum 254 characters
- Must be unique

### Phone Number Validation
- **Indian Format:** 10 digits starting with 6-9
  - Examples: `9876543210`, `8123456789`
- **E.164 Format:** `+` followed by country code and number
  - Examples: `+919876543210`, `+12025551234`
- Must be unique

### GSTN Validation
- Exactly 15 characters
- Format: `##AAAAA####A#A#`
  - `##`: State code (01-37)
  - Next 10: PAN format
  - 13th character: Must be 'Z'
  - Last character: Checksum
- Validates checksum using Luhn algorithm variant
- Example: `27AAPFU0939F1ZV`

### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- Must contain at least 3 of:
  - Uppercase letter
  - Lowercase letter
  - Number
  - Special character
- Cannot contain common passwords
- Cannot contain sequential characters (123, abc, etc.)

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

| Endpoint | Limit |
|----------|-------|
| Registration | 5 per 15 min |
| Login | 5 per 15 min |
| OTP Request | 10 per 15 min |
| OTP Verify | 10 per 15 min |
| Referral Validate | 10 per 15 min |
| Referral Create | 10 per 15 min |
| General API | 100 per 15 min |

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid credentials or token) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Security Features

1. **reCAPTCHA v3**: Bot protection on registration and OTP endpoints
2. **Rate Limiting**: IP-based limits on all auth endpoints
3. **OTP Expiration**: OTPs expire after 10 minutes
4. **Single-Use OTPs**: Each OTP can only be used once
5. **Password Hashing**: Bcrypt with cost factor 12
6. **JWT Tokens**: 7-day expiration
7. **Attempt Logging**: All registration and OTP attempts logged with IP
8. **Email Enumeration Prevention**: Same response for existing/non-existing emails
9. **Transaction-Based Registration**: Atomic user creation and referral increment

---

## Example Registration Flow

1. **Obtain Referral Code**
   - User receives referral code from existing user or admin
   
2. **Validate Referral** (Optional, for UI feedback)
   ```
   POST /referrals/validate
   { "code": "REF123ABC", "email": "user@example.com" }
   ```

3. **Register**
   ```
   POST /secure-auth/register
   {
     "username": "john_doe",
     "phone_number": "9876543210",
     "email": "john@example.com",
     "password": "MySecure#Pass123",
     "confirm_password": "MySecure#Pass123",
     "first_name": "John",
     "last_name": "Doe",
     "gstn": "27AAPFU0939F1ZV",
     "referral_code": "REF123ABC",
     "captcha_token": "..."
   }
   ```

4. **Check Email for OTP**
   - User receives 6-digit OTP via email

5. **Verify OTP**
   ```
   POST /secure-auth/verify-otp
   {
     "email": "john@example.com",
     "otp": "123456"
   }
   ```

6. **Account Activated**
   - User receives JWT token
   - Can now login and use the application

---

## Environment Variables

Required environment variables:

```bash
# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@foodlobbyin.com

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_THRESHOLD=0.5

# OTP Configuration
OTP_EXPIRY_MINUTES=10
MAX_OTP_GENERATION_PER_HOUR=5
MAX_OTP_VERIFICATION_ATTEMPTS=5

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=foodlobbyin
DB_USER=postgres
DB_PASSWORD=password
```

---

## Support

For issues or questions, please contact the development team.
