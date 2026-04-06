/**
 * Stamp Duty (SDLT) Module — England, 2025–26
 * Pure functions — no DOM dependency.
 */

// First-time buyer bands
const FTB_BANDS = [
  { min: 0,      max: 425000,  rate: 0    },
  { min: 425000, max: 625000,  rate: 0.05 },
];
const FTB_MAX_PRICE = 625000; // Above this, standard rates apply

// Standard (non-FTB) bands
const STANDARD_BANDS = [
  { min: 0,       max: 250000,   rate: 0    },
  { min: 250000,  max: 925000,   rate: 0.05 },
  { min: 925000,  max: 1500000,  rate: 0.10 },
  { min: 1500000, max: Infinity, rate: 0.12 },
];

/**
 * Calculate stamp duty using a set of bands.
 *
 * @param {number} price - Property price
 * @param {Array} bands - Tax bands
 * @returns {number} Total stamp duty
 */
function applyBands(price, bands) {
  let duty = 0;
  for (const band of bands) {
    if (price <= band.min) break;
    const taxable = Math.min(price, band.max) - band.min;
    duty += taxable * band.rate;
  }
  return Math.round(duty * 100) / 100;
}

/**
 * Calculate SDLT for a property purchase in England.
 *
 * @param {number} propertyPrice
 * @param {boolean} [isFirstTimeBuyer=true]
 * @returns {object} { stampDuty, effectiveRate, bands }
 */
export function calculateStampDuty(propertyPrice, isFirstTimeBuyer = true) {
  let stampDuty;
  let bandsUsed;

  if (isFirstTimeBuyer && propertyPrice <= FTB_MAX_PRICE) {
    stampDuty = applyBands(propertyPrice, FTB_BANDS);
    bandsUsed = 'ftb';
  } else {
    stampDuty = applyBands(propertyPrice, STANDARD_BANDS);
    bandsUsed = 'standard';
  }

  const effectiveRate = propertyPrice > 0
    ? Math.round((stampDuty / propertyPrice) * 10000) / 100
    : 0;

  return { stampDuty, effectiveRate, bandsUsed };
}
