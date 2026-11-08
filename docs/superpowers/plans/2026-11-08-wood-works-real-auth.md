# Wood Works Real Authentication (Wave 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock authentication with real Supabase accounts on screens 01/02/06/09, add session-aware routing guards and a profile-popover logout, keeping all other screens and the 119-test suite intact.

**Architecture:** All Supabase access goes through one seam module (`src/lib/supabase.js`) whose client is created from Vite env vars; a React context (`AuthProvider`) owns session state and hydrates from `getSession()` + `onAuthStateChange`; `ProtectedRoute` gates the store routes in `App.jsx`; pages call `supabase.auth.signUp` / `signInWithPassword` before their existing `navigate()` calls.

**Tech Stack:** Vite + React 19, `@supabase/supabase-js`, Vitest + Testing Library, GitHub Actions → GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-08-wood-works-real-auth-design.md` (decisions A1–A7, §4 wiring table; this plan argues from it).

## Global Constraints

- Figma copy never changes: all existing strings verbatim (TODO glyph, em-dash/bullets exact as today).
- New error copy pinned exactly: signup already-registered -> `Account already exists - try logging in.` (ASCII hyphen; shell-commits keep ASCII everywhere).
- Login rejection renders the raw Supabase `error.message` (e.g. `Invalid login credentials`) under the Password input; signup maps the already-registered case to the pinned copy and otherwise renders `error.message`.
- Tokens-only CSS: the popover styles in `NavBar.css` must use existing tokens (`--color-surface`, `--color-text-muted`, `--radius-card`, `--gap-*`, `--pad-card`...) - no new literals.
- The context's default value is `{ user: null, loading: false }` so components render without a provider in tests exactly as they do logged-out.
- Suite/lint gates: every commit preceded by `npm run test` (expected counts stated per task) and `npm run lint` clean.
- ASCII-only commit messages; branch `feat/real-auth` off `main`; conventional commits.
- Wave-1 security posture: no tables created; anon key only; env values never committed.

## Review Focus

Failure modes the spec implies that no single task's tests exercise by default:

1. **Session survives refresh** — a user who reloads `/home` arrives logged in, not bounced to `/login`: owning test in Task 2 (hydration from `getSession()`), real-world proof in the post-merge smoke.
2. **Log out on a store screen lands on `/login`** — signed-out users must not face a dead screen: owning test in Task 5 (captured `onAuthStateChange` callback fires `SIGNED_OUT` -> login screen appears through the real `<App />`).
3. **Signup with an already-registered email** — real Supabase may return an error or an obfuscated user; the page must show the pinned copy, never a fake success: owning mock test in Task 3; **real-Supabase semantics validated only by the live smoke** (duplicate throwaway signup).
4. **Auth pages while logged in** — visiting `/login` mid-session must bounce to `/home`, not strand the user on a login form: owning test in Task 5.
5. **Missing env keys in a deployed build** — a Pages build without the two secrets must fail loudly, not ship a broken bundle: owning test in Task 1 (runtime throw with actionable message), deployed-behavior check in Task 7's post-deploy smoke.
6. **Redirect flash** — the guard must not bounce the user to `/login` while the session is still hydrating: owning test in Task 5 (`loading: true` renders nothing through the provider, not the login screen).

---

### Task 1: Supabase client seam + dependency

**Files:**
- Create: `src/lib/supabase.js`
- Create: `src/lib/supabase.test.js`
- Create: `.env.example`
- Modify: `package.json` (via `npm i @supabase/supabase-js`)

**Interfaces: Produces** `export const supabase` — the configured client. Later tasks import `{ supabase }` from this module; tests of later tasks mock this module path `../../lib/supabase` (or `./supabase`).

- [ ] **Step 1: Write the failing test** in `src/lib/supabase.test.js`

```js
import { describe, expect, test, vi } from 'vitest'

