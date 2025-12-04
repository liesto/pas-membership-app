import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCurrentDateEST,
  formatDateForSalesforce,
  formatDateDisplay,
  calculateMembershipEndDate,
} from './dateHelpers';

describe('dateHelpers', () => {
  beforeEach(() => {
    // Set a fixed date for testing: December 15, 2025 at 10:00 AM UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-15T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getCurrentDateEST', () => {
    it('should return the current date in EST timezone', () => {
      const result = getCurrentDateEST();

      // December 15, 2025 at 10:00 AM UTC is December 15, 2025 at 5:00 AM EST
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // December (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it('should handle timezone conversion correctly', () => {
      // Set time to midnight UTC on Jan 1
      vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

      const result = getCurrentDateEST();

      // Midnight UTC on Jan 1 is Dec 31 at 7:00 PM EST (previous day)
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(31);
    });
  });

  describe('formatDateForSalesforce', () => {
    it('should format date as YYYY-MM-DD for Salesforce', () => {
      const date = new Date('2025-12-15T10:00:00.000Z');
      const result = formatDateForSalesforce(date);

      expect(result).toBe('2025-12-15');
    });

    it('should pad single-digit months and days with zeros', () => {
      const date = new Date('2025-01-05T10:00:00.000Z');
      const result = formatDateForSalesforce(date);

      expect(result).toBe('2025-01-05');
    });

    it('should handle dates from getCurrentDateEST', () => {
      const estDate = getCurrentDateEST();
      const result = formatDateForSalesforce(estDate);

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe('2025-12-15');
    });
  });

  describe('formatDateDisplay', () => {
    it('should format date as MM/DD/YYYY for display', () => {
      const date = new Date('2025-12-15T10:00:00.000Z');
      const result = formatDateDisplay(date);

      expect(result).toBe('12/15/2025');
    });

    it('should pad single-digit months and days with zeros', () => {
      const date = new Date('2025-01-05T10:00:00.000Z');
      const result = formatDateDisplay(date);

      expect(result).toBe('01/05/2025');
    });

    it('should handle dates from getCurrentDateEST', () => {
      const estDate = getCurrentDateEST();
      const result = formatDateDisplay(estDate);

      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(result).toBe('12/15/2025');
    });
  });

  describe('calculateMembershipEndDate', () => {
    it('should add 1 month for monthly term', () => {
      const startDate = new Date('2025-12-15T10:00:00.000Z');
      const result = calculateMembershipEndDate(startDate, 'Month');

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    it('should add 1 year for annual term', () => {
      const startDate = new Date('2025-12-15T10:00:00.000Z');
      const result = calculateMembershipEndDate(startDate, 'Year');

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(15);
    });

    it('should handle month rollover correctly', () => {
      const startDate = new Date('2025-01-31T10:00:00.000Z');
      const result = calculateMembershipEndDate(startDate, 'Month');

      // date-fns addMonths handles this correctly: Jan 31 + 1 month = Feb 28 (or 29)
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February
      // Could be 28 or 29 depending on leap year
      expect([28, 29]).toContain(result.getDate());
    });

    it('should handle leap year correctly', () => {
      const startDate = new Date('2024-02-29T10:00:00.000Z');
      const result = calculateMembershipEndDate(startDate, 'Year');

      // Feb 29, 2024 (leap year) + 1 year = Feb 28, 2025 (not a leap year)
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28);
    });

    it('should work with dates from getCurrentDateEST', () => {
      const estDate = getCurrentDateEST();
      const monthResult = calculateMembershipEndDate(estDate, 'Month');
      const yearResult = calculateMembershipEndDate(estDate, 'Year');

      expect(monthResult).toBeInstanceOf(Date);
      expect(yearResult).toBeInstanceOf(Date);
      expect(monthResult.getTime()).toBeLessThan(yearResult.getTime());
    });
  });

  describe('integration: complete membership date workflow', () => {
    it('should calculate and format dates correctly for annual membership', () => {
      const today = getCurrentDateEST();
      const todayFormatted = formatDateForSalesforce(today);
      const endDate = calculateMembershipEndDate(today, 'Year');
      const endDateFormatted = formatDateForSalesforce(endDate);

      expect(todayFormatted).toBe('2025-12-15');
      expect(endDateFormatted).toBe('2026-12-15');
    });

    it('should calculate and format dates correctly for monthly membership', () => {
      const today = getCurrentDateEST();
      const todayFormatted = formatDateForSalesforce(today);
      const endDate = calculateMembershipEndDate(today, 'Month');
      const endDateFormatted = formatDateForSalesforce(endDate);

      expect(todayFormatted).toBe('2025-12-15');
      expect(endDateFormatted).toBe('2026-01-15');
    });

    it('should format display date correctly', () => {
      const today = getCurrentDateEST();
      const displayDate = formatDateDisplay(today);

      expect(displayDate).toBe('12/15/2025');
    });
  });
});
