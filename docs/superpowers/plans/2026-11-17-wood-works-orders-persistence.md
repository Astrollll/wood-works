# Wood Works Custom Order Persistence (Wave 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Signed-in users create real persisted custom orders in a Supabase `orders` table; each account sees only its own orders (RLS proven live with a second account).

**Architecture:** `src/lib/orders.js` evolves from mock factory to the real API module over the existing Supabase seam (`src/lib/supabase.js`); pages consume display-shaped records and never touch Supabase directly. One `orders` table ships with RLS ON in the same migration. The order-confirmation screen gains a latest-order fallback for refreshes; the My Orders stub becomes a real list.

**Tech Stack:** Vite + React 19, react-router-dom v7, @supabase/supabase-js v2, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-11-17-wood-works-orders-persistence-design.md` (executors read both; the spec argues from locked decisions D1–D7).

## Global Constraints

- **RLS (spec D5):** every table ships with RLS ON + `auth.uid()` policies in the same migration. This wave: **insert + select policies only** — no update/delete policies, because no UI performs either.
- **Seam (spec D3):** only `src/lib/orders.js` calls `supabase.from('orders')`. Pages import `orders.js`, never Supabase. Only `src/lib/supabase.js` imports the supabase-js client (existing wave-1 seam).
- **Mock layers:** `src/lib/orders.test.js` mocks `./supabase`. Page tests (`CustomOrderPage`, `OrderConfirmationPage`, `MyOrdersPage`) mock `../../lib/orders`. No test mocks the vendor library anywhere else.
- **Copy verbatim:** `'Pending'`, `'1-3 days'` (ASCII hyphen), `'No orders yet.'`, `'+ Upload Reference Image.'` (button stays non-functional — D2), `'SUBMIT CUSTOM ORDER.'`, confirmation panel lines `Order #: `, `Furniture: `, `Status: `, `Estimated Response: `. The only NEW copy this wave: `'No recent order found.'` (confirmation, empty fallback list).
- **Order numbers (spec D4):** assigned by the DB sequence (`WW-` + zero-pad). The app never generates or formats order numbers.
- **Field storage (spec D7):** dimensions and quantity stored as `text` exactly as typed; no invented validation or parsing. `notes` stored as `null` when empty.
- **Iron law:** RED→GREEN per behavior; full suite green + lint clean before every commit; conventional ASCII commit messages; milestones pushed.
- **Tokens-only CSS:** no raw values in component CSS; add a variable to `tokens.css` if a new value is needed.
- **Env unchanged:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` only (both already in `.env.local` and Actions secrets).
- **Migration ordering:** enforced by CI — the `migrate` job runs before `build` in the same workflow; code that queries `orders` cannot deploy before the table exists.

## Review Focus

The five inputs most likely to bite a person using this software, each pinned by its owning test:

1. **Refresh on `/order-confirmation`** — router state is gone; the user expects their just-placed order still shown, not a dead card. Owning test: Task 4 (fallback fetch renders the latest order).
2. **Double-click Submit during a slow insert** — the user expects exactly one order row, button inert while in flight. Owning test: Task 3 (submit disabled while pending; failure path re-enables).
3. **Insert/network failure on Submit** — the user expects the raw error inline, the form intact and re-enabled, and no navigation. Owning tests: Task 3 (failure inline + stays; re-enable).
4. **Cross-account visibility (RLS)** — account B must never see account A's orders; B's My Orders shows the empty state. Owning proof: Task 6 live smoke (the DB policy is the enforcement; a seam-mocked unit test cannot prove RLS).
5. **Direct visit to `/order-confirmation` with zero orders** — a person poking the URL expects a clear "nothing here" line, not a fake order. Owning test: Task 4 (`No recent order found.`).

---

### Task 1: Orders table migration + CI migration job

**Files:**
- Create: `supabase/migrations/0001_orders.sql`
- Create: `supabase/config.toml`
- Modify: `.github/workflows/deploy-pages.yml` (add `migrate` job; `build` needs it)

**Interfaces:**
- Consumes: nothing (pure SQL + workflow).
- Produces: `public.orders` table + `public.orders_number_seq` sequence, RLS ON with insert/select-own policies. Task 2's API assumes exactly these column names. Every push to `main` now shows three checks: `migrate`, `build`, `deploy`.
- USER PREREQ: a Supabase access token (Account → Access Tokens), stored as the Actions secret `SUPABASE_ACCESS_TOKEN` before the workflow's first run.

- [x] **Step 1: Write the migration file** with the exact SQL from spec §4 (sequence, table, RLS enable, two policies, `user_id` index — verbatim, nothing added).

- [x] **Step 2: Create `supabase/config.toml`** (`supabase init` equivalent, minimal):

```toml
project_id = "wood-works"
```

- [x] **Step 3: USER ACTION — access token.** Generate at supabase.com → Account → Access Tokens → paste it in chat. Executor stores it: `gh secret set SUPABASE_ACCESS_TOKEN`.

- [x] **Step 4: Add the `migrate` job** to `deploy-pages.yml` (project ref is public — hardcoded; token via secret):

```yaml
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - run: supabase link --project-ref fnoxvnzbdxespxsqokli
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

