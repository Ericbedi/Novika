-- Statistiques du tableau de bord (appliquée via Supabase MCP)
CREATE OR REPLACE FUNCTION public.dashboard_stats_server(p_secret text, p_slug text, p_from date, p_to date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v uuid;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  if p_to - p_from > 400 then return jsonb_build_object('success', false, 'error', 'Période trop longue'); end if;
  return jsonb_build_object('success', true,
    'days', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', d::date,
        'orders', (select count(*) from orders o where o.store_id = v and o.created_at::date = d::date),
        'total_sales', (select coalesce(sum(o.total_amount),0) from orders o where o.store_id = v and o.created_at::date = d::date and o.status not in ('cancelled','rejected','rejected_invalid_number')),
        'delivered_count', (select count(*) from orders o where o.store_id = v and o.status = 'delivered' and coalesce(o.delivered_at,o.updated_at)::date = d::date),
        'delivered_sales', (select coalesce(sum(o.total_amount),0) from orders o where o.store_id = v and o.status = 'delivered' and coalesce(o.delivered_at,o.updated_at)::date = d::date),
        'product_cost', (select coalesce(sum(i.unit_cost_snapshot * i.quantity),0) from order_items i join orders o on o.id = i.order_id where o.store_id = v and o.status = 'delivered' and coalesce(o.delivered_at,o.updated_at)::date = d::date),
        'rider_fees', (select coalesce(sum(o.rider_fee),0) from orders o where o.store_id = v and o.status = 'delivered' and coalesce(o.delivered_at,o.updated_at)::date = d::date),
        'ad_spend', (select coalesce(sum(e.amount),0) from expenses e where e.store_id = v and e.spent_on = d::date and e.category = 'pub'),
        'other_expenses', (select coalesce(sum(e.amount),0) from expenses e where e.store_id = v and e.spent_on = d::date and e.category <> 'pub')
      ) order by d) from generate_series(p_from, p_to, interval '1 day') d), '[]'::jsonb),
    'statuses', coalesce((select jsonb_object_agg(status, c) from (select o.status::text status, count(*) c from orders o where o.store_id = v and o.created_at::date between p_from and p_to group by o.status) x), '{}'::jsonb),
    'top_products', coalesce((select jsonb_agg(t) from (
        select jsonb_build_object('id', i.product_id, 'name', max(i.title_snapshot), 'units', sum(i.quantity), 'revenue', sum(i.unit_price * i.quantity)) t
        from order_items i join orders o on o.id = i.order_id
        where o.store_id = v and o.status = 'delivered' and coalesce(o.delivered_at,o.updated_at)::date between p_from and p_to
        group by i.product_id order by sum(i.unit_price * i.quantity) desc limit 5) x), '[]'::jsonb),
    'pending_count', (select count(*) from orders o where o.store_id = v and o.status = 'pending'),
    'today_deliveries', (select count(*) from orders o where o.store_id = v and o.status in ('shipped','scheduled') ));
end $function$;
