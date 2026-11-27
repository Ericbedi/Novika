create or replace function public._shop_id_by_slug(p_slug text) returns uuid
language sql stable security definer set search_path to 'public' as $$ select id from shops where slug = p_slug limit 1 $$;
revoke execute on function public._shop_id_by_slug(text) from public, anon, authenticated;

create or replace function public.riders_list_server(p_secret text, p_slug text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  return jsonb_build_object('success', true, 'riders', coalesce((
    select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'phone', r.phone, 'city', r.city, 'default_fee', r.default_fee, 'active', r.active,
      'active_count', (select count(*) from orders o where o.rider_id = r.id and o.status in ('confirmed','prepared','scheduled','shipped','postponed')),
      'delivered_count', (select count(*) from orders o where o.rider_id = r.id and o.status = 'delivered'),
      'failed_count', (select count(*) from orders o where o.rider_id = r.id and o.status = 'failed'))
      order by r.active desc, r.name) from riders r where r.store_id = v), '[]'::jsonb));
end $$;

create or replace function public.rider_save_server(p_secret text, p_slug text, p_rider jsonb) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid; v_id uuid; v_name text; v_phone text;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  if v is null then return jsonb_build_object('success', false, 'error', 'Boutique introuvable'); end if;
  v_name := left(trim(coalesce(p_rider->>'name','')), 80);
  v_phone := left(trim(coalesce(p_rider->>'phone','')), 30);
  if v_name = '' or v_phone = '' then return jsonb_build_object('success', false, 'error', 'Nom et téléphone obligatoires'); end if;
  v_id := nullif(p_rider->>'id','')::uuid;
  if v_id is null then
    insert into riders(store_id, name, phone, city, default_fee, active)
    values (v, v_name, v_phone, nullif(left(trim(coalesce(p_rider->>'city','')), 60), ''),
            least(greatest(coalesce(nullif(p_rider->>'default_fee','')::int, 0), 0), 100000), coalesce((p_rider->>'active')::boolean, true))
    returning id into v_id;
  else
    update riders set name = v_name, phone = v_phone, city = nullif(left(trim(coalesce(p_rider->>'city','')), 60), ''),
      default_fee = least(greatest(coalesce(nullif(p_rider->>'default_fee','')::int, 0), 0), 100000),
      active = coalesce((p_rider->>'active')::boolean, active)
    where id = v_id and store_id = v;
    if not found then return jsonb_build_object('success', false, 'error', 'Livreur introuvable'); end if;
  end if;
  return jsonb_build_object('success', true, 'id', v_id);
end $$;

create or replace function public.rider_delete_server(p_secret text, p_slug text, p_id uuid) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  delete from riders where id = p_id and store_id = public._shop_id_by_slug(p_slug);
  return jsonb_build_object('success', true);
end $$;

create or replace function public.rates_list_server(p_secret text, p_slug text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  return jsonb_build_object('success', true, 'rates', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'city', city, 'fee', fee) order by city)
    from delivery_rates where store_id = public._shop_id_by_slug(p_slug)), '[]'::jsonb));
end $$;

create or replace function public.rate_save_server(p_secret text, p_slug text, p_city text, p_fee integer) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  if v is null or coalesce(trim(p_city),'') = '' or p_fee is null or p_fee < 0 then return jsonb_build_object('success', false, 'error', 'Ville et tarif invalides'); end if;
  insert into delivery_rates(store_id, city, fee) values (v, left(trim(p_city), 60), p_fee)
  on conflict (store_id, lower(city)) do update set fee = excluded.fee, city = excluded.city;
  return jsonb_build_object('success', true);
end $$;

create or replace function public.rate_delete_server(p_secret text, p_slug text, p_id uuid) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  delete from delivery_rates where id = p_id and store_id = public._shop_id_by_slug(p_slug);
  return jsonb_build_object('success', true);
end $$;

