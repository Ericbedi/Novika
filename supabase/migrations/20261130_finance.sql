-- Dépenses réelles + bénéfice net calculé en base (commandes livrées uniquement)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.shops(id) on delete cascade,
  category text not null check (category in ('pub','stock','salaire','loyer','transport','autre')),
  amount integer not null check (amount > 0 and amount <= 100000000),
  spent_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists expenses_store_date_idx on public.expenses(store_id, spent_on desc);
alter table public.expenses enable row level security;

create or replace function public.expenses_list_server(p_secret text, p_slug text, p_from date, p_to date) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  return jsonb_build_object('success', true, 'expenses', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'category', category, 'amount', amount, 'spent_on', spent_on, 'note', note) order by spent_on desc, created_at desc)
    from expenses where store_id = public._shop_id_by_slug(p_slug) and spent_on between p_from and p_to), '[]'::jsonb));
end $$;

create or replace function public.expense_add_server(p_secret text, p_slug text, p_expense jsonb) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid; v_amt int; v_cat text;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  if v is null then return jsonb_build_object('success', false, 'error', 'Boutique introuvable'); end if;
  v_amt := coalesce(nullif(p_expense->>'amount','')::int, 0);
  v_cat := coalesce(nullif(p_expense->>'category',''), 'autre');
  if v_amt <= 0 then return jsonb_build_object('success', false, 'error', 'Montant invalide'); end if;
  if v_cat not in ('pub','stock','salaire','loyer','transport','autre') then return jsonb_build_object('success', false, 'error', 'Catégorie invalide'); end if;
  insert into expenses(store_id, category, amount, spent_on, note)
  values (v, v_cat, v_amt, coalesce(nullif(p_expense->>'spent_on','')::date, current_date), nullif(left(trim(coalesce(p_expense->>'note','')), 200), ''));
  return jsonb_build_object('success', true);
end $$;

create or replace function public.expense_delete_server(p_secret text, p_slug text, p_id uuid) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  delete from expenses where id = p_id and store_id = public._shop_id_by_slug(p_slug);
  return jsonb_build_object('success', true);
end $$;

-- Bénéfice net réel = CA livré - coût produits - frais livreurs - dépenses
create or replace function public.finance_summary_server(p_secret text, p_slug text, p_from date, p_to date) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v uuid; v_rev bigint; v_cost bigint; v_rider bigint; v_deliv int; v_total int; v_failed int; v_exp bigint; v_pending bigint;
begin
  if not public._check_product_sync_secret(p_secret) then return jsonb_build_object('success', false, 'error', 'Non autorisé'); end if;
  v := public._shop_id_by_slug(p_slug);
  select coalesce(sum(o.total_amount),0), coalesce(sum(o.rider_fee),0), count(*)
    into v_rev, v_rider, v_deliv
    from orders o where o.store_id = v and o.status = 'delivered' and (coalesce(o.delivered_at, o.updated_at))::date between p_from and p_to;
  select coalesce(sum(i.unit_cost_snapshot * i.quantity),0) into v_cost
    from order_items i join orders o on o.id = i.order_id
    where o.store_id = v and o.status = 'delivered' and (coalesce(o.delivered_at, o.updated_at))::date between p_from and p_to;
  select count(*) into v_total from orders where store_id = v and created_at::date between p_from and p_to;
  select count(*) into v_failed from orders where store_id = v and status in ('failed','returned') and updated_at::date between p_from and p_to;
  select coalesce(sum(total_amount),0) into v_pending from orders where store_id = v and status in ('shipped');
  select coalesce(sum(amount),0) into v_exp from expenses where store_id = v and spent_on between p_from and p_to;
  return jsonb_build_object('success', true,
    'revenue', v_rev, 'product_cost', v_cost, 'rider_fees', v_rider, 'expenses', v_exp,
    'net_profit', v_rev - v_cost - v_rider - v_exp,
    'delivered_count', v_deliv, 'orders_count', v_total, 'failed_count', v_failed, 'cash_in_transit', v_pending,
    'by_category', coalesce((select jsonb_object_agg(category, s) from (select category, sum(amount) s from expenses where store_id = v and spent_on between p_from and p_to group by category) x), '{}'::jsonb));
end $$;