`build` gains `needs: migrate`. Concurrency group unchanged.

- [x] **Step 5: Commit + push main** — all three checks green (`migrate` applies the migration; `supabase db push` records it in `supabase_migrations.schema_migrations` so later pushes are no-ops until a new file appears).

- [x] **Step 6: Verify the table exists via the publishable key** (anon sees `200 []` under RLS; a missing table returns 404 `PGRST205`):

```powershell
$key = (Get-Content .env.local | Select-String 'VITE_SUPABASE_ANON_KEY').Line.Split('=')[1]
Invoke-RestMethod -Uri "https://fnoxvnzbdxespxsqokli.supabase.co/rest/v1/orders" -Headers @{ apikey = $key; Authorization = "Bearer $key" }
```

Expected: `200`, body `[]`.

### Task 2: orders.js — real API over the seam

**Files:**
- Modify: `src/lib/orders.js`
- Modify: `src/lib/orders.test.js`

**Interfaces:**
- Consumes: `supabase` from `./supabase` (existing seam module).
- Produces (Tasks 3–5 import these):
  - `insertOrder(values) -> Promise<OrderRecord>` — `values` is the page's raw form-state object (keys `furniture-type`, `wood-type`, `length`, `width`, `height`, `quantity`, `notes`).
  - `listOrders() -> Promise<OrderRecord[]>` — newest first (`created_at` descending).
  - `OrderRecord = { id, number, furniture, wood, status, eta, createdAt }` — the ONLY shape pages ever see (display mapping lives here; pages never see snake_case DB columns).
- `DEFAULT_ORDER` stays exported this task (OrderConfirmationPage still imports it; Task 4 removes it). Mark it deprecated in a comment.

- [x] **Step 1: RED — rework `src/lib/orders.test.js`.** Delete the four `createOrder` tests. Mock the seam (hoisted, Vitest 5):

```js
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { insertOrder, listOrders, DEFAULT_ORDER } from './orders'

const from = vi.hoisted(() => vi.fn())
vi.mock('./supabase', () => ({ supabase: { from } }))
```

New tests:

1. `insertOrder posts the mapped form values and resolves the display-shaped row` — chain mock: `insert(PAYLOAD).select().single()` resolves `{ data: DB_ROW, error: null }`; assert `insert` received exactly `{ furniture_type: 'Modern Oak Shelf', wood_type: 'Oak', length: '4', width: '2', height: '3', quantity: '1', notes: null }` (from `values` keyed `furniture-type` etc., `notes: ''` → `null`); assert the resolved value is `{ id: 1, number: 'WW-0001', furniture: 'Modern Oak Shelf', wood: 'Oak', status: 'Pending', eta: '1-3 days', createdAt: '2026-11-17T00:00:00.000Z' }`.
2. `listOrders resolves rows newest first as display records` — chain mock: `select().order('created_at', { ascending: false })` resolves `{ data: [DB_ROW_B, DB_ROW_A], error: null }`; assert the result is `[B, A]` display-shaped and that `order` was called with `('created_at', { ascending: false })`.
3. `insertOrder rejects with the raw supabase error` — `single()` resolves `{ data: null, error: { message: 'insert failed' } }`; assert the promise rejects with that exact object.

