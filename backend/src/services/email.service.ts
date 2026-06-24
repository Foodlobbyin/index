// Email service using Resend HTTP API (Workers-compatible)
// https://resend.com/docs/api-reference/emails/send-email

const RESEND_API_URL = 'https://api.resend.com/emails';

interface ResendPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

async function sendEmail(apiKey: string, payload: ResendPayload): Promise<void> {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email send failed: ${res.status} ${err}`);
  }
}

export async function sendVerificationEmail(
  apiKey: string,
  fromEmail: string,
  frontendUrl: string,
  toEmail: string,
  token: string
): Promise<void> {
  const link = `${frontendUrl}/verify-email?token=${token}`;
  await sendEmail(apiKey, {
    from: fromEmail,
    to: [toEmail],
    subject: 'Verify your Foodlobbyin account',
    html: `<p>Click the link below to verify your email address:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(
  apiKey: string,
  fromEmail: string,
  frontendUrl: string,
  toEmail: string,
  token: string
): Promise<void> {
  const link = `${frontendUrl}/reset-password?token=${token}`;
  await sendEmail(apiKey, {
    from: fromEmail,
    to: [toEmail],
    subject: 'Reset your Foodlobbyin password',
    html: `<p>Click the link below to reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`,
  });
}

export async function sendOTPEmail(
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  otp: string
): Promise<void> {
  await sendEmail(apiKey, {
    from: fromEmail,
    to: [toEmail],
    subject: 'Your Foodlobbyin verification code',
    html: `<p>Your verification code is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in 10 minutes. Do not share it with anyone.</p>`,
  });
}

export async function sendWelcomeEmail(
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  name: string
): Promise<void> {
  await sendEmail(apiKey, {
    from: fromEmail,
    to: [toEmail],
    subject: 'Welcome to Foodlobbyin',
    html: `<p>Hi ${name},</p><p>Welcome to Foodlobbyin! Your account is now active.</p>`,
  });
}

export default { sendVerificationEmail, sendPasswordResetEmail, sendOTPEmail, sendWelcomeEmail };
