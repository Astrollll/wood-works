# Wood Works

A pixel-focused recreation of the **"Wood Works"** Figma design (file `l5v7uwdr8WshaxTALKjTtz`) as a working React single-page application. All 14 desktop screens of the design are live with their flows wired end to end — authentication, the OTP/password-reset chain, catalog browsing, product details, custom orders, and order confirmation.

> The design's images are reproduced as flat placeholder blocks in the brand palette (no photography was exported from Figma). Mock data + mock flows only — there is no backend.

## Tech stack

- **Vite** + **React 19** (JavaScript, JSX)
- **React Router v7** (`react-router-dom`) — hash-free browser routing
- **Vitest** + **Testing Library** — component and page tests (117 passing)
- **ESLint** (flat config)
- Self-hosted fonts via **Fontsource** (Poppins 400/500/600/700, Inter 700)

## Getting started

```bash
npm install        # install dependencies
npm run dev        # dev server → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build
npm run test       # run the full test suite once
npm run test:watch # vitest watch mode
npm run lint       # eslint
```

## Screens & routes

| # | Figma frame | Route |
|---|---|---|
| 01 | Login | `/login` (and `/` redirect) |
| 02 | Sign Up | `/signup` |
| 03 | Verification Code | `/send-otp` |
| 04 | Verify OTP Code | `/verify-otp` |
| 05 | Reset Password | `/reset-password` |
| 06 | Sign up Successful | `/signup-success` |
| 07 | Send OTP Successful | `/otp-sent-success` |
| 08 | OTP Verified | `/otp-verified` |
| 09 | Reset Password Successful | `/reset-success` |
| 10 | Home | `/home` |
| 11 | Furniture Catalog | `/catalog` |
| 12 | Product Details | `/product/:id` (unknown ids → `/catalog`) |
| 13 | Custom Orders | `/custom-order` |
| 14 | Order Confirmation | `/order-confirmation` |

Plus the navbar's **My Orders** stub at `/my-orders`, and unknown routes redirect to `/login`.

## Architecture notes

- `src/styles/tokens.css` — every color, font, size, radius, and spacing value from the Figma file as a CSS custom property. Components and pages style exclusively through tokens; one-off Figma node sizes (OTP tiles, form card, confirmation panel…) live there too.
- `src/components/` — the Figma Design System page mirrored (Button, Input, CategoryChip, ProductCard, ProfileIcon, QuantityStepper, OtpCodeInput, NavBar).
- `src/layouts/` — `AuthLayout` (split brand panel + 420px card, screens 01–09) and `PageLayout` (navbar + cream canvas, screens 10–14).
- `src/data/products.js` — the mock catalog (8 products, categories, exact Figma copy).
- `src/lib/` — `formatPrice` (₱ + thousands separator), `validation`, and `orders` (mock session order records `WW-0001…`).
- Tests are colocated: `Component.test.jsx` next to `Component.jsx`; page tests wire stub routes via `MemoryRouter` so navigation behavior is asserted end to end.
