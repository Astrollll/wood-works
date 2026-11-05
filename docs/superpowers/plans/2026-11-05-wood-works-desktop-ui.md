# Wood Works Desktop UI Recreation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the 14 desktop screens of the Wood Works Figma design as a working Vite + React app with exact UI fidelity and mock client-side flows.

**Architecture:** Vite + React SPA, `react-router-dom` with a `createBrowserRouter` route list (14 screens + catch-all → `/login`), design tokens in a single `src/styles/tokens.css`, shared components mirroring the Figma Design System page, one folder per page with colocated tests/styles, mock product data in `src/data/products.js`, session-only order records via `src/lib/orders.js` (router state hands an order to `/order-confirmation`).

**Tech Stack:** React 19, react-router-dom, hand-written CSS (custom properties, no Tailwind), @fontsource/poppins (400/500/600/700) + @fontsource/inter (700), Vitest + React Testing Library + jsdom, ESLint 9 flat config.

**Spec:** `docs/superpowers/specs/2026-11-05-wood-works-desktop-recreation-design.md` — the exact-value tables (§3 tokens, §4 §4a per-screen values, §5 components, §7 interactions) are the authority for every color, size, string, and date. Executors **must read the spec next to this plan**.

## Global Constraints

- Environment: Node v24.14.0, npm 11.18.0, Windows, PowerShell 5.1 shell (no `?:` ternary in inline PS).
- Every color/size/radius/gap comes from `tokens.css` CSS variables — **no raw hex or magic px in component/page CSS** (one-offs documented in spec §4a may be defined as additional variables).
- Exact palette: `#2B211E` text · `#3E2723` primary · `#795548` accent · `#A1887F` placeholder · `#F7F3EE` bg · `#FFFFFF` surface · `#756E6A` muted · `#D8D0CA` border · `#98CCFF` link · `#C0392B` validation error text only.
- All user-visible strings are transcribed **verbatim from the spec**, including case ("LOG IN" vs "Sign Up"), glyphs (`−` U+2212, `+`, `→`, `₱`, `☐`, `×`, `.` at end of "SUBMIT CUSTOM ORDER.").
- Default design width 1440px, fixed, horizontally centered overflow otherwise; no responsive behavior in this scope.
- Image placeholders are CSS blocks with `role="img"` + accessible name equal to the product/section name.
- Components/pages/tests live in one folder each (`src/components/Button/Button.jsx`, `Button.css`, `Button.test.jsx`); BEM-lite class names prefixed per component.
- Conventional commits (`feat:`, `test:`, `chore:`, `docs:`); `npm run test` (vitest run) green at every commit; run `npm run lint` before each commit.
- Do **not** call the Figma API from implementation tasks except the one re-pull step in Task 11 (respect rate limits); every other pixel decision is already pinned in the spec.
- No persistence, no backend; account/order state lives in router state and module memory only.

## Review Focus

Failure modes the tests must pin:

1. **Empty category filter** — selecting the "Others" chip yields **zero cards** with no crash; grid renders empty while the page stays mounted: owning test in Task 11 (CatalogPage).
2. **Stepper lower bound** — clicking "−" at quantity 1 stays at 1: owning test in Task 8 (QuantityStepper).
3. **Price formatting** — `formatPrice(5000)` returns exactly `₱5,000` (₱ + thousands separator, no decimals): Task 3.
4. **OTP completeness** — with fewer than 6 digits entered, "Send OTP" on `/verify-otp` does not advance: Task 10.
5. **Unknown route** — `/nonsense` redirects to `/login`, not a blank screen: Task 14.

---

### Task 1: Project scaffold + tooling

