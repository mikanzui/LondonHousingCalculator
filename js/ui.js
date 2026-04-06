/**
 * UI Module — DOM interaction for the London Housing Calculator.
 * This is the only module that touches the DOM.
 */

import {
  calculateMonthlyPayment,
  calculateLoanAmount,
  calculateLendingMultiple,
  calculateAffordabilityPercent,
  getRiskRating,
} from './mortgage.js';

import { calculateTakeHomePay } from './tax.js';
import { calculateStampDuty } from './stamp-duty.js';

// --- DOM references ---
const form = document.getElementById('affordability-form');
const resultsSection = document.getElementById('results');

// --- Helper: format currency ---
function formatCurrency(amount) {
  return '£' + amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Helper: show inline validation error ---
function showError(input, message) {
  clearError(input);
  const error = document.createElement('span');
  error.className = 'field-error';
  error.setAttribute('role', 'alert');
  error.textContent = message;
  input.parentElement.appendChild(error);
  input.setAttribute('aria-invalid', 'true');
}

function clearError(input) {
  const existing = input.parentElement.querySelector('.field-error');
  if (existing) existing.remove();
  input.removeAttribute('aria-invalid');
}

function clearAllErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.remove());
  document.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
}

// --- Validation ---
function validateForm(data) {
  let valid = true;

  const salary = document.getElementById('salary');
  if (data.salary <= 0 || isNaN(data.salary)) {
    showError(salary, 'Salary must be greater than 0');
    valid = false;
  } else {
    clearError(salary);
  }

  const price = document.getElementById('property-price');
  if (data.propertyPrice <= 0 || isNaN(data.propertyPrice)) {
    showError(price, 'Property price must be greater than 0');
    valid = false;
  } else {
    clearError(price);
  }

  const deposit = document.getElementById('deposit');
  if (data.deposit < 0 || isNaN(data.deposit)) {
    showError(deposit, 'Deposit must be 0 or more');
    valid = false;
  } else if (data.deposit + data.additionalFunds >= data.propertyPrice) {
    showError(deposit, 'Total deposit must be less than property price');
    valid = false;
  } else {
    clearError(deposit);
  }

  const rate = document.getElementById('interest-rate');
  if (data.interestRate < 0 || data.interestRate > 15 || isNaN(data.interestRate)) {
    showError(rate, 'Interest rate must be between 0% and 15%');
    valid = false;
  } else {
    clearError(rate);
  }

  const pension = document.getElementById('pension-percent');
  if (data.pensionPercent < 0 || data.pensionPercent > 100 || isNaN(data.pensionPercent)) {
    showError(pension, 'Pension must be between 0% and 100%');
    valid = false;
  } else {
    clearError(pension);
  }

  return valid;
}

// --- Gather form data ---
function getFormData() {
  return {
    salary: parseFloat(document.getElementById('salary').value) || 0,
    propertyPrice: parseFloat(document.getElementById('property-price').value) || 0,
    deposit: parseFloat(document.getElementById('deposit').value) || 0,
    additionalFunds: parseFloat(document.getElementById('additional-funds').value) || 0,
    interestRate: parseFloat(document.getElementById('interest-rate').value),
    mortgageTerm: parseInt(document.getElementById('mortgage-term').value, 10),
    studentLoanPlan: document.getElementById('student-loan').value,
    pensionPercent: parseFloat(document.getElementById('pension-percent').value) || 0,
    salarySacrifice: document.getElementById('pension-type').value === 'sacrifice',
    isFirstTimeBuyer: document.getElementById('first-time-buyer').checked,
  };
}

// --- Risk badge HTML ---
function riskBadgeHTML(rating) {
  const map = {
    safe: { label: '✅ Safe', cls: 'badge-safe' },
    stretch: { label: '⚠️ Stretch', cls: 'badge-stretch' },
    risky: { label: '🔴 Risky', cls: 'badge-risky' },
  };
  const { label, cls } = map[rating];
  return `<span class="risk-badge ${cls}" role="status">${label}</span>`;
}

// --- Render results ---
function renderResults(data) {
  const totalDeposit = data.deposit + data.additionalFunds;
  const loanAmount = calculateLoanAmount(data.propertyPrice, totalDeposit);
  const monthlyPayment = calculateMonthlyPayment(loanAmount, data.interestRate, data.mortgageTerm);
  const lendingMultiple = calculateLendingMultiple(loanAmount, data.salary);

  const taxResult = calculateTakeHomePay({
    grossSalary: data.salary,
    studentLoanPlan: data.studentLoanPlan,
    pensionPercent: data.pensionPercent,
    salarySacrifice: data.salarySacrifice,
  });

  const affordabilityPercent = calculateAffordabilityPercent(monthlyPayment, taxResult.monthlyNet);
  const riskRating = getRiskRating(affordabilityPercent);

  const stampDutyResult = calculateStampDuty(data.propertyPrice, data.isFirstTimeBuyer);

  resultsSection.innerHTML = `
    <h2>Your Results</h2>

    <div class="result-grid">
      <div class="result-card">
        <h3>Monthly Mortgage Payment</h3>
        <p class="result-value">${formatCurrency(monthlyPayment)}</p>
      </div>

      <div class="result-card">
        <h3>Loan Amount</h3>
        <p class="result-value">${formatCurrency(loanAmount)}</p>
      </div>

      <div class="result-card">
        <h3>Lending Multiple</h3>
        <p class="result-value">${lendingMultiple}× salary</p>
      </div>

      <div class="result-card">
        <h3>Take-Home Pay (Monthly)</h3>
        <p class="result-value">${formatCurrency(taxResult.monthlyNet)}</p>
      </div>

      <div class="result-card">
        <h3>% of Income on Housing</h3>
        <p class="result-value">${affordabilityPercent}%</p>
        ${riskBadgeHTML(riskRating)}
      </div>

      <div class="result-card">
        <h3>Stamp Duty (SDLT)</h3>
        <p class="result-value">${formatCurrency(stampDutyResult.stampDuty)}</p>
        <p class="result-note">${stampDutyResult.effectiveRate}% effective rate${stampDutyResult.bandsUsed === 'ftb' ? ' (FTB relief)' : ''}</p>
      </div>
    </div>

    <details class="tax-breakdown">
      <summary>Tax Breakdown (${taxResult.grossSalary >= 0 ? '2025–26' : ''})</summary>
      <table>
        <tbody>
          <tr><td>Gross Salary</td><td>${formatCurrency(taxResult.grossSalary)}</td></tr>
          <tr><td>Pension Deduction</td><td>${formatCurrency(taxResult.pensionAmount)}</td></tr>
          <tr><td>Income Tax</td><td>${formatCurrency(taxResult.incomeTax)}</td></tr>
          <tr><td>National Insurance</td><td>${formatCurrency(taxResult.nationalInsurance)}</td></tr>
          <tr><td>Student Loan</td><td>${formatCurrency(taxResult.studentLoan)}</td></tr>
          <tr><td><strong>Annual Net Pay</strong></td><td><strong>${formatCurrency(taxResult.annualNet)}</strong></td></tr>
          <tr><td><strong>Monthly Net Pay</strong></td><td><strong>${formatCurrency(taxResult.monthlyNet)}</strong></td></tr>
        </tbody>
      </table>
    </details>
  `;

  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// --- Event listener ---
form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearAllErrors();
  const data = getFormData();
  if (validateForm(data)) {
    renderResults(data);
  }
});
