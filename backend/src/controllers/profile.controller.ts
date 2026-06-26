/**
 * Profile Controller
 * Handles user profile viewing/editing, password change,
 * secondary email management, and session management.
 */

import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/** SHA-256 a string using WebCrypto (available in CF Workers) */
async function sha256hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate a 6-digit OTP via WebCrypto */
function generateOTP(): string {
  const num = crypto.getRandomValues(new Uint32Array(1))[0];
  return ((num % 900000) + 100000).toString();
}

/** Send secondary email OTP via Resend */
async function sendSecondaryEmailOTP(
  resendApiKey: string,
  fromEmail: string,
  toEmail: string,
  otp: string
): Promise<void> {
  const body = JSON.stringify({
    from: fromEmail || 'noreply@foodlobby.in',
    to: [toEmail],
    subject: 'FoodLobby — Verify your secondary email',
    html: `
      <p>Hi,</p>
      <p>Use the OTP below to verify your secondary email address on FoodLobby:</p>
      <h2 style="letter-spacing:4px">${otp}</h2>
      <p>This OTP is valid for <strong>10 minutes</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to send verification email: ${err}`);
  }
}

export class ProfileController {
  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/profile — Full profile for settings page
  // ─────────────────────────────────────────────────────────────────────────
  async getProfile(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const result = await db.query(
        `SELECT
           id, username, first_name, last_name,
           email, email_verified,
           mobile_number, phone_number,
           gstn, trust_level, registration_status,
           secondary_email, secondary_email_verified,
           forums_default_anonymous, incidents_always_anonymous,
           forum_anon_handle, created_at
         FROM users WHERE id = $1`,
        [user.id]
      );

      if (!result.rows.length) return c.json({ error: 'User not found' }, 404);
      return c.json({ user: result.rows[0] }, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUT /api/profile — Update editable profile fields
  // ─────────────────────────────────────────────────────────────────────────
  async updateProfile(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = await c.req.json();

      // Only these fields are allowed — email/gstn explicitly excluded server-side
      const {
        first_name,
        last_name,
        phone_number,
        forums_default_anonymous,
        incidents_always_anonymous,
      } = body;

      // Validate phone if provided
      if (phone_number !== undefined && phone_number !== null && phone_number !== '') {
        const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
        const cleaned = (phone_number as string).replace(/\s/g, '');
        if (!phoneRegex.test(cleaned)) {
          return c.json({ error: 'Invalid phone number. Must be a valid Indian mobile number.' }, 400);
        }
        // Check uniqueness
        const existing = await db.query(
          'SELECT id FROM users WHERE phone_number = $1 AND id <> $2',
          [cleaned, user.id]
        );
        if (existing.rows.length) {
          return c.json({ error: 'This phone number is already registered to another account.' }, 409);
        }
      }

      await db.query(
        `UPDATE users SET
           first_name               = COALESCE($1, first_name),
           last_name                = COALESCE($2, last_name),
           phone_number             = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE phone_number END,
           forums_default_anonymous = COALESCE($4, forums_default_anonymous),
           incidents_always_anonymous = COALESCE($5, incidents_always_anonymous)
         WHERE id = $6`,
        [
          first_name   ?? null,
          last_name    ?? null,
          phone_number !== undefined ? (phone_number || null) : null,
          typeof forums_default_anonymous   === 'boolean' ? forums_default_anonymous   : null,
          typeof incidents_always_anonymous === 'boolean' ? incidents_always_anonymous : null,
          user.id,
        ]
      );

      return c.json({ message: 'Profile updated successfully.' }, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/profile/change-password
  // ─────────────────────────────────────────────────────────────────────────
  async changePassword(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { current_password, new_password, confirm_new_password } = await c.req.json();

      if (!current_password) return c.json({ error: 'Current password is required.' }, 400);
      if (!new_password)     return c.json({ error: 'New password is required.' }, 400);
      if (!confirm_new_password) return c.json({ error: 'Please confirm your new password.' }, 400);

      if (new_password !== confirm_new_password) {
        return c.json({ error: 'New passwords do not match.' }, 400);
      }

      // Strength check
      if (new_password.length < 8) {
        return c.json({ error: 'New password must be at least 8 characters.' }, 400);
      }
      const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!strongPassword.test(new_password)) {
        return c.json({
          error: 'New password must contain at least one uppercase letter, one lowercase letter, and one number.',
        }, 400);
      }

      // Fetch current hash
      const result = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [user.id]
      );
      if (!result.rows.length) return c.json({ error: 'User not found.' }, 404);

      const { password_hash } = result.rows[0];
      if (!password_hash) return c.json({ error: 'Cannot change password for this account.' }, 400);

      const matches = await bcrypt.compare(current_password, password_hash);
      if (!matches) return c.json({ error: 'Current password is incorrect.' }, 401);

      // Hash and save new password
      const new_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
      await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [new_hash, user.id]);

      // Revoke all other sessions so they must re-login
      await db.query(
        'UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = $1',
        [user.id]
      );

      return c.json({ message: 'Password changed successfully. Please log in again on other devices.' }, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/profile/secondary-email — Save secondary email + send OTP
  // ─────────────────────────────────────────────────────────────────────────
  async setSecondaryEmail(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { secondary_email } = await c.req.json();
      if (!secondary_email) return c.json({ error: 'Secondary email is required.' }, 400);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(secondary_email)) {
        return c.json({ error: 'Invalid email address.' }, 400);
      }

      // Must not be the same as primary email
      const current = await db.query('SELECT email FROM users WHERE id = $1', [user.id]);
      if (!current.rows.length) return c.json({ error: 'User not found.' }, 404);
      if (current.rows[0].email.toLowerCase() === secondary_email.toLowerCase()) {
        return c.json({ error: 'Secondary email must differ from your primary email.' }, 400);
      }

      // Uniqueness across all users
      const taken = await db.query(
        'SELECT id FROM users WHERE (email = $1 OR secondary_email = $1) AND id <> $2',
        [secondary_email.toLowerCase(), user.id]
      );
      if (taken.rows.length) {
        return c.json({ error: 'This email address is already registered.' }, 409);
      }

      // Generate OTP (10 min expiry)
      const otp = generateOTP();
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      await db.query(
        `UPDATE users SET
           secondary_email             = $1,
           secondary_email_verified    = FALSE,
           secondary_email_otp         = $2,
           secondary_email_otp_expires = $3
         WHERE id = $4`,
        [secondary_email.toLowerCase(), otp, expires, user.id]
      );

      await sendSecondaryEmailOTP(
        c.env.RESEND_API_KEY,
        c.env.EMAIL_FROM,
        secondary_email,
        otp
      );

      return c.json({ message: 'Verification OTP sent to your secondary email.' }, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/profile/secondary-email/verify — Verify OTP for secondary email
  // ─────────────────────────────────────────────────────────────────────────
  async verifySecondaryEmail(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { otp } = await c.req.json();
      if (!otp) return c.json({ error: 'OTP is required.' }, 400);

      const result = await db.query(
        `SELECT secondary_email_otp, secondary_email_otp_expires, secondary_email
         FROM users WHERE id = $1`,
        [user.id]
      );
      if (!result.rows.length) return c.json({ error: 'User not found.' }, 404);

      const { secondary_email_otp, secondary_email_otp_expires, secondary_email } = result.rows[0];

      if (!secondary_email_otp) {
        return c.json({ error: 'No pending secondary email verification.' }, 400);
      }
      if (new Date() > new Date(secondary_email_otp_expires)) {
        return c.json({ error: 'OTP has expired. Please request a new one.' }, 400);
      }
      if (otp.trim() !== secondary_email_otp) {
        return c.json({ error: 'Incorrect OTP.' }, 400);
      }

      // Mark verified and clear OTP
      await db.query(
        `UPDATE users SET
           secondary_email_verified    = TRUE,
           secondary_email_otp         = NULL,
           secondary_email_otp_expires = NULL
         WHERE id = $1`,
        [user.id]
      );

      return c.json({
        message: 'Secondary email verified successfully.',
        secondary_email,
      }, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/profile/sessions — List active sessions
  // ─────────────────────────────────────────────────────────────────────────
  async getSessions(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      // Identify the current session by hashing the incoming token
      const authHeader = c.req.header('Authorization') ?? '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      const currentHash = token ? await sha256hex(token) : '';

      const result = await db.query(
        `SELECT id, ip_address, user_agent, created_at, last_used_at,
                (token_hash = $2) AS is_current
         FROM user_sessions
         WHERE user_id = $1 AND is_revoked = FALSE
         ORDER BY last_used_at DESC`,
        [user.id, currentHash]
      );

      return c.json({ sessions: result.rows }, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE /api/profile/sessions — Revoke all sessions except current
  // ─────────────────────────────────────────────────────────────────────────
  async revokeOtherSessions(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const authHeader = c.req.header('Authorization') ?? '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      const currentHash = token ? await sha256hex(token) : '';

      await db.query(
        `UPDATE user_sessions SET is_revoked = TRUE
         WHERE user_id = $1 AND token_hash <> $2 AND is_revoked = FALSE`,
        [user.id, currentHash]
      );

      return c.json({ message: 'All other sessions have been logged out.' }, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE /api/profile/sessions/:id — Revoke a specific session
  // ─────────────────────────────────────────────────────────────────────────
  async revokeSession(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const sessionId = parseInt(c.req.param('id') ?? '', 10);
      if (isNaN(sessionId)) return c.json({ error: 'Invalid session ID.' }, 400);

      const result = await db.query(
        'UPDATE user_sessions SET is_revoked = TRUE WHERE id = $1 AND user_id = $2 RETURNING id',
        [sessionId, user.id]
      );

      if (!result.rows.length) return c.json({ error: 'Session not found.' }, 404);
      return c.json({ message: 'Session revoked.' }, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  }
}

export default new ProfileController();
