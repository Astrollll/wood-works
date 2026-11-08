# Wood Works

A pixel-focused recreation of the **"Wood Works"** Figma design (file `l5v7uwdr8WshaxTALKjTtz`) as a working React single-page application. All 14 desktop screens of the design are live with their flows wired end to end — authentication, the OTP/password-reset chain, catalog browsing, product details, custom orders, and order confirmation.

> The design's images are reproduced as flat placeholder blocks in the brand palette (no photography was exported from Figma). **Authentication is real** (Supabase); the OTP/password-reset chain (03–09), catalog data, and orders remain mock.

## Tech stack

- **Vite** + **React 19** (JavaScript, JSX)
- **React Router v7** (`react-router-dom`) — hash-free browser routing
- **Supabase JS** (`@supabase/supabase-js`) — real signup/login/logout sessions
- **Vitest** + **Testing Library** — component and page tests (136 passing)
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

### Supabase setup (required for auth)

Real accounts run on Supabase — the app will not build without its two env
values (they fail loudly by design):

1. Create a free project at [supabase.com](https://supabase.com).
2. Auth → Providers → Email → **disable "Confirm email"** (instant signup → session).
3. Copy **Project URL** and **anon public key** (Project Settings → API).
4. Locally: copy `.env.example` → `.env.local` and paste the two values.
5. Deployed (GitHub Pages): set the same two values as repo Actions secrets
   (`gh secret set VITE_SUPABASE_URL`, `gh secret set VITE_SUPABASE_ANON_KEY`).

The anon key is public-safe by design (data access is protected by RLS once
tables exist — no database tables exist in wave 1).
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

Store routes (`/home`, `/catalog`, `/product/:id`, `/custom-order`, `/order-confirmation`, `/my-orders`) are **guarded**: signed-out visitors land on `/login`, and signed-in users on `/login` or `/signup` bounce to `/home`.

## Architecture notes

- `src/styles/tokens.css` — every color, font, size, radius, and spacing value from the Figma file as a CSS custom property. Components and pages style exclusively through tokens; one-off Figma node sizes (OTP tiles, form card, confirmation panel…) live there too.
- `src/components/` — the Figma Design System page mirrored (Button, Input, CategoryChip, ProductCard, ProfileIcon, QuantityStepper, OtpCodeInput, NavBar).
- `src/layouts/` — `AuthLayout` (split brand panel + 420px card, screens 01–09) and `PageLayout` (navbar + cream canvas, screens 10–14).
- `src/data/products.js` — the mock catalog (8 products, categories, exact Figma copy).
- `src/lib/` — `formatPrice` (₱ + thousands separator), `validation`, `orders` (mock session order records `WW-0001…`), and `supabase` (the single seam module that talks to Supabase; tests mock this file only).
- Tests are colocated: `Component.test.jsx` next to `Component.jsx`; page tests wire stub routes via `MemoryRouter` so navigation behavior is asserted end to end.
