# London Housing Calculator — Product Specification

## 1. Product Summary

**Name:** London Housing Calculator
**Tagline:** "Realistic affordability for real London buyers"
**Target User:** First-time buyers and renters in London exploring property affordability
**Platform:** Web app (HTML/CSS/JS) — no frameworks, free to host
**Differentiator:** Hyper-focused on London realities — high prices, service charges, LISA bonuses, shared ownership, Help to Buy

---

## 2. Core Features (MVP — v1.0)

### 2.1 Affordability Calculator
**Inputs:**
| Field | Type | Default | Notes |
|---|---|---|---|
| Annual gross salary | £ number | — | Required |
| Partner salary (optional) | £ number | 0 | Joint application |
| Property price | £ number | — | Required |
| Deposit amount | £ number | — | Required (your own savings) |
| Additional funds | £ number | 0 | Gift from family, inheritance, bonus — any lump sum |
| Interest rate (%) | number | 5.5 | Pre-filled with current avg |
| Mortgage term (years) | number | 30 | Dropdown: 15/20/25/30/35 |
| Monthly service charge | £ number | 0 | Common for London flats |
| Monthly ground rent | £ number | 0 | Leasehold properties |

**Outputs:**
| Output | Formula / Logic |
|---|---|
| Total deposit | Deposit + Additional funds |
| Loan amount | Property price − Total deposit |
| Monthly mortgage payment | Standard amortisation formula: `M = P * r(1+r)^n / ((1+r)^n - 1)` |
| Total monthly housing cost | Mortgage + service charge + ground rent |
| % of take-home pay spent | Total monthly cost / (net monthly income) × 100 |
| Lending multiple | Loan amount / gross annual income |
| Risk rating | < 30% = ✅ Safe · 30–45% = ⚠️ Stretch · > 45% = 🔴 Risky |
| Stamp duty estimate | SDLT bands for England (first-time buyer relief applied if eligible) |

**Stamp Duty Logic (SDLT — England, first-time buyers, as of 2025–26):**
- £0–£425,000: 0%
- £425,001–£625,000: 5%
- Over £625,000: standard rates apply (no FTB relief)

---

### 2.2 Deposit Tracker / LISA Projection
**Inputs:**
| Field | Type | Default |
|---|---|---|
| Current savings | £ number | 0 |
| Monthly contribution | £ number | — |
| Using LISA? | Yes/No toggle | Yes |
| Annual savings growth rate (%) | number | 4 |

**Outputs:**
| Output | Logic |
|---|---|
| Government bonus (LISA) | 25% on contributions up to £4,000/year |
| Projected savings by year | Compound growth + contributions + LISA bonus |
| Time to reach deposit target | Months until own savings ≥ (deposit target − additional funds) |
| Visual timeline chart | Simple bar or line chart |

---

### 2.3 Property Comparison (side-by-side)
Allow the user to compare **2 property scenarios** using the same calculator inputs, displayed in columns.

---

### 2.4 Area Affordability Finder ("Where Can I Afford?")

**Concept:** Rightmove-style search that flips the question — instead of "can I afford this property?", it answers **"which London areas can I actually afford?"**

**Inputs:**
| Field | Type | Default | Notes |
|---|---|---|---|
| Annual gross salary | £ number | — | Carried from calculator if already entered |
| Partner salary (optional) | £ number | 0 | |
| Deposit available | £ number | — | |
| Max % of income on housing | slider | 35% | User sets comfort level |
| Property type filter | Dropdown | Any | Flat / Terraced / Semi / Detached |
| Bedrooms | Dropdown | Any | 1 / 2 / 3 / 4+ |

**Outputs:**
| Output | Description |
|---|---|
| Borough affordability list | All 33 London boroughs sorted by affordability (affordable → expensive) |
| For each borough: avg price | Current average asking/sold price by property type |
| For each borough: monthly cost | Estimated mortgage payment at current rates |
| For each borough: % of income | How much of take-home pay it would consume |
| For each borough: risk rating | ✅ Safe / ⚠️ Stretch / 🔴 Out of reach |
| For each borough: 5-year trend | Price change % over last 5 years (e.g. +18%) |
| For each borough: avg price/sqft | Value for money indicator |
| Interactive map (stretch goal) | Colour-coded London borough map |

