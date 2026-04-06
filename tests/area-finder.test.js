import { describe, it, expect } from 'vitest';
import { getBoroughPrice, rankBoroughs } from '../js/area-finder.js';

const sampleBoroughs = [
  {
    name: 'Barking and Dagenham',
    zone: '5-6',
    prices: {
      flat: { avg: 200000, '1bed': 170000, '2bed': 210000, '3bed': 250000, '4bed': null },
      terraced: { avg: 310000, '1bed': null, '2bed': 280000, '3bed': 320000, '4bed': 370000 },
      semi: { avg: 370000, '1bed': null, '2bed': 340000, '3bed': 380000, '4bed': 420000 },
      detached: { avg: 480000, '1bed': null, '2bed': null, '3bed': 460000, '4bed': 520000 },
    },
    pricePerSqft: 350,
    change1yr: 3.2,
    change5yr: 18.5,
  },
  {
    name: 'Greenwich',
    zone: '2-4',
    prices: {
      flat: { avg: 310000, '1bed': 270000, '2bed': 330000, '3bed': 380000, '4bed': null },
      terraced: { avg: 430000, '1bed': null, '2bed': 400000, '3bed': 450000, '4bed': 520000 },
      semi: { avg: 500000, '1bed': null, '2bed': 460000, '3bed': 510000, '4bed': 570000 },
      detached: { avg: 680000, '1bed': null, '2bed': null, '3bed': 650000, '4bed': 730000 },
    },
    pricePerSqft: 480,
    change1yr: 1.8,
    change5yr: 22.1,
  },
  {
    name: 'Westminster',
    zone: '1',
    prices: {
      flat: { avg: 750000, '1bed': 550000, '2bed': 800000, '3bed': 1100000, '4bed': 2000000 },
      terraced: { avg: 1800000, '1bed': null, '2bed': 1500000, '3bed': 1900000, '4bed': 2500000 },
      semi: { avg: 3000000, '1bed': null, '2bed': null, '3bed': 2800000, '4bed': 3400000 },
      detached: { avg: 5000000, '1bed': null, '2bed': null, '3bed': null, '4bed': 5500000 },
    },
    pricePerSqft: 1200,
    change1yr: -0.5,
    change5yr: 8.3,
  },
];

describe('getBoroughPrice', () => {
  it('returns avg across all types for "any" type and "any" beds', () => {
    const price = getBoroughPrice(sampleBoroughs[0], 'any', 'any');
    // (200000 + 310000 + 370000 + 480000) / 4 = 340000
    expect(price).toBe(340000);
  });

  it('returns specific type avg price', () => {
    const price = getBoroughPrice(sampleBoroughs[0], 'flat', 'any');
    expect(price).toBe(200000);
  });

  it('returns specific bedroom price for specific type', () => {
    const price = getBoroughPrice(sampleBoroughs[0], 'flat', '2bed');
    expect(price).toBe(210000);
  });

  it('returns null when bedroom data not available', () => {
    const price = getBoroughPrice(sampleBoroughs[0], 'flat', '4bed');
    expect(price).toBe(null);
  });

  it('averages across types for specific bedroom', () => {
    // any type + 3bed: flat 250000, terraced 320000, semi 380000, detached 460000
    const price = getBoroughPrice(sampleBoroughs[0], 'any', '3bed');
    expect(price).toBe(352500);
  });
});

describe('rankBoroughs', () => {
  it('returns boroughs sorted by price ascending (default)', () => {
    const results = rankBoroughs({
      boroughs: sampleBoroughs,
      maxAffordablePrice: 10000000,
      netMonthlyIncome: 3000,
      interestRate: 5.5,
      mortgageTerm: 30,
      deposit: 0,
      sortBy: 'price',
    });
    expect(results.length).toBe(3);
    expect(results[0].name).toBe('Barking and Dagenham');
    expect(results[2].name).toBe('Westminster');
  });

  it('filters by max affordability percent', () => {
    const results = rankBoroughs({
      boroughs: sampleBoroughs,
      maxAffordablePrice: 10000000,
      netMonthlyIncome: 3000,
      interestRate: 5.5,
      mortgageTerm: 30,
      deposit: 0,
      maxAffordabilityPercent: 30,
    });
    // Only cheapest boroughs should pass a 30% threshold on £3k/month net
    for (const r of results) {
      expect(r.affordabilityPercent).toBeLessThanOrEqual(30);
    }
  });

  it('sorts by name when requested', () => {
    const results = rankBoroughs({
      boroughs: sampleBoroughs,
      maxAffordablePrice: 10000000,
      netMonthlyIncome: 10000,
      interestRate: 5.5,
      mortgageTerm: 30,
      deposit: 0,
      sortBy: 'name',
    });
    expect(results[0].name).toBe('Barking and Dagenham');
    expect(results[1].name).toBe('Greenwich');
    expect(results[2].name).toBe('Westminster');
  });

  it('sorts by 5yr change descending', () => {
    const results = rankBoroughs({
      boroughs: sampleBoroughs,
      maxAffordablePrice: 10000000,
      netMonthlyIncome: 10000,
      interestRate: 5.5,
      mortgageTerm: 30,
      deposit: 0,
      sortBy: 'change5yr',
    });
    expect(results[0].name).toBe('Greenwich'); // 22.1%
    expect(results[1].name).toBe('Barking and Dagenham'); // 18.5%
    expect(results[2].name).toBe('Westminster'); // 8.3%
  });

  it('filters by property type', () => {
    const results = rankBoroughs({
      boroughs: sampleBoroughs,
      maxAffordablePrice: 10000000,
      netMonthlyIncome: 10000,
      interestRate: 5.5,
      mortgageTerm: 30,
      deposit: 0,
      propertyType: 'flat',
    });
    // Barking flat avg = 200000, Greenwich flat avg = 310000, Westminster flat avg = 750000
    expect(results[0].avgPrice).toBe(200000);
  });

  it('filters by bedrooms', () => {
    const results = rankBoroughs({
      boroughs: sampleBoroughs,
      maxAffordablePrice: 10000000,
      netMonthlyIncome: 10000,
      interestRate: 5.5,
      mortgageTerm: 30,
      deposit: 0,
      bedrooms: '2bed',
    });
    expect(results.length).toBe(3);
  });

  it('includes risk rating for each borough', () => {
    const results = rankBoroughs({
      boroughs: sampleBoroughs,
      maxAffordablePrice: 10000000,
      netMonthlyIncome: 3000,
      interestRate: 5.5,
      mortgageTerm: 30,
      deposit: 0,
    });
    for (const r of results) {
      expect(['safe', 'stretch', 'risky']).toContain(r.riskRating);
    }
  });

  it('accounts for deposit reducing loan amount', () => {
    const withDeposit = rankBoroughs({
      boroughs: [sampleBoroughs[0]],
      maxAffordablePrice: 10000000,
      netMonthlyIncome: 3000,
      interestRate: 5.5,
      mortgageTerm: 30,
      deposit: 100000,
    });
    const withoutDeposit = rankBoroughs({
      boroughs: [sampleBoroughs[0]],
      maxAffordablePrice: 10000000,
      netMonthlyIncome: 3000,
      interestRate: 5.5,
      mortgageTerm: 30,
      deposit: 0,
    });
    expect(withDeposit[0].monthlyPayment).toBeLessThan(withoutDeposit[0].monthlyPayment);
  });
});