- [x] **Step 2: Run to verify RED.** `npm run test -- src/lib/orders.test.js` — expect FAIL (functions missing / mock chain unused).

- [x] **Step 3: Implement.** Replace the mock factory in `src/lib/orders.js`:

```js
import { supabase } from './supabase'

function toOrder(row) {
  return {
    id: row.id,
    number: row.order_number,
    furniture: row.furniture_type,
    wood: row.wood_type,
    status: row.status,
    eta: row.eta,
    createdAt: row.created_at,
  }
}

export async function insertOrder(values) {
  const payload = {
    furniture_type: values['furniture-type'],
    wood_type: values['wood-type'],
    length: values.length,
    width: values.width,
    height: values.height,
    quantity: values.quantity,
    notes: values.notes || null,
  }
  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return toOrder(data)
}

export async function listOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select()
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(toOrder)
}
```

Keep `DEFAULT_ORDER` (unchanged value) with a `@deprecated` comment noting Task 4 removes it.

- [x] **Step 4: Run to verify GREEN.** `npm run test -- src/lib/orders.test.js` — 3 pass + the DEFAULT test stays.

- [x] **Step 5: Gate + commit.** Full suite (expect **141**) + lint clean.

```bash
git add src/lib/orders.js src/lib/orders.test.js
git commit -m "feat: orders api over the supabase seam"
git push origin feat/orders-persistence
```

