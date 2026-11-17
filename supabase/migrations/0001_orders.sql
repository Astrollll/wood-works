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
