/**
 * Captcha Service
 * Handles reCAPTCHA v3 verification for bot protection
 */

import https from 'https';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RECAPTCHA_THRESHOLD = parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.5');

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
   * @param expectedAction The expected action (e.g., 'register', 'login')
   * @returns Promise<{ isValid: boolean; score?: number; error?: string }>
   */
  async verifyRecaptcha(
    token: string,
    expectedAction?: string
  ): Promise<{ isValid: boolean; score?: number; error?: string }> {
    // If reCAPTCHA is not configured, skip verification (for development)
    if (!RECAPTCHA_SECRET_KEY || RECAPTCHA_SECRET_KEY === 'your-recaptcha-secret-key') {
      console.warn('reCAPTCHA verification skipped: RECAPTCHA_SECRET_KEY not configured');
      return { isValid: true, score: 1.0 };
    }

    if (!token) {
      return { isValid: false, error: 'reCAPTCHA token is required' };
    }

    try {
      const response = await this.makeRecaptchaRequest(token);

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
      if (score < RECAPTCHA_THRESHOLD) {
        return { isValid: false, error: 'reCAPTCHA score too low (possible bot)', score };
      }

      return { isValid: true, score };
    } catch (error: any) {
      console.error('reCAPTCHA verification error:', error);
      return { isValid: false, error: 'Failed to verify reCAPTCHA' };
    }
  }

  /**
   * Make HTTP request to Google reCAPTCHA API
   */
  private makeRecaptchaRequest(token: string): Promise<RecaptchaResponse> {
    return new Promise((resolve, reject) => {
      const postData = `secret=${encodeURIComponent(RECAPTCHA_SECRET_KEY)}&response=${encodeURIComponent(token)}`;

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(RECAPTCHA_VERIFY_URL, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response: RecaptchaResponse = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse reCAPTCHA response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Check if captcha verification should be enforced
   * In development, captcha may be optional
   */
  shouldEnforceCaptcha(): boolean {
    return process.env.NODE_ENV === 'production' && Boolean(RECAPTCHA_SECRET_KEY);
  }
}

export default new CaptchaService();
