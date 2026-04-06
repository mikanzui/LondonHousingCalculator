/**
 * Area Finder Module
 * Pure functions — no DOM dependency.
 */

import {
  calculateMonthlyPayment,
  calculateAffordabilityPercent,
  getRiskRating,
} from './mortgage.js';

/**
 * Get the average price for a borough given filters.
 *
 * @param {object} borough - Borough data object
 * @param {string} propertyType - 'any' | 'flat' | 'terraced' | 'semi' | 'detached'
 * @param {string} bedrooms - 'any' | '1bed' | '2bed' | '3bed' | '4bed'
 * @returns {number|null} Average price or null if no data
 */
export function getBoroughPrice(borough, propertyType = 'any', bedrooms = 'any') {
  const types = propertyType === 'any'
    ? ['flat', 'terraced', 'semi', 'detached']
    : [propertyType];

  const prices = [];
  for (const type of types) {
    const typeData = borough.prices[type];
    if (!typeData) continue;

    if (bedrooms === 'any') {
      if (typeData.avg != null) prices.push(typeData.avg);
    } else {
      if (typeData[bedrooms] != null) prices.push(typeData[bedrooms]);
    }
  }

  if (prices.length === 0) return null;
  return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
}

/**
 * Rank boroughs by affordability.
 *
 * @param {object} params
 * @param {Array} params.boroughs - Array of borough data objects
 * @param {number} params.maxAffordablePrice - Max price user can afford
 * @param {number} params.netMonthlyIncome - User's monthly net income
 * @param {number} params.interestRate - Annual interest rate (%)
 * @param {number} params.mortgageTerm - Mortgage term (years)
 * @param {number} params.deposit - Total deposit
 * @param {string} [params.propertyType='any'] - Property type filter
 * @param {string} [params.bedrooms='any'] - Bedroom filter
 * @param {number} [params.maxAffordabilityPercent=100] - Max % income filter
 * @param {string} [params.sortBy='price'] - Sort key
 * @returns {Array} Ranked borough results
 */
export function rankBoroughs({
  boroughs,
  maxAffordablePrice,
  netMonthlyIncome,
  interestRate,
  mortgageTerm,
  deposit,
  propertyType = 'any',
  bedrooms = 'any',
  maxAffordabilityPercent = 100,
  sortBy = 'price',
}) {
  const results = [];

  for (const borough of boroughs) {
    const price = getBoroughPrice(borough, propertyType, bedrooms);
    if (price === null) continue;

    const loanAmount = Math.max(0, price - deposit);
    const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, mortgageTerm);
    const affordabilityPercent = calculateAffordabilityPercent(monthlyPayment, netMonthlyIncome);
    const riskRating = getRiskRating(affordabilityPercent);
    const canAfford = price <= maxAffordablePrice;

    results.push({
      name: borough.name,
      zone: borough.zone,
      avgPrice: price,
      monthlyPayment,
      affordabilityPercent,
      riskRating,
      canAfford,
      pricePerSqft: borough.pricePerSqft,
      change1yr: borough.change1yr,
      change5yr: borough.change5yr,
    });
  }

  // Filter by max affordability
  const filtered = maxAffordabilityPercent < 100
    ? results.filter(r => r.affordabilityPercent <= maxAffordabilityPercent)
    : results;

  // Sort
  const sortFns = {
    price: (a, b) => a.avgPrice - b.avgPrice,
    affordability: (a, b) => a.affordabilityPercent - b.affordabilityPercent,
    name: (a, b) => a.name.localeCompare(b.name),
    change5yr: (a, b) => b.change5yr - a.change5yr,
  };

  const sortFn = sortFns[sortBy] || sortFns.price;
  filtered.sort(sortFn);

  return filtered;
}
