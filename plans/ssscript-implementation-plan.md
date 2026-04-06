# Plan: ssscript.app-Inspired Website Redesign

> Source: [ssscript Design Analysis](./ssscript-design-analysis.md)
> Current state: 4-tab SPA with dark neumorphic design, 81 passing tests, 6 JS modules

---

## Architectural Decisions

Durable decisions that apply across all phases:

- **Layout model**: Convert from hidden tab panels to single-page vertical scroll with all 4 calculator sections visible. Each section is a full-viewport-height "window".
- **Navigation**: Bottom-fixed macOS-style dock replaces the top tab bar. Dock items smooth-scroll to sections. Active section tracked via IntersectionObserver.
- **Component wrapper**: Each calculator section wrapped in a `.window-chrome` container with a macOS-style title bar (traffic-light dots + filename label like `affordability.app`).
- **Color system**: True-black monochrome — `#0d0d0d` background, `rgba(255,255,255, 0.04–0.10)` transparent cards, no neumorphic shadows. Single accent color kept (`#6c5ce7` purple).
- **Typography**: System font stack primary (`-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter"`), display headings at 48–72px, tight letter-spacing on headings.
- **Motion**: IntersectionObserver-driven scroll reveals per section, dock hover magnification, card hover glow — all respecting `prefers-reduced-motion`.
- **Existing JS modules untouched**: All calculation logic (`mortgage.js`, `tax.js`, `stamp-duty.js`, `deposit.js`, `area-finder.js`, `rightmove.js`) remain unchanged. Only `ui.js` is modified.
- **Tests**: All 81 existing tests must continue to pass after every phase. No test file changes needed since tests cover pure calculation logic, not DOM.
- **New sections**: Hero (top), FAQ (bottom), and a redesigned footer are added. No new JS modules needed — these are static HTML+CSS.

---

## Phase 1: Scroll Layout + Window Chrome

**Goal**: Convert from hidden tabs to single-page scroll. Wrap each calculator in macOS window chrome. Remove the tab panel hide/show logic. All 4 calculators visible on page, each in its own `100vh` section.

### What to build

Remove `role="tabpanel"`, `hidden`, and the tab-panel JS toggle. Each section becomes a visible `<section>` with a `.window-chrome` wrapper containing a title bar with three colored dots (red/yellow/green) and a label (`affordability.app`, `deposit.app`, `boroughs.app`, `compare.app`). Sections stack vertically with `min-height: 100vh` and generous padding. Smooth-scroll `id` anchors on each section.

In `ui.js`, remove the tab-switching logic (`switchTab`, `tabBtns` click handler). Replace with IntersectionObserver that tracks which section is in view (for the dock in Phase 3). Forms and result rendering stay the same — they just aren't hidden anymore.

### Acceptance criteria

- [ ] All 4 calculator sections visible on one scrollable page without clicking tabs
- [ ] Each section wrapped in `.window-chrome` with title bar (3 dots + `.app` label)
- [ ] `min-height: 100vh` per section with vertical section spacing (`80–120px`)
- [ ] Old tab bar HTML and tab-switching JS removed
- [ ] Profile bar repositioned (sticky below hero or inside dock)
- [ ] All 4 forms still submit correctly and render results
- [ ] All 81 tests still pass
- [ ] Scrolling to `#affordability`, `#deposit`, `#area`, `#compare` anchors works

---

## Phase 2: True-Black Color System + Transparent Cards

**Goal**: Replace the neumorphic purple-tinted palette with ssscript's true-black monochrome. Cards become semi-transparent with hair-thin borders. Remove all neumorphic shadows.

### What to build

Rewrite the `:root` CSS tokens:
- `--clr-bg` → `#0d0d0d`
- `--clr-surface` → `rgba(255,255,255, 0.04)`
- `--clr-surface-2` → `rgba(255,255,255, 0.07)`
- `--clr-surface-3` → `rgba(255,255,255, 0.10)`
- `--clr-border` → `rgba(255,255,255, 0.06)`
- `--clr-text` → `#ffffff` (pure white for headings), `#aaaaaa` (muted body)
- Remove `--clr-bg-gradient` (flat black, no gradient)
- Remove all `--neu-*` shadow variables and their usages
- Keep `--clr-primary: #6c5ce7` as sole accent
- Keep semantic colors (`--clr-safe`, `--clr-stretch`, `--clr-risky`)

