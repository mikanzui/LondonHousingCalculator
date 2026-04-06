import { describe, it, expect } from 'vitest';
import { calculateTakeHomePay } from '../js/tax.js';

describe('calculateTakeHomePay', () => {
  describe('basic rate taxpayer', () => {
    it('calculates correct net for £30,000 salary, no deductions', () => {
      const result = calculateTakeHomePay({ grossSalary: 30000 });
      // Tax: (30000 - 12570) * 0.20 = £3,486
      expect(result.incomeTax).toBeCloseTo(3486, 0);
      // NI: (30000 - 12570) * 0.08 = £1,394.40
      expect(result.nationalInsurance).toBeCloseTo(1394.40, 0);
      // Net: 30000 - 3486 - 1394.40 = £25,119.60
      expect(result.annualNet).toBeCloseTo(25119.60, 0);
      expect(result.monthlyNet).toBeCloseTo(2093.30, 0);
    });

    it('calculates correct net for £25,000 salary', () => {
      const result = calculateTakeHomePay({ grossSalary: 25000 });
      // Tax: (25000 - 12570) * 0.20 = £2,486
      expect(result.incomeTax).toBeCloseTo(2486, 0);
      expect(result.studentLoan).toBe(0);
    });
  });

  describe('higher rate taxpayer', () => {
    it('calculates correct net for £60,000 salary', () => {
      const result = calculateTakeHomePay({ grossSalary: 60000 });
      // Basic band: (50270 - 12570) * 0.20 = £7,540
      // Higher band: (60000 - 50270) * 0.40 = £3,892
      // Total tax: £11,432
      expect(result.incomeTax).toBeCloseTo(11432, 0);
      // NI main: (50270 - 12570) * 0.08 = £3,016
      // NI upper: (60000 - 50270) * 0.02 = £194.60
      // Total NI: £3,210.60
      expect(result.nationalInsurance).toBeCloseTo(3210.60, 0);
    });
  });

  describe('additional rate taxpayer', () => {
    it('calculates correct net for £150,000 salary', () => {
      const result = calculateTakeHomePay({ grossSalary: 150000 });
      // Personal allowance tapers: (150000 - 100000) / 2 = 25000 reduction → PA = 0
      expect(result.personalAllowance).toBe(0);
      // With PA = 0: basic (0 to 50270-0=50270) = 50270 * 0.20 = 10054
      // Wait, recalculate with PA = 0:
      // Tax: 50270 * 0.20 + (125140 - 50270) * 0.40 + (150000 - 125140) * 0.45
      // = 10054 + 29948 + 11187 = 51189
      expect(result.incomeTax).toBeCloseTo(51189, 0);
    });

    it('tapers personal allowance above £100k', () => {
      const result = calculateTakeHomePay({ grossSalary: 110000 });
      // Reduction: (110000 - 100000) / 2 = 5000
      // PA: 12570 - 5000 = 7570
      expect(result.personalAllowance).toBe(7570);
    });
  });

  describe('student loans', () => {
    it('calculates Plan 1 deduction', () => {
      const result = calculateTakeHomePay({ grossSalary: 35000, studentLoanPlan: 'plan1' });
      // (35000 - 24990) * 0.09 = £900.90
      expect(result.studentLoan).toBeCloseTo(900.90, 0);
    });

    it('calculates Plan 2 deduction', () => {
      const result = calculateTakeHomePay({ grossSalary: 35000, studentLoanPlan: 'plan2' });
      // (35000 - 27295) * 0.09 = £693.45
      expect(result.studentLoan).toBeCloseTo(693.45, 0);
    });

    it('calculates Plan 4 deduction', () => {
      const result = calculateTakeHomePay({ grossSalary: 40000, studentLoanPlan: 'plan4' });
      // (40000 - 31395) * 0.09 = £774.45
      expect(result.studentLoan).toBeCloseTo(774.45, 0);
    });

    it('calculates Plan 5 deduction', () => {
      const result = calculateTakeHomePay({ grossSalary: 35000, studentLoanPlan: 'plan5' });
      // (35000 - 25000) * 0.09 = £900
      expect(result.studentLoan).toBe(900);
    });

    it('calculates Postgraduate loan deduction', () => {
      const result = calculateTakeHomePay({ grossSalary: 35000, studentLoanPlan: 'postgrad' });
      // (35000 - 21000) * 0.06 = £840
      expect(result.studentLoan).toBe(840);
    });

    it('no deduction when below threshold', () => {
      const result = calculateTakeHomePay({ grossSalary: 20000, studentLoanPlan: 'plan1' });
      expect(result.studentLoan).toBe(0);
    });
  });

  describe('pension - salary sacrifice', () => {
    it('reduces taxable income before tax/NI', () => {
      const withPension = calculateTakeHomePay({
        grossSalary: 50000,
        pensionPercent: 5,
        salarySacrifice: true,
      });
      const withoutPension = calculateTakeHomePay({ grossSalary: 50000 });

      // Pension: 50000 * 0.05 = £2,500
      expect(withPension.pensionAmount).toBe(2500);
      // Tax should be lower with pension (smaller taxable income)
      expect(withPension.incomeTax).toBeLessThan(withoutPension.incomeTax);
      // NI should also be lower
      expect(withPension.nationalInsurance).toBeLessThan(withoutPension.nationalInsurance);
    });
  });

  describe('pension - net pay (after tax)', () => {
    it('does not reduce taxable income', () => {
      const netPay = calculateTakeHomePay({
        grossSalary: 50000,
        pensionPercent: 5,
        salarySacrifice: false,
      });
      const withoutPension = calculateTakeHomePay({ grossSalary: 50000 });

      // Tax and NI should be the same as without pension
      expect(netPay.incomeTax).toBe(withoutPension.incomeTax);
      expect(netPay.nationalInsurance).toBe(withoutPension.nationalInsurance);
      // But net pay should be lower due to pension deduction
      expect(netPay.annualNet).toBeLessThan(withoutPension.annualNet);
    });
  });

  describe('edge cases', () => {
    it('handles salary below personal allowance', () => {
      const result = calculateTakeHomePay({ grossSalary: 10000 });
      expect(result.incomeTax).toBe(0);
      expect(result.nationalInsurance).toBe(0);
      expect(result.annualNet).toBe(10000);
    });

    it('handles zero salary', () => {
      const result = calculateTakeHomePay({ grossSalary: 0 });
      expect(result.incomeTax).toBe(0);
      expect(result.nationalInsurance).toBe(0);
      expect(result.annualNet).toBe(0);
    });
  });
});