describe('supabase client seam', () => {
  test('throws an actionable error when env keys are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', undefined)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined)
    vi.resetModules()
    await expect(import('./supabase')).rejects.toThrow(/VITE_SUPABASE_URL/i)
  })

  test('exports a client with auth methods when env keys are present', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.resetModules()
    const { supabase } = await import('./supabase')
    expect(supabase.auth).toBeTruthy()
    expect(typeof supabase.auth.signInWithPassword).toBe('function')
    expect(typeof supabase.auth.signUp).toBe('function')
    expect(typeof supabase.auth.signOut).toBe('function')
  })
})
```

- [ ] **Step 2: Run to verify FAIL** — `npm run test -- src/lib/supabase.test.js`; Expected: FAIL (module resolves import but no env behavior; adjust stubbing until the first test fails for the right reason - a genuine `Cannot find module`-style failure means test-vs-vitest mismatch, not green).
- [ ] **Step 3: Implement `src/lib/supbAse.js`**-> correction: `src/lib/supabase.js`

```js
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    'Missing Supabase env: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (and in the repo Actions secrets for the Pages build).',
  )
}

export const supabase = createClient(url, key)
```

- [ ] **Step 4: Create `.env.example`** (committed, no real values):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Also create local `src`-sibling `.env.local` **only if it does not exist**, with the same two keys -> real values arrive from the user before Task 7; placeholder text is fine until then (tests stub env, pages run under mocks).
- [ ] **Step 5: Run** — `npm run test -- src/lib/supabase.test.js`; Expected: PASS 2/2. Then full suite: `npm run test` 121/121, lint clean. Confirm `.gitignore` already ignores `.env.local` (verify with `git check-ignore .env.local` -> confirmed ignored; extend `.gitignore` with a `.env*' line if not).
- [ ] **Step 6: Commit** — `git add -A; git commit -m 'chore: supabase client seam + env exemplar'` -> Expected HEAD: commits `feat/real-auth` base .. this.

### Task 2: `AuthProvider` + `useAuth` session context

**Files:**
- Create: `src/auth/AuthProvider.jsx`
- Create: `src/auth/AuthProvider.test.jsx`

**Interfaces: Consumes** Task 1 `supabase` (via seam; tests mock the module). **Produces** `AuthProvider({ children })`; `useAuth()` -> `{ user, loading }` (`user` = session?.user or null; `loading` true only until the first `getSession()` settles). Context default `{ user: null, loading: false }`.

- [ ] **Step 1: Write the failing tests** in `src/auth/AuthProvider.test.jsx`

```js
import { describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthProvider'

const signUp = vi.fn()
const getSessionHandback = {}
const stateChanges = []

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(async () => getSessionHandback),
      onAuthStateChange: vi.fn((cb) => {
        stateChanges.push(cb)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    },
  },
}))

function Probe() {
  const { user, loading } = useAuth()
  return (
    <div>
      {String(loading)}|{user ? user.email : 'none'}
    </div>
  )
}
```

Tests to write (names exact):
1. `hydrates the session from getSession` - `getSessionHandback.data = { session: { user: { email: 'a@b.com' } } }`; render `<AuthProvider><Probe /></AuthProvider>`; Expected probe text: `false|a@b.com`
2. `exposes no user until getSession resolves` - `getSessionHandback.data = { session: null }`; initial render (before waitFor) shows `loading` true at first paint; after settle shows `false|none` (use `waitFor`).
3. `clears the user on SIGNED_OUT state change` - hydrate with a session like test 1; invoke `stateChanges[stateChanges.length - 1]('SIGNED_OUT', null)`; probe -> `false|none` (waitFor).

- [ ] **Step 2: Run** — Expected: FAIL (`Cannot find './AuthProvider'`-class failure).
- [ ] **Step 3: Implement `AuthProvider.jsx`** — one `useState` pair + one `useEffect` calling `getSession()` then `onAuthStateChange(cb)` storing the subscription; cleanup unsubscribes. Body shape is determined by tests + wiring semantics of supabase-js (`getSession: () => Promise<{ data: { session } }>`).
- [ ] **Step 4: Run** — PASS 3/3; full suite 121/121 -> 124/124; lint clean.
- [ ] **Step 5: Commit** — `git commit -m 'feat: auth provider session context'`

