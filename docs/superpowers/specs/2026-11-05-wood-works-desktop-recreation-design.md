# Wood Works — Desktop UI Recreation (Design Spec)

**Date:** 2026-11-05
**Status:** Approved design, pending implementation plan
**Source of truth:** Figma file `l5v7uwdr8WshaxTALKjTtz` — "Wood Works — Initial Design" (page `1:2` "Screens" + page `0:1` "Design System"). Rendered references live in `exports/`; extracted node data in `figma-data/`.

## 1. Goal

Recreate the 14 desktop screens of the Wood Works furniture e-commerce design as a working Vite + React app, matching the Figma design's exact UI (layout, colors, typography, spacing, components) and UX (all flows implied by the design work client-side with mock data). Desktop only; mobile comes later.

## 2. Approved Decisions

| Decision | Choice |
|---|---|
| Stack | Vite + React (JavaScript) |
| Styling | Hand-written CSS driven by design tokens (CSS custom properties), no Tailwind |
| Functionality | Mock data + working flows (validation, filtering, steppers, routing). No backend, no persistence |
| Imagery | Keep Figma's muted-brown placeholder look (CSS blocks), positions `<img>`-ready for later swaps |
| Scope | Desktop (1440px design width) only |
| Nav "My Orders" | No designed screen exists → minimal stub page in the same design language |
| App location | Repository root (`src/` at top level; `exports/`, `figma-data/`, `docs/` remain as reference) |

## 3. Design Tokens (extracted from Figma node data)

### Colors
| Token | Value | Usage |
|---|---|---|
| `--color-text` | `#2B211E` | Headings, body text |
| `--color-primary` | `#3E2723` | Filled buttons, selected chips |
| `--color-accent` | `#795548` | Auth brand panel, accent links ("Forgot Password?", "View Details →"), hero image placeholder |
| `--color-image-placeholder` | `#A1887F` | Product images, profile icon, upload thumbnail |
| `--color-bg` | `#F7F3EE` | Page background |
| `--color-surface` | `#FFFFFF` | Navbar, cards, inputs, buttons text on filled |
| `--color-text-muted` | `#756E6A` | Secondary text, placeholders, "Remember me" |
| `--color-border` | `#D8D0CA` | Input borders, default chip borders |
| `--color-link-blue` | `#98CCFF` | "+ Upload Reference Image." link |

### Typography — Poppins (self-hosted via `@fontsource/poppins`, weights 400/500/600/700)
| Style | Weight/Size/Line-height | Used for |
|---|---|---|
| Display | 700 / 48px / 58px | Home hero heading (2-line, hard break after "Wood,") |
| H1 | 600 or 700 / 32px / 48px | Auth card "Welcome Back", section titles ("Featured Furniture"), left-panel logo (32/700) |
| Logo | 700 / 24px / 36px | Navbar "WOOD WORKS" |
| Title | 600 / 18px / 27px | Product card title |
| Body-md | 400/500 / 16px / 24px | Hero subtext, button labels, nav links, page subtext |
| Body-sm | 400/500 / 14px / 21px | Inputs, labels, card subtitle, links, chips |
| Price | 600 / 16px / 24px | Product price |

### Shape & spacing
| Token | Value |
|---|---|
| Radius: buttons, inputs | 8px |
| Radius: cards, auth card, hero image | 12px |
| Radius: category chips | 20px (pill) |
| Page horizontal gutters | 80px |
| Nav/pill internal | 16–20px paddings |
| Gaps | 4 (in-card), 16 (in-form/hero buttons), 24 (card grid/sections), 32 (nav links) |
| Button height | 48px |
| Navbar height | 80px (1440×80) |

Button outline variant: 1.5px stroke `#3E2723`, text `#3E2723`. Input: 1px `#D8D0CA`. Label text on filled/selected: white.

Note: button labels appear in both uppercase ("LOG IN", "BROWSE FURNITURE") and title case ("Sign Up", "Reset Password") across Figma — each usage is transcribed verbatim; no CSS `text-transform` normalization.

## 4. Screens & Routes

All screens are 1440px-wide desktop frames. React Router v7 (`react-router-dom`), `createBrowserRouter`.

