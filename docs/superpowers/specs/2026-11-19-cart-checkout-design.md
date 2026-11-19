# Cart + Checkout — design spec

Date: 2026-11-19
Status: design approved in chat; this document is the record.

## Purpose

Replace the fake "ORDER NOW" mock flow with a real multi-item cart and
checkout. Customer adds products (with quantities) to a per-user cart,
reviews it on one cart page, and submits one multi-item order. Orders,
cart, and My Orders all persist in Supabase under the existing RLS model.

## Approved decisions

- **D1** — "ORDER NOW" is **replaced** by "ADD TO CART". The mock
  `createOrder` path is deleted (it is already marked `@deprecated`).
- **D2** — Cart and checkout require a signed-in user. Guests who hit
  `/cart` are redirected to `/login` (after which they return to `/cart`).
- **D3** — One page does both: `/cart` lists items, shows quantities, and
  carries the SUBMIT ORDER button. No separate checkout route.
- **D4** — Quantities are supported, with a `+`/`−` stepper in the cart.
- **D5** — Products remain the hardcoded catalog in `src/data/products.js`.
  `cart_items.product_id` references that stable `id` string. Order line
  items snapshot `{product_id, name, price, quantity}` at submit time so
  history survives catalog edits.

## Data (new migration `0002_cart.sql`)

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
```

`orders` gains two nullable columns (existing custom orders stay valid):

```sql
alter table public.orders
  add column items jsonb,            -- null for custom orders
  add column total numeric(10,2);    -- null for custom orders
```

Line item shape stored in `orders.items`:

```json
[ { "product_id": "classic-wooden-chair", "name": "Classic Wooden Chair",
    "price": 2500, "quantity": 2 } ]
```

Custom orders (the existing form) are untouched: `items` is `null`,
`total` is `null`, `furniture_type`/`notes` columns keep working.

## Library (`src/lib/cart.js`, new)

Mirrors `orders.js` conventions: snake_case at the DB seam, camelCase
shapes to pages, raw Supabase errors thrown.

- `upsertCartItem(productId, quantity)` — insert or, if the (user,
  product) row exists, set `quantity`. Upsert with
  `onConflict: 'user_id,product_id'`.
- `listCart()` — resolves the user's rows joined with the local catalog
  into `[{ product, quantity, lineTotal }]`, sorted by `created_at`.
- `setQuantity(productId, quantity)` — update; quantity < 1 removes the
  row.
- `removeCartItem(productId)`
- `placeOrder()` — the checkout transaction, executed client-side as a
  sequence (Supabase JS has no multi-statement transactions over REST):
  1. `listCart()` (single source of truth for what to submit).
  2. Insert `orders` row with `items` snapshot + `total`,
     `furniture_type: 'Cart order'`, `notes: null`.
  3. Delete all cart rows for the user.
  4. If step 3 fails after step 2 succeeded, delete the orphan order
     row before rethrowing (best effort).
  Resolves the saved order row (display shape) for the confirmation
  screen.

`orders.js`: `createOrder` + `orderCounter` deleted; `toOrder` extended
with `items`/`total` mapping (null-safe); `listOrders` and `insertOrder`
otherwise unchanged.

## Pages

### ProductDetailsPage (change)

- "ORDER NOW" → "ADD TO CART" (existing filled `Button`, same position,
  `QuantityStepper` already present).
- Handler: if no signed-in user → `navigate('/login', { state: { from:
  location } })`. Else `upsertCartItem(product.id, quantity)`.
  On success the button label flips to "ADDED ✓" for 1.5s (visual
  feedback; no toast infrastructure exists).
  On error → inline error line under the button (role=alert, same
  `--color-error` pattern as CustomOrderPage).
- CUSTOMIZE button unchanged.

### CartPage (new, `/cart`)

- Guard: not signed in → `Navigate to="/login"` with `state.from =
  "/cart"` (login already returns to `state.from`; no login changes).
- Loading: single fetch-state object `{ status: 'loading' | 'ready' |
  'error', lines, message }`, same react-hooks-safe pattern as
  MyOrdersPage (setState only in promise continuations).
- Empty: "Your cart is empty." + link to `/catalog` (pinned copy, same
  style as My Orders empty state).
- Rows: product name, unit price, quantity stepper (+/−; − at 1 removes
  the row), line total, remove link.
- Footer: grand total; SUBMIT ORDER (filled `Button`, disabled in
  flight); on submit `placeOrder()` → `navigate('/order-confirmation',
  { state: { order } })`.
- Error state: message + RETRY button.

### OrderConfirmationPage (extend)

- If `order.items` present: render one line per item
  (`name ×quantity — lineTotal`) above the total.
- If `order.items` null: render today's custom-order fields (unchanged).
- Both paths keep `Order #: WW-####`, status, eta.

### MyOrdersPage (extend)

- Order card: when `order.items` present, list item names with
  quantities and show `total` where the custom fields used to sit.
- Custom orders render exactly as they do today.

### App routing

- Add `CartPage` route at `/cart`.
- Nav: add a cart link with an item-count badge. The badge count is
  fetched once per signed-in user in the layout (a `useCartCount` hook,
  refreshed after add/remove via a lightweight event or simple refetch on
  navigation); guest or error → no badge. If the layout-level fetch
  proves awkward against the existing PageLayout, the badge is dropped
  and the cart is a plain nav link — decide during implementation,
  prefer the badge.

## Testing

- `cart.test.js`: upsert semantics (insert then increment), listCart join
  shape, setQuantity boundary (removes at 0), removeCartItem, placeOrder
  success (order inserted with snapshot + total, cart cleared),
  placeOrder partial failure (orphan order deleted, error thrown).
  Seam-mocked Supabase chainable-thenable builder, same style as
  `orders.test.js`.
- `orders.test.js`: `createOrder` tests removed; `toOrder`/`listOrders`
  null-items cases added.
- `ProductDetailsPage.test.jsx`: "ORDER NOW" tests become
  "ADD TO CART" tests (signed-out → login redirect; signed-in →
  upsert called with chosen quantity).
- `CartPage.test.jsx`: empty state, row render, quantity stepper,
  remove, grand total, submit → navigation with order state, error +
  retry, guest redirect.
- `OrderConfirmationPage.test.jsx`: multi-item breakdown + total;
  custom-order path unchanged (existing tests must keep passing).
- `MyOrdersPage.test.jsx`: card with items + total; custom card
  unchanged.
- Gate: full suite green, lint clean (count expected above the current
  152 baseline; exact number reported at implementation).
- Live smoke (fresh throwaway accounts, one-shot emails): sign in →
  add 2 different products (one ×2) → `/cart` shows 2 rows, correct
  totals → SUBMIT → confirmation shows `WW-####` + both lines + total →
  refresh survives → My Orders shows the breakdown → second account
  sees empty cart and no orders (RLS) → CUSTOMIZE flow still works
  (regression guard).

## Out of scope

- Payment/shipping (no money moves; status stays "Pending").
- Guest carts, cart sync, cart expiry.
- Product deletion from the catalog (catalog is hardcoded, never
  mutated at runtime).
- Canceling orders (candidate for a later wave).