### Task 3: Real signup (screen 02 -> 06)

**Files:**
- Modify: `src/pages/SignupPage/SignupPage.jsx` (submit body only; zero copy/layout changes)
- Modify: `src/pages/SignupPage/SignupPage.test.jsx` (mock seam + 2 added tests + retitle one)

**Interfaces: Consumes** Task 1 seam (`supabase.auth.signUp({ email, password })` -> `{ data: { user, session }, error }`, where `error` may be null). **Produces** navigations unchanged: success -> `/signup-success`.

- [ ] **Step 1: Write the failing tests** — at module top add `vi.mock('../../lib/supabase', ...)` exposing `const signUp = vi.fn()` (same helper shape as Task 2's mock). Update or add, in `describe('SignupPage (Figma screen 02)')`:
  1. Rename `valid submit navigates to /signup-success (mock)` -> `valid submit creates the account and navigates to /signup-success`: type email/password/confirm, click `Sign Up`. Before click, expect `signUp` called with `({ email: 'a@b.com', password: 'secret' })`; mock resolves `{ data: { user: { email: 'a@b.com' }, session: { user } }, error: null }`. Expected: `SIGNUP SUCCESS STUB` visible.
  2. `an already-registered email shows the pinned copy and stays`: mock resolves `{ data: {}, error: { message: 'User already registered' } }`. Expected: `Account already exists - try logging in.` rendered (exact string) AND `SIGNUP SUCCESS STUB` absent.
  3. `other signup failures render the message inline`: mock resolves `{ data: {}, error: { message: 'Password too weak' } }` (think: anything red). Expected: that message rendered, no navigation.
- [ ] **Step 2: Run** — Expected: FAIL (existing valid-submit test hits the un-mocked... it will still navigate? No - page now awaits `supabase.auth.signUp` first; with the module mocked回事 the new tests fail on missing behavior/mappings. Verify failures are assertion-level, not setup-level.)
- [ ] **Step 3: Implement** in `SignupPage.jsx` submit: after existing validation in the `Object.keys(next).length === 0` branch, `const { error } = await supabase.auth.signUp({ email, password })`; if `error.message` matches `/already/i` -> `next.email = 'Account already exists - try logging in.'`; else if `error` -> `next.email = error.message`; navigate only when no error.
- [ ] **Step 4: Run** — PASS; full suite 124 -> 127; lint clean.
- [ ] **Step 5: Commit** — `git commit -m 'feat: real signup on screen 02'`

### Task 4: Real login (screen 01 -> /home)

**Files:**
- Modify: `src/pages/LoginPage/LoginPage.jsx` (submit body only)
- Modify: `src/pages/LoginPage/LoginPage.test.jsx` (mock seam + 1 added test + retitle one)

**Interfaces: Consumes** seam `supabase.auth.signInWithPassword({ email, password })` -> `{ data: { user, session }, error }`. **Produces** success -> `/home`; rejection -> inline error under Password input (raw `error.message`; e.g. `Invalid login credentials`).

- [ ] **Step 1: Write the failing tests** (same seam-mock pattern; `signInWithPassword = vi.fn()`):
  1. Rename `valid submit navigates to /home (mock)` -> `valid credentials sign in and navigate to /home`: fill fields, click LOG IN; expect called with `({ email: 'a@b.com', password: 'secret' })`; mock resolves `{ data: { session: { user: { email: 'a@b.com' } }, user: null }, error: null }`; Expected: `HOME PAGE STUB`.
  2. `bad credentials render the inline error and stay`: mock resolves `{ data: {}, error: { message: 'Invalid login credentials' } }`. Expected: that message under the password field (the existing `errors.password` slot renders it), HOME STUB absent.
- [ ] **Step 2: Run** — Expected: FAIL (assertion level).
- [ ] **Step 3: Implement** in `LoginPage.jsx` submit: in the empty-validation-errors branch, `<const>{ error } = await supabase.auth.signInWithPassword({ email, password })`; if `error` -> `next.password = error.message`; else navigate. (Loading state on the button is NOT wave 1 - click-spam safety comes if the user asks.)
- [ ] **Step 4: Run** — PASS; suite -> 129; lint clean.
- [ ] **Step 5: Commit** — `git commit -m 'feat: real login on screen 01'`

### Task 5: Route guards + `/` behavior + signed-out recovery

**Files:**
- Create: `src/auth/ProtectedRoute.jsx`
- Create: `src/auth/ProtectedRoute.test.jsx`
- Modify: `src/App.jsx` (wrap app in AuthProvider; guard store routes; `/` per-session; auth-aware auth pages)
- Modify: `src/App.test.jsx` (seam mock + 4 new route tests)

**Interfaces: Consumes** `AuthProvider`/`useAuth` (Task 2). **Produces** ProtectedRoute `({ children }) -> element`: renders `null` while `loading`; `user` present -> children; else `<Navigate to="/login" replace />`.

- [ ] **Step 1: Write the failing tests** in `src/App.test.jsx`: top-level `vi.mock('./lib/supabase', ...)` (same mock shape; module path now million `./lib/supabase` since App is in `src/`). Add a mutable `let sessionForTests = { data: { session: null } }` before the mock factory so tests can flip session state (the factory reads the mutable holder; the executor writes `getSession: async () => sessionForTests` accordingly - if closures pin stale refs, use `getSession` returning the holder lookup each call). New tests:
  1. `logged-out direct visit to /home redirects to /login`: `window.history.replaceState({}, '', '/home')`; render `<App />`; Expected 'Welcome Back', no 'WOOD WORKS' featured hero.
  2. `logged-in visit to /login bounces to /home`: set `sessionForTests = { data: { session: { user: { email: 'a@b.com' } } } }`; address `/login`; Expected: hero title `Crafted With Wood,Built With Purpose.` visible.
  3. `/` redirects per session: repeat test 2's setup with `/` -> `/home` content present.
  4. `sign-out event on a store screen lands on login (not a dead screen)`: set session; render at `/home`; capture the newest `onAuthStateChange` callback; invoke `cb('SIGNED_OUT', null)`; `waitFor` -> 'Welcome Back' visible.
- [ ] **Step 2: Run** — Expected: FAIL (no ProtectedRoute; App not provider-wrapped).
- [ ] **Step 3: Implement** — `ProtectedRoute.jsx` per Interfaces; in `App.jsx`: `<BrowserRouter basename> <AuthProvider> <Routes> ...`; wrap store-route elements (6 routes listed in the spec §3: /home, /catalog, /product/:id, /custom-order, /order-confirmation, /my-orders) with `<ProtectedRoute>`; `/login` and `/signup` get a `GuestRoute` flip: logged-in -> `<Navigate to="/home" replace />`; `/` -> authed ? `/home` : `/login` (implement as tiny `RootRedirect` in App.jsx or reuse ProtectedRoute-family pattern). Keep 03-09 routes untouched (mock chain, logged-out users).
- [ ] **Step 4: Run** — suite -> 133; lint clean.
- [ ] **Step 5: Commit** — `git commit -m 'feat: guarded routes + session-aware redirects'`

### Task 6: Profile popover logout

**Files:**
- Modify: `src/components/NavBar/NavBar.jsx` (profile area)
- Modify: `src/components/NavBar/NavBar.css` (popover block, tokens only)
- Modify: `src/components/NavBar/NavBar.test.jsx` (seam mock + provider wrap + 3 new tests)

**Interfaces: Consumes** `useAuth()` (default `{ user: null, loading: false }`), seam `supabase.auth.signOut()`, `useNavigate`. **Produces** visual pattern: circle button opens a popover with the user's email and `Log out`.

- [ ] **Step 1: Write the failing tests** in `NavBar.test.jsx`: add seam mock (module path `../../lib/supabase`); two render helpers: logged-out (current, wraps nothing) and logged-in (wraps in `<AuthProvider>` from Task 2 with a session-bearing mock). New tests:
  1. `logged-out profile stays an inert image`(rename of current profile test)
  2. `logged-in profile becomes a button that opens the account popover`: click button -> `a@b.com` visible + `Log out` button
  3. `Log out signs out and returns to /login`: click `Log out`; expect seam `signOut` called; router lands on `LOGIN STUB` (test passes a route stub for /login).
- [ ] **Step 2: Run** — Expected: FAIL (no popover).
- [ ] **Step 3: Implement** in NavBar (exact shape): profile container renders `<button className="navbar__profile-btn" aria-label="Account options" onClick={}><ProfileIcon /></button>` + conditional popover `role="dialog"`-less div (plain, per Figma-fidelity minimalism) `className="navbar__popover"` with `<p>{user.email}</p>` and `<button className="navbar__popover-logout">Log out</button>`; click handler: `await supabase.auth.signOut(); navigate('/login')`. Popover state local `open` toggled by circle click; closes on outside click? Wave 1: simple toggle only (no outside-click handler - note as deferred minor). CSS: popover absolute card bg `--color-surface`, radius `--radius-card`, text `--fs-14`, muted email; positioned under the circle at the right gutter.
- [ ] **Step 4: Run** — suite -> 136; lint clean.
- [ ] **Step 5: Commit** — `git commit -m 'feat: profile popover logout'`

### Task 7: CI env wiring + README + merge/deploy + live acceptance

**Files:**
- Modify: `.github/workflows/deploy-pages.yml` (build step env)
- Modify: `README.md` (real-auth section + env setup)
- No new tests (infrastructure; verification is the live deployment).

- [ ] **Step 1: Workflow** add to the existing build step:

```yaml
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

- [ ] **Step 2: README** add under Getting started: copy `.env.example` -> `.env.local` with the project URL + anon key; note auth is real (signup/login) and 03-09 remains mock.
- [ ] **Step 3: Prereq (user action):** Supabase project exists; keys received; repo secrets set (`gh secret set VITE_SUPABASE_URL`, `gh secret set VITE_SUPABASE_ANON_KEY`).
- [ ] **Step 4: Gate + merge:** full suite + lint; commit `chore: pages env for auth + readme docs`; merge `feat/real-auth` into `main`; push; `gh run watch` -> Pages deploy green.
- [ ] **Step 5: Live smoke (acceptance):** headless Playwright (Edge channel) against `https://astrollll.github.io/wood-works/`:
  1. unauth direct `/home` -> login screen
  2. real signup (throwaway account, e.g. `woodworks-demo1@<mail-drop>`) -> lands logged-in; 06 copy intact
  3. reload `/home` -> still signed in (session survives refresh)
  4. popover shows the throwaway email; Log out -> `/login`
  5. duplicate signup of the same email -> `Account already exists - try logging in.`
  - Record results in the session; report to the user.
- [ ] **Step 6: Post-run:** delete `throwaway` accounts? (Supabase dashboard -> remove demo users; optional, user decides.) Final whole-branch review per executing-plans.

## Self-Review Notes (fixes applied while writing)

- Corrected a path typo mid-draft (`supbAse` -> `supabase` in Task 1 Step 3 title; implementation snippet already correct).
- Test-count arithmetic: 119 + 2 (T1) + 3 (T2) + 3 (T3) + 2 (T4) + 4 (T5) + 3 (T6) = 136 expected at wave end.
- Every Review Focus line maps to an owning task test (1 -> T2; 2 -> T5#4; 3 -> T3#2 + live smoke; 4 -> T5#2; 5 -> T1 + T7 smoke; 6 -> ProtectedRoute null-while-loading behavior; covered by T5#2's waitFor sequencing assumptions -> if ambiguous at execution, pin with a dedicated loading test in T5).