| # | Figma frame (node id) | Route | Contents |
|---|---|---|---|
| 01 | Login (2:2) | `/login` (+ `/` redirect) | Split: brown panel (logo 32/700 white + tagline 16/400) / white card (Welcome Back 32/600, email+password inputs, "☐ Remember me" + "Forgot Password?" link row, LOG IN filled button, "Don't have an account? Sign Up") |
| 02 | Sign Up (27:166) | `/signup` | Same split; Welcome! card: email, password, confirm password, Sign Up button |
| 03 | Verification Code (28:254) | `/verify` | Post-signup code entry (wire confirmed from frame text at build time) |
| 04 | Verify OTP Code (28:275) | `/verify-otp` | Alternate OTP entry wired from 07 Send OTP flow |
| 05 | Reset Password (28:295) | `/reset-password` | New password + confirm, Reset Password button |
| 06 | Sign up Successful (28:315) | `/signup-success` | Confirmation state screen |
| 07 | Send OTP Successful (28:369) | `/otp-sent-success` | Confirmation state screen |
| 08 | Verify OTP page (28:379) | `/verify-otp-sent` | OTP input screen |
| 09 | Reset password successful (28:389) | `/reset-success` | Confirmation state screen |
| 10 | Home (3:5) | `/home` | Navbar; hero: left heading 48/700 + subtext 16/400 + [BROWSE FURNITURE filled / CUSTOM ORDER outline]; right 12r image block `#795548`; "Featured Furniture" section → 4 ProductCards (Wooden Dining Table ₱5,000 · Classic Wooden Chair ₱2,500 · Wooden Cabinet ₱7,000 · Study Table ₱4,500) |
| 11 | Furniture Catalog (3:57) | `/catalog` | "Furniture Collection" title, subtext, chips row (All selected + Tables/Chairs/Cabinets/Beds/Others), 8 ProductCards in 4-col grid |
| 12 | Product Details (3:142) | `/product/:id` | Left image block; right title/price/description/details/qty stepper/order buttons; related-products row (4 cards) |
| 13 | Custom Orders (8:147) | `/custom-order` | "Create Your Custom Furniture" + product summary card, form: Furniture Type, Wood Type, Length, Width, Height, Quantity, big notes textarea; "+ Upload Reference Image." blue link; SUBMIT CUSTOM ORDER |
| 14 | Order Confirmation (13:136) | `/order-confirmation` | Circle mark, ORDER SUBMITTED, summary panel (Order # WW-000x / Furniture / Status: Pending / Estimated Response: 1–3 days), VIEW MY ORDERS filled + BACK TO HOME outline |

**Flow wiring (initial; final labels transcribed from Figma text at build time):**
- Sign Up (02) → Verification Code (03) → Sign up Successful (06) → Login
- Login "Forgot Password?" → Send OTP Successful (07) → Verify OTP page (08) → Reset Password (05) → Reset password successful (09) → Login
- Login submit → Home
- Nav: Home → `/home` · Furniture → `/catalog` · Custom Order → `/custom-order` · My Orders → `/my-orders` stub
- Card "View Details →" / "ORDER NOW" → `/product/:id` / confirmation · "CUSTOMIZE" → `/custom-order` · confirmation buttons → `/my-orders` stub / `/home`

## 5. Components (mirror of Figma Design System page)

| Component | Props | Notes |
|---|---|---|
| `NavBar` | — | White bar 80px gutters; logo → `/home`; links with 32px gap; mauve `ProfileIcon`; semantic `<nav>` |
| `Button` | `variant: 'filled' \| 'outline'`, `children`, `type`, `onClick` | Radius 8, height from Figma usage; anchors own their navigation |
| `Input` | `label`, `id`, `type`, `placeholder`, `value`, `onChange`, `error` | Label 14/500 `#2B211E` above; 24px gap group |
| `CategoryChip` | `label`, `selected`, `onClick` | Radius 20, 20px x-padding; toggles filter state |
| `ProductCard` | `product`, `onOpen` | White card radius 12; image block; body padding 16/16/12, gap 4; "View Details →" 14/500 accent |
| `ProfileIcon` | — | 40px circle `#A1887F` |
| `QuantityStepper` | `value`, `onChange` | − / value / +, 1px bordered pill; matches Figma ctrl in Product Details |
| `AuthLayout` | `leftPanel`, `children` | Split 50/50: left `#795548` (logo 32/700 white + tagline 16/400, 8px gap); right `#F7F3EE` centering white card (radius 12, padding 40, gap 16) |
| `PageLayout` | `children` | Cream background, navbar at top — wraps all store pages |

Every element styled exclusively through tokens — no hardcoded raw values in components/pages.

## 6. Mock Data Model (`src/data/products.js`)

```js
{ id: 'wooden-dining-table', name: 'Wooden Dining Table', category: 'Tables',
  price: 5000, currency: 'PHP', blurb: 'Solid wood furniture',
  description: 'A handcrafted wooden dining table designed for everyday use and durability.',
  details: { Material: 'Solid Wood', Size: '4 x 6 Ft', Availability: 'Available' } }
```
8 products (names/prices above), category map: Tables → Study Table, Coffee Table, Wooden Dining Table · Chairs → Classic Wooden Chair, Wooden Bench · Cabinets → Bookshelf, Wooden Cabinet · Beds → Bed Frame · Others → (empty state is impossible to reach from default dataset — filtering chips with no matches render an empty grid row consistent with card spacing).

Order records (`src/data/orders.js` or component-level helper): `{ number: 'WW-0001', furniture, status: 'Pending', eta: '1–3 days', source: 'product' | 'custom' }`, number increments per session.

## 7. Interactions & Validation

- **Forms:** required-field validation; email format on login/signup; password == confirm on signup/reset. Errors render under inputs in a legible red (`#C0392B`) with 14/400 text — not designed in Figma, kept minimal so it doesn't fight the design.
- **Catalog:** `CategoryChip` sets filter; default chip is `All` (selected state, filled).
- **Product Details:** stepper min 1, step 1; ORDER NOW builds order record and routes; CUSTOMIZE routes to custom order.
- **Custom Order:** same validation; submit builds custom order record (furniture type + dims + qty) and routes to `/order-confirmation`.
- **OTP entries:** 4–6 digit single inputs as drawn; any non-empty code advances (mock).
- **Auth:** login/signup advance regardless of account "existence" (mock); account creation success screens their terminal actions (e.g., 06 → `/login`).

## 8. Accessibility & Semantics

Semantic landmarks (`nav`, `main`, `header`, `h1–h3` hierarchy per screen), every input has a `<label htmlFor>`, chips `aria-pressed`, stepper buttons `aria-label` ("Decrease quantity"/"Increase quantity") + live value, focus-visible outlines on interactive elements, alt-free decorative blocks via `role="img"` + `aria-label` = product name (placeholders), color contrast checked against the brown palette (white-on-`#3E2723` passes AA).

## 9. File Structure

```
F:\Figma Project\
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── .gitignore
├── README.md                     # run/build instructions
├── docs\superpowers\specs\…\     # this spec
├── exports\                      # rendered Figma PNGs (reference, untouched)
├── figma-data\                   # extracted Figma JSON (reference, untouched)
└── src\
    ├── main.jsx                  # createRoot + StrictMode
    ├── App.jsx                   # router definition (createBrowserRouter, route list)
    ├── styles\
    │   ├── tokens.css            # ALL design tokens (single source)
    │   └── base.css              # reset, typography defaults, focus states
    ├── components\               # shared UI (§5), one file each:
    │   ├── NavBar\NavBar.jsx+css
    │   ├── Button\…, Input\…, CategoryChip\…, ProductCard\…,
    │   └── ProfileIcon\…, QuantityStepper\…
    ├── layouts\
    │   ├── AuthLayout\…          # used by auth screens 01–09
    │   └── PageLayout\…          # navbar + cream canvas for screens 10–14
    ├── pages\                    # one folder per route:
    │   ├── LoginPage\…           # …/LoginPage.jsx (+ .test.jsx + .css)
    │   ├── SignupPage\…, VerificationCodePage\…, VerifyOtpPage\…,
    │   ├── ResetPasswordPage\…, SignupSuccessPage\…, OtpSentSuccessPage\…,
    │   ├── VerifyOtpSentPage\…, ResetSuccessPage\…, HomePage\…,
    │   ├── CatalogPage\…, ProductDetailsPage\…, CustomOrderPage\…,
    │   ├── OrderConfirmationPage\…, MyOrdersStubPage\…
    ├── data\
    │   └── products.js           # mock catalog (§6)
    └── lib\
        ├── formatPrice.js        # ₱ + thousands separator
        └── validation.js         # required/email/password-match helpers
```

Conventions: PascalCase folder/file for components/pages; camelCase for `lib/`/`data/`; tests colocated (`*.test.jsx`); each component owns its CSS file (BNF pattern `Component.css`), class names prefixed per component (`.product-card__…`, BEM-lite); imports ordered (libs → data/lib → components); no default-export soup — components default-export, helpers named-export.

## 10. Best-Practice Tooling

- **Git:** repo initialized at root; commits per milestone (scaffold → tokens → components → screens → flows/tests).
- **Linting:** ESLint 9 flat config (Vite React template defaults + `react-hooks`, `react-refresh`), `npm run lint` wired.
- **Formatting:** consistent 2-space indent, double quotes from Vite template — enforced by editor settings; no Prettier dependency unless wanted later.
- **Node/npm:** explicit `package.json` scripts: `dev`, `build` (`vite build`), `preview`, `lint`, `test` (`vitest run`, `test:watch`).
- **Testing:** Vitest + @testing-library/react + jsdom + userEvent. Coverage focus on interactions (§7): chip filtering, stepper bounds, form validation, order-number increment, route navigation. Visual fidelity verified by side-by-side comparison against `exports/*.png` renders at 1440px.
- **Dependencies:** `react`, `react-dom`, `react-router-dom`, `@fontsource/poppins` (400/500/600/700 imports). Dev: vite, `@vitejs/plugin-react`, vitest, testing-library, jsdom, eslint stack.

## 11. Out of Scope (Desktop Recreation)

Mobile/responsive layouts · real product photography · backend/auth/orders persistence · My Orders full design (stub only) · the html.to.design imported section on the Figma canvas (reference material, not a screen).

## 12. Risks & Unknowns

- **Screen 03/04/07/08 flow wiring** is inferred from naming; resolved by transcribing each frame's actual text/buttons from Figma node data during build (per-screen extraction step in the plan).
- **Exact paddings/heights** for elements not in the Design System (e.g., auth card inputs height 48, gaps where autolayout data already captured) — all pulled from `figma-data` or fresh `/nodes` extractions, never guessed.
- **Figma rendered CSS may drift**: the extracted PNGs (rendered at 0.5×) and token table are the pinned baseline; if the file changes, re-export and re-diff.
