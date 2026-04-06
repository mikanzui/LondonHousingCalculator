import { describe, it, expect } from 'vitest';
import { projectDeposit } from '../js/deposit.js';

describe('projectDeposit', () => {
  it('reaches target with simple monthly savings', () => {
    const result = projectDeposit({
      currentSavings: 0,
      monthlyContribution: 1000,
      targetAmount: 12000,
      annualGrowthRate: 0,
      useLISA: false,
    });
    expect(result.targetReached).toBe(true);
    expect(result.monthsToTarget).toBe(12);
  });

  it('accounts for current savings', () => {
    const result = projectDeposit({
      currentSavings: 5000,
      monthlyContribution: 1000,
      targetAmount: 12000,
      annualGrowthRate: 0,
      useLISA: false,
    });
    expect(result.targetReached).toBe(true);
    expect(result.monthsToTarget).toBe(7);
  });

  it('accounts for additional funds', () => {
    const result = projectDeposit({
      currentSavings: 0,
      monthlyContribution: 1000,
      targetAmount: 15000,
      additionalFunds: 5000,
      annualGrowthRate: 0,
      useLISA: false,
    });
    // effectiveTarget = 15000 - 5000 = 10000
    expect(result.targetReached).toBe(true);
    expect(result.monthsToTarget).toBe(10);
    expect(result.effectiveTarget).toBe(10000);
  });

  it('returns null monthsToTarget when unreachable in 40 years', () => {
    const result = projectDeposit({
      currentSavings: 0,
      monthlyContribution: 1,
      targetAmount: 10000000,
      annualGrowthRate: 0,
      useLISA: false,
    });
    expect(result.targetReached).toBe(false);
    expect(result.monthsToTarget).toBe(null);
  });

  it('applies compound growth', () => {
    const result = projectDeposit({
      currentSavings: 10000,
      monthlyContribution: 0,
      targetAmount: 10500,
      annualGrowthRate: 10, // high rate for clear test
      useLISA: false,
    });
    expect(result.targetReached).toBe(true);
    expect(result.monthsToTarget).toBeLessThanOrEqual(7);
  });

  it('includes LISA bonus in total', () => {
    const withLisa = projectDeposit({
      currentSavings: 0,
      monthlyContribution: 300,
      targetAmount: 50000,
      annualGrowthRate: 0,
      useLISA: true,
    });
    const withoutLisa = projectDeposit({
      currentSavings: 0,
      monthlyContribution: 300,
      targetAmount: 50000,
      annualGrowthRate: 0,
      useLISA: false,
    });
    expect(withLisa.monthsToTarget).toBeLessThan(withoutLisa.monthsToTarget);
  });

  it('caps LISA contributions at £4000/year', () => {
    // £500/month × 12 = £6000/year, but LISA cap is £4000
    // So bonus = £4000 × 25% = £1000/year (not £6000 × 25% = £1500)
    const result = projectDeposit({
      currentSavings: 0,
      monthlyContribution: 500,
      targetAmount: 100000,
      annualGrowthRate: 0,
      useLISA: true,
    });
    // After year 1: 500*12 = 6000 contributions + 1000 LISA bonus = 7000
    const year1 = result.timeline.find(y => y.year === 1);
    expect(year1.lisaBonus).toBe(1000);
  });

  it('disqualifies LISA for properties over £450k', () => {
    const result = projectDeposit({
      currentSavings: 0,
      monthlyContribution: 500,
      targetAmount: 50000,
      annualGrowthRate: 0,
      useLISA: true,
      propertyPrice: 500000,
    });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('450,000');
    // Should behave like non-LISA
    const year1 = result.timeline.find(y => y.year === 1);
    expect(year1.lisaBonus).toBe(0);
  });

  it('allows LISA for properties at exactly £450k', () => {
    const result = projectDeposit({
      currentSavings: 0,
      monthlyContribution: 300,
      targetAmount: 30000,
      annualGrowthRate: 0,
      useLISA: true,
      propertyPrice: 450000,
    });
    expect(result.warnings.length).toBe(0);
    const year1 = result.timeline.find(y => y.year === 1);
    expect(year1.lisaBonus).toBeGreaterThan(0);
  });

  it('timeline grows with each year', () => {
    const result = projectDeposit({
      currentSavings: 0,
      monthlyContribution: 500,
      targetAmount: 100000,
      annualGrowthRate: 4,
      useLISA: false,
    });
    expect(result.timeline.length).toBeGreaterThan(1);
    for (let i = 1; i < result.timeline.length; i++) {
      expect(result.timeline[i].total).toBeGreaterThan(result.timeline[i - 1].total);
    }
  });

  it('returns totalAtTarget when target is reached', () => {
    const result = projectDeposit({
      currentSavings: 0,
      monthlyContribution: 1000,
      targetAmount: 6000,
      annualGrowthRate: 0,
      useLISA: false,
    });
    expect(result.totalAtTarget).toBeGreaterThanOrEqual(6000);
  });

  it('immediate target if current savings already enough', () => {
    const result = projectDeposit({
      currentSavings: 50000,
      monthlyContribution: 500,
      targetAmount: 30000,
      annualGrowthRate: 0,
      useLISA: false,
    });
    expect(result.monthsToTarget).toBe(0);
    expect(result.targetReached).toBe(true);
  });
});
