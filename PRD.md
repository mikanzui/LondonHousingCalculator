# PRD: London Housing Calculator

> Source: PRODUCT_SPEC.md + user interview (March 2026)

---

## Problem Statement

First-time buyers in London face an overwhelming, opaque property market. Average house prices are 10–12× the median salary, leaseholds come with hidden service charges and ground rent, and tools like Rightmove assume you already know what you can afford. There is no simple, free, London-specific tool that answers the real questions: **"Can I actually afford this?"** and **"Where in London could I realistically buy?"**

Existing mortgage calculators are generic (UK-wide), ignore London-specific costs (service charges, ground rent, leasehold), and don't connect affordability to actual areas. Users have to bounce between salary calculators, mortgage estimators, stamp duty tools, and Rightmove — piecing together an answer manually.

---

## Solution

A free, mobile-first web calculator hyper-focused on London that:

1. Takes a user's salary, deposit, and preferences and instantly shows their realistic monthly cost, risk level, and stamp duty — including a built-in UK tax estimator so they never need to leave the tool.
2. Projects how long it will take to save a deposit, factoring in LISA government bonuses.
3. Shows which London boroughs they can actually afford, ranked and colour-coded, with historical price trends — answering "where can I buy?" not just "can I buy this?"
4. Gates the Area Finder and property comparison behind a Pro upgrade, with the core affordability and deposit tools remaining free to maximise traffic and SEO.

The tool targets first-time buyers (including those considering shared ownership / Help to Buy), with the "realistic London" angle as the key differentiator from generic UK calculators.

---

## User Stories

1. As a first-time buyer, I want to enter my salary and see how much I can borrow, so that I know my realistic budget before browsing properties.
2. As a first-time buyer, I want to enter a property price and deposit and see my monthly mortgage payment, so that I can compare it to my current rent.
3. As a joint applicant, I want to add a partner's salary, so that our combined borrowing power is calculated.
4. As a London flat buyer, I want to include service charges and ground rent in my monthly cost, so that I see the true cost of leasehold living.
5. As a user, I want to see my take-home pay calculated automatically from my gross salary (Income Tax, NI, student loan, pension), so that I don't need a separate tax calculator.
6. As a user with a student loan, I want to select my repayment plan (Plan 1, 2, or 5), so that my net income is accurate.
7. As a user with a workplace pension, I want to enter my pension contribution %, so that my disposable income reflects reality.
8. As a user, I want to see what % of my take-home pay goes to housing, so that I understand my financial risk.
9. As a user, I want a clear risk rating (Safe / Stretch / Risky) colour-coded on screen, so that I can quickly judge affordability.
10. As a first-time buyer, I want stamp duty calculated automatically with first-time buyer relief applied, so that I know my upfront costs.
11. As a non-first-time buyer, I want standard SDLT rates applied, so that the tool works for my situation too.
12. As a saver, I want to enter my current savings and monthly contribution, so that I can project when I'll hit my deposit target.
13. As a LISA holder, I want the 25% government bonus included in my projection, so that I see the real growth of my savings.
14. As a saver, I want to see a visual timeline chart of my projected savings, so that I can stay motivated.
15. As a user, I want to see how many months/years until I reach my deposit target, so that I can plan ahead.
16. As a buyer who doesn't know where to look, I want to see which London boroughs I can afford ranked from cheapest to most expensive, so that I discover areas I hadn't considered.
17. As a user of the Area Finder, I want to filter by property type (flat / terraced / semi / detached), so that results match what I'm looking for.
18. As a user of the Area Finder, I want to filter by number of bedrooms (1 / 2 / 3 / 4+), so that results are relevant to my needs.
19. As a user, I want to set my comfort level (max % of income on housing) via a slider, so that the tool respects my personal risk tolerance.
20. As a user, I want to choose a lending multiple (4x / 4.5x / 5x salary), so that I can see conservative, standard, and stretch scenarios.
21. As a user, I want to see the 5-year price trend for each borough, so that I can spot areas that are rising or stable.
22. As a user, I want to see average price per sqft for each borough, so that I can judge value for money.
23. As a user, I want to sort boroughs by price, affordability, or price change, so that I can explore the data from different angles.
24. As a user, I want each borough colour-coded (green / amber / red), so that I can scan affordability at a glance.
25. As a buyer comparing two properties, I want to see them side-by-side with all costs calculated, so that I can make a direct comparison.
26. As someone considering shared ownership, I want to see an explanation of how it works and a link to further info, so that I understand my options.
27. As a mobile user, I want the tool to work perfectly on my phone, so that I can use it on the go or when I see a TikTok about it.
28. As a free user, I want full access to the affordability calculator and deposit tracker, so that I get genuine value before upgrading.
29. As a Pro user, I want access to the Area Finder and property comparison, so that I get deeper insights worth paying for.
30. As a user, I want to adjust the interest rate, so that I can model different rate scenarios (e.g. rates dropping or rising).
31. As a user, I want to select different mortgage terms (15/20/25/30/35 years), so that I can see how the term affects my monthly payment.

