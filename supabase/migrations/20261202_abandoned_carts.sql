-- Paniers abandonnés : numéro saisi dans le formulaire sans commande finalisée
create table if not exists public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.shops(id) on delete cascade,
  phone text not null,
  customer_name text,
  city text,
  product_id text,
  product_name text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  contacted_at timestamptz,
  unique (store_id, phone)
);
alter table public.abandoned_carts enable row level security;

-- Appelée par la vitrine (publique) : validation stricte + plafond horaire anti-flood
create or replace function public.cart_capture_public(p_slug text, p_cart jsonb) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid; v_phone text;
begin
  v := public._shop_id_by_slug(p_slug);
  if v is null then return jsonb_build_object('success', false); end if;
  v_phone := trim(coalesce(p_cart->>'phone',''));
  if v_phone !~ '^\+[0-9]{8,15}$' then return jsonb_build_object('success', false); end if;
  if (select count(*) from abandoned_carts where store_id = v and last_seen > now() - interval '1 hour') > 300 then
    return jsonb_build_object('success', false);
  end if;
  insert into abandoned_carts(store_id, phone, customer_name, city, product_id, product_name)
  values (v, v_phone, nullif(left(trim(coalesce(p_cart->>'name','')),80),''), nullif(left(trim(coalesce(p_cart->>'city','')),60),''),
          nullif(left(coalesce(p_cart->>'productId',''),80),''), nullif(left(coalesce(p_cart->>'productName',''),120),''))
  on conflict (store_id, phone) do update set
    customer_name = coalesce(excluded.customer_name, abandoned_carts.customer_name),
    city = coalesce(excluded.city, abandoned_carts.city),
    product_id = coalesce(excluded.product_id, abandoned_carts.product_id),
    product_name = coalesce(excluded.product_name, abandoned_carts.product_name),
    last_seen = now();
  return jsonb_build_object('success', true);
end $$;
grant execute on function public.cart_capture_public(text, jsonb) to anon, authenticated, service_role;

create or replace function public.carts_list_server(p_secret text, p_slug text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  return jsonb_build_object('success', true, 'carts', coalesce((
    select jsonb_agg(jsonb_build_object('id', a.id, 'phone', a.phone, 'name', a.customer_name, 'city', a.city, 'product_name', a.product_name,
      'first_seen', a.first_seen, 'last_seen', a.last_seen, 'contacted_at', a.contacted_at,
      'recovered', exists (select 1 from orders o join customers c on c.id = o.customer_id where o.store_id = a.store_id and c.phone = a.phone and o.created_at >= a.first_seen))
      order by a.last_seen desc)
    from abandoned_carts a where a.store_id = v and a.last_seen > now() - interval '30 days'), '[]'::jsonb));
end $$;

create or replace function public.cart_update_server(p_secret text, p_slug text, p_id uuid, p_action text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  if p_action = 'contacted' then update abandoned_carts set contacted_at = now() where id = p_id and store_id = v;
  elsif p_action = 'delete' then delete from abandoned_carts where id = p_id and store_id = v;
  else return jsonb_build_object('success', false, 'error', 'Action invalide'); end if;
  return jsonb_build_object('success', true);
end $$;
