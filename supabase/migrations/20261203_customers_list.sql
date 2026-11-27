-- Clients réels avec statistiques calculées sur les commandes
create or replace function public.customers_list_server(p_secret text, p_slug text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  return jsonb_build_object('success', true, 'customers', coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.last_order desc nulls last) from (
      select c.id, c.full_name as name, c.phone, c.country_code as country, c.city, c.address, c.created_at,
        count(o.id) as orders_count,
        count(o.id) filter (where o.status = 'delivered') as delivered_count,
        count(o.id) filter (where o.status in ('failed','returned','rejected','rejected_invalid_number','lost_unreachable')) as failed_count,
        coalesce(sum(o.total_amount) filter (where o.status = 'delivered'), 0) as total_spent,
        max(o.created_at) as last_order
      from customers c left join orders o on o.customer_id = c.id
      where c.store_id = v group by c.id
    ) t), '[]'::jsonb));
end $$;
