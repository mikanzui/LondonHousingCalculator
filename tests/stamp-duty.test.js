import { describe, it, expect } from 'vitest';
import { calculateStampDuty } from '../js/stamp-duty.js';

describe('calculateStampDuty', () => {
  describe('first-time buyer relief', () => {
    it('£0 stamp duty for property at £300,000', () => {
      const result = calculateStampDuty(300000, true);
      expect(result.stampDuty).toBe(0);
      expect(result.bandsUsed).toBe('ftb');
    });

    it('£0 stamp duty at exactly £425,000', () => {
      const result = calculateStampDuty(425000, true);
      expect(result.stampDuty).toBe(0);
      expect(result.bandsUsed).toBe('ftb');
    });

    it('stamp duty at £500,000 (FTB)', () => {
      // (500000 - 425000) * 0.05 = £3,750
      const result = calculateStampDuty(500000, true);
      expect(result.stampDuty).toBe(3750);
      expect(result.bandsUsed).toBe('ftb');
    });

    it('stamp duty at exactly £625,000 (FTB boundary)', () => {
      // (625000 - 425000) * 0.05 = £10,000
      const result = calculateStampDuty(625000, true);
      expect(result.stampDuty).toBe(10000);
      expect(result.bandsUsed).toBe('ftb');
    });

    it('no FTB relief above £625,000 — falls to standard rates', () => {
      // £650,000 with FTB flag but exceeds limit, uses standard:
      // (250000 * 0) + (400000 * 0.05) = £20,000
      const result = calculateStampDuty(650000, true);
      expect(result.stampDuty).toBe(20000);
      expect(result.bandsUsed).toBe('standard');
    });
  });

  describe('standard rates (non-FTB)', () => {
    it('£0 stamp duty at £200,000', () => {
      const result = calculateStampDuty(200000, false);
      expect(result.stampDuty).toBe(0);
      expect(result.bandsUsed).toBe('standard');
    });

    it('stamp duty at £300,000', () => {
      // (250000 * 0) + (50000 * 0.05) = £2,500
      const result = calculateStampDuty(300000, false);
      expect(result.stampDuty).toBe(2500);
    });

    it('stamp duty at £500,000', () => {
      // (250000 * 0) + (250000 * 0.05) = £12,500
      const result = calculateStampDuty(500000, false);
      expect(result.stampDuty).toBe(12500);
    });

    it('stamp duty at £1,000,000', () => {
      // (250000 * 0) + (675000 * 0.05) + (75000 * 0.10) = £41,250
      const result = calculateStampDuty(1000000, false);
      expect(result.stampDuty).toBe(41250);
    });

    it('stamp duty at £2,000,000', () => {
      // (250000 * 0) + (675000 * 0.05) + (575000 * 0.10) + (500000 * 0.12)
      // = 0 + 33750 + 57500 + 60000 = £151,250
      const result = calculateStampDuty(2000000, false);
      expect(result.stampDuty).toBe(151250);
    });
  });

  describe('effective rate', () => {
    it('calculates effective rate for £500k FTB', () => {
      const result = calculateStampDuty(500000, true);
      // 3750 / 500000 = 0.75%
      expect(result.effectiveRate).toBe(0.75);
    });

    it('returns 0 effective rate for £0 property', () => {
      const result = calculateStampDuty(0, true);
      expect(result.effectiveRate).toBe(0);
    });
  });
});
