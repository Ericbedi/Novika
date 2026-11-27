-- Statuts d'interface manquants dans l'enum + changement de statut serveur (protégé par secret).
alter type public.order_status add value if not exists 'prepared';
alter type public.order_status add value if not exists 'unreachable';
alter type public.order_status add value if not exists 'postponed';
alter type public.order_status add value if not exists 'rejected';
alter type public.order_status add value if not exists 'rejected_invalid_number';
alter type public.order_status add value if not exists 'lost_unreachable';
alter type public.order_status add value if not exists 'pending_stock';

create or replace function public.order_set_status_server(
  p_secret text, p_shop_slug text, p_order_number text, p_status text, p_note text default null, p_actor text default null
) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  v_shop uuid; v_order record; v_new public.order_status;
begin
  if not public._check_product_sync_secret(p_secret) then
    return jsonb_build_object('success', false, 'error', 'Non autorisé');
  end if;
  begin
    v_new := p_status::public.order_status;
  exception when others then
    return jsonb_build_object('success', false, 'error', 'Statut inconnu');
  end;
  select id into v_shop from shops where slug = p_shop_slug limit 1;
  if v_shop is null then return jsonb_build_object('success', false, 'error', 'Boutique introuvable'); end if;
  select id, status into v_order from orders where store_id = v_shop and order_number = p_order_number limit 1;
  if not found then return jsonb_build_object('success', false, 'error', 'Commande introuvable'); end if;

  update orders set
    status = v_new,
    updated_at = now(),
    confirmed_at = case when v_new = 'confirmed' and confirmed_at is null then now() else confirmed_at end,
    delivered_at = case when v_new = 'delivered' then now() else delivered_at end,
    collected_at = case when v_new = 'delivered' and collected_at is null then now() else collected_at end
  where id = v_order.id;

  insert into order_events(order_id, event_type, from_status, to_status, note)
  values (v_order.id, 'status_change', v_order.status, v_new, nullif(concat_ws(' — ', p_actor, p_note), ''));

  return jsonb_build_object('success', true, 'status', v_new::text);
end $$;

revoke execute on function public.order_set_status_server(text, text, text, text, text, text) from public;
grant execute on function public.order_set_status_server(text, text, text, text, text, text) to anon, authenticated, service_role;