create or replace function public.order_assign_rider_server(p_secret text, p_slug text, p_order_number text, p_rider_id uuid) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid; v_o record; v_r record;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  select id, status into v_o from orders where store_id = v and order_number = p_order_number limit 1;
  if not found then return jsonb_build_object('success', false, 'error', 'Commande introuvable'); end if;
  if p_rider_id is null then
    update orders set rider_id = null, rider_fee = 0, updated_at = now() where id = v_o.id;
    return jsonb_build_object('success', true);
  end if;
  select id, name, default_fee, active into v_r from riders where id = p_rider_id and store_id = v;
  if not found then return jsonb_build_object('success', false, 'error', 'Livreur introuvable'); end if;
  if not v_r.active then return jsonb_build_object('success', false, 'error', 'Ce livreur est désactivé'); end if;
  update orders set rider_id = v_r.id, rider_fee = v_r.default_fee, updated_at = now() where id = v_o.id;
  insert into order_events(order_id, event_type, from_status, to_status, note) values (v_o.id, 'rider_assigned', v_o.status, v_o.status, 'Livreur : ' || v_r.name);
  return jsonb_build_object('success', true, 'rider_name', v_r.name, 'rider_fee', v_r.default_fee);
end $$;

-- Liste des commandes : ajoute livreur, frais livreur et motif d'échec
create or replace function public.orders_list_server(p_secret text, p_shop_slug text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
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
      'created_at', o.created_at, 'updated_at', o.updated_at, 'delivered_at', o.delivered_at,
      'order_items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'product_name', i.title_snapshot,
          'quantity', i.quantity, 'unit_price', i.unit_price, 'total_price', i.unit_price * i.quantity))
          from order_items i where i.order_id = o.id), '[]'::jsonb)
    ) order by o.created_at desc)
    from orders o join customers c on c.id = o.customer_id left join riders r on r.id = o.rider_id where o.store_id = v_shop_id
  ), '[]'::jsonb));
end $$;

-- Statut : le motif est conservé quand une livraison échoue
create or replace function public.order_set_status_server(p_secret text, p_shop_slug text, p_order_number text, p_status text, p_note text default null, p_actor text default null) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v_shop uuid; v_order record; v_new public.order_status;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  begin v_new := p_status::public.order_status; exception when others then return jsonb_build_object('success', false, 'error', 'Statut inconnu'); end;
  select id into v_shop from shops where slug = p_shop_slug limit 1;
  if v_shop is null then return jsonb_build_object('success', false, 'error', 'Boutique introuvable'); end if;
  select id, status into v_order from orders where store_id = v_shop and order_number = p_order_number limit 1;
  if not found then return jsonb_build_object('success', false, 'error', 'Commande introuvable'); end if;
  update orders set status = v_new, updated_at = now(),
    confirmed_at = case when v_new = 'confirmed' and confirmed_at is null then now() else confirmed_at end,
    delivered_at = case when v_new = 'delivered' then now() else delivered_at end,
    collected_at = case when v_new = 'delivered' and collected_at is null then now() else collected_at end,
    failure_reason = case when v_new in ('failed','rejected','cancelled') then nullif(left(coalesce(p_note,''), 300), '') else failure_reason end
  where id = v_order.id;
  insert into order_events(order_id, event_type, from_status, to_status, note)
  values (v_order.id, 'status_change', v_order.status, v_new, nullif(concat_ws(' — ', p_actor, p_note), ''));
  return jsonb_build_object('success', true, 'status', v_new::text);
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'riders_list_server(text,text)','rider_save_server(text,text,jsonb)','rider_delete_server(text,text,uuid)',
    'rates_list_server(text,text)','rate_save_server(text,text,text,integer)','rate_delete_server(text,text,uuid)',
    'order_assign_rider_server(text,text,text,uuid)']
  loop
    execute format('revoke execute on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated, service_role', f);
  end loop;
end $$;