Cards get `background: var(--clr-surface); border: 1px solid var(--clr-border); backdrop-filter: blur(12px);` instead of solid bg + box-shadow.

Inputs get the sunken look from a lighter border on focus, not inset shadows.

### Acceptance criteria

- [ ] Page background is true black (#0d0d0d), no gradient
- [ ] Cards are semi-transparent with visible subtle borders, no box-shadow
- [ ] All `--neu-*` variables removed from CSS; no neumorphic shadows remain
- [ ] Text is white/gray on black — readable with sufficient contrast (4.5:1 WCAG AA)
- [ ] Semantic color badges (safe/stretch/risky) still clearly distinguishable
- [ ] Input focus states use border-color change, not shadow
- [ ] Window chrome title bar uses `--clr-surface-2` background
- [ ] All 81 tests still pass

---

## Phase 3: Dock Navigation

**Goal**: Add a macOS-style dock fixed to the bottom of the viewport. Dock contains icons for each section + a live clock. Active section highlighted via IntersectionObserver. Dock items magnify on hover.

### What to build

New HTML: A `<nav class="dock">` element fixed to the bottom, containing 4-5 icon buttons (Affordability 🏠, Deposit 💰, Areas 📍, Compare 📊) and a live clock span. Each button has `onclick` → `scrollIntoView({ behavior: 'smooth' })` targeting the section anchor.

CSS: Dock has `position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);`, `background: rgba(255,255,255, 0.08)`, `backdrop-filter: blur(40px)`, `border-radius: 20px`, `padding: 8px 16px`. Dock items: `transition: transform 150ms`. On hover, items scale to 1.3× and adjacent items scale to 1.15× (CSS `:hover` + adjacent sibling selectors, or JS for full macOS-style magnification). Active item has a small dot indicator below it.

JS: An IntersectionObserver watches all 4 sections. When a section is ≥50% visible, its dock icon gets an `.active` class and the dot indicator. The live clock updates every minute with `HH:MM` format.

### Acceptance criteria

- [ ] Dock visible at bottom of viewport on all screen sizes
- [ ] 4 section icons + clock displayed in the dock
- [ ] Clicking a dock icon smooth-scrolls to that section
- [ ] Active section highlighted with dot indicator beneath its dock icon
- [ ] Hover magnification effect on dock items (scale up on hover)
- [ ] Dock has frosted glass background (backdrop-blur + semi-transparent)
- [ ] Dock doesn't overlap form content (body has `padding-bottom` for dock height)
- [ ] Clock shows current time, updates live
- [ ] All 81 tests still pass

---

## Phase 4: Hero Section + Typography Overhaul

**Goal**: Add a full-viewport hero section at the top of the page. Overhaul all typography to match ssscript's large, tight-tracked headings with split-word styling.

### What to build

New HTML at the top of `<main>`: A `<section class="hero">` with `min-height: 100vh`, centered content:
- Split heading: `<span class="hero-muted">London Housing</span>` + `<span class="hero-bold">Calculator</span>` on separate lines
- Subtitle: "Realistic affordability for real London buyers"
- A scroll indicator arrow/chevron at the bottom

Typography overhaul:
- Font stack → `-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif` (system first, Inter fallback)
- Remove Google Fonts `<link>` — bundle Inter locally or drop it entirely
- Display heading: `clamp(48px, 8vw, 80px)`, weight 700, `letter-spacing: -0.03em`
- Section headings (`.window-chrome` labels): `24–32px`, weight 600
- Body text: `16–17px`, weight 400, `line-height: 1.65`, color `#aaaaaa`
- Form labels: `13–14px`, weight 500, color `#888888`

### Acceptance criteria

- [ ] Hero section appears first, taking full viewport height
- [ ] "London Housing" in muted gray, "Calculator" in bold white — large display size
- [ ] Subtitle text below heading in muted gray
- [ ] Scroll indicator visible at bottom of hero
- [ ] System font stack in use; no external font request (or Inter loaded as fallback only)
- [ ] Heading letter-spacing is tight (`-0.02em` to `-0.04em`)
- [ ] Body text is `#aaaaaa` muted with generous line-height
- [ ] All 81 tests still pass

---

## Phase 5: Buttons, Inputs & Form Styling

**Goal**: Restyle all interactive elements to match ssscript's minimal, borderline-invisible aesthetic. Pill-shaped buttons with borders, clean inputs, subtle focus states.

### What to build

Buttons: Replace filled primary buttons with pill-shaped outline buttons — `background: transparent`, `border: 1px solid rgba(255,255,255, 0.15)`, `border-radius: 999px`, `color: #fff`, `padding: 12px 28px`. On hover: `background: rgba(255,255,255, 0.06)`, `border-color: rgba(255,255,255, 0.25)`. Keep the SVG icons inside buttons.

Inputs: `background: rgba(255,255,255, 0.03)`, `border: 1px solid rgba(255,255,255, 0.08)`, `border-radius: 10px`, `color: #fff`. On focus: `border-color: var(--clr-primary)`, subtle `box-shadow: 0 0 0 2px var(--clr-primary-ring)`. No inset shadows.

Selects: Same as inputs. Custom arrow via SVG `background-image`.

Checkboxes: Custom checkbox with `border: 1px solid rgba(255,255,255, 0.15)`, `border-radius: 4px`. Checked state fills with `--clr-primary`.

Range slider: Thin track (`4px`) with `rgba(255,255,255, 0.1)` background, filled portion in `--clr-primary`. Thumb: small circle (`16px`), white, with subtle shadow.

### Acceptance criteria

- [ ] All buttons are pill-shaped outlines (not filled)
- [ ] Button hover shows subtle background fill + border brightening
- [ ] Inputs have transparent background with thin borders
- [ ] Input focus shows purple ring (`--clr-primary`)
- [ ] Selects styled consistently with inputs
- [ ] Custom checkboxes match the monochrome theme
- [ ] Range slider is thin with purple fill and white thumb
- [ ] All validation error states still visible (red border/text)
- [ ] All 81 tests still pass

---

## Phase 6: FAQ Section (Email-Thread Style)

**Goal**: Add a housing FAQ section between the last calculator section and the footer. Style each Q&A as an email thread message, inspired by ssscript's Apple Mail pattern.

### What to build

New HTML: A `<section class="faq-section" id="faq">` after the Compare section. Contains 6–8 Q&A items about London housing:
1. "What is stamp duty for first-time buyers?"
2. "How much deposit do I actually need?"
3. "What lending multiple will banks offer?"
4. "Is a Lifetime ISA worth it?"
5. "How accurate is this calculator?"
6. "What does the affordability percentage mean?"

Each Q&A is a `.mail-message` container:
- `.mail-header`: From line ("London Housing Calculator"), To ("You"), Subject = the question
- `.mail-body`: The answer text
- `.mail-footer`: "Sent from London Housing Calculator" (playful hat-tip to the "Sent from my iPhone" pattern)

CSS: Messages have `.window-chrome` wrapping (like a Mail.app window), alternating slight alignment shifts, blue accent on subject line, muted gray for metadata.

### Acceptance criteria

- [ ] FAQ section visible between Compare section and footer
- [ ] 6–8 housing-related questions with clear, accurate answers
- [ ] Each Q&A styled as an email thread message (headers, body, footer)
- [ ] Email metaphor is clear — "From", "To", "Subject" labels visible
- [ ] "Sent from London Housing Calculator" footer on each message
- [ ] Section accessible via dock navigation (add FAQ icon to dock)
- [ ] FAQ section has a scroll anchor (`#faq`)
- [ ] All 81 tests still pass

---

## Phase 7: Scroll Animations + Motion

**Goal**: Add IntersectionObserver-driven entrance animations for each section and micro-interactions for cards, buttons, and the dock. Respect `prefers-reduced-motion`.

### What to build

Section reveals: Each `.window-chrome` section starts with `opacity: 0; transform: translateY(40px)`. An IntersectionObserver (threshold 0.1) adds `.revealed` class → `opacity: 1; transform: none` with `transition: 600ms ease-out`.

Card stagger: Cards within a section get sequential `transition-delay` (100ms increments) for a cascade effect.

Card hover: `translateY(-2px)` + `border-color: rgba(255,255,255, 0.12)` + subtle purple glow `box-shadow: 0 0 20px rgba(108,92,231, 0.06)`.

Button press: `transform: scale(0.97)` on `:active`.

Hero animation: Heading fades/slides in from bottom on page load (CSS `@keyframes`). Scroll indicator pulses.

Dock: Items have spring-like hover transition (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

Reduced motion: All animations wrapped in `@media (prefers-reduced-motion: no-preference)`. With reduced motion, everything is instant (no transforms, no delays).

### Acceptance criteria

- [ ] Sections animate in (fade + slide up) as user scrolls into view
- [ ] Cards within a section stagger their appearance
- [ ] Card hover lifts card slightly with subtle glow
- [ ] Button press has a scale-down micro-interaction
- [ ] Hero content animates on page load
- [ ] Scroll indicator has a pulse/bounce animation
- [ ] All animations disabled when `prefers-reduced-motion: reduce` is set
- [ ] No janky/jumpy animations on low-end devices (use `transform` and `opacity` only)
- [ ] All 81 tests still pass

---

## Phase 8: Footer + Responsive Polish

**Goal**: Redesign the footer to match ssscript's minimal two-column style. Polish responsive behavior across all breakpoints. Ensure the dock works well on mobile.

### What to build

Footer: Two-column layout — **Navigate** column (scroll links to each section) + **About** column (disclaimer, data sources, tax year). Logo + copyright at the bottom. Low-contrast text (`#555`), minimal styling.

Mobile dock: At `< 768px`, dock items lose labels (icon-only), dock padding reduces, magnification effect is disabled (tap targets stay 44px). Clock hidden on mobile.

Mobile sections: Window chrome title bars become compact. Forms stack to single column. Hero heading uses `clamp()` to scale down. Section `min-height` drops from `100vh` to `auto` on mobile to avoid excessive blank space.

Breakpoints:
- `> 1024px`: Full desktop layout, side-by-side form+results where possible
- `768–1024px`: Tablet, single-column forms, slightly reduced spacing
- `< 768px`: Mobile, compact dock, stacked layout, smaller headings
- `< 480px`: Small mobile, reduced section padding, compact window chrome

### Acceptance criteria

- [ ] Footer has Navigate + About columns on desktop, stacks on mobile
- [ ] Footer text is low-contrast, minimal
- [ ] Dock is usable on mobile (icon-only, adequate tap targets)
- [ ] No horizontal overflow on any screen width down to 320px
- [ ] Hero heading scales appropriately from mobile to desktop via `clamp()`
- [ ] Window chrome title bars are compact on mobile
- [ ] Forms are single-column on mobile
- [ ] Results tables scroll horizontally on narrow screens
- [ ] All 81 tests still pass

---

## Phase Summary

| Phase | Deliverable | Key Risk |
|-------|------------|----------|
| 1 | Scroll layout + window chrome | Tab removal may break form submission event listeners — verify all 4 forms work |
| 2 | True-black color system | Contrast regression — verify WCAG AA on all text |
| 3 | Dock navigation | IntersectionObserver thresholds need tuning for variable-height sections |
| 4 | Hero + typography | Removing Google Fonts may cause FOUT on Windows — keep Inter as fallback |
| 5 | Buttons/inputs/forms | Transparent inputs may have readability issues with autofill backgrounds |
| 6 | FAQ section | Content accuracy — housing info must be factually correct for 2025-26 |
| 7 | Scroll animations | Performance on low-end devices — stick to compositor-friendly properties |
| 8 | Footer + responsive | Dock on mobile needs careful tap-target sizing (≥44px) |

---

## Verification Plan

After each phase:
1. Run `npx vitest run` — all 81 tests must pass
2. Open `http://localhost:52718/LondonHousingCalculator/` — visual check
3. Submit all 4 calculator forms — verify results render correctly
4. Check at 3 viewport widths: 1440px, 768px, 375px
5. Toggle `prefers-reduced-motion` — verify motion compliance
6. Keyboard-navigate through the entire page — verify focus management
