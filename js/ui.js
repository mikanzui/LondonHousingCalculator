/**
 * UI Module — all DOM interaction for the London Housing Calculator.
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
import { projectDeposit } from './deposit.js';
import { rankBoroughs, getBoroughPrice } from './area-finder.js';

// ============================================================
//  Tabs
// ============================================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function switchTab(tabId) {
  tabBtns.forEach(b => {
    const selected = b.dataset.tab === tabId;
    b.classList.toggle('active', selected);
    b.setAttribute('aria-selected', String(selected));
  });
  tabPanels.forEach(p => {
    const show = p.id === `tab-${tabId}`;
    p.hidden = !show;
    p.classList.toggle('active', show);
  });
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Keyboard arrow navigation on tab bar
document.querySelector('.tab-bar').addEventListener('keydown', (e) => {
  const btns = [...tabBtns];
  const idx = btns.indexOf(document.activeElement);
  if (idx === -1) return;
  let next = idx;
  if (e.key === 'ArrowRight') next = (idx + 1) % btns.length;
  else if (e.key === 'ArrowLeft') next = (idx - 1 + btns.length) % btns.length;
  else return;
  e.preventDefault();
  btns[next].focus();
  btns[next].click();
});

// ============================================================
//  Helpers
// ============================================================
function fmt(amount) {
  return '£' + amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtInt(amount) {
  return '£' + Math.round(amount).toLocaleString('en-GB');
}

function showError(input, message) {
  clearError(input);
  const span = document.createElement('span');
  span.className = 'field-error';
  span.setAttribute('role', 'alert');
  span.textContent = message;
  input.parentElement.appendChild(span);
  input.setAttribute('aria-invalid', 'true');
}

function clearError(input) {
  const existing = input.parentElement.querySelector('.field-error');
  if (existing) existing.remove();
  input.removeAttribute('aria-invalid');
}

function clearAllErrors(container) {
  (container || document).querySelectorAll('.field-error').forEach(el => el.remove());
  (container || document).querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
}

function riskBadgeHTML(rating) {
  const map = {
    safe:    { label: 'Safe',    cls: 'badge-safe' },
    stretch: { label: 'Stretch', cls: 'badge-stretch' },
    risky:   { label: 'Risky',   cls: 'badge-risky' },
  };
  const { label, cls } = map[rating];
  return `<span class="risk-badge ${cls}" role="status">${label}</span>`;
}

// ============================================================
//  1. AFFORDABILITY TAB
// ============================================================
const affForm = document.getElementById('affordability-form');
const affResults = document.getElementById('results');

function getAffData() {
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

function validateAff(d) {
  let ok = true;
  const check = (id, cond, msg) => {
    const el = document.getElementById(id);
    if (cond) { showError(el, msg); ok = false; } else clearError(el);
  };
  check('salary', d.salary <= 0 || isNaN(d.salary), 'Salary must be greater than 0');
  check('property-price', d.propertyPrice <= 0 || isNaN(d.propertyPrice), 'Property price must be greater than 0');
  check('deposit', d.deposit < 0 || isNaN(d.deposit), 'Deposit must be 0 or more');
  if (d.deposit + d.additionalFunds >= d.propertyPrice) {
    check('deposit', true, 'Total deposit must be less than property price');
  }
  check('interest-rate', d.interestRate < 0 || d.interestRate > 15 || isNaN(d.interestRate), 'Rate must be 0–15%');
  check('pension-percent', d.pensionPercent < 0 || d.pensionPercent > 100 || isNaN(d.pensionPercent), 'Pension must be 0–100%');
  return ok;
}

function renderAff(d) {
  const totalDep = d.deposit + d.additionalFunds;
  const loan = calculateLoanAmount(d.propertyPrice, totalDep);
  const monthly = calculateMonthlyPayment(loan, d.interestRate, d.mortgageTerm);
  const multiple = calculateLendingMultiple(loan, d.salary);
  const tax = calculateTakeHomePay({
    grossSalary: d.salary,
    studentLoanPlan: d.studentLoanPlan,
    pensionPercent: d.pensionPercent,
    salarySacrifice: d.salarySacrifice,
  });
  const pct = calculateAffordabilityPercent(monthly, tax.monthlyNet);
  const risk = getRiskRating(pct);
  const sdlt = calculateStampDuty(d.propertyPrice, d.isFirstTimeBuyer);

  affResults.innerHTML = `
    <h2 class="results-title">Your Results</h2>
    <div class="result-grid">
      <div class="result-card"><h3>Monthly Payment</h3><p class="result-value">${fmt(monthly)}</p></div>
      <div class="result-card"><h3>Loan Amount</h3><p class="result-value">${fmt(loan)}</p></div>
      <div class="result-card"><h3>Lending Multiple</h3><p class="result-value">${multiple}× salary</p></div>
      <div class="result-card"><h3>Take-Home (Monthly)</h3><p class="result-value">${fmt(tax.monthlyNet)}</p></div>
      <div class="result-card"><h3>% of Income on Housing</h3><p class="result-value">${pct}%</p>${riskBadgeHTML(risk)}</div>
      <div class="result-card"><h3>Stamp Duty (SDLT)</h3><p class="result-value">${fmt(sdlt.stampDuty)}</p><p class="result-note">${sdlt.effectiveRate}% effective${sdlt.bandsUsed === 'ftb' ? ' · FTB relief' : ''}</p></div>
    </div>
    <details class="tax-breakdown">
      <summary>Tax Breakdown (2025–26)</summary>
      <table><tbody>
        <tr><td>Gross Salary</td><td>${fmt(tax.grossSalary)}</td></tr>
        <tr><td>Pension Deduction</td><td>${fmt(tax.pensionAmount)}</td></tr>
        <tr><td>Income Tax</td><td>${fmt(tax.incomeTax)}</td></tr>
        <tr><td>National Insurance</td><td>${fmt(tax.nationalInsurance)}</td></tr>
        <tr><td>Student Loan</td><td>${fmt(tax.studentLoan)}</td></tr>
        <tr class="sep"><td><strong>Annual Net Pay</strong></td><td><strong>${fmt(tax.annualNet)}</strong></td></tr>
        <tr class="sep"><td><strong>Monthly Net Pay</strong></td><td><strong>${fmt(tax.monthlyNet)}</strong></td></tr>
      </tbody></table>
    </details>`;
  affResults.hidden = false;
  affResults.scrollIntoView({ behavior: 'smooth' });
}

affForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearAllErrors(affForm);
  const d = getAffData();
  if (validateAff(d)) renderAff(d);
});

// ============================================================
//  2. DEPOSIT TAB
// ============================================================
const depForm = document.getElementById('deposit-form');
const depResults = document.getElementById('deposit-results');
const depChartContainer = document.getElementById('deposit-chart-container');
let depChart = null;

depForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearAllErrors(depForm);

  const monthly = parseFloat(document.getElementById('dep-monthly-contribution').value) || 0;
  const target = parseFloat(document.getElementById('dep-target').value) || 0;
  const current = parseFloat(document.getElementById('dep-current-savings').value) || 0;
  const additional = parseFloat(document.getElementById('dep-additional').value) || 0;
  const growth = parseFloat(document.getElementById('dep-growth-rate').value) || 0;
  const propPrice = parseFloat(document.getElementById('dep-property-price').value) || 0;
  const useLisa = document.getElementById('dep-lisa').checked;

  let ok = true;
  if (monthly <= 0) { showError(document.getElementById('dep-monthly-contribution'), 'Enter a monthly savings amount'); ok = false; }
  if (target <= 0) { showError(document.getElementById('dep-target'), 'Enter a deposit target'); ok = false; }
  if (!ok) return;

  const proj = projectDeposit({
    currentSavings: current,
    monthlyContribution: monthly,
    additionalFunds: additional,
    targetAmount: target,
    annualGrowthRate: growth,
    useLISA: useLisa,
    propertyPrice: propPrice,
  });

  // Summary
  let html = `<h2 class="results-title">Deposit Projection</h2>`;
  html += `<div class="result-grid">`;
  html += `<div class="result-card"><h3>Months to Target</h3><p class="result-value">${proj.monthsToTarget === null ? '40+ years' : proj.monthsToTarget + ' months'}</p>`;
  if (proj.monthsToTarget) { const y = Math.floor(proj.monthsToTarget / 12); const m = proj.monthsToTarget % 12; html += `<p class="result-note">${y}y ${m}m</p>`; }
  html += `</div>`;
  html += `<div class="result-card"><h3>Total Saved at Target</h3><p class="result-value">${fmtInt(proj.totalAtTarget || proj.timeline[proj.timeline.length - 1].total)}</p></div>`;
  if (useLisa) {
    const totalBonus = proj.timeline.reduce((s, y) => s + y.lisaBonus, 0);
    html += `<div class="result-card"><h3>LISA Bonus Total</h3><p class="result-value">${fmtInt(totalBonus)}</p></div>`;
  }
  html += `</div>`;

  if (proj.warnings && proj.warnings.length) {
    html += `<div class="info-note" style="margin-top:0.75rem"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>${proj.warnings.join('. ')}</div>`;
  }

  // Timeline table
  if (proj.timeline.length) {
    html += `<table class="dep-timeline"><thead><tr><th>Year</th><th>Saved</th><th>Interest</th>`;
    if (useLisa) html += `<th>LISA Bonus</th>`;
    html += `<th>Total</th></tr></thead><tbody>`;
    for (const yr of proj.timeline) {
      const hitClass = proj.monthsToTarget && yr.year === Math.ceil(proj.monthsToTarget / 12) ? ' class="hit-target"' : '';
      html += `<tr${hitClass}><td>${yr.year}</td><td>${fmtInt(yr.saved)}</td><td>${fmtInt(yr.interest)}</td>`;
      if (useLisa) html += `<td>${fmtInt(yr.lisaBonus)}</td>`;
      html += `<td>${fmtInt(yr.total)}</td></tr>`;
    }
    html += `</tbody></table>`;
  }

  depResults.innerHTML = html;
  depResults.hidden = false;

  // Chart
  renderDepositChart(proj.timeline, useLisa, target);
});

function renderDepositChart(timeline, useLisa, target) {
  if (typeof Chart === 'undefined') { depChartContainer.hidden = true; return; }
  depChartContainer.hidden = false;
  const ctx = document.getElementById('deposit-chart').getContext('2d');
  if (depChart) depChart.destroy();

  const labels = timeline.map(y => `Year ${y.year}`);
  const datasets = [
    { label: 'Total Saved', data: timeline.map(y => Math.round(y.total)), borderColor: '#0984e3', backgroundColor: 'rgba(9,132,227,0.1)', fill: true, tension: 0.3 },
  ];
  if (useLisa) {
    const cumBonus = []; let sum = 0;
    for (const y of timeline) { sum += y.lisaBonus; cumBonus.push(Math.round(sum)); }
    datasets.push({ label: 'LISA Bonus (cumulative)', data: cumBonus, borderColor: '#48bb78', backgroundColor: 'rgba(72,187,120,0.1)', fill: true, tension: 0.3 });
  }

  depChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        annotation: target ? { annotations: { target: { type: 'line', yMin: target, yMax: target, borderColor: '#f56565', borderDash: [5, 5], label: { content: 'Target', display: true } } } } : undefined,
        legend: { position: 'bottom', labels: { font: { family: 'Inter' } } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => '£' + (v / 1000).toFixed(0) + 'k' } },
      },
    },
  });
}

// ============================================================
//  3. AREA FINDER TAB
// ============================================================
const areaForm = document.getElementById('area-form');
const areaResults = document.getElementById('area-results');
let boroughData = null;

// Comfort slider live update
const comfortSlider = document.getElementById('area-comfort');
const comfortValue = document.getElementById('area-comfort-value');
comfortSlider.addEventListener('input', () => { comfortValue.textContent = comfortSlider.value + '%'; });

async function loadBoroughData() {
  if (boroughData) return boroughData;
  const resp = await fetch('data/london-boroughs.json');
  boroughData = await resp.json();
  return boroughData;
}

areaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors(areaForm);

  const salary = parseFloat(document.getElementById('area-salary').value) || 0;
  const deposit = parseFloat(document.getElementById('area-deposit').value) || 0;
  const propType = document.getElementById('area-type').value;
  const beds = document.getElementById('area-beds').value;
  const multiple = parseFloat(document.getElementById('area-multiple').value);
  const sortBy = document.getElementById('area-sort').value;
  const maxPct = parseInt(comfortSlider.value, 10);

  if (salary <= 0) { showError(document.getElementById('area-salary'), 'Enter your salary'); return; }

  const boroughs = await loadBoroughData();
  const maxAffordablePrice = salary * multiple + deposit;

  // Pre-compute net monthly income for affordability %
  const tax = calculateTakeHomePay({ grossSalary: salary, studentLoanPlan: 'none', pensionPercent: 0, salarySacrifice: false });

  const ranked = rankBoroughs({
    boroughs,
    maxAffordablePrice,
    netMonthlyIncome: tax.monthlyNet,
    interestRate: 5.5,
    mortgageTerm: 30,
    deposit,
    propertyType: propType === 'any' ? 'any' : propType,
    bedrooms: beds === 'any' ? 'any' : beds,
    maxAffordabilityPercent: maxPct,
    sortBy,
  });

  let html = `<h2 class="results-title">Affordable Boroughs</h2>`;
  html += `<p class="result-note" style="margin-bottom:0.5rem">Budget: ${fmtInt(maxAffordablePrice)} (${multiple}× salary + deposit) · Max ${maxPct}% of income on housing</p>`;

  if (ranked.length === 0) {
    html += `<p style="padding:1rem; text-align:center; color:var(--clr-text-muted)">No boroughs match your criteria. Try increasing your budget or comfort level.</p>`;
  } else {
    html += `<div style="overflow-x:auto"><table class="borough-table"><thead><tr>`;
    html += `<th>Borough</th><th class="text-right">Avg Price</th><th class="text-right">Monthly</th><th class="text-right">% Income</th><th class="text-right">5yr Change</th><th>Rating</th>`;
    html += `</tr></thead><tbody>`;
    for (const b of ranked) {
      const cls = b.riskRating === 'safe' ? 'borough-affordable' : b.riskRating === 'stretch' ? 'borough-stretch' : 'borough-unaffordable';
      html += `<tr>`;
      html += `<td>${b.name}</td>`;
      html += `<td class="text-right">${fmtInt(b.avgPrice)}</td>`;
      html += `<td class="text-right">${fmt(b.monthlyPayment)}</td>`;
      html += `<td class="text-right ${cls}">${b.affordabilityPercent}%</td>`;
      html += `<td class="text-right">${b.change5yr > 0 ? '+' : ''}${b.change5yr}%</td>`;
      html += `<td>${riskBadgeHTML(b.riskRating)}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table></div>`;
  }

  areaResults.innerHTML = html;
  areaResults.hidden = false;
  areaResults.scrollIntoView({ behavior: 'smooth' });
});

// ============================================================
//  4. COMPARE TAB
// ============================================================
const cmpForm = document.getElementById('compare-form');
const cmpResults = document.getElementById('compare-results');

cmpForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearAllErrors(cmpForm);

  const salary = parseFloat(document.getElementById('cmp-salary').value) || 0;
  const ftb = document.getElementById('cmp-ftb').checked;
  if (salary <= 0) { showError(document.getElementById('cmp-salary'), 'Enter your salary'); return; }

  function getProp(prefix) {
    return {
      price: parseFloat(document.getElementById(`cmp-${prefix}-price`).value) || 0,
      deposit: parseFloat(document.getElementById(`cmp-${prefix}-deposit`).value) || 0,
      rate: parseFloat(document.getElementById(`cmp-${prefix}-rate`).value) || 5.5,
      term: parseInt(document.getElementById(`cmp-${prefix}-term`).value, 10),
      service: parseFloat(document.getElementById(`cmp-${prefix}-service`).value) || 0,
      ground: parseFloat(document.getElementById(`cmp-${prefix}-ground`).value) || 0,
    };
  }

  const a = getProp('a');
  const b = getProp('b');

  if (a.price <= 0) { showError(document.getElementById('cmp-a-price'), 'Enter price'); return; }
  if (b.price <= 0) { showError(document.getElementById('cmp-b-price'), 'Enter price'); return; }

  const tax = calculateTakeHomePay({ grossSalary: salary, studentLoanPlan: 'none', pensionPercent: 0, salarySacrifice: false });

  function calcProp(p) {
    const loan = calculateLoanAmount(p.price, p.deposit);
    const monthly = calculateMonthlyPayment(loan, p.rate, p.term);
    const totalMonthly = monthly + p.service + p.ground;
    const pct = calculateAffordabilityPercent(totalMonthly, tax.monthlyNet);
    const risk = getRiskRating(pct);
    const sdlt = calculateStampDuty(p.price, ftb);
    const multiple = calculateLendingMultiple(loan, salary);
    const totalCost = monthly * p.term * 12;
    return { loan, monthly, totalMonthly, pct, risk, sdlt, multiple, totalCost, ...p };
  }

  const ca = calcProp(a);
  const cb = calcProp(b);

  function winTag(valA, valB, lowerBetter = true) {
    if (valA === valB) return ['', ''];
    const aWins = lowerBetter ? valA < valB : valA > valB;
    return [aWins ? ' class="winner"' : '', !aWins ? ' class="winner"' : ''];
  }

  const rows = [
    ['Property Price', fmtInt(ca.price), fmtInt(cb.price), winTag(ca.price, cb.price)],
    ['Deposit', fmtInt(ca.deposit), fmtInt(cb.deposit), winTag(ca.deposit, cb.deposit)],
    ['Loan Amount', fmtInt(ca.loan), fmtInt(cb.loan), winTag(ca.loan, cb.loan)],
    ['Interest Rate', ca.rate + '%', cb.rate + '%', winTag(ca.rate, cb.rate)],
    ['Mortgage Term', ca.term + ' yrs', cb.term + ' yrs', ['', '']],
    ['Monthly Mortgage', fmt(ca.monthly), fmt(cb.monthly), winTag(ca.monthly, cb.monthly)],
    ['Service Charge', fmt(ca.service), fmt(cb.service), winTag(ca.service, cb.service)],
    ['Ground Rent', fmt(ca.ground), fmt(cb.ground), winTag(ca.ground, cb.ground)],
    ['Total Monthly Cost', fmt(ca.totalMonthly), fmt(cb.totalMonthly), winTag(ca.totalMonthly, cb.totalMonthly)],
    ['% of Income', ca.pct + '%', cb.pct + '%', winTag(ca.pct, cb.pct)],
    ['Lending Multiple', ca.multiple + '×', cb.multiple + '×', winTag(ca.multiple, cb.multiple)],
    ['Stamp Duty', fmt(ca.sdlt.stampDuty), fmt(cb.sdlt.stampDuty), winTag(ca.sdlt.stampDuty, cb.sdlt.stampDuty)],
    ['Total Repaid', fmtInt(ca.totalCost), fmtInt(cb.totalCost), winTag(ca.totalCost, cb.totalCost)],
  ];

  let html = `<h2 class="results-title">Comparison</h2>`;
  html += `<div style="overflow-x:auto"><table class="compare-table"><thead><tr><th></th><th>Property A</th><th>Property B</th></tr></thead><tbody>`;
  for (const [label, va, vb, [clsA, clsB]] of rows) {
    html += `<tr><td>${label}</td><td${clsA}>${va}</td><td${clsB}>${vb}</td></tr>`;
  }
  html += `</tbody></table></div>`;

  html += `<div class="result-grid" style="margin-top:0.75rem">`;
  html += `<div class="result-card"><h3>Property A Risk</h3><p>${riskBadgeHTML(ca.risk)}</p></div>`;
  html += `<div class="result-card"><h3>Property B Risk</h3><p>${riskBadgeHTML(cb.risk)}</p></div>`;
  html += `</div>`;

  cmpResults.innerHTML = html;
  cmpResults.hidden = false;
  cmpResults.scrollIntoView({ behavior: 'smooth' });
});
