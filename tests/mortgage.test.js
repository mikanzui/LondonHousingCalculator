import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPayment,
  calculateLoanAmount,
  calculateLendingMultiple,
  calculateAffordabilityPercent,
  getRiskRating,
} from '../js/mortgage.js';

describe('calculateMonthlyPayment', () => {
  it('calculates standard 25-year mortgage at 5.5%', () => {
    // £340,000 loan, 5.5%, 25 years → £2,087.90 (standard amortisation formula)
    const result = calculateMonthlyPayment(340000, 5.5, 25);
    expect(result).toBeCloseTo(2087.90, 0);
  });

  it('calculates 30-year mortgage at 5.5%', () => {
    // £300,000 loan, 5.5%, 30 years → ~£1,703.37
    const result = calculateMonthlyPayment(300000, 5.5, 30);
    expect(result).toBeCloseTo(1703.37, 0);
  });

  it('returns 0 for zero loan amount', () => {
    expect(calculateMonthlyPayment(0, 5.5, 25)).toBe(0);
  });

  it('returns 0 for zero term', () => {
    expect(calculateMonthlyPayment(300000, 5.5, 0)).toBe(0);
  });

  it('handles 0% interest (simple division)', () => {
    // £120,000 / (10 * 12) = £1,000/month
    expect(calculateMonthlyPayment(120000, 0, 10)).toBe(1000);
  });

  it('handles very short term (1 year)', () => {
    const result = calculateMonthlyPayment(12000, 5, 1);
    expect(result).toBeGreaterThan(1000);
    expect(result).toBeLessThan(1100);
  });

  it('handles very long term (35 years)', () => {
    const result = calculateMonthlyPayment(400000, 4.5, 35);
    expect(result).toBeGreaterThan(1700);
    expect(result).toBeLessThan(1900);
  });
});

describe('calculateLoanAmount', () => {
  it('subtracts deposit from price', () => {
    expect(calculateLoanAmount(350000, 50000)).toBe(300000);
  });

  it('returns 0 if deposit exceeds price', () => {
    expect(calculateLoanAmount(100000, 150000)).toBe(0);
  });

  it('returns full price if deposit is 0', () => {
    expect(calculateLoanAmount(350000, 0)).toBe(350000);
  });
});

describe('calculateLendingMultiple', () => {
  it('calculates correct multiple', () => {
    expect(calculateLendingMultiple(200000, 50000)).toBe(4);
  });

  it('returns 0 for zero salary', () => {
    expect(calculateLendingMultiple(200000, 0)).toBe(0);
  });

  it('rounds to 1 decimal place', () => {
    expect(calculateLendingMultiple(225000, 50000)).toBe(4.5);
  });
});

describe('calculateAffordabilityPercent', () => {
  it('calculates correct percentage', () => {
    expect(calculateAffordabilityPercent(1000, 3000)).toBeCloseTo(33.3, 1);
  });

  it('returns 100 if no income', () => {
    expect(calculateAffordabilityPercent(1000, 0)).toBe(100);
  });
});

describe('getRiskRating', () => {
  it('returns safe at exactly 30%', () => {
    expect(getRiskRating(30)).toBe('safe');
  });

  it('returns safe below 30%', () => {
    expect(getRiskRating(25)).toBe('safe');
  });

  it('returns stretch at 31%', () => {
    expect(getRiskRating(31)).toBe('stretch');
  });

  it('returns stretch at exactly 45%', () => {
    expect(getRiskRating(45)).toBe('stretch');
  });

  it('returns risky above 45%', () => {
    expect(getRiskRating(46)).toBe('risky');
  });

  it('returns risky at 80%', () => {
    expect(getRiskRating(80)).toBe('risky');
  });
});
