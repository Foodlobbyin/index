# Authentication Features Documentation

## Overview

The Foodlobbyin platform now includes comprehensive authentication features:
- **Email Verification** - Verify user email addresses upon registration
- **Password Reset** - Allow users to reset forgotten passwords
- **Email OTP Authentication** - Alternative login method using One-Time Passwords
- **Mobile Number as User ID** - Mobile number is now a required unique identifier

## Features

### 1. Email Verification

When a user registers, they automatically receive an email verification link.

**Flow:**
1. User registers with username, mobile number, email, and optional password
2. System sends verification email with a unique token (valid for 24 hours)
3. User clicks the link in email
4. Email is verified and user can proceed

**Backend Endpoints:**
- `GET /api/auth/verify-email?token=<token>` - Verify email with token

**Frontend Pages:**
- `/verify-email?token=<token>` - Email verification page

### 2. Password Reset

Users who forget their password can request a reset link via email.

**Flow:**
1. User clicks "Forgot Password?" on login page
2. User enters their email address
3. System sends password reset email with token (valid for 1 hour)
4. User clicks link and enters new password
5. Password is updated and user can login

**Backend Endpoints:**
- `POST /api/auth/request-password-reset` - Request reset link
  ```json
  {
    "email": "user@example.com"
  }
  ```
- `POST /api/auth/reset-password` - Reset password with token
  ```json
  {
    "token": "reset-token-here",
    "newPassword": "newSecurePassword123"
  }
  ```

**Frontend Pages:**
- `/forgot-password` - Request password reset
- `/reset-password?token=<token>` - Set new password

### 3. Email OTP Authentication

Alternative authentication method for users without passwords or who forget them.

**Flow:**
1. User selects "Email OTP Login" tab on login page
2. User enters their email address
3. System sends 6-digit OTP to email (valid for 10 minutes)
4. User enters OTP
5. User is authenticated and logged in

**Backend Endpoints:**
- `POST /api/auth/request-email-otp` - Request OTP
  ```json
  {
    "email": "user@example.com"
  }
  ```
- `POST /api/auth/login-with-otp` - Login with OTP
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```

**Frontend Pages:**
- `/login` - Tabbed interface with "Email OTP Login" option

### 4. Mobile Number as User ID

Mobile number is now a required field during registration.

**Changes:**
- `mobile_number` field added to User model
- Must be unique across all users
- Indexed for fast lookups
- Stored in E.164 format (e.g., +1234567890)

## Registration Updates

Users can now register with or without a password:

**With Password (Traditional):**
```json
{
  "username": "john_doe",
  "mobile_number": "+1234567890",
  "email": "john@example.com",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Without Password (OTP-only):**
```json
{
  "username": "jane_doe",
  "mobile_number": "+1987654321",
  "email": "jane@example.com",
  "first_name": "Jane",
  "last_name": "Doe"
}
```

Users without passwords can only login using Email OTP.

## Email Configuration

### Required Environment Variables

```bash
# Email Service Configuration
EMAIL_HOST=smtp.gmail.com        # SMTP server hostname
EMAIL_PORT=587                   # SMTP port (587 for TLS, 465 for SSL)
EMAIL_USER=your-email@gmail.com  # SMTP username/email
EMAIL_PASSWORD=app-password      # SMTP password or app-specific password
EMAIL_FROM=noreply@foodlobbyin.com  # Sender email address

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup Example

If using Gmail:
1. Enable 2-factor authentication in your Google account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password
3. Use this app password as `EMAIL_PASSWORD`

### Testing Email Configuration

The email service includes a test method. To verify your configuration:

```typescript
import emailService from './services/email.service';

// Test connection
const isConnected = await emailService.testConnection();
```

## Database Changes

New fields added to `users` table:

```sql
ALTER TABLE users ADD COLUMN mobile_number VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verification_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN email_otp VARCHAR(10);
ALTER TABLE users ADD COLUMN email_otp_expires TIMESTAMP;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
```

Run migrations:
```bash
# From infrastructure directory
psql -U postgres -d foodlobbyin -f db/migrations/001_add_auth_features.sql
```

## Security Considerations

### Token Expiration
- Email verification tokens: 24 hours
- Password reset tokens: 1 hour
- Email OTPs: 10 minutes

### Rate Limiting
All authentication endpoints are rate-limited:
- Login/Register: 5 requests per 15 minutes
- OTP requests: 5 requests per 15 minutes
- Password reset: 5 requests per 15 minutes

### Password Requirements
- Minimum 6 characters
- Stored as bcrypt hash with 10 salt rounds

### OTP Security
- 6-digit random number
- Single use only
- Cleared after successful login or expiration

## Frontend Usage

### Login Page

Two tabs for different login methods:
1. **Password Login**: Traditional username/password
2. **Email OTP Login**: Email + OTP verification

### Registration Page

Required fields:
- Username (unique)
- Mobile Number (unique, E.164 format)
- Email (unique)
- Password (optional)

Optional fields:
- First Name
- Last Name

### User Experience

**After Registration:**
- Success message displayed
- Verification email sent automatically
- User can access app but may see "email not verified" warnings

**Forgot Password:**
- Link on login page
- Email sent with reset instructions
- Link expires in 1 hour

**Email OTP:**
- Alternative to password login
- OTP sent immediately
- 10-minute validity
- Can resend with different email

## API Examples

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "mobile_number": "+1234567890",
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Login with Password
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Request Email OTP
```bash
curl -X POST http://localhost:5000/api/auth/request-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### Login with OTP
```bash
curl -X POST http://localhost:5000/api/auth/login-with-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### Request Password Reset
```bash
curl -X POST http://localhost:5000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### Reset Password
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "newPassword": "newPassword123"
  }'
```

## Troubleshooting

### Emails Not Sending
1. Check environment variables are correctly set
2. Verify SMTP credentials are valid
3. Check firewall/network allows SMTP connections
4. Test with `emailService.testConnection()`
5. Check spam folder

### Token Expired Errors
- Tokens have limited validity periods
- Request new verification/reset email
- Ensure system time is correct

### OTP Not Working
- Check OTP hasn't expired (10 minutes)
- Verify correct email address
- OTP is single-use only
- Try requesting a new OTP

### Mobile Number Format
- Use E.164 format: +[country code][number]
- Example: +1234567890 (US)
- Example: +442071234567 (UK)

## Future Enhancements

Potential improvements:
- SMS OTP as alternative to email OTP
- Two-factor authentication (2FA)
- Social authentication (Google, Facebook, etc.)
- Email verification reminder notifications
- Password strength indicator
- Account recovery via mobile number
