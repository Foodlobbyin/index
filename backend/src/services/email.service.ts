// @ts-nocheck — Phase 2: nodemailer will be replaced with an HTTP email API (Resend/MailChannels)
// Stub exports so the bundler does not try to resolve nodemailer

export async function sendVerificationEmail(_email: string, _token: string): Promise<void> {
  console.warn('[email.service] sendVerificationEmail: email not implemented yet (Phase 2)');
}

export async function sendPasswordResetEmail(_email: string, _token: string): Promise<void> {
  console.warn('[email.service] sendPasswordResetEmail: email not implemented yet (Phase 2)');
}

export async function sendOTPEmail(_email: string, _otp: string): Promise<void> {
  console.warn('[email.service] sendOTPEmail: email not implemented yet (Phase 2)');
}

export async function sendWelcomeEmail(_email: string, _name: string): Promise<void> {
  console.warn('[email.service] sendWelcomeEmail: email not implemented yet (Phase 2)');
}

export default { sendVerificationEmail, sendPasswordResetEmail, sendOTPEmail, sendWelcomeEmail };
