# Cart + Checkout (Wave 3) — Session Handoff & Full Plan

> **Purpose:** This is the single recovery document for the Wood Works cart/checkout work. If the chat session is deleted, read this file top to bottom. It contains the project state, every decision made in the session, the conventions to follow, the known risks, and the complete implementation plan (embedded below, starting at "Part 2").
>
> **Status as of 2026-11-20:** design approved; implementation plan written; **no code written yet**. Plan tasks are all unchecked.

---

## Part 1 — Session memory and operating context

### 1.1 Project

- **Project:** "Wood Works" — a Figma recreation built as a real React app.
- **Repo:** `F:\Figma Project` (git repo).
- **Stack:** Vite + React 19, react-router-dom v7, `@supabase/supabase-js` v2, Vitest 5 + Testing Library (jsdom), plain CSS with design tokens.
- **Backend:** Supabase project ref `fnoxvnzbdxespxsqokli`; anon key + RLS is the security model (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local` and GitHub Actions secrets).
- **Deploy:** GitHub Pages via `.github/workflows/deploy-pages.yml`; jobs `migrate` (Supabase CLI `db push`) → `build` → `deploy`. The `migrate` job is registered (commit `2a6ad4d`), so new migration files apply automatically before the build.

### 1.2 Where we are

- **Wave 1 (auth + screens):** complete.
- **Wave 2 (custom-order persistence):** complete, merged, deployed, live smoke passed. `orders` table exists with RLS insert/select policies; order numbers come from the DB sequence (`WW-####`).
- **Wave 3 (cart + checkout):** design approved in chat and recorded in `docs/superpowers/specs/2026-11-19-cart-checkout-design.md`. Implementation plan written and saved. No code changed yet.

**Repo state at handoff:**

- Branch: `main`, clean working tree, up to date with `origin/main`.
- Latest commits: `2a6ad4d ci: register migrate job...`, `d129a7f docs(spec): cart + checkout design (wave 3)`, `460ca59 docs(plan): mark Task 6 Step 4...`.
- **Baseline gate: 152 tests / 33 files passing; `npm run lint` clean.**
- Untracked: `docs/superpowers/plans/2026-11-20-cart-checkout.md` and this file. Commit them if desired (not required for execution).

### 1.3 Objective

Replace the fake "ORDER NOW" flow with a real multi-item cart and checkout:

1. "ADD TO CART" on Product Details (guests sent to login, returning to the product).
2. A per-user cart persisted in Supabase (`cart_items`).
3. One `/cart` page: rows, quantities via a +/− stepper, remove, grand total, SUBMIT ORDER.
4. One multi-item order persisted in `orders` with an item snapshot + total.
5. Confirmation and My Orders render cart breakdowns; custom orders keep working exactly as before.

### 1.4 Approved decisions (from the spec)

- **D1:** "ORDER NOW" is **replaced** by "ADD TO CART". The deprecated mock `createOrder` path is deleted.
- **D2:** Cart and checkout require a signed-in user. Guests hitting `/cart` go to `/login`, then return to `/cart`.
- **D3:** One page does both: `/cart` lists items and carries SUBMIT ORDER. No separate checkout route.
- **D4:** Quantities are supported with a `+`/`−` stepper; `−` at quantity 1 removes the row.
- **D5:** Products remain the hardcoded catalog in `src/data/products.js`. `cart_items.product_id` references its stable `id`. Order items snapshot `{product_id, name, price, quantity}` so history survives catalog edits.

### 1.5 Plan-level decisions made this session (important — the spec missed these)

1. **Nullable custom-order columns.** `orders.wood_type`, `length`, `width`, `height`, `quantity` are `NOT NULL` from `0001_orders.sql`. Cart orders insert none of them. `0002_cart.sql` must drop those five `NOT NULL` constraints or every `placeOrder` fails with a constraint violation. Custom orders still populate all five.
2. **Delete-own policy on `orders`.** `placeOrder`'s best-effort orphan cleanup (delete the inserted order when clearing the cart fails) is a no-op under the current insert/select-only RLS. `0002_cart.sql` adds `for delete to authenticated using (auth.uid() = user_id)`. Own rows only; no UI exposes deletion.
3. **Login return-to is broken today.** `LoginPage` hardcodes `navigate('/home')`, so the spec's "login returns to `state.from`" assumption is false. Task 4 fixes it to accept both a location object (`{ pathname }`) and a plain string, defaulting to `/home`.
4. **Cart route guards itself.** `/cart` is not wrapped in `ProtectedRoute`, because `ProtectedRoute` does not pass `state.from`. `CartPage` performs its own guard and redirects with `state.from = '/cart'`. Other store routes are unchanged.
5. **Stepper removal.** `QuantityStepper` enforces a minimum of 1. Task 5 adds an optional `onRemove` prop so `−` at 1 removes the cart row without changing Product Details behaviour.
6. **Nav badge.** Implement `useCartCount` + a lightweight `window` event (`'woodworks:cart-changed'`) dispatched by cart mutations. This satisfies the spec's "prefer the badge" rather than dropping it.
7. **Confirmation copy.** Cart orders use the generic sub-line `'Your order has been successfully submitted.'`; custom orders keep `'Your custom furniture request has been successfully submitted.'`.

### 1.6 New copy pinned by the plan

- Product Details: `ADD TO CART`, `ADDED ✓` (shown 1.5s).
- Cart: `Your Cart`, `Your cart is empty.`, `Browse the catalog`, `Total: `, `Remove`, `SUBMIT ORDER`, `Retry`.
- Order item lines: `` `${name} ×${quantity} — ${formatPrice(lineTotal)}` `` (`×` U+00D7, `—` em dash).
- Snapshot label: `Cart order` (stored as `orders.furniture_type`).
- Confirmation cart sub-line: `Your order has been successfully submitted.`

### 1.7 File map (what exists and what changes)

Existing files the work touches:

| File | Role |
| --- | --- |
| `docs/superpowers/specs/2026-11-19-cart-checkout-design.md` | Approved wave-3 spec |
| `docs/superpowers/specs/2026-11-17-wood-works-orders-persistence-design.md` | Wave-2 conventions reference |
| `docs/superpowers/plans/2026-11-17-wood-works-orders-persistence.md` | Wave-2 plan format reference (completed) |
| `2026-11-06-wood-works-real-functions-roadmap.md` | Waves 1–5 overview |
| `README.md` | Current feature/route list |
| `src/lib/supabase.js` | The only Supabase client seam |
| `src/lib/orders.js` | Order API; `toOrder` mapping; `createOrder` to delete |
| `src/lib/orders.test.js` | Seam-mocked order tests |
| `src/auth/AuthProvider.jsx` | `useAuth()` → `{ user, loading }` |
| `src/auth/ProtectedRoute.jsx` | Store-route guard (does **not** pass `state.from`) |
| `src/App.jsx` | Routes; add `/cart` |
| `src/data/products.js` | Hardcoded catalog + `getProduct` |
| `src/lib/formatPrice.js` | `₱` + en-US thousands |
| `src/components/QuantityStepper/QuantityStepper.jsx` | +/− stepper, min 1 |
| `src/components/NavBar/NavBar.jsx` | Nav links + profile popover |
| `src/layouts/PageLayout/PageLayout.jsx` | Cream page + navbar |
| `src/pages/ProductDetailsPage/*` | ORDER NOW → ADD TO CART |
| `src/pages/LoginPage/LoginPage.jsx` | Hardcoded `/home` → `state.from` |
| `src/pages/OrderConfirmationPage/*` | Add cart breakdown |
| `src/pages/MyOrdersPage/*` | Add cart breakdown |
| `src/pages/CartPage/*` | **New** |
| `supabase/migrations/0001_orders.sql` | Existing orders schema |
| `supabase/migrations/0002_cart.sql` | **New** |

### 1.8 Conventions to preserve (learned from waves 1–2)

- **TDD:** write the failing test, run it to prove RED, implement minimally, prove GREEN, then gate.
- **Gate = full suite green + `npm run lint` clean before every commit.**
- **Seam mocking:** library tests mock `./supabase`; page tests mock `../../lib/cart` / `../../lib/orders`. Never mock the vendor library elsewhere.
- **Display shapes:** pages see camelCase records only; snake_case stays at the DB seam. Raw Supabase errors are thrown and rendered inline (`role="alert"`).
- **Tokens-only CSS:** no raw colors/sizes in component CSS; reuse `--color-*`, `--fs-*`, `--lh-*`, `--w-*`, `--gap-*`, `--radius-*`.
- **Copy verbatim:** spec copy is pinned exactly (ASCII hyphen in `1-3 days`, `×`/`—` in item lines).
- **Commits:** conventional ASCII messages; task-sized commits; branch `feat/cart-checkout`; merge with `--no-ff` in the final task.
- **Live smoke:** fresh throwaway accounts with one-shot emails; password `Demo-Wood-2026`; headless Playwright Edge channel; RLS isolation proven with a second account.
- **No money moves:** payment/shipping out of scope; status stays `Pending`, eta `1-3 days`.

### 1.9 Known risks / gotchas for the executor

- **Hook order in `CartPage`:** declare state, `useCallback`, and `useEffect` before any conditional `return`; the fetch effect should run only when `user` is truthy.
- **Task 8 affects earlier page tests:** `NavBar` will call `useCartCount` → `listCart`. The Task 4/5 test mocks already include `listCart` and `CART_CHANGED_EVENT` so those suites keep passing. Page tests that render `PageLayout` without a signed-in auth context (e.g. My Orders) skip the fetch because the default auth context is a guest.
- **`App.test.jsx` Supabase mock has no `from`:** after Task 8, signed-in Home tests call `listCart`, which rejects; `useCartCount` catches and shows no badge. That is expected.
- **Price totals:** prices are integer pesos; `orders.total` is `numeric(10,2)` and may arrive as a string, so `toOrder` must `Number()` it. `formatPrice` expects a number.
- **RLS delete policy** is required for orphan cleanup; do not skip it.
- **`ProductDetailsPage` signed-out branch** is unreachable in the live app (the route is protected), but the spec requires it and it is unit-tested.
- **Don't invent validation or guest carts** — out of scope.
- **Migration ordering** is enforced by CI; do not deploy code that queries `cart_items` before Task 1's migration is green.

### 1.10 Resume instructions (fresh session)

1. Read this file and the embedded plan in Part 2.
2. Optionally re-read the spec at `docs/superpowers/specs/2026-11-19-cart-checkout-design.md`.
3. Use `superpowers:executing-plans` (native, in-session) or `superpowers:subagent-driven-development` per the chosen method.
4. Start at Task 1: `git checkout main && git pull && git checkout -b feat/cart-checkout`, then write `0002_cart.sql`.
5. Follow each task's RED → GREEN → gate → commit cycle exactly. Record the new test count at each gate.
6. Task 9 handles merge, deploy, and live smoke.

**Suggested kickoff prompt:**

> Implement `docs/superpowers/plans/2026-11-20-cart-checkout-handoff.md` (Part 2 plan) task-by-task. Read Part 1 first for context and the two migration deviations. Use `superpowers:executing-plans`. Create `feat/cart-checkout` off `main`, follow RED→GREEN and the gate/commit steps, and record the test count at each gate. Baseline: 152 tests / 33 files, clean `main`.

---

## Part 2 — Full implementation plan

# Cart + Checkout (Wave 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock ORDER NOW flow with a persisted per-user cart, one `/cart` page with quantities and SUBMIT ORDER, and multi-item orders that render correctly on the confirmation and My Orders screens.

**Architecture:** `src/lib/cart.js` becomes a new API module over the existing Supabase seam, mirroring `src/lib/orders.js`: snake_case at the DB seam, display-shaped camelCase to pages, raw Supabase errors thrown. A `cart_items` table ships in migration `0002_cart.sql` under the existing RLS model; `orders` gains nullable `items`/`total` so custom orders are untouched. Pages stay thin: Product Details adds to cart, `/cart` reviews and submits, and the two order screens branch on `order.items`.

**Tech Stack:** Vite + React 19, react-router-dom v7, @supabase/supabase-js v2, Vitest 5 + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-11-19-cart-checkout-design.md` (executors read both; the spec argues from locked decisions D1–D5).

## Global Constraints

- **RLS (spec Data):** `cart_items` ships with RLS ON and insert/select/update/delete-own policies in `0002_cart.sql`. The update policy's `using` clause doubles as its `with check` (Postgres default), so `user_id` cannot be reassigned.
- **Cart orders need nullable custom fields (plan addition):** `0001_orders.sql` declares `wood_type`, `length`, `width`, `height`, and `quantity` as `not null`. A cart order inserts none of them, so `0002_cart.sql` drops those five `not null` constraints. Custom orders still supply every field; only cart rows are null there. Without this, `placeOrder` fails with a constraint violation on every submit.
- **Orphan cleanup needs a delete policy (plan addition):** the spec's `placeOrder` step 4 deletes an orphan order after a failed cart clear. `orders` currently has insert/select policies only, so that delete would be a silent no-op under RLS. `0002_cart.sql` therefore also adds a delete-own policy on `orders` (own rows only, no UI exposes deletion). Both SQL additions deviate from the spec's Data section and are called out in the commit message.
- **Seam (spec Library):** only `src/lib/cart.js` calls `supabase.from('cart_items')`; only `src/lib/cart.js` and `src/lib/orders.js` call `supabase.from('orders')`. Pages never import Supabase.
- **Mock layers:** `src/lib/cart.test.js` and `src/lib/orders.test.js` mock `./supabase`. Page tests mock `../../lib/cart` and/or `../../lib/orders`; `CartPage` and `ProductDetailsPage` tests also mock `../../auth/AuthProvider` (`useAuth`). No test mocks the vendor library anywhere else.
- **Catalog is the source of product truth (D5):** `cart_items.product_id` stores `PRODUCTS[].id`; `listCart` joins with `getProduct`. Order snapshots store `{ product_id, name, price, quantity }`; display maps to `{ productId, name, price, quantity, lineTotal }`.
- **Copy verbatim:** `'ADD TO CART'`, `'ADDED ✓'`, `'Your cart is empty.'`, `'SUBMIT ORDER'`, `'Cart order'`, `'Pending'`, `'1-3 days'`, `'Order #: '`, `'Status: '`, `'Estimated Response: '`, `'No orders yet.'`. Item lines use `×` (U+00D7) and `—` (em dash): `` `${name} ×${quantity} — ${formatPrice(lineTotal)}` ``.
- **New copy pinned by this plan:** cart heading `'Your Cart'`, empty-state link `'Browse the catalog'`, totals prefix `'Total: '`, remove action `'Remove'`, guest/detail redirect target `/login` with `state.from`, cart-order confirmation sub-line `'Your order has been successfully submitted.'`.
- **Money:** prices are integer pesos; `total = Σ price × quantity`. `orders.total` is `numeric(10,2)` and PostgREST may return it as a string — `toOrder` must `Number()` it (null stays null). Display always through `formatPrice`.
- **Tokens-only CSS:** no raw colors/sizes in component CSS. Reuse `--gap-*`, `--fs-*`, `--lh-*`, `--w-*`, `--radius-*`, `--color-*`; add a token only if a genuinely new value appears.
- **Iron law:** RED→GREEN per behavior; full suite green + `npm run lint` clean before every commit; conventional ASCII commit messages. Baseline is **152 tests / 33 files**; record the new count at each gate.
- **Migration ordering:** the existing `migrate` CI job (commit `2a6ad4d`) applies new migration files before `build`; no workflow change is needed this wave.
- **Branch:** create `feat/cart-checkout` off `main` before Task 1's commit. Deploy and live smoke happen only in Task 9.

## Review Focus

The five inputs/failure modes most likely to bite a person using this software, each pinned by its owning test:

1. **Double-click SUBMIT ORDER** — the user expects exactly one order, never an empty or duplicate one. Owning tests: Task 3 (`placeOrder` rejects on an empty cart), Task 5 (submit disabled in flight).
2. **A failed +/− or Remove on `/cart`** — the user expects the row to stay put and the raw error to be visible, not a silently dead control. Owning test: Task 5 (mutation failure shows `role="alert"`, rows remain).
3. **Refresh / deep link on `/cart`** — cart contents are persisted, so they must survive a reload; an unknown catalog id must not crash the page. Owning tests: Task 3 (`listCart` join + unknown-id drop), Task 9 live smoke (refresh keeps cart).
4. **Order inserted but cart clear fails** — the user retries; without cleanup they get a duplicate order and a cart that never empties. Owning test: Task 3 (`placeOrder` deletes the orphan order and rethrows).
5. **Guest sends themselves to login mid-task** — after signing in they must land back on `/cart` or the product page, not `/home`. Owning tests: Task 4 (LoginPage honours `state.from`, object and string forms), Task 5 (guest `/cart` redirect carries `/cart`).

---

### Task 1: `cart_items` migration + order columns

**Files:**
- Create: `supabase/migrations/0002_cart.sql`

**Interfaces:**
- Consumes: existing `public.orders` + `auth.users` from `0001_orders.sql`.
- Produces: `public.cart_items` (columns `id`, `user_id`, `product_id`, `quantity`, `created_at`; unique `(user_id, product_id)`), `public.orders.items jsonb` + `public.orders.total numeric(10,2)`, five custom-order columns made nullable, and a delete-own policy on `orders`. Task 3's API assumes exactly these names.

- [ ] **Step 1: Create the branch**

```bash
git checkout main
git pull
git checkout -b feat/cart-checkout
```

- [ ] **Step 2: Write `supabase/migrations/0002_cart.sql`**

Cart table, RLS, policies, index exactly as the spec's Data section, followed by the `orders` column additions and the cleanup policy:

```sql
create table public.cart_items (
  id bigint generated always as identity primary key,
  user_id uuid not null
    references auth.users (id) on delete cascade
    default auth.uid(),
  product_id text not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.cart_items enable row level security;

create policy "cart insert own" on public.cart_items
  for insert to authenticated with check (auth.uid() = user_id);
create policy "cart select own" on public.cart_items
  for select to authenticated using (auth.uid() = user_id);
create policy "cart update own" on public.cart_items
  for update to authenticated using (auth.uid() = user_id);
create policy "cart delete own" on public.cart_items
  for delete to authenticated using (auth.uid() = user_id);

create index cart_items_user_id_idx on public.cart_items (user_id);

alter table public.orders
  add column items jsonb,
  add column total numeric(10,2);

-- Cart orders have no wood/dimensions; custom orders still fill these.
alter table public.orders
  alter column wood_type drop not null,
  alter column length drop not null,
  alter column width drop not null,
  alter column height drop not null,
  alter column quantity drop not null;

-- placeOrder's best-effort orphan cleanup needs this; own rows only.
create policy "delete own order" on public.orders
  for delete to authenticated using (auth.uid() = user_id);
```

- [ ] **Step 3: Commit and push — let CI migrate**

```bash
git add supabase/migrations/0002_cart.sql
git commit -m "feat: cart_items table and cart order columns"
git push -u origin feat/cart-checkout
```

- [ ] **Step 4: Verify the migration applied**

`gh run watch` until the `migrate` check is green, then hit both tables with the anon key (RLS returns `200 []`; a missing table returns `404 PGRST205`):

```powershell
$key = (Get-Content .env.local | Select-String 'VITE_SUPABASE_ANON_KEY').Line.Split('=')[1]
Invoke-RestMethod -Uri "https://fnoxvnzbdxespxsqokli.supabase.co/rest/v1/cart_items" -Headers @{ apikey = $key; Authorization = "Bearer $key" }
Invoke-RestMethod -Uri "https://fnoxvnzbdxespxsqokli.supabase.co/rest/v1/orders" -Headers @{ apikey = $key; Authorization = "Bearer $key" }
```

Expected: both `200`, body `[]`.

### Task 2: `orders.js` — items/total display mapping

**Files:**
- Modify: `src/lib/orders.js`
- Modify: `src/lib/orders.test.js`

**Interfaces:**
- Consumes: existing orders rows; `createOrder`/`orderCounter` stay this task (Product Details still imports `createOrder` until Task 4).
- Produces:
  - `export function toOrder(row) -> OrderRecord` — now exported because Task 3's `placeOrder` reuses it.
  - `OrderRecord = { id, number, furniture, wood, status, eta, createdAt, items, total }` where `items` is `null` or `Array<{ productId, name, price, quantity, lineTotal }>`, and `total` is `null` or a `number`.

- [ ] **Step 1: RED — extend `src/lib/orders.test.js`**

Keep the existing seam mock and `chain()` helper. Update every existing `toEqual` expectation for `insertOrder`/`listOrders` to include `items: null, total: null`. Add:

1. `toOrder maps a cart snapshot into camelCase lines with line totals` — call `toOrder` directly with a row whose `items` is `[{ product_id: 'classic-wooden-chair', name: 'Classic Wooden Chair', price: 2500, quantity: 2 }]` and `total: '5000.00'`; expect `items: [{ productId: 'classic-wooden-chair', name: 'Classic Wooden Chair', price: 2500, quantity: 2, lineTotal: 5000 }]` and `total: 5000` (number).
2. `toOrder keeps custom orders null-safe` — row with `items: null, total: null` → both `null`.
3. `listOrders carries cart items through the display mapper` — list a cart row and a custom row; expect the cart row's `items` populated and the custom row's `items: null`.

- [ ] **Step 2: Run to verify RED**

Run: `npm run test -- src/lib/orders.test.js`
Expected: FAIL — `toOrder` is not exported; updated expectations lack the new keys.

- [ ] **Step 3: Implement in `src/lib/orders.js`**

Export `toOrder` (replace the private function) with null-safe mapping:

```js
export function toOrder(row) {
  return {
    id: row.id,
    number: row.order_number,
    furniture: row.furniture_type,
    wood: row.wood_type,
    status: row.status,
    eta: row.eta,
    createdAt: row.created_at,
    items: Array.isArray(row.items)
      ? row.items.map((item) => ({
          productId: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          lineTotal: item.price * item.quantity,
        }))
      : null,
    total: row.total == null ? null : Number(row.total),
  }
}
```

`insertOrder`/`listOrders` bodies are unchanged.

- [ ] **Step 4: Run to verify GREEN**

Run: `npm run test -- src/lib/orders.test.js`
Expected: PASS.

- [ ] **Step 5: Gate + commit**

Full suite + lint green (baseline 152; no test count change beyond the 3 added and expectation updates).

```bash
git add src/lib/orders.js src/lib/orders.test.js
git commit -m "feat: map cart item snapshots onto order records"
```

### Task 3: `cart.js` — cart API + checkout sequence

**Files:**
- Create: `src/lib/cart.js`
- Create: `src/lib/cart.test.js`

**Interfaces:**
- Consumes: `supabase` from `./supabase`, `getProduct` from `../data/products`, `toOrder` from `./orders` (Task 2).
- Produces (Tasks 4–8 import these):
  - `CART_CHANGED_EVENT = 'woodworks:cart-changed'`
  - `upsertCartItem(productId, quantity) -> Promise<void>` — sets the row's quantity (not additive), conflict target `user_id,product_id`.
  - `listCart() -> Promise<Array<{ product, quantity, lineTotal }>>` — catalog-joined, `created_at` ascending, unknown ids dropped.
  - `setQuantity(productId, quantity) -> Promise<void>` — quantity `< 1` removes the row.
  - `removeCartItem(productId) -> Promise<void>`
  - `placeOrder() -> Promise<OrderRecord>` — snapshot + total, clears the cart, resolves the saved order.

- [ ] **Step 1: RED — write `src/lib/cart.test.js`**

Mirror `orders.test.js`: `const from = vi.hoisted(() => vi.fn())`, `vi.mock('./supabase', () => ({ supabase: { from } }))`. Extend the `chain(result)` builder with `upsert`, `update`, `delete`, `eq`, `in`, and `single` (all chainable; `then` resolves `result`). Use a `from.mockImplementation((table) => ...)` map / queue so `placeOrder` can serve different tables in order.

Tests (exact assertions):

1. `upsertCartItem sends the product, quantity, and conflict target` — resolves `{ error: null }`; expect `from('cart_items')`, `upsert({ product_id: 'classic-wooden-chair', quantity: 2 }, { onConflict: 'user_id,product_id' })`.
2. `upsertCartItem rejects with the raw supabase error` — `{ error: { message: 'upsert failed' } }` → rejects with that exact object.
3. `listCart joins the catalog and computes line totals in created order` — rows `[chair qty 2, table qty 1]` → `[{ product: PRODUCTS chair, quantity: 2, lineTotal: 5000 }, ...]`; expect `select()` then `order('created_at', { ascending: true })`.
4. `listCart drops rows whose product left the catalog` — one known + one `'ghost'` → only the known line.
5. `setQuantity updates the row's quantity` — resolves `{ error: null }`; expect `update({ quantity: 3 }).eq('product_id', 'study-table')`.
6. `setQuantity below 1 removes the row` — `setQuantity('study-table', 0)` → `delete().eq('product_id', 'study-table')`, and `update` not called.
7. `removeCartItem deletes by product id` — `delete().eq('product_id', 'bed-frame')`.
8. `mutations dispatch the cart-changed event` — attach a `window` listener for `CART_CHANGED_EVENT`, call `upsertCartItem`/`setQuantity`/`removeCartItem`; expect one event per successful call (and none for a rejected call).
9. `placeOrder inserts the snapshot + total, clears the cart, and resolves the display order` — cart lines chair ×2 + table ×1; orders insert resolves a DB row whose `items` is the submitted snapshot with `order_number: 'WW-0007'`, `furniture_type: 'Cart order'`; expect:
   - `from('orders').insert({ items: [{ product_id: 'classic-wooden-chair', name: 'Classic Wooden Chair', price: 2500, quantity: 2 }, { product_id: 'wooden-dining-table', name: 'Wooden Dining Table', price: 5000, quantity: 1 }], total: 10000, furniture_type: 'Cart order', notes: null })`
   - `from('cart_items').delete().in('product_id', ['classic-wooden-chair', 'wooden-dining-table'])`
   - resolved order has `number: 'WW-0007'`, `items` camelCase with `lineTotal`, `total: 10000`.
10. `placeOrder rejects on an empty cart without inserting an order` — `listCart` resolves `[]`; expect rejection message `'Your cart is empty.'` and no `from('orders')` call.
11. `placeOrder deletes the orphan order when clearing the cart fails` — cart delete resolves `{ error: { message: 'clear failed' } }`; expect `from('orders').delete().eq('id', <inserted id>)` and rejection with the clear error.
12. `placeOrder rethrows an order-insert failure without clearing the cart` — orders insert resolves `{ data: null, error: { message: 'insert failed' } }`; expect rejection, no cart delete.

- [ ] **Step 2: Run to verify RED**

Run: `npm run test -- src/lib/cart.test.js`
Expected: FAIL — `src/lib/cart.js` does not exist.

- [ ] **Step 3: Implement `src/lib/cart.js`**

Follow the interfaces exactly. Bodies:

- `notify()` guards `typeof window !== 'undefined'` and dispatches `new Event(CART_CHANGED_EVENT)`.
- `upsertCartItem` awaits `supabase.from('cart_items').upsert({ product_id, quantity }, { onConflict: 'user_id,product_id' })`; throw `error` if present; `notify()`.
- `listCart` awaits `supabase.from('cart_items').select().order('created_at', { ascending: true })`; throw raw error; map rows through `getProduct`, drop undefined, return `{ product, quantity: row.quantity, lineTotal: product.price * row.quantity }`.
- `setQuantity`: if `quantity < 1` return `removeCartItem(productId)`; else `update({ quantity }).eq('product_id', productId)`, throw raw, `notify()`.
- `removeCartItem`: `delete().eq('product_id', productId)`, throw raw, `notify()`.
- `placeOrder`:
  1. `const lines = await listCart()`; if empty `throw new Error('Your cart is empty.')`.
  2. Build `items = lines.map(({ product, quantity }) => ({ product_id: product.id, name: product.name, price: product.price, quantity }))` and `total = lines.reduce((sum, line) => sum + line.lineTotal, 0)`.
  3. `const { data, error } = await supabase.from('orders').insert({ items, total, furniture_type: 'Cart order', notes: null }).select().single()`; throw raw.
  4. `const { error: clearError } = await supabase.from('cart_items').delete().in('product_id', items.map((item) => item.product_id))`.
  5. If `clearError`: `await supabase.from('orders').delete().eq('id', data.id)` (best effort — ignore its result), then `throw clearError`.
  6. `notify()`; return `toOrder(data)`.

- [ ] **Step 4: Run to verify GREEN**

Run: `npm run test -- src/lib/cart.test.js src/lib/orders.test.js`
Expected: PASS.

- [ ] **Step 5: Gate + commit**

Full suite + lint green.

```bash
git add src/lib/cart.js src/lib/cart.test.js
git commit -m "feat: persistent cart api with multi-item checkout"
```

### Task 4: ADD TO CART + login return-to

**Files:**
- Modify: `src/pages/ProductDetailsPage/ProductDetailsPage.jsx`
- Modify: `src/pages/ProductDetailsPage/ProductDetailsPage.test.jsx`
- Modify: `src/pages/ProductDetailsPage/ProductDetailsPage.css` (error line)
- Modify: `src/pages/LoginPage/LoginPage.jsx`
- Modify: `src/pages/LoginPage/LoginPage.test.jsx`
- Modify: `src/lib/orders.js` (delete `createOrder` + `orderCounter`)
- Modify: `src/lib/orders.test.js` (delete the four `createOrder` tests)

**Interfaces:**
- Consumes: `useAuth()` (`{ user, loading }`), `useLocation()`, `upsertCartItem(productId, quantity)` (Task 3).
- Produces: Product Details calls `upsertCartItem(product.id, quantity)` for signed-in users and sends guests to `/login` with `state.from = location`; LoginPage resolves `state.from` to a path after sign-in (`string` or location object), defaulting to `/home`.

- [ ] **Step 1: RED — rework `ProductDetailsPage.test.jsx`**

Add hoisted mocks:

```js
const upsertCartItem = vi.hoisted(() => vi.fn())
const useAuth = vi.hoisted(() => vi.fn())
vi.mock('../../lib/cart', () => ({
  upsertCartItem,
  // PageLayout's navbar consumes these after Task 8; harmless here.
  listCart: vi.fn(async () => []),
  CART_CHANGED_EVENT: 'woodworks:cart-changed',
}))
vi.mock('../../auth/AuthProvider', () => ({ useAuth }))
```

`beforeEach`: `useAuth.mockReturnValue({ user: { email: 'a@b.com' }, loading: false })`; `upsertCartItem.mockReset(); upsertCartItem.mockResolvedValue()`.

Update the router helper: replace the ORDER NOW stub with a `/login` route that renders `LOGIN STUB {useLocation().state?.from?.pathname ?? 'none'}`. Rewrite the ORDER NOW test:

1. `ADD TO CART upserts the chosen quantity and flips to ADDED ✓` — click `Increase quantity` (value 2), click `ADD TO CART`; expect `upsertCartItem` called with `'wooden-dining-table', 2`; expect `await screen.findByText('ADDED ✓')`.
2. `signed-out ADD TO CART routes to login carrying the product location` — `useAuth` returns `{ user: null, loading: false }`; click `ADD TO CART`; expect `LOGIN STUB /product/wooden-dining-table`; `upsertCartItem` not called.
3. `upsert failure shows the raw message under the button` — `upsertCartItem.mockRejectedValue(new Error('network down'))`; click; expect `findByRole('alert')` with `network down`, page still on product details.
4. Keep the existing copy/price/stepper/CUSTOMIZE/related/unknown-id tests; the button-name assertions change only where they reference ORDER NOW.

- [ ] **Step 2: RED — extend `LoginPage.test.jsx`**

Add `/cart` and `/product/wooden-dining-table` stubs to the router. Add:

1. `returns to an object state.from after sign-in` — `initialEntries={[{ pathname: '/login', state: { from: { pathname: '/cart' } } }]}`; sign in successfully → expect `CART STUB`.
2. `returns to a string state.from after sign-in` — `state: { from: '/cart' }` → expect `CART STUB`.

Keep the existing `valid credentials ... navigate to /home` test (no `state.from` → `/home`).

- [ ] **Step 3: Run to verify RED**

Run: `npm run test -- src/pages/ProductDetailsPage src/pages/LoginPage`
Expected: FAIL — still ORDER NOW, still `/home`.

- [ ] **Step 4: Implement**

`ProductDetailsPage.jsx`:
- Imports: `useLocation`, `useAuth`, `upsertCartItem`; drop `createOrder`.
- State: `added`, `error`; a `useRef` for the reset timer with a `useEffect` unmount cleanup.
- Handler: clear error; `if (!user) { navigate('/login', { state: { from: location } }); return }`; `try { await upsertCartItem(product.id, quantity); setAdded(true); timer.current = setTimeout(() => setAdded(false), 1500) } catch (e) { setError(e.message) }`.
- Button: `onClick={handleAddToCart}`, label `{added ? 'ADDED ✓' : 'ADD TO CART'}`.
- Under the actions: `{error && <p className="details__error" role="alert">{error}</p>}`.
- `.details__error` uses `--color-error`, `--fs-14`, `--lh-21`, `--w-600`, `margin: 0`.
- Update the page's doc comment line `ORDER NOW / CUSTOMIZE` to `ADD TO CART / CUSTOMIZE`.

`LoginPage.jsx`: `const location = useLocation()`; after successful sign-in resolve `const from = location.state?.from; const target = typeof from === 'string' ? from : (from?.pathname ?? '/home'); navigate(target)`.

`orders.js`: delete `orderCounter` and `createOrder` (and their `@deprecated` comment). Delete the `createOrder` describe block from `orders.test.js`; remove it from the import list.

- [ ] **Step 5: Run to verify GREEN**

Run: `npm run test -- src/pages/ProductDetailsPage src/pages/LoginPage src/lib/orders.test.js`
Expected: PASS (no ORDER NOW/createOrder references remain — `grep -r "ORDER NOW\|createOrder" src` is empty).

- [ ] **Step 6: Gate + commit**

Full suite + lint green; record the count.

```bash
git add src/pages/ProductDetailsPage src/pages/LoginPage src/lib/orders.js src/lib/orders.test.js
git commit -m "feat: add to cart from product details with login return-to"
```

### Task 5: `/cart` page + stepper removal

**Files:**
- Modify: `src/components/QuantityStepper/QuantityStepper.jsx`
- Modify: `src/components/QuantityStepper/QuantityStepper.test.jsx`
- Create: `src/pages/CartPage/CartPage.jsx`
- Create: `src/pages/CartPage/CartPage.css`
- Create: `src/pages/CartPage/CartPage.test.jsx`
- Modify: `src/App.jsx` (import + `/cart` route)

**Interfaces:**
- Consumes: `useAuth()`, `listCart`, `setQuantity`, `removeCartItem`, `placeOrder` (Task 3), `formatPrice`, `QuantityStepper`, `PageLayout`, `Button`.
- Produces: signed-in `/cart` with rows, stepper, totals, SUBMIT ORDER; guests redirected to `/login` with `state.from = '/cart'`; `QuantityStepper` gains optional `onRemove` (called when − is pressed at value 1).

- [ ] **Step 1: RED — `QuantityStepper.test.jsx`**

Add: `minus at the minimum calls onRemove when provided` — render `<QuantityStepper value={1} onChange={onChange} onRemove={onRemove} />`, click `Decrease quantity`; expect `onRemove` called and `onChange` not called. Existing minimum test (no `onRemove`) stays.

- [ ] **Step 2: RED — write `src/pages/CartPage/CartPage.test.jsx`**

Hoisted mocks:

```js
const listCart = vi.hoisted(() => vi.fn())
const setQuantity = vi.hoisted(() => vi.fn())
const removeCartItem = vi.hoisted(() => vi.fn())
const placeOrder = vi.hoisted(() => vi.fn())
const useAuth = vi.hoisted(() => vi.fn())
vi.mock('../../lib/cart', () => ({
  listCart,
  setQuantity,
  removeCartItem,
  placeOrder,
  CART_CHANGED_EVENT: 'woodworks:cart-changed', // navbar badge, Task 8
}))
vi.mock('../../auth/AuthProvider', () => ({ useAuth }))
```

`beforeEach`: signed-in `useAuth`; every mock reset; `listCart`/`setQuantity`/`removeCartItem` resolve `undefined`; `placeOrder` resolves `CART_ORDER`.

Fixtures: `LINES = [{ product: PRODUCTS[0], quantity: 2, lineTotal: 10000 }, { product: PRODUCTS[1], quantity: 1, lineTotal: 2500 }]` (import `PRODUCTS` from `../../data/products`); `CART_ORDER = { id: 7, number: 'WW-0007', furniture: 'Cart order', wood: null, status: 'Pending', eta: '1-3 days', createdAt: '2026-11-20T00:00:00.000Z', items: [...], total: 12500 }`.

Render helper: `MemoryRouter` with `/cart` → `CartPage`, `/login` → stub showing `state.from`, `/catalog` → `CATALOG STUB`, `/order-confirmation` → stub showing `state?.order?.number ?? 'none'`; `initialEntries={['/cart']}`.

Tests:

1. `guest is redirected to login carrying /cart` — `useAuth` returns `{ user: null, loading: false }` → `LOGIN STUB /cart`; `listCart` not called.
2. `empty cart shows the pinned line and a catalog link` — `listCart` resolves `[]` → `Your cart is empty.`; link `Browse the catalog` with `href="/catalog"`.
3. `renders rows, unit prices, line totals, and the grand total` — expect both names, `₱5,000` (unit) and `₱10,000` (line), `₱2,500` (unit and line), `Total: ₱12,500`.
4. `plus steps a row and persists the new quantity` — within the first row, click `Increase quantity` → `setQuantity('wooden-dining-table', 3)`.
5. `minus on a quantity of 1 removes the row` — within the chair row, click `Decrease quantity` → `removeCartItem('classic-wooden-chair')`.
6. `Remove link deletes the row` — click the first `Remove` → `removeCartItem('wooden-dining-table')`.
7. `SUBMIT ORDER places the order and navigates with it` — click → `placeOrder` called; `findByText('WW-0007')`.
8. `SUBMIT ORDER is disabled while the order is in flight` — `placeOrder` returns a never-resolving promise; click; expect the button `toBeDisabled()`.
9. `submit failure shows the raw message and stays on the cart` — `placeOrder` rejects `new Error('network down')`; expect `findByRole('alert')` text and `WW-0007` absent.
10. `mutation failure shows the raw message and keeps the rows` — `setQuantity.mockRejectedValue(new Error('update failed'))`; click Increase; expect alert `update failed` and the row names still present.
11. `load failure shows the message and RETRY reloads` — `listCart.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce([])`; expect alert; click `Retry` → `Your cart is empty.`.

- [ ] **Step 3: Run to verify RED**

Run: `npm run test -- src/components/QuantityStepper src/pages/CartPage`
Expected: FAIL — no `CartPage`, no `onRemove`.

- [ ] **Step 4: Implement**

`QuantityStepper.jsx`: signature `({ value, onChange, onRemove })`; `decrement` = `if (value > 1) onChange(value - 1); else if (onRemove) onRemove()`.

`CartPage.jsx`:
- Hooks first (no conditional hooks): `useAuth`, `useNavigate`, `const [fetch, setFetch] = useState({ status: 'loading', lines: [], message: '' })`, `const [actionError, setActionError] = useState('')`, `const [submitError, setSubmitError] = useState('')`, `const [submitting, setSubmitting] = useState(false)`.
- `load = useCallback(() => { listCart().then((lines) => setFetch({ status: 'ready', lines, message: '' })).catch((e) => setFetch({ status: 'error', lines: [], message: e.message })) }, [])`; `useEffect` calls `load()` only when `user` is truthy; depend on `[user, load]`.
- After hooks: `if (loading) return null`; `if (!user) return <Navigate to="/login" state={{ from: '/cart' }} replace />`.
- `changeQuantity(productId, quantity)` / `remove(productId)`: clear `actionError`, `await` the lib call, `load()`, catch → `setActionError(e.message)`.
- `handleSubmit`: clear `submitError`, `setSubmitting(true)`, `try { const order = await placeOrder(); navigate('/order-confirmation', { state: { order } }) } catch (e) { setSubmitError(e.message) } finally { setSubmitting(false) }`.
- Markup: `PageLayout` → `<section className="cart">` with `<h1 className="cart__title">Your Cart</h1>`; loading → `null`; error → `<p className="cart__error" role="alert">{message}</p>` + `<button type="button" className="cart__retry" onClick={load}>Retry</button>`; empty → `<p className="cart__empty">Your cart is empty.</p>` + `<Link to="/catalog" className="cart__catalog-link">Browse the catalog</Link>`; ready → list of rows (`name`, `formatPrice(product.price)`, `<QuantityStepper value={quantity} onChange={(next) => changeQuantity(product.id, next)} onRemove={() => remove(product.id)} />`, `formatPrice(lineTotal)`, `<button type="button" className="cart__remove" onClick={() => remove(product.id)}>Remove</button>`), then `Total: {formatPrice(grandTotal)}` where `grandTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)`, the two error lines (`role="alert"`, tokens only), and `<Button variant="filled" disabled={submitting} onClick={handleSubmit}>SUBMIT ORDER</Button>`.
- `CartPage.css`: tokens only; title mirrors `.my-orders__title`; rows/panels mirror `.my-orders__card` (`--color-surface`, `--color-border`, `--radius-card`, `--gap-lg`); total uses `--fs-18`/`--w-700`; errors `--color-error`; retry/remove buttons mirror `.my-orders__retry`.

`App.jsx`: import `CartPage`; add `<Route path="/cart" element={<CartPage />} />` next to the other store routes with a comment that CartPage owns its auth guard (so it can carry `state.from`).

- [ ] **Step 5: Run to verify GREEN**

Run: `npm run test -- src/components/QuantityStepper src/pages/CartPage`
Expected: PASS.

- [ ] **Step 6: Gate + commit**

Full suite + lint green; record the count.

```bash
git add src/components/QuantityStepper src/pages/CartPage src/App.jsx
git commit -m "feat: cart page with quantity editing and submit order"
```

### Task 6: Order confirmation cart breakdown

**Files:**
- Modify: `src/pages/OrderConfirmationPage/OrderConfirmationPage.jsx`
- Modify: `src/pages/OrderConfirmationPage/OrderConfirmationPage.test.jsx`
- Modify: `src/pages/OrderConfirmationPage/OrderConfirmationPage.css`

**Interfaces:**
- Consumes: `OrderRecord` from Tasks 2–3 (router state or the `listOrders` fallback).
- Produces: cart orders render item lines + total; custom orders render exactly today's fields.

- [ ] **Step 1: RED — extend `OrderConfirmationPage.test.jsx`**

Add a `CART_ORDER` fixture: `{ id: 7, number: 'WW-0007', furniture: 'Cart order', wood: null, status: 'Pending', eta: '1-3 days', createdAt: '...', items: [{ productId: 'classic-wooden-chair', name: 'Classic Wooden Chair', price: 2500, quantity: 2, lineTotal: 5000 }, { productId: 'study-table', name: 'Study Table', price: 4500, quantity: 1, lineTotal: 4500 }], total: 9500 }`.

1. `cart order renders each line with quantity and line total, plus the total` — render via router state; expect `Classic Wooden Chair ×2 — ₱5,000`, `Study Table ×1 — ₱4,500`, `Total: ₱9,500`, `Order #: WW-0007`, `Status: Pending`, `Estimated Response: 1-3 days`, and `queryByText(/^Furniture:/)` absent.
2. `cart order uses the generic submitted line` — expect `Your order has been successfully submitted.` and the custom copy absent.
3. `direct visit fallback renders a cart order's breakdown` — `listOrders` resolves `[CART_ORDER]`; expect the item lines and total.
4. Existing custom-order tests stay untouched and must pass unchanged.

- [ ] **Step 2: Run to verify RED**

Run: `npm run test -- src/pages/OrderConfirmationPage`
Expected: FAIL — cart fixtures render `Furniture: Cart order`, no item lines/total.

- [ ] **Step 3: Implement**

- Import `formatPrice`.
- Sub-line: `order.items ? 'Your order has been successfully submitted.' : 'Your custom furniture request has been successfully submitted.'`
- Panel: keep `Order #: `. Then branch:
  - `order.items`: `<ul className="confirmation__items">{order.items.map((item) => <li key={item.productId}>{item.name} ×{item.quantity} — {formatPrice(item.lineTotal)}</li>)}</ul>` followed by `<p>Total: {formatPrice(order.total)}</p>`.
  - else: `<p>Furniture: {order.furniture}</p>`.
  Then `Status:` and `Estimated Response:` unchanged for both paths.
- CSS: `.confirmation__items { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--gap-xs); }` (tokens only).

- [ ] **Step 4: Run to verify GREEN**

Run: `npm run test -- src/pages/OrderConfirmationPage`
Expected: PASS (every pre-existing test still green).

- [ ] **Step 5: Gate + commit**

Full suite + lint green.

```bash
git add src/pages/OrderConfirmationPage
git commit -m "feat: cart item breakdown on order confirmation"
```

### Task 7: My Orders cart cards

**Files:**
- Modify: `src/pages/MyOrdersPage/MyOrdersPage.jsx`
- Modify: `src/pages/MyOrdersPage/MyOrdersPage.test.jsx`
- Modify: `src/pages/MyOrdersPage/MyOrdersPage.css`

**Interfaces:**
- Consumes: `OrderRecord[]` from `listOrders()`.
- Produces: cards for cart orders list `name ×quantity` + `Total:`; custom cards unchanged.

- [ ] **Step 1: RED — extend `MyOrdersPage.test.jsx`**

Add `CART_ORDER` (same shape as Task 6) and:

1. `cart order card lists item names with quantities and the total` — `listOrders` resolves `[CART_ORDER]`; expect `Order #: WW-0007`, `Classic Wooden Chair ×2`, `Study Table ×1`, `Total: ₱9,500`, `Pending`, `1-3 days`, the formatted date, and no `Furniture: ` line.
2. `custom order cards are unchanged` — the existing two custom fixtures still render furniture names and no `Total:` line.
3. Existing empty/error/retry tests stay untouched.

- [ ] **Step 2: Run to verify RED**

Run: `npm run test -- src/pages/MyOrdersPage`
Expected: FAIL — cart card renders `Cart order` and no breakdown.

- [ ] **Step 3: Implement**

- Import `formatPrice`.
- Inside each card, after the number: `order.items ? (<><ul className="my-orders__items">{order.items.map((item) => <li key={item.productId}>{item.name} ×{item.quantity}</li>)}</ul><p className="my-orders__card-total">Total: {formatPrice(order.total)}</p></>) : (<p className="my-orders__card-furniture">{order.furniture}</p>)`.
- Keep status/eta/date lines for both paths.
- CSS: `.my-orders__items { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--gap-xs); }` and `.my-orders__card-total { margin: 0; font-size: var(--fs-16); line-height: var(--lh-24); font-weight: var(--w-700); color: var(--color-text); }`.

- [ ] **Step 4: Run to verify GREEN**

Run: `npm run test -- src/pages/MyOrdersPage`
Expected: PASS.

- [ ] **Step 5: Gate + commit**

Full suite + lint green.

```bash
git add src/pages/MyOrdersPage
git commit -m "feat: cart breakdown on my orders cards"
```

### Task 8: Cart nav link + item-count badge

**Files:**
- Create: `src/components/NavBar/useCartCount.js`
- Modify: `src/components/NavBar/NavBar.jsx`
- Modify: `src/components/NavBar/NavBar.css`
- Modify: `src/components/NavBar/NavBar.test.jsx`

**Interfaces:**
- Consumes: `useAuth()`, `listCart()`, `CART_CHANGED_EVENT` (Task 3).
- Produces: `useCartCount() -> number` — `0` for guests/errors/empty cart; refreshes on `CART_CHANGED_EVENT`; NavBar gains a `Cart` link with a badge when the count is positive.

- [ ] **Step 1: RED — extend `NavBar.test.jsx`**

Add hoisted mocks:

```js
const listCart = vi.hoisted(() => vi.fn())
vi.mock('../../lib/cart', () => ({ listCart, CART_CHANGED_EVENT: 'woodworks:cart-changed' }))
```

`beforeEach`: `listCart.mockReset(); listCart.mockResolvedValue([])`.

1. Update `renders the 4 nav links` → `renders the 5 nav links`: add `Cart` → `href="/cart"`.
2. `signed-in badge shows the number of cart rows` — `listCart` resolves two lines; render logged-in; expect `await screen.findByLabelText('2 items in cart')` (badge) with text `2`.
3. `guest sees no badge` — `listCart` resolves two lines; render logged out; expect `queryByLabelText(/item.* in cart/)` absent (and `listCart` not called).
4. `badge refreshes on the cart-changed event` — render logged-in with `listCart` resolving one line, then two; `await findByLabelText('1 item in cart')`; `act(() => window.dispatchEvent(new Event('woodworks:cart-changed')))`; expect `await findByLabelText('2 items in cart')`.
5. `a failed count fetch shows no badge` — `listCart.mockRejectedValue(new Error('down'))`; render logged-in; wait for the profile button, expect no badge.

- [ ] **Step 2: Run to verify RED**

Run: `npm run test -- src/components/NavBar`
Expected: FAIL — no Cart link/badge.

- [ ] **Step 3: Implement**

`useCartCount.js`:

```js
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { listCart, CART_CHANGED_EVENT } from '../../lib/cart'

export default function useCartCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setCount(0)
      return undefined
    }
    let active = true
    const refresh = () => {
      listCart()
        .then((lines) => { if (active) setCount(lines.length) })
        .catch(() => { if (active) setCount(0) })
    }
    refresh()
    window.addEventListener(CART_CHANGED_EVENT, refresh)
    return () => {
      active = false
      window.removeEventListener(CART_CHANGED_EVENT, refresh)
    }
  }, [user])

  return count
}
```

`NavBar.jsx`: append `{ label: 'Cart', to: '/cart' }` to `NAV_LINKS`; `const cartCount = useCartCount()`; render the badge inside the Cart link only when `cartCount > 0`:

```jsx
{to === '/cart' && cartCount > 0 && (
  <span
    className="navbar__badge"
    aria-label={`${cartCount} ${cartCount === 1 ? 'item' : 'items'} in cart`}
  >
    {cartCount}
  </span>
)}
```

`NavBar.css`: `.navbar__badge { margin-left: var(--gap-xs); font-size: var(--fs-14); font-weight: var(--w-700); color: var(--color-primary); }` (tokens only).

- [ ] **Step 4: Run to verify GREEN**

Run: `npm run test -- src/components/NavBar`
Expected: PASS.

- [ ] **Step 5: Gate + commit**

Full suite + lint green. Confirm App tests still pass (the HomePage navbar now calls `listCart`; the hook swallows the mocked-seam rejection and shows no badge).

```bash
git add src/components/NavBar
git commit -m "feat: cart nav link with item count badge"
```

### Task 9: Merge, deploy, live acceptance

**Files:**
- Modify: `.superpowers/deploy-smoke.mjs` (gitignored smoke tooling — add the cart flow)

**Interfaces:**
- Consumes: everything above, deployed to Pages with `0002_cart.sql` applied.
- Produces: live proof of the full cart + checkout path and RLS isolation.

- [ ] **Step 1: Pre-merge gate**

`npm run test` (full suite, record the count) + `npm run lint` clean on `feat/cart-checkout`. Confirm the latest `migrate` run applied `0002_cart.sql`.

- [ ] **Step 2: Merge + deploy**

Merge `feat/cart-checkout` into `main` with `--no-ff`, push, and `gh run watch` until `migrate`, `build`, and `deploy` are green.

- [ ] **Step 3: Live smoke** (fresh throwaway accounts, one-shot emails; password `Demo-Wood-2026`; headless Playwright Edge channel)

1. Account A signs up → lands signed in.
2. A opens a product, sets quantity 2, clicks `ADD TO CART` → button flips to `ADDED ✓`; A adds a second product (quantity 1) → nav badge shows `2`.
3. `/cart` shows 2 rows, correct unit/line totals and `Total:` (2× + 1× arithmetic), and survives a refresh.
4. Click `+` on one row → total and badge update; click `−` down to 1 then `−` again → row disappears; add it back before submitting.
5. `SUBMIT ORDER` → confirmation shows `Order #: WW-####`, both item lines, and the total; refresh the confirmation → still renders (fallback fetch).
6. `/my-orders` shows the cart card with item names, quantities, total, status, eta, date; refresh → still there.
7. Cart is empty after submit (`/cart` shows `Your cart is empty.`); nav badge is gone.
8. Account B signs up → `/cart` empty, `/my-orders` shows `No orders yet.` — **RLS proven live: B sees none of A's cart or orders.**
9. Regression: A's `CUSTOMIZE` flow still submits a custom order; its confirmation and My Orders card render the old fields (no item breakdown).
10. Guest guard: log out, deep-link `/cart` → login; sign in → lands back on `/cart`, not `/home`.

Record results; report to the user.

- [ ] **Step 4: Finish.** Update the README/roadmap wave status; mark plan checkboxes; delete the branch worktree if one was used; `finishing-a-development-branch` (delete `feat/cart-checkout`).
