/**
 * Deposit Projection Module
 * Pure functions — no DOM dependency.
 */

const LISA_ANNUAL_CAP = 4000; // Max £4,000/year contributions
const LISA_BONUS_RATE = 0.25;
const LISA_PROPERTY_CAP = 450000;

/**
 * Project savings over time with optional LISA bonus.
 *
 * @param {object} params
 * @param {number} params.currentSavings - Current savings (£)
 * @param {number} params.monthlyContribution - Monthly savings (£)
 * @param {boolean} [params.useLISA=false] - Using a Lifetime ISA
 * @param {number} [params.annualGrowthRate=4] - Annual growth rate (%)
 * @param {number} params.targetAmount - Deposit target (£)
 * @param {number} [params.additionalFunds=0] - Additional funds (gift etc)
 * @param {number} [params.propertyPrice=0] - Property price (for LISA cap check)
 * @returns {object} { timeline, monthsToTarget, totalAtTarget, targetReached, warnings }
 */
export function projectDeposit({
  currentSavings,
  monthlyContribution,
  useLISA = false,
  annualGrowthRate = 4,
  targetAmount,
  additionalFunds = 0,
  propertyPrice = 0,
}) {
  const effectiveTarget = Math.max(0, targetAmount - additionalFunds);
  const monthlyGrowthRate = annualGrowthRate / 100 / 12;

  // LISA cannot be used for properties over £450,000
  const lisaDisqualified = useLISA && propertyPrice > LISA_PROPERTY_CAP;
  const effectiveLISA = useLISA && !lisaDisqualified;

  const warnings = [];
  if (lisaDisqualified) {
    warnings.push(`LISA funds cannot be used for properties over £${LISA_PROPERTY_CAP.toLocaleString()}. Bonus excluded from projection`);
  }

  const timeline = [];
  let balance = currentSavings;
  let cumulativeSaved = currentSavings;
  let cumulativeInterest = 0;
  let yearlyLISAContrib = 0;
  let totalLISABonus = 0;
  let monthsToTarget = null;
  let totalAtTarget = null;
  const maxMonths = 12 * 40; // Cap at 40 years

  for (let month = 0; month <= maxMonths; month++) {
    // Record yearly snapshot
    if (month > 0 && month % 12 === 0) {
      const yearLisaBonus = effectiveLISA ? yearlyLISAContrib * LISA_BONUS_RATE : 0;
      timeline.push({
        year: month / 12,
        month,
        saved: Math.round(cumulativeSaved * 100) / 100,
        interest: Math.round(cumulativeInterest * 100) / 100,
        lisaBonus: Math.round(yearLisaBonus * 100) / 100,
        total: Math.round(balance * 100) / 100,
      });
    }

    // Check if target reached
    if (monthsToTarget === null && balance >= effectiveTarget) {
      monthsToTarget = month;
      totalAtTarget = Math.round(balance * 100) / 100;
    }

    if (month === maxMonths) break;

    // Apply monthly growth
    const interest = balance * monthlyGrowthRate;
    cumulativeInterest += interest;
    balance += interest;

    // Add monthly contribution
    balance += monthlyContribution;
    cumulativeSaved += monthlyContribution;

    // LISA bonus (applied monthly but capped yearly)
    if (effectiveLISA && monthlyContribution > 0) {
      // Reset LISA tracking at each year boundary
      if (month > 0 && month % 12 === 0) {
        yearlyLISAContrib = 0;
      }

      const remainingCap = Math.max(0, LISA_ANNUAL_CAP - yearlyLISAContrib);
      const lisaContribThisMonth = Math.min(monthlyContribution, remainingCap);
      const bonus = lisaContribThisMonth * LISA_BONUS_RATE;

      yearlyLISAContrib += lisaContribThisMonth;
      totalLISABonus += bonus;
      balance += bonus;
    }
  }

  return {
    timeline,
    monthsToTarget: monthsToTarget === null ? null : monthsToTarget,
    totalAtTarget,
    targetReached: monthsToTarget !== null,
    effectiveTarget: Math.round(effectiveTarget * 100) / 100,
    warnings,
  };
}