---

## Implementation Decisions

### Modules

The application is composed of these key modules:

1. **Tax Estimator Module** — Calculates UK net (take-home) pay from gross salary. Handles Income Tax bands, National Insurance, student loan plans (1/2/5), and pension contribution deductions. Pure function: salary in → net monthly income out.

2. **Mortgage Calculator Module** — Computes monthly mortgage payment using standard amortisation formula. Pure function: loan amount, rate, term → monthly payment.

3. **Stamp Duty Module** — Calculates SDLT for England. Supports first-time buyer relief and standard rates. Pure function: property price, first-time-buyer flag → stamp duty amount.

4. **Deposit Projection Module** — Projects savings over time including monthly contributions, compound growth, and LISA 25% government bonus (capped at £4,000/year contributions). Pure function: current savings, monthly amount, LISA flag, growth rate, target → timeline array.

5. **Area Finder Module** — Loads static borough data (JSON), filters by property type and bedrooms, calculates affordability per borough using salary × lending multiple + deposit, sorts/ranks results. Pure function: user params + borough data → ranked borough list.

6. **UI Module** — Handles DOM interaction, tab navigation, form validation, rendering results, and colour-coded risk badges. Only module that touches the DOM.

### Architecture

- **No backend.** Entirely static HTML/CSS/JS. All data is pre-processed into a static JSON file.
- **No frameworks.** Vanilla JS, CSS, HTML. Single-page app with tab navigation.
- **Chart.js** (CDN) for the deposit projection timeline chart only.
- **Borough data** starts with 10–15 popular London boroughs in `data/london-boroughs.json`, expanded to all 33 later. Data sourced from ONS / HM Land Registry (free, public). Updated quarterly via manual refresh.

### Lending Multiple

- Configurable by the user: 4× (conservative), 4.5× (standard, default), 5× (stretch).
- Max affordable price = (combined salary × lending multiple) + deposit.

### Shared Ownership / Help to Buy

- Informational only in v1 — an explainer section with links to gov.uk. No custom calculation.
- Full shared ownership calculator (% share, rent on remainder) is a future addition.

### Tax Estimator Detail

- 2025–26 UK tax year bands (auto-updated as needed)
- Income Tax: Personal allowance £12,570, Basic 20%, Higher 40%, Additional 45%
- National Insurance: Class 1 employee rates
- Student Loan: Plan 1 (threshold £24,990, 9%), Plan 2 (threshold £27,295, 9%), Plan 5 (threshold £25,000, 9%)
- Pension: User-entered % deducted before tax calculation (salary sacrifice) or after (net pay)

### Pro vs Free Gating

- **Free:** Affordability Calculator, Deposit Tracker, Stamp Duty
- **Pro (paid):** Area Affordability Finder, Property Comparison
- Gating implemented client-side initially (honour system / soft gate). Stripe or Gumroad integration for payment.

