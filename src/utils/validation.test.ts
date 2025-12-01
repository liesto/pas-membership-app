import { describe, it, expect } from 'vitest';
import {
  validatePhoneNumber,
  getPhoneErrorMessage,
  formatPhoneNumber,
} from './validation';

describe('validatePhoneNumber', () => {
  describe('valid phone numbers', () => {
    it('should accept 10-digit phone number', () => {
      expect(validatePhoneNumber('1234567890')).toBe(true);
    });

    it('should accept phone number with dashes', () => {
      expect(validatePhoneNumber('123-456-7890')).toBe(true);
    });

    it('should accept phone number with parentheses and dashes', () => {
      expect(validatePhoneNumber('(123) 456-7890')).toBe(true);
    });

    it('should accept phone number with spaces', () => {
      expect(validatePhoneNumber('123 456 7890')).toBe(true);
    });

    it('should accept 11-digit number starting with 1', () => {
      expect(validatePhoneNumber('11234567890')).toBe(true);
    });

    it('should accept +1 format', () => {
      expect(validatePhoneNumber('+1 123 456 7890')).toBe(true);
    });

    it('should accept +1 with dashes', () => {
      expect(validatePhoneNumber('+1-123-456-7890')).toBe(true);
    });

    it('should accept various formatting of valid numbers', () => {
      const validNumbers = [
        '2025551234',
        '202-555-1234',
        '(202) 555-1234',
        '+1 (202) 555-1234',
        '+12025551234',
        '1 (202) 555-1234',
      ];

      validNumbers.forEach(number => {
        expect(validatePhoneNumber(number)).toBe(true);
      });
    });
  });

  describe('invalid phone numbers', () => {
    it('should reject empty string', () => {
      expect(validatePhoneNumber('')).toBe(false);
    });

    it('should reject null', () => {
      expect(validatePhoneNumber(null as any)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(validatePhoneNumber(undefined as any)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(validatePhoneNumber(1234567890 as any)).toBe(false);
    });

    it('should reject numbers with too few digits', () => {
      expect(validatePhoneNumber('123456789')).toBe(false);
    });

    it('should reject numbers with too many digits', () => {
      expect(validatePhoneNumber('123456789012')).toBe(false);
    });

    it('should reject 11-digit numbers not starting with 1', () => {
      expect(validatePhoneNumber('21234567890')).toBe(false);
    });

    it('should reject text with no numbers', () => {
      expect(validatePhoneNumber('abc-def-ghij')).toBe(false);
    });

    it('should reject partial numbers', () => {
      const invalidNumbers = [
        '123',
        '123-456',
        '(123) 456',
        '555',
      ];

      invalidNumbers.forEach(number => {
        expect(validatePhoneNumber(number)).toBe(false);
      });
    });
  });
});

describe('getPhoneErrorMessage', () => {
  it('should return appropriate message for empty phone', () => {
    expect(getPhoneErrorMessage('')).toContain('required');
  });

  it('should return appropriate message for too few digits', () => {
    const msg = getPhoneErrorMessage('123-456');
    expect(msg).toBeTruthy();
  });

  it('should return appropriate message for too many digits', () => {
    const msg = getPhoneErrorMessage('1234567890123');
    expect(msg).toContain('too long');
  });

  it('should return appropriate message for invalid format', () => {
    const msg = getPhoneErrorMessage('abc-def-ghij');
    expect(msg).toBeTruthy();
  });

  it('should return generic message for no digits', () => {
    const msg = getPhoneErrorMessage('---');
    expect(msg).toContain('valid');
  });
});

describe('formatPhoneNumber', () => {
  it('should format 10-digit number as (XXX) XXX-XXXX', () => {
    expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
  });

  it('should format already-formatted number', () => {
    expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
  });

  it('should format dashed number', () => {
    expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
  });

  it('should format 11-digit number starting with 1', () => {
    expect(formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890');
  });

  it('should format +1 number', () => {
    expect(formatPhoneNumber('+1 (123) 456-7890')).toBe('+1 (123) 456-7890');
  });

  it('should return original if not a valid format', () => {
    expect(formatPhoneNumber('invalid')).toBe('invalid');
  });

  it('should handle various input formats', () => {
    const testCases = [
      ['2025551234', '(202) 555-1234'],
      ['202-555-1234', '(202) 555-1234'],
      ['202 555 1234', '(202) 555-1234'],
    ];

    testCases.forEach(([input, expected]) => {
      expect(formatPhoneNumber(input)).toBe(expected);
    });
  });
});
