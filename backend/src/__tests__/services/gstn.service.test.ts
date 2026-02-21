import gstnService from '../../services/gstn.service';

describe('GstnService', () => {
  describe('validate', () => {
    it('should return true for a valid GSTN', () => {
      expect(gstnService.validate('27AAPFU0939F1ZV')).toBe(true);
      expect(gstnService.validate('29AAACR5055K1Z5')).toBe(true);
    });

    it('should return false for an invalid GSTN', () => {
      expect(gstnService.validate('INVALID')).toBe(false);
      expect(gstnService.validate('')).toBe(false);
      expect(gstnService.validate('27AAPFU0939F1Z')).toBe(false); // too short
      expect(gstnService.validate('27aapfu0939f1zv')).toBe(false); // lowercase
    });
  });

  describe('assertValid', () => {
    it('should not throw for a valid GSTN', () => {
      expect(() => gstnService.assertValid('27AAPFU0939F1ZV')).not.toThrow();
    });

    it('should throw for an invalid GSTN', () => {
      expect(() => gstnService.assertValid('INVALID')).toThrow('Invalid GSTN format');
    });
  });
});
