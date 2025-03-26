import { calculateLTV, calculateFloorPrice, getLoanBucket, isLoanMatchingLTV } from './financial';

describe('Financial Utilities', () => {
  describe('calculateLTV', () => {
    it('calculates LTV correctly', () => {
      expect(calculateLTV(50, 100)).toBe(50);
      expect(calculateLTV(75, 50)).toBe(150);
      expect(calculateLTV(100, 100)).toBe(100);
    });

    it('handles edge cases', () => {
      expect(calculateLTV(0, 100)).toBe(0);
      expect(calculateLTV(100, 0)).toBe(0);
    });
  });

  describe('calculateFloorPrice', () => {
    it('calculates floor price correctly', () => {
      expect(calculateFloorPrice(50, 50)).toBe(100);
      expect(calculateFloorPrice(75, 150)).toBe(50);
      expect(calculateFloorPrice(100, 100)).toBe(100);
    });

    it('handles edge cases', () => {
      expect(calculateFloorPrice(0, 50)).toBe(0);
      expect(calculateFloorPrice(50, 0)).toBe(0);
    });
  });

  describe('getLoanBucket', () => {
    it('returns correct bucket for integer values', () => {
      expect(getLoanBucket(50)).toBe(50);
      expect(getLoanBucket(100)).toBe(100);
      expect(getLoanBucket(0)).toBe(0);
    });

    it('handles decimal values correctly', () => {
      expect(getLoanBucket(50.5)).toBe(50);
      expect(getLoanBucket(50.9)).toBe(50);
      expect(getLoanBucket(100.1)).toBe(100);
    });

    it('respects bucket size parameter', () => {
      expect(getLoanBucket(52, 5)).toBe(50);
      expect(getLoanBucket(55, 5)).toBe(55);
      expect(getLoanBucket(58, 5)).toBe(55);
      expect(getLoanBucket(103, 10)).toBe(100);
    });
  });

  describe('isLoanMatchingLTV', () => {
    const testLoan = { principalAmountUSD: 50 };
    const floorPrice = 100;

    it('uses tolerance-based matching by default', () => {
      // Default tolerance is 5%, so for target LTV 50%, it should match 47.5-52.5%
      expect(isLoanMatchingLTV(testLoan, 50, floorPrice)).toBe(true);
      expect(isLoanMatchingLTV({ principalAmountUSD: 47.5 }, 50, floorPrice)).toBe(true);
      expect(isLoanMatchingLTV({ principalAmountUSD: 52.5 }, 50, floorPrice)).toBe(true);
      expect(isLoanMatchingLTV({ principalAmountUSD: 45 }, 50, floorPrice)).toBe(false);
    });

    it('respects custom tolerance', () => {
      expect(isLoanMatchingLTV(testLoan, 50, floorPrice, { tolerancePercent: 10 })).toBe(true);
      expect(isLoanMatchingLTV({ principalAmountUSD: 45 }, 50, floorPrice, { tolerancePercent: 10 })).toBe(true);
      expect(isLoanMatchingLTV({ principalAmountUSD: 55 }, 50, floorPrice, { tolerancePercent: 10 })).toBe(true);
    });

    it('uses exact bucket matching when exactMatch is true', () => {
      // With exact matching and default bucket size 1%
      expect(isLoanMatchingLTV(testLoan, 50, floorPrice, { exactMatch: true })).toBe(true);
      expect(isLoanMatchingLTV({ principalAmountUSD: 50.5 }, 50, floorPrice, { exactMatch: true })).toBe(true);
      expect(isLoanMatchingLTV({ principalAmountUSD: 51 }, 50, floorPrice, { exactMatch: true })).toBe(false);
    });

    it('respects bucket size with exact matching', () => {
      // With exact matching and bucket size 5%
      expect(isLoanMatchingLTV({ principalAmountUSD: 52 }, 50, floorPrice, { exactMatch: true, bucketSize: 5 })).toBe(true);
      expect(isLoanMatchingLTV({ principalAmountUSD: 54.9 }, 50, floorPrice, { exactMatch: true, bucketSize: 5 })).toBe(true);
      expect(isLoanMatchingLTV({ principalAmountUSD: 55 }, 50, floorPrice, { exactMatch: true, bucketSize: 5 })).toBe(false);
    });
  });
}); 