### Hosting & Deployment

- Netlify or Vercel free tier, auto-deploy from GitHub.
- Optional custom `.co.uk` domain (~£5/year).

---

## Testing Decisions

### Testing Philosophy

Tests should verify **external behaviour** (given these inputs, expect these outputs), not internal implementation details. They should be resilient to refactoring — if the code structure changes but the behaviour is the same, tests should still pass.

### Modules Under Test

1. **Tax Estimator Module** — Critical. Financial accuracy is non-negotiable.
   - Test: gross salary → correct net pay for various scenarios (basic rate, higher rate, with/without student loan, with pension)
   - Cross-validate against HMRC tax calculator

2. **Mortgage Calculator Module** — Critical.
   - Test: known loan/rate/term combinations → expected monthly payment (validated against MSE mortgage calculator)
   - Edge cases: 0% interest, very short/long terms

3. **Stamp Duty Module** — Critical.
   - Test: property prices at each band boundary, FTB relief vs standard rates
   - Edge case: exactly £625,000 (FTB relief cutoff)

4. **Deposit Projection Module**
   - Test: savings growth over 1/3/5 years with and without LISA bonus
   - Edge case: contributions exceeding £4,000/year LISA cap

5. **Area Finder Module**
   - Test: filtering returns correct boroughs, sorting order is correct, affordability classification (safe/stretch/out of reach) matches expected thresholds
   - Edge case: no affordable boroughs, all boroughs affordable

6. **UI Interaction Logic**
   - Test: input validation (no negatives, required fields), risk rating badge shows correct colour for given % thresholds
   - Test: tab switching preserves entered data

7. **Responsive / Mobile**
   - Manual or automated visual regression tests ensuring layout works at 375px, 768px, 1024px viewports

### Test Runner

- Vitest or plain Node.js test runner for unit tests on pure calculation modules
- Pure functions are extracted into modules with no DOM dependency, making them trivially testable

---

## Out of Scope

- **Full shared ownership calculator** — v1 is informational only; custom share % / rent calculations are deferred.
- **Backend / API** — No server, database, or user accounts. Entirely static.
- **Live data feeds** — Borough data is static JSON updated quarterly, not a live API connection to Land Registry.
- **Areas outside London** — Tool is London-only. No plans to expand to other UK cities in v1.
- **Mortgage application / broker integration** — This is an affordability tool, not a mortgage application platform.
- **Interactive borough map** — Stretch goal for Phase 4, not part of core build.
- **Postcode / ward-level area data** — Pro upgrade path for later; MVP is borough-level only.
- **Email capture / marketing automation** — Deferred to Phase 4.
- **Native mobile app** — Web-only; mobile-responsive design is sufficient.

---

## Further Notes

- **Content is critical.** The tool's success depends on driving traffic via faceless TikTok/Shorts content. The Area Finder is specifically designed to generate compelling "Can you afford X on £Yk salary?" content.
- **Data freshness.** Borough price data should include a "last updated" date shown to users and be refreshed quarterly from ONS/Land Registry sources. Document the update process so it's repeatable.
- **Validation baseline.** Before launch, cross-check all financial calculations against MSE mortgage calculator, HMRC tax calculator, and Nationwide affordability tool. Record test scenarios and expected outputs.
- **Starting boroughs for Area Finder (10–15):** Prioritise a mix of affordable and aspirational — e.g. Barking & Dagenham, Croydon, Bexley, Hounslow, Lewisham, Greenwich, Waltham Forest, Newham, Tower Hamlets, Hackney, Southwark, Lambeth, Camden, Islington, Westminster. Expand to all 33 based on demand.
- **Monetisation sequence:** Free tool first → grow traffic → introduce Pro gate on Area Finder → add affiliate links to mortgage brokers and LISA providers → target £500/month.
