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
import { buildSearchUrl } from './rightmove.js';

// ============================================================
//  Shared State
// ============================================================
const appState = {
  salary: 0,
  propertyPrice: 0,
  deposit: 0,
  additionalFunds: 0,
  interestRate: 5.5,
  mortgageTerm: 30,
  studentLoanPlan: 'none',
  pensionPercent: 0,
  salarySacrifice: true,
  isFirstTimeBuyer: true,
};

function updateAppState(data) {
  Object.assign(appState, data);
  updateProfileBar();
  autoFillTabs();
}

// Profile bar
const profileBar = document.getElementById('profile-bar');
function updateProfileBar() {
  if (!appState.salary) { profileBar.hidden = true; return; }
  profileBar.hidden = false;
  document.getElementById('pb-salary').textContent = `£${Math.round(appState.salary).toLocaleString('en-GB')} salary`;
  document.getElementById('pb-deposit').textContent = `£${Math.round(appState.deposit + appState.additionalFunds).toLocaleString('en-GB')} deposit`;
  document.getElementById('pb-rate').textContent = `${appState.interestRate}% rate`;
  document.getElementById('pb-term').textContent = `${appState.mortgageTerm}yr term`;
}

// Auto-fill other tabs from shared state
function autoFillTabs() {
  // Deposit tab
  const depTarget = document.getElementById('dep-target');
  const depPropPrice = document.getElementById('dep-property-price');
  if (depTarget && !depTarget.value) depTarget.value = appState.deposit + appState.additionalFunds || '';
  if (depPropPrice && !depPropPrice.value && appState.propertyPrice) depPropPrice.value = appState.propertyPrice;

  // Area finder tab
  const areaSalary = document.getElementById('area-salary');
  const areaDeposit = document.getElementById('area-deposit');
  if (areaSalary && !areaSalary.value) areaSalary.value = appState.salary || '';
  if (areaDeposit && !areaDeposit.value) areaDeposit.value = appState.deposit + appState.additionalFunds || '';

  // Compare tab
  const cmpSalary = document.getElementById('cmp-salary');
  const cmpFtb = document.getElementById('cmp-ftb');
  if (cmpSalary && !cmpSalary.value) cmpSalary.value = appState.salary || '';
  if (cmpFtb) cmpFtb.checked = appState.isFirstTimeBuyer;

  // Compare property A defaults
  const cmpADeposit = document.getElementById('cmp-a-deposit');
  const cmpARate = document.getElementById('cmp-a-rate');
  const cmpBRate = document.getElementById('cmp-b-rate');
  if (cmpADeposit && !cmpADeposit.value) cmpADeposit.value = appState.deposit + appState.additionalFunds || '';
  if (cmpARate && appState.interestRate) cmpARate.value = appState.interestRate;
  if (cmpBRate && appState.interestRate) cmpBRate.value = appState.interestRate;
}

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
    // Focus management — move focus to new panel for accessibility
    if (show) {
      p.setAttribute('tabindex', '-1');
      p.focus({ preventScroll: true });
    }
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

// Apply success pulse to a results container
function pulseResults(el) {
  el.classList.remove('results-pulse');
  // Force reflow to restart animation
  void el.offsetWidth;
  el.classList.add('results-pulse');
}

// Update range slider fill track
function updateRangeFill(rangeEl) {
  const min = parseFloat(rangeEl.min) || 0;
  const max = parseFloat(rangeEl.max) || 100;
  const val = parseFloat(rangeEl.value) || 0;
  const pct = ((val - min) / (max - min)) * 100;
  rangeEl.style.setProperty('--fill', pct + '%');
}

// Set stagger index on result cards for scalable animation
function applyStaggerIndex(container) {
  container.querySelectorAll('.result-card').forEach((card, i) => {
    card.style.setProperty('--i', i);
  });
}

