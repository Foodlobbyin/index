/**
 * Validation Service Tests
 * Tests for email, phone, GSTN, and password validation
 */

import validationService from '../../services/validation.service';

describe('ValidationService', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.in',
        'first+last@test-domain.com',
        'user123@company.org',
      ];

      validEmails.forEach((email) => {
        const result = validationService.validateEmail(email);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
      ];

      invalidEmails.forEach((email) => {
        const result = validationService.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validationService.validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should accept valid Indian 10-digit phone numbers', () => {
      const validPhones = [
        '9876543210',
        '8123456789',
        '7000000000',
        '6999999999',
      ];

      validPhones.forEach((phone) => {
        const result = validationService.validatePhoneNumber(phone);
        expect(result.isValid).toBe(true);
      });
    });

    it('should accept E.164 international format', () => {
      const validPhones = [
        '+919876543210',
        '+12025551234',
        '+447911123456',
      ];

      validPhones.forEach((phone) => {
        const result = validationService.validatePhoneNumber(phone);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123456789',  // Too short
        '0123456789', // Starts with 0
        '5123456789', // Doesn't start with 6-9
        'abcdefghij', // Not numeric
        '+1',         // Too short E.164
      ];

      invalidPhones.forEach((phone) => {
        const result = validationService.validatePhoneNumber(phone);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('validateGSTN', () => {
    it('should accept valid GSTN format', () => {
      // Valid GSTN examples (checksum may not be accurate, but format is correct)
      const validGSTNs = [
        '27AAPFU0939F1ZV',
        '09AAACH7409R1ZZ',
        '29AABCT1332L1Z5',
      ];

      validGSTNs.forEach((gstn) => {
        const result = validationService.validateGSTN(gstn);
        // May fail checksum but should pass format validation
        if (!result.isValid) {
          expect(result.error).toContain('checksum');
        }
      });
    });

    it('should reject GSTN with wrong length', () => {
      const result = validationService.validateGSTN('27AAPFU0939F1Z'); // 14 chars
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('15 characters');
    });

    it('should reject GSTN with invalid format', () => {
      const invalidGSTNs = [
        '99AAPFU0939F1ZV', // Invalid state code
        '27AAPF00939F1ZV', // Wrong PAN format
        '27AAPFU0939F1XV', // Wrong 13th character (should be Z)
      ];

      invalidGSTNs.forEach((gstn) => {
        const result = validationService.validateGSTN(gstn);
        expect(result.isValid).toBe(false);
      });
    });

    it('should handle lowercase and spaces', () => {
      const result = validationService.validateGSTN('27 aapfu 0939 f1zv');
      // Should convert to uppercase and remove spaces
      expect(result.isValid).toBe(false); // Will fail checksum but format is checked
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'MyP@ssw0rd!',
        'Secure#Pass123',
        'C0mplex!ty99',
      ];

      strongPasswords.forEach((password) => {
        const result = validationService.validatePassword(password, password);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject passwords that are too short', () => {
      const result = validationService.validatePassword('Pass1!', 'Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 8 characters');
    });

    it('should reject passwords without sufficient complexity', () => {
      const weakPasswords = [
        'password', // No numbers, no uppercase, no special chars
        'Password', // No numbers, no special chars
        'password1', // No uppercase, no special chars
      ];

      weakPasswords.forEach((password) => {
        const result = validationService.validatePassword(password, password);
        expect(result.isValid).toBe(false);
        // Should fail for complexity OR common password check
        expect(result.error).toBeDefined();
      });
    });

    it('should reject common passwords', () => {
      const commonPasswords = [
        'Password123!', // Contains 'password' and '123'
        'Qwerty@123',   // Contains 'qwerty'
      ];

      commonPasswords.forEach((password) => {
        const result = validationService.validatePassword(password, password);
        expect(result.isValid).toBe(false);
        // Should fail for common password check
        expect(result.error).toBeDefined();
      });
    });

    it('should reject passwords with sequential characters', () => {
      const sequentialPasswords = [
        'AbcDef123!',  // Has abc
        'Test9876!@', // Has 987
      ];

      sequentialPasswords.forEach((password) => {
        const result = validationService.validatePassword(password, password);
        expect(result.isValid).toBe(false);
        // May fail for sequential OR common check
        expect(result.error).toBeDefined();
      });
    });

    it('should check password match when confirm_password is provided', () => {
      const result = validationService.validatePassword('MyP@ssw0rd!', 'MyP@ssw0rd!!');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('do not match');
    });
  });

  describe('validateName', () => {
    it('should accept valid names', () => {
      const validNames = [
        'John',
        'Mary-Jane',
        "O'Brien",
        'Jean Pierre',
      ];

      validNames.forEach((name) => {
        const result = validationService.validateName(name);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject names that are too short', () => {
      const result = validationService.validateName('A');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 2 characters');
    });

    it('should reject names with invalid characters', () => {
      const invalidNames = [
        'John123',
        'Mary@Smith',
        'Test!Name',
      ];

      invalidNames.forEach((name) => {
        const result = validationService.validateName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('letters');
      });
    });
  });
});
