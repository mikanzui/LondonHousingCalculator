# UI/UX Improvement Plan — Designer Skills Collection Audit

> Based on frameworks from [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills) (63 skills, 8 plugins).
> Applied to the London Housing Calculator's Dark Neumorphic theme (v3).

---

## Audit Summary

### What's working well ✓
- Neumorphic shadow system (raised/sunken pairs) is consistent
- Good ARIA attributes: `role="tablist"`, `aria-live="polite"`, `aria-required`
- Keyboard arrow navigation on tab bar
- `prefers-reduced-motion: reduce` respected
- Semantic HTML structure (header, nav, main, footer, fieldset/legend)
- Shared app state with auto-fill across tabs
- Error messages placed near source inputs

### Gaps identified ✗

| # | Skill Framework | Issue | Impact |
|---|----------------|-------|--------|
| 1 | **Design Tokens** | No spacing scale tokens — 15+ arbitrary values (0.15rem–1.5rem) | Inconsistent rhythm |
| 2 | **Typography Scale** | No modular type scale — 10+ hardcoded sizes (0.65rem–1.25rem) | No hierarchy system |
| 3 | **Color System** | Missing `--clr-info` semantic color; only safe/stretch/risky | Incomplete semantic palette |
| 4 | **Dark Mode Design** | Only 2 surface levels (bg + surface); need 3–4 for elevation | Flat depth perception |
| 5 | **Visual Hierarchy** | Result values use gradient text — may fail contrast checks | Accessibility risk |
| 6 | **Spacing System** | No spacing tokens; padding/margin are ad-hoc throughout | Inconsistent whitespace |
| 7 | **Responsive Design** | Only 2 breakpoints (640px, 400px); no tablet (768–1024px) | Poor tablet experience |
| 8 | **Micro-Interactions** | Range slider has no visual fill track; no live validation | Missing feedback |
| 9 | **Feedback Patterns** | No inline validation on input; errors only on submit | Late error discovery |
| 10 | **Loading States** | Borough data fetch has zero loading indicator | User uncertainty |
| 11 | **Error Handling UX** | No helpful empty state for area finder; no network error handling | Dead-end UX |
| 12 | **Animation Principles** | Card stagger only handles 6 items; no exit animations | Incomplete choreography |
| 13 | **State Machine** | Form has no explicit idle→editing→submitting→results states | No button disabled feedback |
| 14 | **Accessibility** | No skip-to-content link; no focus management after tab switch | Keyboard users lost |
| 15 | **Data Visualization** | Chart lacks direct labels; no colorblind-safe palette verified | Chart accessibility |
| 16 | **Layout Grid** | Single max-width (840px), no column grid system | Rigid layout |
| 17 | **Component Spec** | No loading/disabled button variant; no success state | Missing states |

---

## Implementation Plan

### Phase A — Design Token Foundation (CSS only)
**Skills applied**: Design Token, Spacing System, Typography Scale, Color System

1. **Add spacing scale tokens** as CSS custom properties:
   ```
   --space-2xs: 0.125rem (2px)
   --space-xs: 0.25rem (4px)
   --space-sm: 0.5rem (8px)
   --space-md: 1rem (16px)
   --space-lg: 1.5rem (24px)
   --space-xl: 2rem (32px)
   --space-2xl: 3rem (48px)
   ```

2. **Add type scale tokens** (ratio ~1.25 Major Third):
   ```
   --text-xs: 0.7rem (caption/fine-print)
   --text-sm: 0.8rem (labels/helper)
   --text-base: 0.95rem (body/inputs)
   --text-md: 1.1rem (subheadings)
   --text-lg: 1.25rem (section titles)
   --text-xl: 1.5rem (page title)
   ```

3. **Add surface elevation tokens** (Dark Mode Design):
   ```
   --clr-surface-1: #252538 (cards)
   --clr-surface-2: #2a2a42 (modals, elevated)
   --clr-surface-3: #30304a (tooltips, popovers)
   ```

4. **Add --clr-info** semantic color (blue) for informational notes

5. **Replace all hardcoded spacing/sizing values** with token references

### Phase B — Visual Hierarchy & Accessibility (CSS + HTML)
**Skills applied**: Visual Hierarchy, Dark Mode Design, Accessibility Audit

1. **Add skip-to-content link** at top of body
2. **Focus management**: Move focus to results section after calculation, to new tab panel after tab switch
3. **Replace gradient text on result values** with solid high-contrast color + gradient accent on the card border instead
4. **Add scope attributes** to all table headers
5. **Add text alternative** for deposit chart (hidden summary table)
6. **Verify all color contrasts** meet WCAG AA (4.5:1 body, 3:1 large/UI)
7. **Add visible focus indicators** on all interactive elements (not just tab buttons)

### Phase C — Interaction & Feedback (JS + CSS)
**Skills applied**: Micro-Interaction Spec, Feedback Patterns, Error Handling UX, Loading States, State Machine

1. **Live inline validation**: Validate salary/price/deposit fields on blur (not just submit)
2. **Range slider fill track**: CSS to show filled portion of the range input
3. **Button loading state**: Show spinner + "Calculating…" while processing, disable during compute
4. **Borough data loading**: Show skeleton/spinner while fetching JSON
5. **Network error handling**: Catch fetch failures with retry option
6. **Empty state improvements**: Helpful messaging when no boroughs match (suggest adjustments)
7. **Success micro-interaction**: Brief checkmark or glow pulse on results card after calculation
8. **Scalable stagger animation**: Use CSS `calc()` with nth-child for any number of cards

### Phase D — Responsive & Data Viz (CSS + JS)
**Skills applied**: Responsive Design, Layout Grid, Data Visualization

1. **Add tablet breakpoint** at 768px with adjusted card padding, grid gaps
2. **Touch target audit**: Ensure all clickable elements ≥ 44px
3. **Chart improvements**: Direct data labels, colorblind-friendly palette, tooltip formatting
4. **Mobile chart**: Simplified view with larger touch-friendly tooltips
5. **Table responsive**: Horizontal scroll indicator for borough table on mobile

---

## Priority Order

| Priority | Phase | Effort | User Impact |
|----------|-------|--------|-------------|
| 🔴 High | B (Accessibility) | Medium | Blocks real users |
| 🟠 High | C (Interaction/Feedback) | Medium | Improves trust & usability |
| 🟡 Medium | A (Tokens) | Low-Medium | Foundation for consistency |
| 🟢 Medium | D (Responsive/DataViz) | Medium | Better mobile/tablet UX |

**Recommended implementation order**: A → B → C → D (tokens first to support all other changes).

---

## Success Criteria
- All spacing/type values use design tokens
- WCAG AA contrast on every text/background pair
- Live inline validation on all required fields
- Loading indicator for async operations
- Keyboard-navigable with visible focus throughout
- All existing 81 tests still pass
- Works on mobile (375px), tablet (768px), and desktop (1440px)
