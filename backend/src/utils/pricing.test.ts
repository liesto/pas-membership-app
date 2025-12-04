import { describe, it, expect } from 'vitest';
import { calculateMembershipPrice } from './pricing';

describe('pricing', () => {
  describe('calculateMembershipPrice', () => {
    describe('Bronze membership', () => {
      it('should return $50 for annual Bronze membership', () => {
        const result = calculateMembershipPrice('Bronze', 'Year');
        expect(result).toBe(50);
      });

      it('should return $5 for monthly Bronze membership', () => {
        const result = calculateMembershipPrice('Bronze', 'Month');
        expect(result).toBe(5);
      });
    });

    describe('Silver membership', () => {
      it('should return $100 for annual Silver membership', () => {
        const result = calculateMembershipPrice('Silver', 'Year');
        expect(result).toBe(100);
      });

      it('should return $10 for monthly Silver membership', () => {
        const result = calculateMembershipPrice('Silver', 'Month');
        expect(result).toBe(10);
      });
    });

    describe('Gold membership', () => {
      it('should return $250 for annual Gold membership', () => {
        const result = calculateMembershipPrice('Gold', 'Year');
        expect(result).toBe(250);
      });

      it('should return $25 for monthly Gold membership', () => {
        const result = calculateMembershipPrice('Gold', 'Month');
        expect(result).toBe(25);
      });
    });

    describe('error handling', () => {
      it('should throw error for invalid membership level', () => {
        expect(() => {
          // @ts-expect-error Testing invalid input
          calculateMembershipPrice('Platinum', 'Year');
        }).toThrow('Invalid membership combination');
      });

      it('should throw error for invalid membership term', () => {
        expect(() => {
          // @ts-expect-error Testing invalid input
          calculateMembershipPrice('Bronze', 'Weekly');
        }).toThrow('Invalid membership combination');
      });

      it('should throw error for invalid combination', () => {
        expect(() => {
          // @ts-expect-error Testing invalid input
          calculateMembershipPrice('Invalid', 'Invalid');
        }).toThrow('Invalid membership combination');
      });
    });

    describe('pricing relationships', () => {
      it('should have annual price approximately equal to 10x monthly price for Bronze', () => {
        const annual = calculateMembershipPrice('Bronze', 'Year');
        const monthly = calculateMembershipPrice('Bronze', 'Month');
        expect(annual).toBe(monthly * 10);
      });

      it('should have annual price approximately equal to 10x monthly price for Silver', () => {
        const annual = calculateMembershipPrice('Silver', 'Year');
        const monthly = calculateMembershipPrice('Silver', 'Month');
        expect(annual).toBe(monthly * 10);
      });

      it('should have annual price approximately equal to 10x monthly price for Gold', () => {
        const annual = calculateMembershipPrice('Gold', 'Year');
        const monthly = calculateMembershipPrice('Gold', 'Month');
        expect(annual).toBe(monthly * 10);
      });

      it('should have Silver cost 2x Bronze for annual', () => {
        const bronze = calculateMembershipPrice('Bronze', 'Year');
        const silver = calculateMembershipPrice('Silver', 'Year');
        expect(silver).toBe(bronze * 2);
      });

      it('should have Silver cost 2x Bronze for monthly', () => {
        const bronze = calculateMembershipPrice('Bronze', 'Month');
        const silver = calculateMembershipPrice('Silver', 'Month');
        expect(silver).toBe(bronze * 2);
      });

      it('should have Gold cost 5x Bronze for annual', () => {
        const bronze = calculateMembershipPrice('Bronze', 'Year');
        const gold = calculateMembershipPrice('Gold', 'Year');
        expect(gold).toBe(bronze * 5);
      });

      it('should have Gold cost 5x Bronze for monthly', () => {
        const bronze = calculateMembershipPrice('Bronze', 'Month');
        const gold = calculateMembershipPrice('Gold', 'Month');
        expect(gold).toBe(bronze * 5);
      });
    });

    describe('return type', () => {
      it('should return a number', () => {
        const result = calculateMembershipPrice('Silver', 'Year');
        expect(typeof result).toBe('number');
      });

      it('should return a positive number', () => {
        const result = calculateMembershipPrice('Bronze', 'Month');
        expect(result).toBeGreaterThan(0);
      });

      it('should return an integer (no decimals)', () => {
        const result = calculateMembershipPrice('Gold', 'Year');
        expect(Number.isInteger(result)).toBe(true);
      });
    });
  });
});
