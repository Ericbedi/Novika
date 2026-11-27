-- Livreurs, tarifs de livraison et affectation des commandes (accès uniquement via fonctions protégées par secret).
create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text not null,
  city text,
  default_fee integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.delivery_rates (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.shops(id) on delete cascade,
  city text not null,
  fee integer not null check (fee >= 0),
  created_at timestamptz not null default now()
);
create unique index if not exists delivery_rates_store_city on public.delivery_rates (store_id, lower(city));
alter table public.riders enable row level security;
alter table public.delivery_rates enable row level security;
alter table public.orders add column if not exists rider_id uuid references public.riders(id) on delete set null;
alter table public.orders add column if not exists rider_fee integer not null default 0;
alter table public.orders add column if not exists failure_reason text;