**Files:** Create `package.json`, `vite.config.js`, `eslint.config.js`, `.gitignore`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/App.css`, `src/App.test.jsx`.

**Interfaces: Produces** `npm run dev` (Vite on :5173), `npm run build`, `npm run test` (vitest run), `npm run lint`, `<App />` mounted in `src/main.jsx` with a temporary placeholder route.

- [ ] **Step 1: Scaffold manually (folder is not empty — avoid `npm create vite` interactivity)**

`package.json` scripts exactly:

```json
{
  "name": "wood-works",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Dependencies: `react`, `react-dom`, `react-router-dom`, `@fontsource/poppins`, `@fontsource/inter`. Dev deps: `vite`, `@vitejs/plugin-react`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`. `vite.config.js`: react plugin + `test: { environment: "jsdom", setupFiles: ["./src/test/setup.js"], globals: true }`. Create `src/test/setup.js` importing `@testing-library/jest-dom`. `index.html`: title `Wood Works`, `<div id="root">`. `.gitignore`: `node_modules/`, `dist/`, coverage. `eslint.config.js`: ESLint 9 flat config with `js.configs.recommended` + react-hooks/react-refresh plugins, browser globals.

- [ ] **Step 2: `npm install`**
- [ ] **Step 3: Write placeholder App** — `App.jsx` renders `<h1>Wood Works</h1>` inside `main`.

- [ ] **Step 4: Write smoke test** `src/App.test.jsx`

```jsx
import { render, screen } from "@testing-library/react";
import App from "./App";
test("renders placeholder", () => {
  render(<App />);
  expect(screen.getByText("Wood Works")).toBeInTheDocument();
});
```

- [ ] **Step 5: Run** `npm run test` and `npm run lint` — both pass (placeholder has no lint errors).
- [ ] **Step 6: Commit + push**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + Vitest + ESLint"
git push origin main
```

### Task 2: Design tokens + base styles

**Files:** Create `src/styles/tokens.css`, `src/styles/base.css`. Modify `src/main.jsx` (import both fonts + styles before `App`).

**Interfaces: Consumes** spec §3/§4a values. **Produces** the CSS variable names every later task uses (pinned below).

- [ ] **Step 1: Write `tokens.css`** defining exactly these variables (values verbatim from spec):

```css
:root {
  --color-text: #2b211e;        /* headings, body */
  --color-primary: #3e2723;     /* filled buttons, selected chips */
  --color-accent: #795548;      /* auth panel, accent links, hero image */
  --color-image-placeholder: #a1887f; /* product images, profile icon, cards */
  --color-bg: #f7f3ee;          /* page background */
  --color-surface: #ffffff;     /* navbar, cards, inputs */
  --color-text-muted: #756e6a;  /* secondary text, placeholders */
  --color-border: #d8d0ca;      /* input borders, default chips */
  --color-link-blue: #98ccff;   /* upload reference link */
  --color-error: #c0392b;       /* validation text only */

  --font-poppins: "Poppins", sans-serif;
  --font-inter: "Inter", sans-serif;

  --fs-48: 48px;  --lh-hero: 58px;    --w-700: 700;  --w-600: 600;  --w-500: 500; --w-400: 400;
  --fs-40: 40px;  --lh-48: 48px;
  --fs-32: 32px;  --lh-36: 36px;
  --fs-24: 24px;
  --fs-18: 18px;  --lh-27: 27px;
  --fs-16: 16px;  --lh-24: 24px;
  --fs-14: 14px;  --lh-21: 21px;

  --radius-btn: 8px;      /* buttons, inputs */
  --radius-card: 12px;    /* cards, auth card, hero image, form card */
  --radius-chip: 20px;    /* category chips */
  --radius-otp: 10px;     /* OTP tiles */

  --page-gutter: 80px;      /* navbar + hero + sections horizontal padding */
  --section-pad-y: 64px;    /* featured section vertical padding (Task 11 pins rest after re-pull) */
  --gap-xs: 4px;  --gap-sm: 8px;  --gap-md: 16px;  --gap-lg: 24px;  --gap-xl: 32px;
  --size-btn-h: 48px;
  --size-nav-h: 80px;
  --size-icon: 40px;        /* profile icon */
}
```

- [ ] **Step 2: Write `base.css`** — box-sizing reset, zero body margin, body font `var(--font-poppins)` with `var(--color.text)`/`--color-bg`; `h1..h6, p { margin: 0 }`; `button, input, textarea { font: inherit; color: inherit; }`; `:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }`; `.app-width { max-width: 1440px; margin-inline: auto; }`.

- [ ] **Step 3: Wire imports in `main.jsx`** — `@fontsource/poppins/400.css`, `/500.css`, `/600.css`, `/700.css`, `@fontsource/inter/700.css`, then `./styles/tokens.css`, then `./styles/base.css`.

- [ ] **Step 4: Verify** tokens present: `Select-String -Path src\styles\tokens.css -Pattern '#3e2723|#f7f3ee|#a1887f|#d8d0ca|#98ccff'` (all hit) and `npm run test` passes.
- [ ] **Step 5: Commit** `feat: design tokens + base styles from Figma spec`

### Task 3: `lib/formatPrice.js` + `lib/validation.js`

**Files:** Create `src/lib/formatPrice.js`, `src/lib/formatPrice.test.js`, `src/lib/validation.js`, `src/lib/validation.test.js`.

**Interfaces: Produces** `formatPrice(amount: number): string` · `isEmail(value: string): boolean` · `isFilled(value: unknown): boolean` · `passwordsMatch(a: string, b: string): boolean` — all named exports.

- [ ] **Step 1: Write failing tests**

```js
// formatPrice.test.js
import { formatPrice } from "./formatPrice";
test("5000 -> ₱5,000 exactly", () => expect(formatPrice(5000)).toBe("₱5,000"));
test("2500 -> ₱2,500", () => expect(formatPrice(2500)).toBe("₱2,500"));
test("no decimals", () => expect(formatPrice(3000)).not.toMatch(/\.00/));
// validation.test.js
import { isEmail, isFilled, passwordsMatch } from "./validation";
test("", () => { expect(isFilled("x")).toBe(true); expect(isFilled("")).toBe(false); });
test("email shapes", () => { expect(isEmail("a@b.com")).toBe(true); expect(isEmail("nope")).toBe(false); });
test("match", () => { expect(passwordsMatch("a", "a")).toBe(true); expect(passwordsMatch("a", "b")).toBe(false); });
```

- [ ] **Step 2: Run** `npm run test` — expect FAIL (modules missing).
- [ ] **Step 3: Implement** — `formatPrice` = `"₱" + amount.toLocaleString("en-US")`; `isFilled` = non-empty string; `isEmail` = `/^\S+@\S+\.\S+$/`; `passwordsMatch` = strict equality.
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat: price formatting + validation helpers`

### Task 4: `data/products.js` mock catalog

**Files:** Create `src/data/products.js`, `src/data/products.test.js`.

**Interfaces: Produces** named exports `PRODUCTS`, `CATEGORIES` (order `[All, Tables, Chairs, Cabinets, Beds, Others]`), `getProduct(id)`, `getByCategory(category)` (category `All` → all). Product shape: `{ id, name, category, price, blurb, description, details: { Material, Size, Availability } }` — `Size` string holds the **multiplication sign** variant `4 × 6 ft` for Product Details use; Custom Order screen composes its own `4 x 6 ft` line from a constant `DIMENSIONS_PLAIN = ["Material: Solid Wood", "Size: 4 x 6 ft", "Availability: Available"]` also exported from this file.

- [ ] **Step 1: Write failing tests** asserting exactly: 8 products; ids `['wooden-dining-table','classic-wooden-chair','wooden-cabinet','study-table','bed-frame','coffee-table','bookshelf','wooden-bench']`; prices `[5000,2500,7000,4500,8000,3500,4000,3000]` in the same order; blurb on every product `'Solid wood furniture'`; category counts `{Tables:3, Chairs:2, Cabinets:2, Beds:1, Others:0}`; `getProduct('wooden-dining-table').description === 'A handcrafted wooden dining table designed for everyday use and durability.'`; `.details === { Material:'Solid Wood', Size:'4 × 6 ft', Availability:'Available' }`; `getByCategory('All').length === 8`; `getProduct('missing')` undefined.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** dataset + helpers (diet dining-table per above; others get sensible short wood-furniture descriptions ≤1 sentence, kept in the spec's tone).
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat: mock product catalog`

### Task 5: `Button` + `Input`

**Files:** Create `src/components/Button/{Button.jsx,Button.css,Button.test.jsx}`, `src/components/Input/{Input.jsx,Input.css,Input.test.jsx}`.

**Interfaces: Produces**
- `<Button variant="filled"|"outline" type="button"|"submit" onClick>label</Button>` — class `btn btn--filled|btn--outline`; height `--size-btn-h`; radius `--radius-btn`; font 600/16; filled: `--color-primary` bg + white text; outline: 1.5px `--color-primary` border + text `--color-primary`, transparent bg; labels passed already-verbatim (no CSS `text-transform`).
- `<Input label id type="text"|"email"|"password" placeholder value onChange error?>` — structure: `<label htmlFor>{label}</label><input id placeholder …>` + `{error && <div role="alert" class="input__error">{error}</div>}`; input: white bg, 1px `--color-border`, radius `--radius-btn`, 16px inline padding, height 48, font 400/14, placeholder color `--color-text-muted`; label 500/14 `--color-text`, 8px gap above input; error text 400/14 `--color-error`.

- [ ] **Step 1: Write failing tests** — Button renders both variants + right class + fires `onClick`; Input associates label via `htmlFor`/`id`, passes placeholder + emits `onChange` on typing, renders error element only when `error` given.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS. **Step 5: Lint + Commit** `feat: button + input components`

### Task 6: `ProfileIcon` + `CategoryChip` + `ProductCard`

**Files:** Create the three folders as in Task 5 pattern.

**Interfaces: Produces**
- `<ProfileIcon />` — 40px circle `--color-image-placeholder`, decorative (`role="img" aria-label="Profile"`).
- `<CategoryChip label selected onClick />` — pill radius `--radius-chip`, 20px inline padding, 14/500; default: white bg + 1px `--color-border` border, text `--color-text`; selected: `--color-primary` bg, white text; renders `<button type="button" aria-pressed={selected}>`.
- `<ProductCard product onOpen />` — white card radius `--radius-card`, padding-bottom 16; image block (placeholder bg `--color-image-placeholder`, full width, ~204px tall per 280×340 card ratio); body padding 16/16/12 gap 4; title 600/18; blurb 400/14 muted; price 600/16 via `formatPrice`; `View Details →` 500/14 `--color-accent` (clickable, plus card image click); whole card click → `onOpen(product.id)`.

- [ ] **Step 1: Write failing tests** — chip `aria-pressed` toggles + classes swap on `selected`; card shows product name exactly (`screen.getByText("Wooden Dining Table")`), subtitle `'Solid wood furniture'`, `'₱5,000'`, `'View Details →'`; clicking calls `onOpen` with the id (`userEvent`).
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS. **Step 5: Commit** `feat: profile icon, category chip, product card`

### Task 7: `NavBar` + `AuthLayout` + `PageLayout`

**Files:** Create `src/components/NavBar/{…}`, `src/layouts/AuthLayout/{…}`, `src/layouts/PageLayout/{…}`.

**Interfaces: Produces**
- `<NavBar />` — `<nav>` white, height 80, inline padding `--page-gutter`; left logo button `WOOD WORKS` (700/24) → `/home`; center links 32px gap, 500/16: `Home`→`/home`, `Furniture`→`/catalog`, `Custom Order`→`/custom-order`, `My Orders`→`/my-orders`; right `ProfileIcon`.
- `<AuthLayout>{children}</AuthLayout>` — flex row 100vh: left 50% `--color-accent`, centered column gap 8: logo 700/32 white `WOOD WORKS`, tagline 400/16 white `Furniture & Custom Woodworks`; right 50% `--color-bg`, centering a white auth card (radius `--radius-card`, padding 40, column gap 16, width 420, min-height auto).
- `<PageLayout children />` — `--color-bg` bg, `<NavBar />`, then `<main>` children (`app-width` wrapper).

- [ ] **Step 1: Write failing tests** — NavBar has exactly the 4 links with the 4 hrefs + logo href; AuthLayout renders the two panel strings and children inside it; PageLayout renders `<main>` with role landmark.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS. **Step 5: Commit** `feat: navbar, auth layout, page layout`

### Task 8: `QuantityStepper` + `OtpCodeInput`

**Files:** Create both component folders.

**Interfaces: Produces**
- `<QuantityStepper value onChange(next:number) />` — renders `−` button, value text ("1"), `+` button, 500/16; `−` button when `value===1` does nothing (component guards: calls `onChange(value-1)` only if `value>1`); buttons `aria-label="Decrease quantity"` / `"Increase quantity"`.
- `<OtpCodeInput digits onChange />` — six 44×44 square text `<input>`s (maxLength 1, `inputMode="numeric"`, radius `--radius-otp`, bg `--color-bg`, no border), 11px gap; typing a digit advances focus to the next box, Backspace on empty moves focus back; emits `digits` (array of strings, length 6, e.g. `['2','4','','','','']`).

- [ ] **Step 1: Write failing tests** — stepper: renders "1"; `+` → 2; − at 1 → still 1 (no decrement call); at 2 → 1. OTP: typing `'2'` in box 1 puts `'2'` in digits and focuses box 2; completing `['2','4','6','8','0','1']` then reading digits works; Backspace clears + refocuses previous.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS. **Step 5: Commit** `feat: quantity stepper + otp code input`

### Task 9: Login + Signup screens (01, 02)

**Files:** Create `src/pages/LoginPage/{…}`, `src/pages/SignupPage/{…}`. Modify `src/App.jsx` (add routes `/login`, `/signup`; index `/` `<Navigate to="/login" replace>`; remove placeholder hero/task-1 CSS).

**Interfaces: Consumes** Task 5–7 components + helpers. **Produces** both routes; `LoginPage` submit → `navigate('/home')`; "Forgot Password?" → `/send-otp`; "Sign Up" → `/signup`; `SignupPage` submit → `/signup-success`.

- [ ] **Step 1: Write failing tests** (per spec §4 copy, exact strings) — LoginPage: renders `Welcome Back`, `Sign in to continue to Wood Works.`, labels `Email Address` / `Password`, placeholder-only inputs `Enter your email` / `Enter your password`, text `☐ Remember me` (visual text; a hidden real checkbox exists), link `Forgot Password?` → `/send-otp`, filled button `LOG IN`, trailing line `Don't have an account? Sign Up` where `Sign Up` → `/signup`; empty submit shows validation errors (email format, required password) and does NOT navigate; valid submit lands on `/home`. SignupPage: `Welcome!`, `Sign up your account`, fields + `Confirm Password`, button `Sign Up` → `/signup-success`, passwords match rule.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement both pages** composing `AuthLayout` + `Input` + `Button`. **Step 4: Run** — PASS. **Step 5: Visual check** — `npm run dev`, compare `/login` and `/signup` at 1440px against `exports/01-login.png`, `exports/02-sign-up.png`; fix token deviations until they match. **Step 6: Commit + push** `feat: login + signup screens (01, 02)`

### Task 10: OTP chain screens (03, 07, 04, 08, 05, 09)

**Files:** Create `src/pages/SendOtpPage/{…}`, `src/pages/OtpSentSuccessPage/{…}`, `src/pages/VerifyOtpPage/{…}`, `src/pages/OtpVerifiedPage/{…}`, `src/pages/ResetPasswordPage/{…}`, `src/pages/ResetSuccessPage/{…}`. Modify `src/App.jsx` routes: `/send-otp`, `/otp-sent-success`, `/verify-otp`, `/otp-verified`, `/reset-password`, `/reset-success`.

**Interfaces: Consumes** `AuthLayout`, `Input`, `Button`, `OtpCodeInput`. **Produces** the full forgot-password chain per spec §4 wiring: 03 submit → `/otp-sent-success`; 07 → `/verify-otp`; 04 (all six digits) → `/otp-verified`; 08 → `/reset-password`; 05 → `/reset-success`; 09 → `/login`.

- [ ] **Step 1: Write failing tests wiring + copy** — 03: `Welcome!`, `Reset your password`, `Email Address`/`Enter your email`, button `Send OTP` → `/otp-sent-success`. 07: heading wraps naturally as one string `Email found Successfully!`, line `The OTP is sent to your email`, button `Go to verify OTP` → `/verify-otp` (card content text-centered). 04: `Welcome!`, `Reset your password`, label `OTP`, six tiles typed `2`…, partial digits + button click → still on `/verify-otp` (Review Focus #4), full 6 → `/otp-verified`, button label `Send OTP` verbatim. 08: `OTP Verified Successfully!` (natural wrap), `You can reset your password`, `Go to Reset Password` → `/reset-password`. 05: `Welcome Back`, `Reset your password`, `New Password`/`Enter new password`, `Confirm New Password`/`Confirm new password`, `☐ Remember me` row (text + hidden checkbox), `Reset Password` → validate match → `/reset-success` (mismatch error). 09: `Password updated successfully!` (natural wrap), `You can now Log in`, `Go to Log in` → `/login`. Success/entry cards: centered text alignment.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement** the six pages. **Step 4: Run** — PASS. **Step 5: Visual check** vs `exports/03…09` PNGs at 1440px, fix deviations. **Step 6: Commit** `feat: otp + reset flow screens (03–09)`

### Task 11: Home + Catalog screens (10, 11) + section-padding re-pull

**Files:** Create `src/pages/HomePage/{…}`, `src/pages/CatalogPage/{…}`. Modify `src/App.jsx` (`/home`, `/catalog`). Optional one-off Figma GET to pin remaining section paddings (Hero vertical, Catalog body, Details bodies) if the rate limit has expired; **if still limited, use the documented 64/80 rhythm** and mark the diff check in Task 14 as the arbiter.

**Interfaces: Consumes** `PageLayout`, `Button`, `ProductCard`, data helpers. **Produces** home featured list = first 4 products in dataset order; catalog filter state.

- [ ] **Step 1: Write failing tests** — Home: heading is the 2-line string with hard break `Crafted With Wood,\nBuilt With Purpose.` (700/48/58), subtext `Explore handcrafted furniture made for your home and space.`, buttons `BROWSE FURNITURE`→`/catalog` and `CUSTOM ORDER`→`/custom-order`, hero image block `role="img" aria-label="Wood Works hero"`; section title `Featured Furniture`, sub `Explore some of our available furniture.`, exactly 4 ProductCards with names `['Wooden Dining Table','Classic Wooden Chair','Wooden Cabinet','Study Table']`, each `View Details →` → `/product/<id>`. Catalog: title `Furniture Collection` (700/40), sub `Browse our handcrafted furniture.`, chip labels `['All','Tables','Chairs','Cabinets','Beds','Others']` with `All` initially `aria-pressed=true`; all 8 cards render; clicking `Chairs` shows exactly 2 cards (`Classic Wooden Chair`, `Wooden Bench`); clicking `Others` renders **zero** cards, still on `/catalog`, no crash (Review Focus #1); clicking a card → `/product/<id>`.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS. **Step 5: Visual check** vs `exports/10-home.png`, `exports/11-catalog.png` at 1440px; fix diffs (grid gap 24, section paddings per extraction or rhythm). **Step 6: Commit + push** `feat: home + catalog screens (10, 11)`

### Task 12: Product Details (12) + `lib/orders.js`

**Files:** Create `src/lib/orders.js`, `src/lib/orders.test.js`, `src/pages/ProductDetailsPage/{…}`. Modify `src/App.jsx` (`/product/:id`).

**Interfaces: Produces**
- `createOrder({ furniture: string })` → `{ number: 'WW-0001', furniture, status: 'Pending', eta: '1-3 days' }`; counter module-scoped, zero-padded 4 (`WW-0002`, …); `DEFAULT_ORDER` export = the Figma example `WW-0001` / `Custom Dining Table`.
- Route behavior: unknown id → `<Navigate to="/catalog" replace>` (small deliberate deviation beyond Figma — no designed 404; flagged in commit message and QA report).

- [ ] **Step 1: Write failing orders tests** — first call `WW-0001`, second `WW-0002`; `status:'Pending'`; `eta:'1-3 days'` (ASCII hyphen).
- [ ] **Step 2: Run** — FAIL → **Step 3: Implement** → run PASS.
- [ ] **Step 4: Write failing page tests** — title `700/32` `Wooden Dining Table`; `price` 600/24 `₱5,000`; heading `Description` (600/16); body `A handcrafted wooden dining table designed for everyday use and durability.`; details block 3 lines `Material: Solid Wood` / `Size: 4 × 6 ft` / `Availability: Available` (14/400); QuantityStepper renders 1, `+` → 2; `ORDER NOW` (filled) creates order with `furniture: 'Wooden Dining Table'` and lands on `/order-confirmation` showing that order; `CUSTOMIZE` (outline) → `/custom-order`; left image block `role="img"`; related row = 4 identical ProductCards of the same product (per Figma duplicates).
- [ ] **Step 5: Run** — FAIL → **Step 6: Implement** → PASS. **Step 7: Commit** `feat: product details screen (12) + session orders`

### Task 13: Custom Orders (13) + Order Confirmation (14) + My Orders stub

**Files:** Create `src/pages/CustomOrderPage/{…}`, `src/pages/OrderConfirmationPage/{…}`, `src/pages/MyOrdersStubPage/{…}`. Modify `src/App.jsx` (`/custom-order`, `/order-confirmation`, `/my-orders`).

**Interfaces: Consumes** Task 12 orders, `Input`, `Button`, `PageLayout`. **Produces** custom order record `{ number, furniture: '<Furniture Type entered>', status:'Pending', eta:'1-3 days' }`.

- [ ] **Step 1: Write failing tests** — CustomOrder (all strings exact, Inter 700 for the form-label set `['Furniture Type','Wood Type','Length','Width','Height','Quantity']` at 24px, white; heading `Create Your Custom Furniture` Inter 700/40; sub `Tell us what you need and we'll help bring your idea to life.` Inter 700/18; inside-card summary: title `Wooden Dining Table` Poppins 700/32 `#2B211E`, `Description` 600/16, desc 400/16 white, detail lines `Material: Solid Wood` / `Size: 4 x 6 ft` (letter x) / `Availability: Available` white 400/14, image block `#795548`; textarea placeholder `Describe your preferred design, color, style, or other requests...` (square corners, 860×100); link-style button text `+ Upload Reference Image.` `#98CCFF` 24px (styled text-button, no file picker — placeholder semantics only); submit `SUBMIT CUSTOM ORDER.` (filled 220×48) → `/order-confirmation` with that record; empty required fields keep the user on the page with error text. Confirmation: direct visit (no router state) renders `DEFAULT_ORDER` content exactly — heading `ORDER SUBMITTED` (700/32), sub-line `Your custom furniture request has been successfully submitted.` (600/32), panel `#A1887F` square corners with 4 white 600/32 lines `Order #: WW-0001`, `Furniture: Custom Dining Table`, `Status: Pending`, `Estimated Response: 1-3 days`, ProfileIcon circle above heading, buttons `VIEW MY ORDERS` (filled)+`BACK TO HOME` (outline) → `/my-orders` / `/home`; visit via ORDER NOW state shows `Furniture: Wooden Dining Table` instead. MyOrdersStub: `My Orders` heading + `No orders yet.` line in the same design language.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS. **Step 5: Visual check** vs `exports/13-custom-orders.png`, `exports/14-order-confirmation.png`. **Step 6: Commit + push** `feat: custom orders, confirmation, my orders stub (13, 14)`

### Task 14: Router completion + full QA + README

**Files:** Modify `src/App.jsx` (add `*` route → `<Navigate to="/login" replace>`). Create `README.md`.

- [ ] **Step 1: Write failing router test** — `MemoryRouter` (initialEntries `['/nonsense']`) renders, tests `window.location` or uses router-probe component asserting redirect target is `/login` (Review Focus #5).
- [ ] **Step 2: Run** — FAIL → **Step 3: Implement catch-all** → PASS.
- [ ] **Step 4: Full gate:** `npm run test` (all suites green), `npm run lint`, `npm run build` succeeds.
- [ ] **Step 5: Visual QA sweep** — `npm run dev` (background), visit all 14 routes at 1440×N, compare each against its `exports/*.png`; fix any token/spacing deviation found (commit fixes as `fix: visual QA corrections [screen N]`).
- [ ] **Step 6: README.md** — project purpose (Figma recreation), stack, `npm install / npm run dev / npm run build / npm test`.

- [ ] **Step 7: Commit + push** `docs: readme + router guardrails; chore: final QA pass`
