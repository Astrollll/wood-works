-- Wave 3: persistent per-user cart + cart-order columns on orders.
-- RLS model is unchanged: anon key + row-level policies, own rows only.

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