(Branch `feat/orders-persistence` is created off `main` before this task's first commit.)

### Task 3: Real custom-order submit

**Files:**
- Modify: `src/components/Button/Button.jsx` (accept + render `disabled`)
- Modify: `src/components/Button/Button.test.jsx` (1 new test)
- Modify: `src/pages/CustomOrderPage/CustomOrderPage.jsx`
- Modify: `src/pages/CustomOrderPage/CustomOrderPage.test.jsx`

**Interfaces:**
- Consumes: `insertOrder(values)` (Task 2).
- Produces: `Button` accepts `disabled = false` and renders the attribute; CustomOrderPage navigates with `{ state: { order } }` where `order` is a Task-2 `OrderRecord`.

- [x] **Step 1: RED — Button test.** In `Button.test.jsx`: `renders with the disabled attribute when disabled` — render `<Button disabled>X</Button>`, expect `getByRole('button', { name: 'X' })` `toBeDisabled()`.

- [x] **Step 2: RED — CustomOrderPage tests.** Add at the top (above the existing helpers):

```js
const insertOrder = vi.hoisted(() => vi.fn())
vi.mock('../../lib/orders', () => ({ insertOrder }))
```

(Remove nothing else; the module mock replaces the whole file, so `createOrder`/`DEFAULT_ORDER` are unavailable — the page will be rewritten to use `insertOrder`.)

1. Rework the existing `valid submit routes to confirmation` test: mock `insertOrder` resolving `{ id: 1, number: 'WW-0001', furniture: 'Modern Oak Shelf', wood: 'Oak', status: 'Pending', eta: '1-3 days', createdAt: '2026-11-17T00:00:00.000Z' }`; fill the six fields as today; click `SUBMIT CUSTOM ORDER.`; expect the existing stub text `ORDER CONFIRMATION STUB WW-0001 Modern Oak Shelf`.
2. New `insert failure shows the raw message and stays`: `insertOrder` rejects `new Error('network down')`; fill + click; expect `network down` visible, `ORDER CONFIRMATION STUB` absent.
3. New `submit is disabled while the insert is in flight`: `insertOrder` returns a never-resolving promise; fill + click; expect the submit button `toBeDisabled()`.
4. New `submit re-enables when the insert fails`: reject + resolve the await; expect the submit button enabled again (`not.toBeDisabled()`).

Existing tests untouched: exact copy, six-fields-exist, empty submit (6 alerts).

- [x] **Step 3: Run to verify RED** (`npm run test -- src/components/Button src/pages/CustomOrderPage`) — expect the 4 new/reworked tests to fail (no `disabled` support; page still calls `createOrder`).

- [x] **Step 4: Implement.**
  - `Button.jsx`: add `disabled = false` to the destructure; render `disabled={disabled}` on the `<button>`.
  - `CustomOrderPage.jsx`: import `insertOrder` (drop `createOrder`); add `const [submitting, setSubmitting] = useState(false)` and `const [formError, setFormError] = useState('')`; `handleSubmit`: validation unchanged → `setSubmitting(true)` → `try { const order = await insertOrder(values); navigate('/order-confirmation', { state: { order } }) } catch (error) { setFormError(error.message) } finally { setSubmitting(false) }`. Clear `formError` at submit start.
  - Submit button: `disabled={submitting}`.
  - Form-level error line under the fields: `<p className="custom__form-error" role="alert">{formError}</p>` rendered only when `formError` is set. CSS: `.custom__form-error { color: var(--color-error); margin: 0; }` (token only).
  - The `+ Upload Reference Image.` button stays untouched (D2).

- [x] **Step 5: Run to verify GREEN** — all CustomOrderPage tests + Button tests pass.

- [x] **Step 6: Gate + commit.** Full suite (expect **145**) + lint clean.

```bash
git add src/components/Button src/pages/CustomOrderPage
git commit -m "feat: real custom order submit with insert failure handling"
git push origin feat/orders-persistence
```

### Task 4: Order confirmation fallback

**Files:**
- Modify: `src/pages/OrderConfirmationPage/OrderConfirmationPage.jsx`
- Modify: `src/pages/OrderConfirmationPage/OrderConfirmationPage.test.jsx`
- Modify: `src/lib/orders.js` (remove `DEFAULT_ORDER`)
- Modify: `src/lib/orders.test.js` (remove the DEFAULT test)

**Interfaces:**
- Consumes: `listOrders()` (Task 2).
- Produces: confirmation renders a Task-2 `OrderRecord` from router state OR from the fallback fetch.

- [x] **Step 1: RED — rework + new tests.** Mock like Task 3 (`vi.mock('../../lib/orders', () => ({ listOrders }))`, hoisted; default: `listOrders.mockResolvedValue([])` in `beforeEach`).

1. Rework `direct visit` test → `direct visit fetches the latest order and renders it`: `listOrders` resolves `[ROW]` (`{ id: 9, number: 'WW-0009', furniture: 'Oak Bookshelf', wood: 'Oak', status: 'Pending', eta: '1-3 days', createdAt: '...' }`); expect panel lines `Order #: WW-0009`, `Furniture: Oak Bookshelf`, `Status: Pending`, `Estimated Response: 1-3 days`; heading/copy asserts stay. Keep the VIEW MY ORDERS and BACK TO HOME tests (they now hit the mocked module harmlessly).
2. New `direct visit with no orders shows the no-recent-order line`: `listOrders` resolves `[]`; expect exactly `No recent order found.`
3. New `fallback fetch failure shows the raw message`: `listOrders` rejects `new Error('network down')`; expect `network down` visible, no `Order #: ` line.

- [x] **Step 2: Run to verify RED** — direct-visit test fails (page renders DEFAULT_ORDER, never fetches); the two new tests fail.

- [x] **Step 3: Implement.** In `OrderConfirmationPage.jsx`: drop the `DEFAULT_ORDER` import; `const savedOrder = state?.order`; `const [fetched, setFetched] = useState(null)`; `useEffect` runs only when `!savedOrder`: `listOrders().then((rows) => setFetched(rows[0] ?? null)).catch((e) => setFetchError(e.message))` with a `loading` flag — render `null` while fetching. Render precedence: `savedOrder ?? fetched` → panel (lines unchanged); fetch error → `<p role="alert">{fetchError}</p>`; empty (`savedOrder` absent, fetch settled, no row) → `<p>No recent order found.</p>`. Then delete `DEFAULT_ORDER` from `orders.js` and its test from `orders.test.js`.

- [x] **Step 4: Run to verify GREEN.**

- [x] **Step 5: Gate + commit.** Full suite (expect **146**) + lint clean.

```bash
git add src/pages/OrderConfirmationPage src/lib/orders.js src/lib/orders.test.js
git commit -m "feat: order confirmation falls back to the latest saved order"
git push origin feat/orders-persistence
```

### Task 5: My Orders real

**Files:**
- Rename: `src/pages/MyOrdersStubPage/` → `src/pages/MyOrdersPage/` (`MyOrdersStubPage.jsx|css|test.jsx` → `MyOrdersPage.*`; keep the `my-orders__*` class names)
- Modify: `src/App.jsx` (import + route element: `MyOrdersStubPage` → `MyOrdersPage`; path `/my-orders` unchanged)
- Modify: `src/pages/MyOrdersPage/MyOrdersPage.test.jsx`

**Interfaces:**
- Consumes: `listOrders()` (Task 2).
- Produces: the `/my-orders` screen renders `OrderRecord[]` as cards.

- [x] **Step 1: RED — rework + new tests.** Mock `../../lib/orders` (`listOrders`, hoisted; default `[]`).

1. Rework the existing test → `renders the heading and the empty line when there are no orders`: expect heading `My Orders` + `No orders yet.`
2. New `renders the user's orders as cards newest first`: `listOrders` resolves `[ROW_2 (WW-0002), ROW_1 (WW-0001)]`; expect both cards; card content: `Order #: WW-0002`, furniture, `Pending`, `1-3 days`, and the date `new Date(createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })`.
3. New `shows the raw error and retries`: `listOrders` rejects `new Error('network down')` → `network down` visible + a `Retry` button; make the mock resolve and click Retry → the empty line (or cards) appears.

- [x] **Step 2: Run to verify RED.**

- [x] **Step 3: Implement.**
  - `MyOrdersPage.jsx`: `listOrders()` on mount via `useEffect`; state `{ orders, loading, error }`; `loading` → `null`; error → `<p role="alert">{error}</p>` + `<button type="button" className="my-orders__retry" onClick={load}>Retry</button>`; empty → the pinned `No orders yet.`; cards:

```jsx
<li className="my-orders__card" key={order.id}>
  <p className="my-orders__card-number">Order #: {order.number}</p>
  <p className="my-orders__card-furniture">{order.furniture}</p>
  <p className="my-orders__card-status">{order.status}</p>
  <p className="my-orders__card-eta">{order.eta}</p>
  <p className="my-orders__card-date">{formatDate(order.createdAt)}</p>
</li>
```

  - CSS (tokens only): `.my-orders__list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--gap-lg); }`, `.my-orders__card { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-card); padding: var(--gap-lg); display: grid; gap: var(--gap-sm); }`, `.my-orders__card-number { font-weight: var(--w-700); }`.
  - `App.jsx`: rename the import and the route element.

- [x] **Step 4: Run to verify GREEN.**

- [x] **Step 5: Gate + commit.** Full suite (expect **148**) + lint clean.

```bash
git add -A
git commit -m "feat: real my orders list with retry"
git push origin feat/orders-persistence
```

### Task 6: Merge, deploy, live acceptance

**Files:**
- Modify: `.superpowers/deploy-smoke.mjs` (gitignored smoke tooling — update for orders)

**Interfaces:**
- Consumes: everything above, deployed.

- [x] **Step 1: Prereq check:** confirm the `migrate` check is green in the deploy run (Task 1's job ran; the table exists).

- [x] **Step 2: Gate + merge + deploy.** Full suite (148) + lint on the branch → merge `feat/orders-persistence` into `main` (`--no-ff`) → push → `gh run watch` until the Pages deploy is green.

- [x] **Step 3: Live smoke** (fresh throwaway accounts `woodworks-smoke4@` and `woodworks-smoke5@wood-works-demo.invalid`, password `Demo-Wood-2026`), headless Playwright Edge channel:

1. Account A signs up → lands signed-in.
2. A opens `/custom-order`, fills the six fields, submits → confirmation shows `Order #: WW-####` (a DB-assigned number, not `WW-0001` from a module counter).
3. A refreshes the confirmation → the order still renders (fallback fetch).
4. A opens `/my-orders` → the order is listed; refresh → still listed.
5. A logs out; account B signs up → B's `/my-orders` shows `No orders yet.` — **RLS proven live: B sees none of A's rows.**
6. Optional: A's popover logout still lands on `/login` (wave-1 regression guard).

Record results; report to the user.

- [ ] **Step 4: Finish.** Ledger `Final:` lines; delete the plan workspace; `finishing-a-development-branch` (delete `feat/orders-persistence`); remind the user about the pending `sb_secret_` rotation if not yet done.
