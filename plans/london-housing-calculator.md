# Plan: London Housing Calculator

> Source PRD: [PRD: London Housing Calculator (#1)](https://github.com/mikanzui/LondonHousingCalculator/issues/1)

## Architectural decisions

Durable decisions that apply across all phases:

- **No backend / no database**: Entirely static HTML, CSS, JS files. No server, no API, no user accounts.
- **Single-page app with tab navigation**: One `index.html` with tabs — Affordability → Deposit → Compare → Area Finder. No routing library; tabs show/hide sections.
- **Pure function modules**: All calculation logic (tax, mortgage, stamp duty, deposit, area finder) lives in standalone JS modules with zero DOM dependency. Each module exports pure functions: inputs in → outputs out. This makes them trivially testable in Node.js.
- **Static borough data**: Borough prices/trends stored in `data/london-boroughs.json`, loaded client-side via `fetch()`. Updated quarterly from ONS/Land Registry. No live API calls.
- **Chart.js via CDN**: Only external dependency. Used for deposit projection timeline chart only.
- **Pro gating**: Affordability Calculator + Deposit Tracker = free. Area Finder + Property Comparison = Pro (soft client-side gate initially, Stripe/Gumroad later).
- **Tax estimator**: Built-in UK 2025–26 tax calculation (Income Tax, NI, Student Loan Plans 1/2/5, pension contributions). No external tax API.
- **Lending multiple**: User-configurable — 4× (conservative), 4.5× (standard, default), 5× (stretch).
- **Mobile-first**: All UI built mobile-first, targeting phone traffic from TikTok/Shorts.
- **Test runner**: Vitest or Node.js built-in test runner for pure calculation modules.

---

## Phase 1: Single Salary Affordability

**User stories**: 1, 2, 8, 9, 30, 31, 32, 33, 34

### What to build

The core calculator working end-to-end: a user enters their gross salary, a property price, a deposit, an interest rate, and a mortgage term. The tool calculates the loan amount, monthly mortgage payment (standard amortisation formula), and shows the percentage of income spent on housing with a colour-coded risk badge (green Safe / amber Stretch / red Risky).

Net income uses a simplified estimate in this phase (e.g. rough 70% of gross) — the full tax estimator comes in Phase 2.

This is the first demoable slice: a working page with a form, real calculations, and visual output.

### Acceptance criteria

- [ ] HTML form accepts: gross salary, property price, deposit, additional funds (default £0), interest rate (default 5.5%), mortgage term (dropdown: 15/20/25/30/35 years)
- [ ] "Additional funds" field labelled non-descriptly — tooltip: "Gift from family, inheritance, bonus, or any other lump sum"
- [ ] Total deposit = deposit + additional funds
- [ ] Monthly mortgage payment calculated using `M = P * r(1+r)^n / ((1+r)^n - 1)`
- [ ] Loan amount displayed (property price − total deposit)
- [ ] Lending multiple displayed (loan / salary)
- [ ] % of take-home pay spent on housing displayed
- [ ] Risk badge: ≤ 30% = ✅ Safe, > 30% and ≤ 45% = ⚠️ Stretch, > 45% = 🔴 Risky
- [ ] Risk badges include text labels + icons (not colour alone) for accessibility
- [ ] Input validation: salary required and > 0, deposit ≤ property price, rate 0–15%, inline error messages
- [ ] Calculation logic is a pure function with no DOM dependency
- [ ] Unit tests pass for mortgage calculation (validated against MSE calculator for known scenarios)
- [ ] UI is clean, centered card layout, works on mobile (375px)
- [ ] All form inputs have associated `<label>` elements, keyboard-navigable
- [ ] Legal disclaimer in footer: "For informational purposes only, not financial advice"
- [ ] Prominent banner: "Take-home pay is estimated. Full tax calculator included in next update."

---

## Phase 2: UK Tax Estimator

**User stories**: 5, 6, 7

### What to build

Replace the rough net income estimate from Phase 1 with a real UK tax calculator. The user's gross salary is run through Income Tax bands (2025–26), National Insurance Class 1, optional student loan deductions (Plan 1, 2, 4, 5, or Postgraduate), and optional pension contribution with a salary sacrifice / net pay toggle. The resulting net monthly income feeds into the affordability calculation automatically.

New UI fields appear: student loan plan dropdown (None/1/2/4/5/Postgraduate), pension contribution % input, and pension type toggle (salary sacrifice / net pay).

### Acceptance criteria

- [ ] Income Tax calculated using 2025–26 bands (£12,570 personal allowance, 20% basic, 40% higher, 45% additional)
- [ ] National Insurance calculated at Class 1 employee rates
- [ ] Student loan deduction: Plan 1 (threshold £24,990, 9%), Plan 2 (threshold £27,295, 9%), Plan 4 (threshold £31,395, 9%), Plan 5 (threshold £25,000, 9%), Postgraduate (threshold £21,000, 6%)
- [ ] Pension contribution toggle: salary sacrifice (before tax) or net pay (after tax)
- [ ] Pension contribution % deducted according to selected method
- [ ] Net monthly pay displayed to the user
- [ ] Affordability % and risk badge now use real net income
- [ ] Tax estimator is a pure function, tested independently
- [ ] Unit tests cover: basic rate only, higher rate, additional rate, with/without student loan, with pension
- [ ] Cross-validated against HMRC tax calculator for at least 3 salary levels

---

## Phase 3: Stamp Duty

**User stories**: 10, 11

### What to build

Add stamp duty (SDLT) calculation to the affordability output. A toggle lets the user indicate if they are a first-time buyer (default: yes). The stamp duty amount appears as an upfront cost alongside the monthly breakdown.

### Acceptance criteria

- [ ] First-time buyer SDLT: £0–£425k at 0%, £425k–£625k at 5%, over £625k = no FTB relief (standard rates)
- [ ] Standard SDLT rates applied when FTB toggle is off
- [ ] Stamp duty amount displayed as a one-off cost in the results
- [ ] Toggle for first-time buyer / not first-time buyer
- [ ] Stamp duty module is a pure function, tested independently
- [ ] Unit tests cover: below £425k (FTB = £0), exactly £500k, exactly £625k boundary, £700k (no relief), standard rates at various prices

---

## Phase 4: Joint Applicant + Leasehold Costs

**User stories**: 3, 4

**Note:** Phase 3 (Stamp Duty) and Phase 4 are independent and can be built in parallel.

### What to build

Add a partner salary field (optional) that combines with the primary salary for borrowing power and net income. The partner gets their own student loan plan and pension inputs. Add monthly service charge and ground rent fields. Total monthly housing cost now includes mortgage + service charge + ground rent. The affordability % and risk badge reflect the true all-in cost.

### Acceptance criteria

- [ ] Partner salary field (optional, defaults to 0)
- [ ] Partner student loan plan dropdown (None/1/2/4/5/Postgraduate)
- [ ] Partner pension contribution % and salary sacrifice / net pay toggle
- [ ] Combined salary used for lending multiple and max borrowing
- [ ] Partner salary runs through the same tax estimator (separate calculation with partner's own student loan and pension settings)
- [ ] Combined net monthly income used for affordability %
- [ ] Service charge (£/month) and ground rent (£/month) fields added
- [ ] Total monthly cost = mortgage + service charge + ground rent
- [ ] Risk badge reflects total monthly cost, not just mortgage
- [ ] Tests cover: single applicant, joint applicant, various service charge / ground rent combinations

---

## Phase 5: Deposit Tracker + LISA Projection

**User stories**: 12, 13, 14, 15

### What to build

A new tab: "Deposit Tracker". The user enters current savings, monthly contribution, whether they're using a LISA, and an annual growth rate. The tool projects savings over time, applies the 25% LISA government bonus (capped at £4,000/year contributions), and shows a timeline chart (Chart.js) plus the number of months to reach the deposit target (carried from the affordability tab).

### Acceptance criteria

- [ ] New "Deposit" tab in the navigation
- [ ] Inputs: current savings, monthly contribution, LISA toggle, annual growth rate (default 4%)
- [ ] Deposit target pre-filled from affordability calculator's deposit field (if entered)
- [ ] Additional funds carried from affordability calculator — subtracted from target (user only needs to save the difference)
- [ ] Tracker clearly shows: "You need £X. With £Y additional funds, you need to save £Z."
- [ ] LISA bonus: 25% on contributions up to £4,000/year (max bonus £1,000/year)
- [ ] LISA property price cap warning: if deposit target implies property > £450,000, show warning that LISA funds cannot be used and exclude bonus from projection
- [ ] LISA age eligibility note displayed: "You must be 18–39 to open a LISA"
- [ ] Projected savings displayed year-by-year
- [ ] Chart.js timeline chart showing savings growth over time
- [ ] "X months to reach your target" displayed prominently
- [ ] Deposit projection is a pure function, tested independently
- [ ] Tests cover: with/without LISA, contributions exceeding £4k/year cap, 0 current savings, already at target

---

## Phase 6: Area Affordability Finder

**User stories**: 16, 17, 18, 19, 20, 21, 22, 23, 24

### What to build

A new tab: "Where Can I Afford?" The user's salary, deposit, and lending multiple preference are used to calculate their maximum affordable property price. The tool loads `data/london-boroughs.json` (starting with 10–15 boroughs) and ranks them by affordability. Each borough row shows: average price (by property type), estimated monthly cost, % of income, risk rating (colour-coded), 5-year price trend, and price per sq ft.

Users can filter by property type and bedrooms, adjust their comfort level (max % of income slider) and lending multiple (4×/4.5×/5×), and re-sort the list.

This tab is gated behind Pro (Phase 8), but built fully functional here for testing.

### Acceptance criteria

- [ ] New "Area Finder" tab in the navigation
- [ ] Loads borough data from `data/london-boroughs.json` via `fetch()`
- [ ] 10–15 London boroughs with real data (sourced from ONS/Land Registry)
- [ ] Borough data includes: avg price by type (flat/terraced/semi/detached), price per sqft, 1yr change %, 5yr change %, zone
- [ ] Max affordable price calculated: (combined salary × lending multiple) + deposit
- [ ] Each borough row shows: name, avg price, estimated monthly payment, % of income, risk badge, 5yr trend
- [ ] Filter by property type (Any / Flat / Terraced / Semi / Detached)
- [ ] Filter by bedrooms (Any / 1 / 2 / 3 / 4+)
- [ ] Slider for max % of income on housing (default 35%)
- [ ] Lending multiple selector (4× / 4.5× / 5×)
- [ ] Sortable by: price, % of income, borough name, 5yr change
- [ ] Colour-coded: green = affordable, amber = stretch, red = out of reach
- [ ] Area finder filtering/sorting logic is a pure function, tested independently
- [ ] Tests cover: filtering, sorting order, correct affordability classification, edge cases (no affordable boroughs, all affordable)

---

## Phase 7: Property Comparison

**User stories**: 25, 30, 31

### What to build

A new tab: "Compare". The user enters two property scenarios side-by-side (property price, deposit, rate, term, service charge, ground rent for each). Both run through the full calculation pipeline and results display in two columns for direct comparison.

This tab is gated behind Pro (Phase 8), but built fully functional here.

### Acceptance criteria

- [ ] New "Compare" tab in the navigation
- [ ] Two-column layout: Property A and Property B
- [ ] Each column has full inputs: property price, deposit, rate, term, service charge, ground rent
- [ ] Each column shows full outputs: monthly payment, total cost, % of income, risk badge, stamp duty
- [ ] Salary / tax inputs inherited from main calculator (not re-entered)
- [ ] Visual highlights showing which property is cheaper / lower risk
- [ ] Works on mobile (stacked vertically on small screens)
- [ ] Tests cover: comparison logic produces correct relative results

---

## Phase 8: Shared Ownership Info + Pro Gating

**User stories**: 26, 28, 29

### What to build

Add a "Shared Ownership & Help to Buy" informational section — a clear explainer of how shared ownership works, what Help to Buy was, and links to gov.uk resources. No calculator for shared ownership in this phase.

Implement soft Pro gating: Area Finder and Compare tabs show a brief preview then prompt the user to upgrade. Free users get full access to Affordability + Deposit. Pro unlocking connects to Stripe or Gumroad checkout.

### Acceptance criteria

- [ ] Shared ownership explainer section with: how it works, typical share percentages, rent on unowned share, pros/cons, link to gov.uk
- [ ] Help to Buy brief summary (scheme closed, historical context)
- [ ] Area Finder tab: shows 2–3 boroughs then a "Unlock all boroughs — upgrade to Pro" prompt
- [ ] Compare tab: shows the input form but results are blurred/locked behind "Upgrade to Pro"
- [ ] Pro unlock via Stripe or Gumroad checkout link
- [ ] Affordability Calculator and Deposit Tracker remain fully free with no restrictions
- [ ] Gating logic is clean and can be toggled off for testing

---

## Phase 9: Mobile Polish + Deployment

**User stories**: 27

### What to build

Final responsive audit and production polish. Ensure all tabs work correctly at 375px, 768px, and 1024px. Add SEO meta tags, Open Graph image, favicon. Set up Netlify deployment from GitHub (auto-deploy on push). Add a "data last updated" footer showing when borough data was refreshed.

### Acceptance criteria

- [ ] All tabs tested and working at 375px (phone), 768px (tablet), 1024px (desktop)
- [ ] No horizontal scroll, no overlapping elements, no broken layouts on any viewport
- [ ] `<meta>` tags: title, description, og:title, og:description, og:image
- [ ] Favicon present
- [ ] Deployed to Netlify with auto-deploy from GitHub `master` branch
- [ ] Custom domain connected (if purchased)
- [ ] "Data last updated: [date]" footer on Area Finder tab
- [ ] Lighthouse mobile score > 90 for performance
- [ ] All existing tests still pass

---

## UI/UX Design System

> Based on [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — Personal Finance Tracker category

### Design Pattern

- **Pattern:** Feature-Showcase with Calculator Focus
- **Conversion:** Utility-driven — users arrive to calculate, results encourage Pro upgrade
- **CTA:** Calculate button prominent above fold; Pro upgrade surfaced after free results
- **Sections:** Tab navigation — Affordability → Deposit → Area Finder → Compare

### Style: Clean Minimalism with Soft UI touches

- **Keywords:** Clean lines, generous whitespace, soft shadows, subtle depth, trustworthy, professional
- **Best For:** Finance tools, calculators, personal finance trackers
- **Performance:** Excellent (no heavy assets) | **Accessibility:** WCAG AA

### Colour Palette

| Token | Hex | Usage |
|---|---|---|
| Primary | `#0984e3` | CTAs, links, active states, focus rings |
| Primary hover | `#0770c4` | Button hover, link hover |
| Primary light | `#e8f4fd` | Selected tab background, info highlights |
| Surface | `#ffffff` | Cards, form backgrounds |
| Background | `#f0f4f8` | Page background |
| Text primary | `#1a1a2e` | Headings, key values |
| Text secondary | `#4a5568` | Labels, supporting text |
| Text muted | `#a0aec0` | Placeholder, disclaimer text |
| Border | `#e2e8f0` | Input borders, dividers, card borders |
| Safe (green) | `#48bb78` | Safe badge bg: `#c6f6d5`, text: `#22543d` |
| Stretch (amber) | `#ecc94b` | Stretch badge bg: `#fefcbf`, text: `#744210` |
| Risky (red) | `#f56565` | Risky badge bg: `#fed7d7`, text: `#742a2a` |
| Error | `#e53e3e` | Validation error text and border |

### Typography

- **Headings:** Inter (600/700 weight) — clean, modern, highly legible
- **Body:** Inter (400/500 weight) — single font family for performance
- **Monospace numbers:** `font-variant-numeric: tabular-nums` on all financial figures
- **Scale:** 12px labels → 14px body → 16px input → 18px section → 24px page title → 32px hero
- **Line height:** 1.5 body, 1.3 headings
- **Max line width:** 65ch for readability
- **Google Fonts:** `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`

### Key Effects

- **Shadows:** `0 1px 3px rgba(0,0,0,0.08)` cards, `0 4px 16px rgba(0,0,0,0.12)` elevated
- **Border radius:** 12px cards, 8px inputs/buttons, 20px badges
- **Transitions:** 200ms ease-out for hover/focus states
- **Focus ring:** `0 0 0 3px rgba(9,132,227,0.25)` on focus-visible
- **Tab indicator:** 2px bottom border on active tab with primary colour

### Anti-Patterns to Avoid

- No emoji as structural icons (use SVG: Lucide icons via CDN)
- No dark gradients or neon colours
- No animation > 300ms for micro-interactions
- No placeholder-only labels
- No colour-only meaning (always text + icon with badges)
- No disable-zoom viewport

### Pre-Delivery Checklist

- [ ] SVG icons used (Lucide) — no emoji as structural icons
- [ ] `cursor: pointer` on all clickable elements
- [ ] Hover states with smooth transitions (200ms ease-out)
- [ ] Text contrast ≥ 4.5:1 in light mode
- [ ] Focus states visible for keyboard nav (focus-visible ring)
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] Tabular nums on all financial figures
- [ ] Inline validation errors near field with `role="alert"`
- [ ] Tab navigation fully keyboard-accessible
