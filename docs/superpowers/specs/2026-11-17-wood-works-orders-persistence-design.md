# Wood Works — Custom Order Persistence (Wave 2) Design Spec

## 1. Purpose

Wave 1 made authentication real: screens 01 (login), 02 (signup), 06/09 (success cards), session-aware route guards, and the profile popover logout, validated by a 7/7 live smoke. Wave 2 makes the custom-order flow real. A signed-in user submits the Figma screen 13 form; the order lands in a Supabase `orders` table that only they can read; the confirmation screen (12) shows exactly what was saved; My Orders (a navbar link Figma never designed a screen for) lists their orders and survives refresh. Row-level security is proven live with a second account.

The audience is unchanged from wave 1: classmates demoing the deployed site. Every account sees only its own orders.

## 2. Locked decisions (brainstorm, 2026-11-17)

- **D1 — Scope: orders only.** Catalog and product data stay mock (wave-1 posture). A `products` table is deferred; revisit when a screen needs live product data.
- **D2 — Reference image: Supabase Storage deferred to wave 3.** The column `reference_image_url` exists, nullable, unused this wave. The "+ Upload Reference Image." button stays non-functional (wave-1 pattern: mock things stay mock, flagged).
- **D3 — Access path.** `src/lib/orders.js` evolves from mock factory to the real API module over the seam client (`src/lib/supabase.js`). Pages never import Supabase directly; tests mock the seam, never the library.
- **D4 — Order numbers.** Global database sequence, `WW-` + zero-padded digits, unique. Per-user counters rejected: complexity without benefit when RLS already hides other users' rows.
- **D5 — RLS rule (locked in the wave-1 spec §5).** Every table ships with RLS ON and `auth.uid()` policies in the same migration. This wave adds **insert + select policies only** — no update/delete policies, because no UI performs either. Fewer policies than "manage own orders" is deliberate tightness.
- **D6 — No admin tooling.** Every order stays `status = 'Pending'` with the Figma-pinned eta copy (`1-3 days`). Status transitions are a later wave if they ever matter.
- **D7 — Dimensions and quantity stay `text`.** The form validates `isFilled` only; the database stores what was typed, with no invented parsing or numeric validation. Numeric fields are a later wave if needed.

## 3. Screen / route surface

| Screen / route | Today | Wave 2 |
|---|---|---|
| 13 `/custom-order` | mock `createOrder()` module counter | real insert; the returned row is routed to confirmation; submit disabled while in flight |
| 12 `/order-confirmation` | reads router state only (refresh = dead screen) | router state primary; fallback fetches the user's latest order |
| `/my-orders` | stub, "No orders yet." | real list of the user's orders; empty state keeps the pinned copy |
| 01/02/06/09, 03–09, `/home`, `/catalog`, `/product/:id` | real / mock per wave 1 | unchanged |

## 4. Data & security

Migrations live in the repo (`supabase/migrations/*.sql`) and are applied by CI, not by hand: the Pages workflow gains a `migrate` job (Supabase CLI `link` + `db push`, using a `SUPABASE_ACCESS_TOKEN` Actions secret) and the `build` job depends on it — so the table exists before any code that queries it deploys, and the migration shows up as a GitHub check (`migrate`) beside `build` and `deploy`. The migration is applied exactly once per file (the CLI tracks applied migrations).

```sql
create sequence public.orders_number_seq start 1;

create table public.orders (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid not null
    references auth.users (id) on delete cascade
    default auth.uid(),
  order_number text not null unique
    default ('WW-' || lpad(nextval('public.orders_number_seq')::text, 4, '0')),
  furniture_type text not null,
  wood_type text not null,
  length text not null,
  width text not null,
  height text not null,
  quantity text not null,
  notes text,
  reference_image_url text,
  status text not null default 'Pending',
  eta text not null default '1-3 days'
);

alter table public.orders enable row level security;

create policy "insert own order" on public.orders
  for insert to authenticated with check (auth.uid() = user_id);

create policy "select own orders" on public.orders
  for select to authenticated using (auth.uid() = user_id);

create index orders_user_id_idx on public.orders (user_id);
```

Notes:

- `user_id` defaults to `auth.uid()` and the insert policy re-checks it with `with check`, so the client cannot create a row for another user.
- `on delete cascade` from `auth.users`: deleting an account removes its orders.
- The `user_id` index matches the RLS filter pattern.
- The sequence is global; numbers are visible only to the row's owner (RLS), so a global counter leaks nothing.
- Frontend env is unchanged: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. The anon key stays public-safe: data access is protected by RLS.

## 5. Behavior

### 5.1 `src/lib/orders.js`

- `insertOrder(values)` maps the six form fields plus `notes` into the insert payload, appends `.select().single()`, and resolves the saved row (order number assigned by the database sequence). It rejects with the raw Supabase error.
- `listOrders()` selects the user's rows ordered by `created_at` descending (newest first) and resolves the array.
- The mock `createOrder`, `DEFAULT_ORDER`, and the module counter are deleted; order numbers come from the database now.

### 5.2 CustomOrderPage (screen 13)

- Validation is unchanged: `isFilled` per field, inline errors, no submit on failure.
- Success: `insertOrder(values)` → `navigate('/order-confirmation', { state: { order } })` with the **returned row** — one round-trip, and the confirmation shows what actually saved.
- Failure: the raw error message renders inline and the page stays. No fake success.
- The submit button is disabled while the insert is in flight. Wave 1 skipped double-click guards because the worst case was a navigation glitch; here a double-click creates **two real rows** — data damage — so the guard ships this wave.

### 5.3 OrderConfirmationPage (screen 12)

- Router state stays primary; existing tests keep passing.
- State missing (direct visit or refresh): fetch the user's latest order — `listOrders()[0]` — and render it.
- Fallback fetch fails: inline error on the page.

### 5.4 My Orders (`/my-orders`)

- Order cards: order number, furniture type, status, eta, created date. The date renders from `created_at` as a medium locale date (e.g. "Nov 17, 2026" — `dateStyle: 'medium'`). Built from the store card language and existing design tokens only — no raw CSS values.
- Empty state: pinned copy "No orders yet."
- Error state: inline line with a Retry action.
- Figma never designed this screen (the navbar link exists, no screen does), so the layout has design freedom but must hold the store design language.

## 6. Testing

Iron law unchanged: RED→GREEN per behavior; whole suite green + lint before every commit; conventional commits; milestones pushed.

- Tests mock the seam (`src/lib/supabase`); never the library.
- `orders.test.js` rework: insert payload mapping, single-row return, newest-first list, error propagation.
- CustomOrderPage: success routes with the returned row; failure renders inline and stays; double-click performs exactly one insert; existing validation tests unchanged.
- OrderConfirmationPage: state-present path unchanged; state missing → latest-order fallback renders; fallback failure → inline error.
- My Orders: rows render; empty copy; error state with retry.
- Gate estimate: 142 → ~152 tests; the exact count is pinned in the implementation plan.
- Acceptance = live headless smoke (Playwright, Edge channel) after migration + merge + deploy:
  1. Account A places an order → confirmation shows the returned row with a database-assigned `WW-####`.
  2. Refresh the confirmation → the order still renders (fallback fetch works).
  3. My Orders lists it; refresh → it survives.
  4. Account B's My Orders is empty — **RLS proven live**: B sees none of A's rows.
  5. The migration job (`migrate`) gates the build job in the same workflow — code that queries the table cannot deploy before the table exists.

## 7. Implementation order

1. `chore:` migration file `supabase/migrations/0001_orders.sql` + `supabase/config.toml` committed; Pages workflow gains the `migrate` job (access token as an Actions secret); the user creates the token; CI applies the migration on push.
2. `chore:` `orders.js` API over the seam (RED→GREEN).
3. `feat:` real custom-order submit — success, failure, double-click guard (RED→GREEN each behavior).
4. `feat:` confirmation fallback (RED→GREEN).
5. `feat:` My Orders real — rows, empty, error (RED→GREEN).
6. Merge to `main` → Pages deploy → live smoke.

Branch: `feat/orders-persistence` off `main`.

## 8. Out of scope (wave 2)

Supabase Storage and image upload (wave 3); a `products` table and live catalog data; order status transitions and admin tooling; order cancel/update/delete UI; changes to screens 03–09 (wave 5, real reset); mobile/responsive layout (per the recreation spec §11); pagination (the list is small; add it when it hurts).
