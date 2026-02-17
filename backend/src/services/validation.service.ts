/**
 * Validation Service
 * Provides comprehensive validation for user registration data
 */

// Common weak passwords to blacklist
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
  'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'shadow',
  'superman', 'qazwsx', 'michael', 'football', '123456789', 'welcome',
  'admin', 'login', 'passw0rd', 'Password1', 'password1', '12345',
];

export class ValidationService {
  /**
   * Validate email format using RFC-compliant regex
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    // RFC 5322 compliant email regex (simplified but comprehensive)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    if (email.length > 254) {
      return { isValid: false, error: 'Email is too long' };
    }

    return { isValid: true };
  }

  /**
   * Validate phone number (Indian 10-digit or E.164 international format)
   */
  validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
    if (!phone) {
      return { isValid: false, error: 'Phone number is required' };
    }

    // Remove all spaces, dashes, and parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Check for Indian 10-digit format
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (indianPhoneRegex.test(cleanPhone)) {
      return { isValid: true };
    }

    // Check for E.164 international format (+[country code][number])
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (e164Regex.test(cleanPhone)) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: 'Invalid phone number format. Use 10-digit Indian format (e.g., 9876543210) or E.164 format (e.g., +919876543210)',
    };
  }

  /**
   * Validate GSTN (Goods and Services Tax Identification Number)
   * Format: 15 characters
   * Structure: 2 digits (state code) + 10 alphanumeric (PAN) + 1 digit (entity number) + 1 letter (Z) + 1 check digit
   * Example: 27AAPFU0939F1ZV
   */
  validateGSTN(gstn: string): { isValid: boolean; error?: string } {
    if (!gstn) {
      return { isValid: false, error: 'GSTN is required' };
    }

    // Remove spaces and convert to uppercase
    const cleanGstn = gstn.replace(/\s/g, '').toUpperCase();

    if (cleanGstn.length !== 15) {
      return { isValid: false, error: 'GSTN must be exactly 15 characters' };
    }

    // GSTN format validation
    // Format: ##AAAAA####A#A#
    // ## = State code (01-37)
    // AAAAA##### = PAN (10 characters: 5 letters, 4 digits, 1 letter)
    // # = Entity number (1-9, A-Z)
    // A = Letter 'Z'
    // # = Check digit
    const gstnRegex = /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/;

    if (!gstnRegex.test(cleanGstn)) {
      return {
        isValid: false,
        error: 'Invalid GSTN format. GSTN should follow the format: 27AAPFU0939F1ZV',
      };
    }

    // Validate state code (01-37)
    const stateCode = parseInt(cleanGstn.substring(0, 2), 10);
    if (stateCode < 1 || stateCode > 37) {
      return { isValid: false, error: 'Invalid state code in GSTN' };
    }

    // Validate checksum
    if (!this.validateGSTNChecksum(cleanGstn)) {
      return { isValid: false, error: 'Invalid GSTN checksum' };
    }

    return { isValid: true };
  }

  /**
   * Validate GSTN checksum (Luhn algorithm variant for GSTN)
   */
  private validateGSTNChecksum(gstn: string): boolean {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let sum = 0;

    // Process first 14 characters
    for (let i = 0; i < 14; i++) {
      const char = gstn[i];
      let value = chars.indexOf(char);

      if (value === -1) return false;

      // Double every second digit (from right, so positions 1, 3, 5, etc.)
      if ((14 - i) % 2 === 0) {
        value *= 2;
      }

      // If doubled value is > 35, add the digits (value / 36 + value % 36)
      if (value > 35) {
        sum += Math.floor(value / 36) + (value % 36);
      } else {
        sum += value;
      }
    }

    // Calculate check digit
    const checkDigit = (36 - (sum % 36)) % 36;
    const expectedCheckChar = chars[checkDigit];
    const actualCheckChar = gstn[14];

    return expectedCheckChar === actualCheckChar;
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string, confirm_password?: string): { isValid: boolean; error?: string } {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }

    // Check if passwords match (if confirm_password is provided)
    if (confirm_password !== undefined && password !== confirm_password) {
      return { isValid: false, error: 'Passwords do not match' };
    }

    // Minimum length
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    // Maximum length (to prevent DoS)
    if (password.length > 128) {
      return { isValid: false, error: 'Password is too long (maximum 128 characters)' };
    }

    // Check complexity requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const complexityCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

    if (complexityCount < 3) {
      return {
        isValid: false,
        error: 'Password must contain at least 3 of the following: uppercase letter, lowercase letter, number, special character',
      };
    }

    // Check against common password blacklist
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.some((common) => lowerPassword.includes(common))) {
      return { isValid: false, error: 'Password is too common. Please choose a stronger password' };
    }

    // Check for sequential characters (123, abc, etc.)
    if (this.hasSequentialChars(password)) {
      return { isValid: false, error: 'Password contains sequential characters. Please choose a stronger password' };
    }

    return { isValid: true };
  }

  /**
   * Check for sequential characters in password
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = [
      '0123456789',
      'abcdefghijklmnopqrstuvwxyz',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ];

    const lowerPassword = password.toLowerCase();

    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - 3; i++) {
        const subSeq = seq.substring(i, i + 3);
        const reverseSubSeq = subSeq.split('').reverse().join('');

        if (lowerPassword.includes(subSeq) || lowerPassword.includes(reverseSubSeq)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validate name field
   */
  validateName(name: string, fieldName: string = 'Name'): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    if (name.length < 2) {
      return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
    }

    if (name.length > 100) {
      return { isValid: false, error: `${fieldName} is too long (maximum 100 characters)` };
    }

    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name)) {
      return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
    }

    return { isValid: true };
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

export default new ValidationService();
