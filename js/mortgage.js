/**
 * Mortgage Calculator Module
 * Pure functions — no DOM dependency.
 */

/**
 * Calculate monthly mortgage payment using standard amortisation formula.
 * M = P * r(1+r)^n / ((1+r)^n - 1)
 *
 * @param {number} loanAmount - Loan principal (£)
 * @param {number} annualRate - Annual interest rate as percentage (e.g. 5.5)
 * @param {number} termYears - Mortgage term in years
 * @returns {number} Monthly payment (£), rounded to 2 decimal places
 */
export function calculateMonthlyPayment(loanAmount, annualRate, termYears) {
  if (loanAmount <= 0) return 0;
  if (termYears <= 0) return 0;

  // 0% interest — simple division
  if (annualRate === 0) {
    return Math.round((loanAmount / (termYears * 12)) * 100) / 100;
  }

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const factor = Math.pow(1 + monthlyRate, numPayments);

  const monthly = loanAmount * (monthlyRate * factor) / (factor - 1);
  return Math.round(monthly * 100) / 100;
}

/**
 * Calculate loan amount from property price and total deposit.
 *
 * @param {number} propertyPrice
 * @param {number} totalDeposit - Own deposit + additional funds
 * @returns {number}
 */
export function calculateLoanAmount(propertyPrice, totalDeposit) {
  return Math.max(0, propertyPrice - totalDeposit);
}

/**
 * Calculate lending multiple (how many times salary the loan is).
 *
 * @param {number} loanAmount
 * @param {number} grossAnnualSalary
 * @returns {number} Multiple, rounded to 1 decimal place
 */
export function calculateLendingMultiple(loanAmount, grossAnnualSalary) {
  if (grossAnnualSalary <= 0) return 0;
  return Math.round((loanAmount / grossAnnualSalary) * 10) / 10;
}

/**
 * Calculate the % of net monthly income spent on housing.
 *
 * @param {number} totalMonthlyCost - Mortgage + service charge + ground rent
 * @param {number} netMonthlyIncome
 * @returns {number} Percentage, rounded to 1 decimal place
 */
export function calculateAffordabilityPercent(totalMonthlyCost, netMonthlyIncome) {
  if (netMonthlyIncome <= 0) return 100;
  return Math.round((totalMonthlyCost / netMonthlyIncome) * 1000) / 10;
}

/**
 * Determine risk rating from affordability percentage.
 *
 * @param {number} percent - % of income on housing
 * @returns {'safe' | 'stretch' | 'risky'}
 */
export function getRiskRating(percent) {
  if (percent <= 30) return 'safe';
  if (percent <= 45) return 'stretch';
  return 'risky';
}