**Data Sources (free, public):**
| Source | What it provides | Format |
|---|---|---|
| [HM Land Registry PPD](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads) | Every property sale in England & Wales | CSV (monthly updates) |
| [ONS House Price Statistics](https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/previousReleases) | Average prices by local authority, property type, buyer type | CSV/JSON |
| [ONS Median house price by borough](https://data.london.gov.uk/dataset/average-house-prices) | London-specific borough averages by year | CSV |
| [Rightmove / Zoopla asking prices](https://www.rightmove.co.uk/house-prices.html) | Current asking prices (manually reference or scrape overview) | Manual/reference |

**Data Strategy:**
- Pre-process ONS/Land Registry data into a static JSON file (`data/london-boroughs.json`)
- Include: borough name, avg price (flat/terraced/semi/detached), 1yr change %, 5yr change %, avg price per sqft
- Update the JSON monthly or quarterly (manual or scripted)
- No backend needed — all filtering/sorting happens client-side

**Sample data structure:**
```json
{
  "boroughs": [
    {
      "name": "Barking and Dagenham",
      "code": "E09000002",
      "avgPrice": {
        "flat": 215000,
        "terraced": 340000,
        "semi": 395000,
        "detached": 510000,
        "all": 320000
      },
      "pricePerSqft": 385,
      "change1yr": 3.2,
      "change5yr": 18.5,
      "avgServiceCharge": 150,
      "zone": "4-5"
    }
  ]
}
```

**Sorting/Filtering Logic:**
1. Calculate max affordable property price: `(salary × lending multiple) + deposit`
2. For each borough, compare avg price (by selected property type) against max affordable price
3. Calculate monthly cost and % of income for each
4. Sort by affordability (most affordable first)
5. Colour-code: green = affordable, amber = stretch, red = out of reach
6. Allow re-sorting by: price, % change, borough name

**Why this is a killer feature:**
- Nobody else does this as a simple, free tool for London specifically
- Perfect for TikTok content: "Where in London can you afford on £35k?"
- Drives organic SEO: "cheapest London boroughs to buy 2025"
- Creates natural upgrade path: free = borough level, Pro = postcode/ward level

---

## 3. UI / Design Direction

- **Layout:** Centered card-based, max-width ~700px
- **Style:** Clean, modern, minimal — soft shadows, rounded corners
- **Colour coding:** Green (safe) / Amber (stretch) / Red (risky)
- **Mobile-first:** Must work well on phones (TikTok traffic)
- **Typography:** System font stack or Inter/DM Sans
- **Sections:** Tabbed or stepped (Affordability → Deposit → Compare → Area Finder)
- **Area Finder layout:** Scrollable card list or table with borough rows, each showing price/risk/trend at a glance

---

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | HTML + CSS + JS (vanilla) | Zero dependencies, fast, easy to deploy |
| Charts | Chart.js (CDN) | Lightweight, one dependency |
| Hosting | Netlify or Vercel (free tier) | Auto-deploy from GitHub |
| Domain | Optional: custom .co.uk | ~£5/year |

**File structure:**
```
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── calculator.js      # Core affordability math
│   ├── deposit.js          # LISA / savings projection
│   ├── compare.js          # Side-by-side comparison
│   ├── stampduty.js        # SDLT calculation
│   ├── areafinder.js       # Borough affordability search & filtering
│   └── ui.js               # DOM interaction, validation, rendering
├── data/
│   └── london-boroughs.json # Pre-processed borough price data (ONS/Land Registry)
├── assets/
│   └── (icons, og-image)
└── README.md
```

---

## 5. Monetisation Strategy

| Stream | How | Revenue estimate |
|---|---|---|
| Free tool (traffic driver) | SEO + social content | £0 (builds audience) |
| Notion/Spreadsheet pack | Gumroad — £5–£15 | £100–£200/mo |
| Pro calculator (gated features) | Stripe or Gumroad — £10–£20 one-time | £200–£400/mo |
| Affiliate links | Mortgage brokers, LISA providers | £50–£150/mo |
| Content | TikTok/Shorts → tool link in bio | Free traffic engine |

**Target:** £500/month within 2–3 months

---

## 6. Phased Delivery Plan

### Phase 1 — MVP (Days 1–2)
- [ ] Build affordability calculator (inputs → outputs → risk rating)
- [ ] Basic stamp duty calculation
- [ ] Clean, responsive UI
- [ ] Deploy to Netlify

### Phase 2 — Traffic & Validation (Days 3–7)
- [ ] Add LISA / deposit tracker tab
- [ ] Create Gumroad listing for spreadsheet version
- [ ] Post 1–2 faceless TikToks daily showing real London scenarios
- [ ] Collect feedback (what do people ask about?)

### Phase 3 — Area Finder & Monetise (Weeks 2–3)
- [ ] Download and process ONS/Land Registry data into `london-boroughs.json`
- [ ] Build Area Affordability Finder (borough list + filtering + sorting)
- [ ] Add property comparison feature
- [ ] Create "Pro" version (PDF export, saved scenarios, postcode-level data)
- [ ] Add affiliate links (mortgage brokers, LISA providers)
- [ ] Target: first £50–£150

### Phase 4 — Scale (Month 2+)
- [ ] SEO landing pages per borough (e.g., "Can I afford a flat in Hackney?")
- [ ] Add interactive colour-coded London borough map
- [ ] Email capture + drip sequence
- [ ] Postcode/ward level data as Pro upgrade
- [ ] More tools / templates
- [ ] Target: consistent £500/month

---

## 7. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| No traffic | Content is mandatory, not optional — post daily |
| Competitive space | Niche down: "realistic London" angle, not generic UK |
| Overbuilding before launch | MVP in 2 days max — ugly but working wins |
| Giving up early | Set 30-day commitment before evaluating results |
| Incorrect calculations | Validate against known mortgage calculators (MSE, Nationwide) |
| Stale area data | Document data update process; set calendar reminder to refresh quarterly |
| Data accuracy | Cross-check ONS figures against Rightmove/Zoopla area guides |

---

## 8. Success Metrics

| Metric | Target (Month 1) |
|---|---|
| Tool live and deployed | ✅ |
| Daily unique visitors | 50+ |
| Gumroad sales | 10+ |
| TikTok videos posted | 20+ |
| Revenue | £50–£150 |
