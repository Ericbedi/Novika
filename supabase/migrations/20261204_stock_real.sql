-- Stock réel : quantité par produit, journal des mouvements, baisse automatique à la livraison
alter table public.products add column if not exists stock_qty integer not null default 0;

create or replace function public.stock_list_server(p_secret text, p_slug text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  return jsonb_build_object('success', true,
    'products', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'title', p.title, 'sku', p.sku, 'stock', p.stock_qty,
        'threshold', coalesce(p.low_stock_threshold, 10), 'track', coalesce(p.track_quantity, true), 'status', p.status, 'cost', p.cost_price, 'price', p.sale_price) order by p.title)
      from products p where p.store_id = v and p.deleted_at is null and p.status <> 'archived'), '[]'::jsonb),
    'movements', coalesce((select jsonb_agg(m) from (
      select jsonb_build_object('id', sm.id, 'product_id', sm.product_id, 'title', p.title, 'delta', sm.delta, 'new_stock', sm.new_stock,
        'reason', sm.reason, 'label', sm.reason_label, 'reference', sm.reference_id, 'author', sm.author, 'notes', sm.notes, 'created_at', sm.created_at) m
      from stock_movements sm join products p on p.id = sm.product_id where p.store_id = v order by sm.created_at desc limit 50) x), '[]'::jsonb));
end $$;

create or replace function public.stock_adjust_server(p_secret text, p_slug text, p_product_id uuid, p_mode text, p_qty integer, p_reason text, p_note text, p_author text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid; v_prev int; v_new int; v_reason stock_movement_reason_type; v_label text;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  select stock_qty into v_prev from products where id = p_product_id and store_id = v for update;
  if not found then return jsonb_build_object('success', false, 'error', 'Produit introuvable'); end if;
  if p_qty is null or p_qty < 0 or p_qty > 1000000 then return jsonb_build_object('success', false, 'error', 'Quantité invalide'); end if;
  if p_mode = 'set' then v_new := p_qty; elsif p_mode = 'add' then v_new := v_prev + p_qty; elsif p_mode = 'remove' then v_new := greatest(v_prev - p_qty, 0);
  else return jsonb_build_object('success', false, 'error', 'Mode invalide'); end if;
  v_reason := case p_reason when 'purchase_receipt' then 'purchase_receipt' when 'loss_damage' then 'loss_damage' else 'inventory_adjustment' end;
  v_label := case v_reason when 'purchase_receipt' then 'Réception de marchandise' when 'loss_damage' then 'Perte / casse' else 'Ajustement d''inventaire' end;
  update products set stock_qty = v_new, updated_at = now() where id = p_product_id;
  insert into stock_movements(product_id, delta, previous_stock, new_stock, reason, reason_label, author, notes)
  values (p_product_id, v_new - v_prev, v_prev, v_new, v_reason, v_label, left(coalesce(nullif(p_author,''),'Admin'),80), nullif(left(coalesce(p_note,''),200),''));
  return jsonb_build_object('success', true, 'stock', v_new);
end $$;

-- Livraison confirmée : le stock baisse une seule fois. Retour d'une commande livrée : il remonte.
create or replace function public._orders_stock_trigger() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare r record; v_prev int; v_new int;
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    for r in select oi.product_id, sum(oi.quantity)::int q from order_items oi where oi.order_id = new.id and oi.product_id is not null group by oi.product_id loop
      if exists (select 1 from stock_movements where reference_id = new.order_number and reason = 'delivery' and product_id = r.product_id) then continue; end if;
      select stock_qty into v_prev from products where id = r.product_id and coalesce(track_quantity, true) for update;
      if not found then continue; end if;
      v_new := greatest(v_prev - r.q, 0);
      update products set stock_qty = v_new where id = r.product_id;
      insert into stock_movements(product_id, delta, previous_stock, new_stock, reason, reason_label, reference_id, author)
      values (r.product_id, v_new - v_prev, v_prev, v_new, 'delivery', 'Livraison ' || new.order_number, new.order_number, 'Système');
    end loop;
  elsif old.status = 'delivered' and new.status in ('returned','failed','cancelled') then
    for r in select sm.product_id, -sm.delta q from stock_movements sm where sm.reference_id = new.order_number and sm.reason = 'delivery' and sm.delta < 0
             and not exists (select 1 from stock_movements b where b.reference_id = new.order_number and b.reason = 'return' and b.product_id = sm.product_id) loop
      select stock_qty into v_prev from products where id = r.product_id for update;
      if not found then continue; end if;
      v_new := v_prev + r.q;
      update products set stock_qty = v_new where id = r.product_id;
      insert into stock_movements(product_id, delta, previous_stock, new_stock, reason, reason_label, reference_id, author)
      values (r.product_id, r.q, v_prev, v_new, 'return', 'Retour ' || new.order_number, new.order_number, 'Système');
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists orders_stock_after_status on public.orders;
create trigger orders_stock_after_status after update of status on public.orders
  for each row when (old.status is distinct from new.status) execute function public._orders_stock_trigger();