// ============================================================
//  Live Inline Validation (blur-based — Feedback Patterns)
// ============================================================
function addBlurValidation(id, check) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('blur', () => {
    const val = parseFloat(el.value);
    const msg = check(val);
    if (msg) showError(el, msg);
    else clearError(el);
  });
}

// Affordability tab — live validation
addBlurValidation('salary', v => (v <= 0 || isNaN(v)) ? 'Salary must be greater than 0' : null);
addBlurValidation('property-price', v => (v <= 0 || isNaN(v)) ? 'Property price must be greater than 0' : null);
addBlurValidation('deposit', v => (v < 0 || isNaN(v)) ? 'Deposit must be 0 or more' : null);
addBlurValidation('interest-rate', v => (v < 0 || v > 15 || isNaN(v)) ? 'Rate must be 0–15%' : null);

// Deposit tab — live validation
addBlurValidation('dep-monthly-contribution', v => (v <= 0 || isNaN(v)) ? 'Enter a monthly savings amount' : null);
addBlurValidation('dep-target', v => (v <= 0 || isNaN(v)) ? 'Enter a deposit target' : null);

// Area finder tab — live validation
addBlurValidation('area-salary', v => (v <= 0 || isNaN(v)) ? 'Enter your salary' : null);

// Compare tab — live validation
addBlurValidation('cmp-salary', v => (v <= 0 || isNaN(v)) ? 'Enter your salary' : null);
addBlurValidation('cmp-a-price', v => (v <= 0 || isNaN(v)) ? 'Enter price' : null);
addBlurValidation('cmp-b-price', v => (v <= 0 || isNaN(v)) ? 'Enter price' : null);

// Range slider fill initialization + live update
document.querySelectorAll('input[type="range"].has-fill').forEach(r => {
  updateRangeFill(r);
  r.addEventListener('input', () => updateRangeFill(r));
});

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

  // Budget for Rightmove search
  const budget = Math.round(d.salary * 4.5 + totalDep);
  const rmUrl = buildSearchUrl(null, { maxPrice: budget });

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
    <a href="${rmUrl}" target="_blank" rel="noopener noreferrer" class="btn-rightmove">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      Search Properties in Budget on Rightmove
    </a>
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
  applyStaggerIndex(affResults);
  pulseResults(affResults);
  affResults.scrollIntoView({ behavior: 'smooth' });
  affResults.setAttribute('tabindex', '-1');
  affResults.focus({ preventScroll: true });
}

affForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearAllErrors(affForm);
  const d = getAffData();
  if (validateAff(d)) {
    // Save to shared state
    updateAppState(d);
    renderAff(d);
  }
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
  applyStaggerIndex(depResults);
  pulseResults(depResults);

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
    { label: 'Total Saved', data: timeline.map(y => Math.round(y.total)), borderColor: '#6c5ce7', backgroundColor: 'rgba(108,92,231,0.15)', fill: true, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
  ];
  if (useLisa) {
    const cumBonus = []; let sum = 0;
    for (const y of timeline) { sum += y.lisaBonus; cumBonus.push(Math.round(sum)); }
    datasets.push({ label: 'LISA Bonus (cumulative)', data: cumBonus, borderColor: '#00b894', backgroundColor: 'rgba(0,184,148,0.15)', fill: true, tension: 0.3, borderDash: [6, 3], pointRadius: 4, pointHoverRadius: 6, pointStyle: 'rect' });
  }

  depChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true, padding: 16 } },
        tooltip: {
          callbacks: {
            label: (item) => `${item.dataset.label}: £${item.parsed.y.toLocaleString('en-GB')}`,
          },
          backgroundColor: '#252538',
          titleColor: '#e0e0ee',
          bodyColor: '#e0e0ee',
          borderColor: 'rgba(108,92,231,0.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => '£' + (v / 1000).toFixed(0) + 'k', color: '#9a9ab0', font: { family: 'Inter' } },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        x: {
          ticks: { color: '#9a9ab0', font: { family: 'Inter' } },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
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
comfortSlider.addEventListener('input', () => {
  comfortValue.textContent = comfortSlider.value + '%';
  updateRangeFill(comfortSlider);
});

async function loadBoroughData() {
  if (boroughData) return boroughData;
  try {
    const resp = await fetch('data/london-boroughs.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    boroughData = await resp.json();
    return boroughData;
  } catch (err) {
    throw new Error('Could not load borough data. Check your connection and try again.');
  }
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

  // Loading state
  areaResults.innerHTML = `<div class="skeleton" style="width:60%;height:1.5rem;margin-bottom:var(--space-sm)"></div><div class="skeleton" style="width:100%;height:6rem"></div>`;
  areaResults.hidden = false;

  let boroughs;
  try {
    boroughs = await loadBoroughData();
  } catch (err) {
    areaResults.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p>${err.message}</p>
      <button type="button" class="btn-primary" onclick="this.closest('form').requestSubmit()" style="width:auto;padding:0.5rem 1.5rem">Retry</button>
    </div>`;
    return;
  }
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
    html += `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      <p>No boroughs match your criteria.</p>
      <p>Try increasing your budget, raising the comfort level to ${Math.min(maxPct + 10, 60)}%, or selecting a different property type.</p>
    </div>`;
  } else {
    // Map property type for Rightmove
    const rmType = propType === 'any' ? '' : propType;
    const rmBeds = beds === 'any' ? '' : beds.replace('bed', '');

    html += `<div style="overflow-x:auto"><table class="borough-table"><thead><tr>`;
    html += `<th scope="col">Borough</th><th scope="col" class="text-right">Avg Price</th><th scope="col" class="text-right">Monthly</th><th scope="col" class="text-right">% Income</th><th scope="col" class="text-right">5yr Change</th><th scope="col">Rating</th><th scope="col"></th>`;
    html += `</tr></thead><tbody>`;
    for (const b of ranked) {
      const cls = b.riskRating === 'safe' ? 'borough-affordable' : b.riskRating === 'stretch' ? 'borough-stretch' : 'borough-unaffordable';
      const rmLink = b.rightmoveRegionId
        ? buildSearchUrl(b.rightmoveRegionId, { maxPrice: Math.round(maxAffordablePrice), minBeds: rmBeds, propertyType: rmType })
        : null;
      html += `<tr>`;
      html += `<td>${b.name}</td>`;
      html += `<td class="text-right">${fmtInt(b.avgPrice)}</td>`;
      html += `<td class="text-right">${fmt(b.monthlyPayment)}</td>`;
      html += `<td class="text-right ${cls}">${b.affordabilityPercent}%</td>`;
      html += `<td class="text-right">${b.change5yr > 0 ? '+' : ''}${b.change5yr}%</td>`;
      html += `<td>${riskBadgeHTML(b.riskRating)}</td>`;
      html += `<td>${rmLink ? `<a href="${rmLink}" target="_blank" rel="noopener noreferrer" class="rm-link" title="View listings on Rightmove">View Listings</a>` : ''}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table></div>`;
    html += `<p class="rm-disclaimer">Links open Rightmove in a new tab. We are not affiliated with Rightmove.</p>`;
  }

  areaResults.innerHTML = html;
  areaResults.hidden = false;
  pulseResults(areaResults);
  areaResults.scrollIntoView({ behavior: 'smooth' });
  areaResults.setAttribute('tabindex', '-1');
  areaResults.focus({ preventScroll: true });
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
  html += `<div style="overflow-x:auto"><table class="compare-table"><thead><tr><th scope="col"></th><th scope="col">Property A</th><th scope="col">Property B</th></tr></thead><tbody>`;
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
  applyStaggerIndex(cmpResults);
  pulseResults(cmpResults);
  cmpResults.scrollIntoView({ behavior: 'smooth' });
  cmpResults.setAttribute('tabindex', '-1');
  cmpResults.focus({ preventScroll: true });
});
