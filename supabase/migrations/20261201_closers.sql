-- Closeuses : liste par boutique, affectation aux commandes, performance et commission
create table if not exists public.closers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  country text,
  commission integer not null default 0 check (commission >= 0 and commission <= 1000000),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists closers_store_idx on public.closers(store_id);
alter table public.closers enable row level security;
alter table public.orders add column if not exists closer_id uuid references public.closers(id) on delete set null;

create or replace function public.closers_list_server(p_secret text, p_slug text, p_from date, p_to date) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  return jsonb_build_object('success', true, 'closers', coalesce((
    select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'phone', c.phone, 'country', c.country, 'commission', c.commission, 'active', c.active,
      'assigned', (select count(*) from orders o where o.closer_id = c.id and o.created_at::date between p_from and p_to),
      'delivered', (select count(*) from orders o where o.closer_id = c.id and o.status = 'delivered' and coalesce(o.delivered_at,o.updated_at)::date between p_from and p_to),
      'failed', (select count(*) from orders o where o.closer_id = c.id and o.status in ('failed','returned','cancelled','rejected') and o.updated_at::date between p_from and p_to),
      'revenue', (select coalesce(sum(o.total_amount),0) from orders o where o.closer_id = c.id and o.status = 'delivered' and coalesce(o.delivered_at,o.updated_at)::date between p_from and p_to))
      order by c.active desc, c.name) from closers c where c.store_id = v), '[]'::jsonb));
end $$;

create or replace function public.closer_save_server(p_secret text, p_slug text, p_closer jsonb) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid; v_id uuid; v_name text;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  if v is null then return jsonb_build_object('success', false, 'error', 'Boutique introuvable'); end if;
  v_name := left(trim(coalesce(p_closer->>'name','')), 80);
  if v_name = '' then return jsonb_build_object('success', false, 'error', 'Nom obligatoire'); end if;
  v_id := nullif(p_closer->>'id','')::uuid;
  if v_id is null then
    insert into closers(store_id, name, phone, country, commission, active)
    values (v, v_name, nullif(left(trim(coalesce(p_closer->>'phone','')),30),''), nullif(left(trim(coalesce(p_closer->>'country','')),4),''),
            least(greatest(coalesce(nullif(p_closer->>'commission','')::int,0),0),1000000), coalesce((p_closer->>'active')::boolean, true))
    returning id into v_id;
  else
    update closers set name = v_name, phone = nullif(left(trim(coalesce(p_closer->>'phone','')),30),''), country = nullif(left(trim(coalesce(p_closer->>'country','')),4),''),
      commission = least(greatest(coalesce(nullif(p_closer->>'commission','')::int,0),0),1000000), active = coalesce((p_closer->>'active')::boolean, active)
    where id = v_id and store_id = v;
    if not found then return jsonb_build_object('success', false, 'error', 'Closeuse introuvable'); end if;
  end if;
  return jsonb_build_object('success', true, 'id', v_id);
end $$;

create or replace function public.closer_delete_server(p_secret text, p_slug text, p_id uuid) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  delete from closers where id = p_id and store_id = public._shop_id_by_slug(p_slug);
  return jsonb_build_object('success', true);
end $$;

create or replace function public.order_assign_closer_server(p_secret text, p_slug text, p_order_number text, p_closer_id uuid) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid; v_name text; v_n int;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  if p_closer_id is not null then
    select name into v_name from closers where id = p_closer_id and store_id = v;
    if v_name is null then return jsonb_build_object('success', false, 'error', 'Closeuse introuvable'); end if;
  end if;
  update orders set closer_id = p_closer_id, updated_at = now() where store_id = v and order_number = p_order_number;
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('success', false, 'error', 'Commande introuvable'); end if;
  return jsonb_build_object('success', true, 'closerName', v_name);
end $$;

-- La liste des commandes renvoie aussi la closeuse affectée
create or replace function public.orders_list_server(p_secret text, p_shop_slug text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare v_shop_id uuid;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  select id into v_shop_id from shops where slug = p_shop_slug limit 1;
  if v_shop_id is null then return jsonb_build_object('success', true, 'orders', '[]'::jsonb); end if;
  return jsonb_build_object('success', true, 'orders', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', o.id, 'order_number', o.order_number, 'customer_name', c.full_name, 'customer_phone', c.phone,
      'city', o.city, 'country', o.country_code, 'currency', o.currency, 'delivery_address', o.delivery_address,
      'status', o.status, 'subtotal', o.subtotal, 'shipping_fee', o.shipping_fee, 'total_amount', o.total_amount,
      'source_channel', coalesce(o.source->>'channel', case when o.source->>'origin' = 'storefront' then 'online_store' else 'manual' end),
      'notes', o.notes, 'failure_reason', o.failure_reason,
      'rider_id', o.rider_id, 'rider_name', r.name, 'rider_phone', r.phone, 'rider_fee', o.rider_fee,
      'closer_id', o.closer_id, 'closer_name', cl.name,
      'created_at', o.created_at, 'updated_at', o.updated_at, 'delivered_at', o.delivered_at,
      'order_items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'product_name', i.title_snapshot,
          'quantity', i.quantity, 'unit_price', i.unit_price, 'total_price', i.unit_price * i.quantity))
          from order_items i where i.order_id = o.id), '[]'::jsonb)
    ) order by o.created_at desc)
    from orders o join customers c on c.id = o.customer_id left join riders r on r.id = o.rider_id left join closers cl on cl.id = o.closer_id where o.store_id = v_shop_id
  ), '[]'::jsonb));
end $function$;
