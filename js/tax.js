/**
 * UK Tax Estimator Module (2025–26 tax year)
 * Pure functions — no DOM dependency.
 */

// --- Constants: 2025–26 UK Tax Year ---

const PERSONAL_ALLOWANCE = 12570;
const PERSONAL_ALLOWANCE_TAPER_THRESHOLD = 100000;

const INCOME_TAX_BANDS = [
  { min: 0,      max: 12570,  rate: 0    },  // Personal allowance
  { min: 12570,  max: 50270,  rate: 0.20 },  // Basic rate
  { min: 50270,  max: 125140, rate: 0.40 },  // Higher rate
  { min: 125140, max: Infinity, rate: 0.45 }, // Additional rate
];

// National Insurance Class 1 employee (2025–26)
const NI_PRIMARY_THRESHOLD = 12570; // per year
const NI_UPPER_EARNINGS_LIMIT = 50270; // per year
const NI_RATE_MAIN = 0.08; // 8% between thresholds
const NI_RATE_UPPER = 0.02; // 2% above upper limit

// Student loan plans
const STUDENT_LOAN_PLANS = {
  none: { threshold: Infinity, rate: 0 },
  plan1: { threshold: 24990, rate: 0.09 },
  plan2: { threshold: 27295, rate: 0.09 },
  plan4: { threshold: 31395, rate: 0.09 },
  plan5: { threshold: 25000, rate: 0.09 },
  postgrad: { threshold: 21000, rate: 0.06 },
};

/**
 * Calculate adjusted personal allowance (tapers above £100k).
 * Reduced by £1 for every £2 over £100,000.
 *
 * @param {number} grossSalary
 * @returns {number}
 */
function getPersonalAllowance(grossSalary) {
  if (grossSalary <= PERSONAL_ALLOWANCE_TAPER_THRESHOLD) {
    return PERSONAL_ALLOWANCE;
  }
  const reduction = Math.floor((grossSalary - PERSONAL_ALLOWANCE_TAPER_THRESHOLD) / 2);
  return Math.max(0, PERSONAL_ALLOWANCE - reduction);
}

/**
 * Calculate annual Income Tax.
 *
 * @param {number} taxableIncome - Gross salary minus personal allowance (and pension if salary sacrifice)
 * @param {number} personalAllowance
 * @returns {number} Annual tax amount
 */
function calculateIncomeTax(taxableIncome, personalAllowance) {
  if (taxableIncome <= personalAllowance) return 0;

  let tax = 0;
  let remaining = taxableIncome;

  // Tax-free portion
  remaining -= personalAllowance;

  // Basic rate: personalAllowance to 50270
  const basicBand = Math.max(0, 50270 - personalAllowance);
  const basicTaxable = Math.min(remaining, basicBand);
  tax += basicTaxable * 0.20;
  remaining -= basicTaxable;

  // Higher rate: 50270 to 125140
  const higherBand = 125140 - 50270;
  const higherTaxable = Math.min(remaining, higherBand);
  tax += higherTaxable * 0.40;
  remaining -= higherTaxable;

  // Additional rate: above 125140
  if (remaining > 0) {
    tax += remaining * 0.45;
  }

  return Math.round(tax * 100) / 100;
}

/**
 * Calculate annual National Insurance (Class 1 employee).
 *
 * @param {number} grossSalary
 * @returns {number}
 */
function calculateNI(grossSalary) {
  if (grossSalary <= NI_PRIMARY_THRESHOLD) return 0;

  let ni = 0;

  // Main rate: primary threshold to upper earnings limit
  const mainBand = Math.min(grossSalary, NI_UPPER_EARNINGS_LIMIT) - NI_PRIMARY_THRESHOLD;
  ni += Math.max(0, mainBand) * NI_RATE_MAIN;

  // Upper rate: above upper earnings limit
  if (grossSalary > NI_UPPER_EARNINGS_LIMIT) {
    ni += (grossSalary - NI_UPPER_EARNINGS_LIMIT) * NI_RATE_UPPER;
  }

  return Math.round(ni * 100) / 100;
}

/**
 * Calculate annual student loan repayment.
 *
 * @param {number} grossSalary
 * @param {string} plan - 'none' | 'plan1' | 'plan2' | 'plan4' | 'plan5' | 'postgrad'
 * @returns {number}
 */
function calculateStudentLoan(grossSalary, plan) {
  const config = STUDENT_LOAN_PLANS[plan];
  if (!config || grossSalary <= config.threshold) return 0;
  return Math.round((grossSalary - config.threshold) * config.rate * 100) / 100;
}

/**
 * Calculate full UK take-home pay breakdown.
 *
 * @param {object} params
 * @param {number} params.grossSalary - Annual gross salary
 * @param {string} [params.studentLoanPlan='none'] - Student loan plan
 * @param {number} [params.pensionPercent=0] - Pension contribution as %
 * @param {boolean} [params.salarySacrifice=true] - true = salary sacrifice (before tax), false = net pay (after tax)
 * @returns {object} Breakdown of deductions and net pay
 */
export function calculateTakeHomePay({
  grossSalary,
  studentLoanPlan = 'none',
  pensionPercent = 0,
  salarySacrifice = true,
}) {
  const pensionAmount = Math.round(grossSalary * (pensionPercent / 100) * 100) / 100;

  // Salary sacrifice reduces gross before tax/NI; net pay does not
  const taxableGross = salarySacrifice
    ? grossSalary - pensionAmount
    : grossSalary;

  const personalAllowance = getPersonalAllowance(taxableGross);
  const incomeTax = calculateIncomeTax(taxableGross, personalAllowance);

  // NI is also reduced by salary sacrifice
  const niGross = salarySacrifice ? taxableGross : grossSalary;
  const nationalInsurance = calculateNI(niGross);

  const studentLoan = calculateStudentLoan(grossSalary, studentLoanPlan);

  // Net pay deduction (pension taken after tax)
  const netPayPension = salarySacrifice ? 0 : pensionAmount;

  const annualNet = taxableGross - incomeTax - nationalInsurance - studentLoan - netPayPension;
  const monthlyNet = Math.round((annualNet / 12) * 100) / 100;

  return {
    grossSalary,
    pensionAmount,
    personalAllowance,
    incomeTax,
    nationalInsurance,
    studentLoan,
    annualNet: Math.round(annualNet * 100) / 100,
    monthlyNet,
  };
}
