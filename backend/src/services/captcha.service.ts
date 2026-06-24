/**
 * Captcha Service
 * Handles reCAPTCHA v3 verification for bot protection
 */

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export class CaptchaService {
  /**
   * Verify reCAPTCHA token
   * @param token The reCAPTCHA token from the client
   * @param recaptchaSecretKey The reCAPTCHA secret key (from env, threaded in)
   * @param expectedAction The expected action (e.g., 'register', 'login')
   * @param recaptchaThreshold The minimum score threshold
   * @returns Promise<{ isValid: boolean; score?: number; error?: string }>
   */
  async verifyRecaptcha(
    token: string,
    recaptchaSecretKey: string,
    expectedAction?: string,
    recaptchaThreshold: number = 0.5
  ): Promise<{ isValid: boolean; score?: number; error?: string }> {
    // If reCAPTCHA is not configured, skip verification (for development)
    if (!recaptchaSecretKey || recaptchaSecretKey === 'your-recaptcha-secret-key') {
      console.warn('reCAPTCHA verification skipped: RECAPTCHA_SECRET_KEY not configured');
      return { isValid: true, score: 1.0 };
    }

    if (!token) {
      return { isValid: false, error: 'reCAPTCHA token is required' };
    }

    try {
      const response = await this.makeRecaptchaRequest(token, recaptchaSecretKey);

      if (!response.success) {
        const errors = response['error-codes'] || [];
        console.error('reCAPTCHA verification failed:', errors);
        return { isValid: false, error: 'reCAPTCHA verification failed' };
      }

      const score = response.score || 0;

      // Check if action matches (if provided)
      if (expectedAction && response.action !== expectedAction) {
        return { isValid: false, error: 'reCAPTCHA action mismatch', score };
      }

      // Check if score is above threshold
      if (score < recaptchaThreshold) {
        return { isValid: false, error: 'reCAPTCHA score too low (possible bot)', score };
      }

      return { isValid: true, score };
    } catch (error: any) {
      console.error('reCAPTCHA verification error:', error);
      return { isValid: false, error: 'Failed to verify reCAPTCHA' };
    }
  }

  /**
   * Make HTTP request to Google reCAPTCHA API using fetch (Workers-compatible)
   */
  private async makeRecaptchaRequest(token: string, recaptchaSecretKey: string): Promise<RecaptchaResponse> {
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: recaptchaSecretKey, response: token }).toString(),
    });

    return (await res.json()) as RecaptchaResponse;
  }

  /**
   * Check if captcha verification should be enforced
   * In development, captcha may be optional
   */
  shouldEnforceCaptcha(nodeEnv: string, recaptchaSecretKey: string): boolean {
    return nodeEnv === 'production' && Boolean(recaptchaSecretKey);
  }
}

export default new CaptchaService();
