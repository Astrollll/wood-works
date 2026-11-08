# Wood Works — Real Authentication (Wave 1) Design Spec

Companion to `docs/superpowers/specs/2026-11-05-wood-works-desktop-recreation-design.md`
(the UI recreation spec, whose §-references below point there). Status: approved in
brainstorming session-by-session (2026-11-06..08); awaiting user review of this written form.

## 1. Goal

Replace the mock authentication of the deployed Wood Works SPA with real, working accounts so
classmates can sign up and log in on the live site while everything else (orders, product data,
the OTP password-reset chain) stays deliberately mock until its own wave.

## 2. Approved Decisions

| # | Decision |
|---|----------|
| A1 | Foundation: **Supabase** (managed auth + Postgres; no custom server code) |
| A2 | Scope: **auth only** — screenshots 01, 02, 06, 09 real; 03–09 mock (flagged), orders/catalog mock |
| A3 | Logout: navbar profile circle becomes a **button with popover** (email + "Log out") |
| A4 | Supabase "Confirm email" **disabled** for the demo (instant signup → session) |
| A5 | Security: anon key public in the bundle (RLS protects data); every future table gets RLS scoped to `auth.uid()`; `service_role` key never touches frontend or repo |
| A6 | Test seam: **all** Supabase access behind one module `src/lib/supabase.js`; tests mock that module |
| A7 | Keys: `.env.local` (gitignored) locally + **GitHub Actions secrets** for the Pages build |

## 3. Architecture

New dependency: `@supabase/supabase-js` (official client).

New modules (each one concern, independently understandable):

- `src/lib/supabase.js` — reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
  (`import.meta.env`), exports one `createClient()` instance. The only file in the codebase
  that knows Supabase exists.
- `src/auth/AuthProvider.jsx` — React context holding `{ user, loading }`; hydrates from
  `getSession()`, then subscribes `onAuthStateChange` so refreshes/tab changes stay in sync.
  Exposes `useAuth()`.
- `src/auth/ProtectedRoute.jsx` — guard wrapper used in `src/App.jsx`:
  - no user (after auth finishes loading) → `<Navigate to="/login" replace />`
  - user present on `/login` or `/signup` → `<Navigate to="/home" replace />`
  - `/` keeps redirecting per session state.

## 4. Screen wiring

| Screen / route | Today (mock) | Wave 1 (real) |
|---|---|---|
| 01 `/login` submit | navigate `/home` | `signInWithPassword(email, password)`; success → same navigate; rejection → inline red error under field (`#C0392B`, 14/400 per spec §7) — reuse the validation error UI |
| 02 `/signup` submit | navigate `/signup-success` | `signUp({ email, password })`; success (session; confirmed-off flow) → same navigate; email already registered → inline error "Account already exists — try logging in." |
| 06 `/signup-success` | cosmetic | copy unchanged, now states a real event |
| 09 `/reset-success` | cosmetic | unchanged in wave 1 |
| 03–09 OTP chain | mock | **unchanged, flagged** (real reset = wave 5) |
| 10 `/home` … 14 `/order-confirmation`, `/my-orders` | open | wrapped by ProtectedRoute |
| Navbar profile circle | inert `span` | `<button>` → popover: signed-in email + "Log out" → `signOut()` → `/login`; styled with existing tokens (cream card per §3) |
| `/my-orders` stub | stub | unchanged in wave 1 |

Wiring discipline: auth calls happen **before** the existing `navigate()` calls — flow shape and
test surface stay stable; only what gates navigation becomes real.

## 5. Data & security

- **No database tables in wave 1.** Supabase's managed `auth` schema handles users and passwords.
- Dashboard setup (once): Auth → Providers → Email; disable "Confirm email". Two values out of
  the project: URL + anon key.
- Frontend env vars only ever: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
  `.env.local` gitignored; the deploy workflow's build step receives both as GitHub Actions
  secrets (the bundle inlines them at build; absent keys must fail the build loudly).
- Rule for wave 2 (locked now): every table ships with RLS ON + `auth.uid()` policies in the
  same migration.

## 6. Testing

Iron law unchanged (RED→GREEN per behavior; whole suite green + lint before every commit;
conventional commits; milestones pushed).

- Tests `vi.mock` `src/lib/supabase.js`; never test the library itself. Coverage:
  - login: mocked success → `/home`; mocked rejection → inline error, no navigation
  - signup: mocked success → session present → `/signup-success` chain; mocked
    already-registered → error copy, stays on page
  - guards: logged-out direct hit to `/home` → lands `/login`; logged-in hit to `/login` → `/home`
  - `AuthProvider`: hydrates session, reacts to `onAuthStateChange`, exposes user
  - profile popover: opens, shows email, "Log out" calls `signOut()` and routes to `/login`
- The 119 existing tests stay green; auth pages' tests update their mock layer only
  (copy + navigation assertions intact).
- Acceptance = live headless smoke against the deployed site after merge+deploy:
  throwaway signup → session survives refresh → popover logout. Also `/home` unauthenticated
  lands on `/login` at the real URL.

## 7. Implementation order

1. `chore: supabase client + auth provider` — seam module + provider skeleton (RED→GREEN).
2. `feat: real signup and login (01, 02, 06, 09)` — behavior per §4 (RED→GREEN each behavior).
3. `feat: route guards + profile popover logout` (RED→GREEN).
4. Merge to `main` → Pages auto-deploy → live smoke.

Branch: `feat/real-auth` off `main`.

## 8. Out of scope (wave 1)

Any backend code beyond Supabase; admin tooling; email confirmation flows; orders/products
persistence; changes to screens 03–09; mobile/responsive layout (per the recreation spec §11).

## 9. Risks

| Risk | Mitigation |
|---|---|
| Env vars missing in Pages build → blank/broken asset URLs | Actions secrets checklist; strict runtime guards in `supabase.js` (throw with a clear message); post-merge smoke |
| Existing tests break wholesale from auth dependency | Seam-first design; mock layer confined to `src/lib/supabase.js`; suite green gate per commit |
| Popover novel UI drifts from design language | Tokens-only CSS; review against exports style at smoke time |
| Supabase client API drift | Single seam module; one place to update |
