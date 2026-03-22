# Claude Skills & Workflow Guide — London Housing Calculator

This is your playbook for using Claude (in VS Code via Copilot) effectively to build, debug, and ship this project.

---

## Skill 1: Structured Spec → Code Generation

**What:** Give Claude a precise spec and it generates clean, working code in one shot.

**How to use it:**
Instead of vague requests, reference the PRODUCT_SPEC.md directly:

```
Build the affordability calculator from PRODUCT_SPEC.md section 2.1.
Use vanilla HTML/CSS/JS. Create separate files: index.html, css/styles.css, js/calculator.js, js/ui.js.
Implement the exact inputs, outputs, and risk rating logic specified.
```

**Why it works:** Claude in VS Code can read your files — the spec becomes the single source of truth.

---

## Skill 2: Iterative Building (Step-by-Step)

**What:** Build in small, testable chunks rather than asking for everything at once.

**Recommended build order:**

| Step | Prompt pattern |
|---|---|
| 1 | "Build the HTML form with all inputs from section 2.1 of PRODUCT_SPEC.md. No logic yet." |
| 2 | "Add the mortgage payment calculation in js/calculator.js. Export a pure function." |
| 3 | "Wire up the form to the calculator. Show outputs below the form." |
| 4 | "Add stamp duty calculation using the SDLT logic from the spec." |
| 5 | "Style it — modern card layout, mobile-first, colour-coded risk ratings." |
| 6 | "Add input validation — no negative numbers, salary required, etc." |

**Pro tip:** After each step, test in browser. If something breaks, paste the error into chat.

---

## Skill 3: Debugging with Context

**What:** When something breaks, give Claude the error + relevant code.

**Bad:** "the calculator doesn't work"

**Good:**
```
The monthly payment shows NaN when I enter £350,000 property price, £50,000 deposit, 5.5% rate, 30 years.
The calculation is in js/calculator.js. What's causing this?
```

**Even better:** Just say "check the errors in my project" — Claude in VS Code can see lint/compile errors directly.

---

## Skill 4: Formula Validation

**What:** Ask Claude to verify your financial calculations are correct.

**Prompt:**
```
Verify that my mortgage calculation matches this scenario:
- Property: £400,000
- Deposit: £60,000 (15%)
- Rate: 5.5%
- Term: 25 years

Expected monthly payment should be approximately £2,166.
Does my calculator.js produce this? If not, find the bug.
```

**Why it matters:** Financial tools MUST be accurate. Cross-check against MSE mortgage calculator.

---

## Skill 5: UI/UX Polish Prompting

**What:** Turn a working but ugly tool into something that looks professional.

**Prompt pattern:**
```
Improve the styling of my calculator:
- Centered card, max-width 700px
- Soft shadows, 8px border-radius
- Input labels above fields, not beside
- Risk rating as a coloured badge (green/amber/red)
- Mobile responsive
- Use system font stack
Don't change any logic, only CSS and HTML structure.
```

---

## Skill 6: Feature Expansion (v2+)

**What:** Add new features without breaking existing ones.

**Prompt pattern:**
```
Add a new tab "Deposit Tracker" to the calculator.
Inputs and outputs are defined in PRODUCT_SPEC.md section 2.2.
Keep the existing affordability calculator unchanged.
Add tab navigation at the top of the page.
```

---

## Skill 7: Deployment

**What:** Get step-by-step deployment instructions.

**Prompt:**
```
Walk me through deploying this project to Netlify for free.
Assume I have a GitHub account but have never deployed a site before.
Step by step, beginner level.
```

---

## Skill 8: Content Ideas Generation

**What:** Use Claude to generate TikTok/Shorts script ideas based on your tool.

**Prompt:**
```
Give me 10 faceless TikTok video ideas for a London property affordability calculator.
Each should be a "Can you afford X?" scenario using real London prices.
Include the hook (first 3 seconds) and what to show on screen.
```

---

## Skill 9: Code Review & Refactoring

**What:** Once your MVP works, ask Claude to clean it up.

**Prompt:**
```
Review my codebase. Suggest improvements for:
- Code readability
- Performance
- Accessibility (a11y)
- SEO basics (meta tags, og:image)
Don't rewrite everything — give targeted changes.
```

---

## Skill 10: Testing Edge Cases

**What:** Make sure your calculator handles weird inputs.

**Prompt:**
```
What edge cases should I test for a UK mortgage affordability calculator?
Generate test scenarios including:
- Zero deposit
- Very high salary
- Very low property price
- 0% interest rate
- Service charge higher than mortgage
Then check if my calculator handles them correctly.
```

---

## Quick Reference — Prompt Templates

### Generate a component
```
Build [component name] based on section [X] of PRODUCT_SPEC.md.
Use vanilla JS. Keep it in a separate file: js/[name].js.
```

### Fix a bug
```
[Describe what's wrong + what you expected]
The relevant code is in [filename].
```

### Improve styling
```
Make [component] look more professional.
[Describe desired look]. Don't change logic.
```

### Add a feature
```
Add [feature] from PRODUCT_SPEC.md section [X].
Don't modify existing features.
```

### Deploy
```
How do I deploy this static site to [Netlify/Vercel] for free? Step by step.
```

---

## Workflow Summary

```
1. Spec (PRODUCT_SPEC.md)     ← Your blueprint  
2. Build iteratively           ← One feature at a time  
3. Test in browser             ← After every change  
4. Debug with context          ← Paste errors + code  
5. Polish UI                   ← CSS only, no logic changes  
6. Deploy                      ← Netlify, 5 minutes  
7. Post content                ← TikTok driving traffic  
8. Iterate based on feedback   ← Add features, fix issues  
```
