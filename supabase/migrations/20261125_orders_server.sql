-- Commandes clients : création publique sécurisée (prix recalculés côté base) + lecture admin
CREATE OR REPLACE FUNCTION public.create_order_server(p_secret text, p_shop_slug text, p_order jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE
  v_shop_id uuid; v_country text; v_prod record; v_cust uuid; v_order uuid;
  v_name text; v_phone text; v_city text; v_addr text; v_qty int; v_unit int; v_sub int; v_claimed int;
  v_num text; v_pid_text text;
BEGIN
  IF NOT public._check_product_sync_secret(p_secret) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;
  SELECT id, COALESCE(country_code, 'TG') INTO v_shop_id, v_country FROM shops WHERE slug = p_shop_slug LIMIT 1;
  IF v_shop_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Boutique introuvable'); END IF;

  v_name := left(trim(COALESCE(p_order->>'customerName', '')), 120);
  v_phone := left(trim(COALESCE(p_order->>'customerPhone', '')), 40);
  v_city := left(trim(COALESCE(p_order->>'city', '')), 80);
  v_addr := NULLIF(left(trim(COALESCE(p_order->>'deliveryAddress', '')), 300), '');
  IF v_name = '' OR v_phone = '' OR v_city = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Champs obligatoires manquants');
  END IF;

  v_pid_text := NULLIF(trim(COALESCE(p_order->>'productId', '')), '');
  SELECT id, title, sale_price, cost_price INTO v_prod FROM products
   WHERE store_id = v_shop_id AND published_to_storefront = true AND status = 'active'
     AND (legacy_id = v_pid_text OR id::text = v_pid_text OR slug = v_pid_text)
   LIMIT 1;
  IF v_prod.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Produit indisponible'); END IF;

  v_qty := LEAST(GREATEST(COALESCE(NULLIF(p_order->>'quantity', '')::int, 1), 1), 50);
  v_unit := v_prod.sale_price;
  v_sub := v_unit * v_qty;
  -- Offres de lot : le total annoncé n'est accepté que s'il est compris entre 40 % et 100 % du prix catalogue
  v_claimed := NULLIF(p_order->>'subtotal', '')::int;
  IF v_claimed IS NOT NULL AND v_claimed <= v_sub AND v_claimed * 100 >= v_sub * 40 THEN
    v_sub := v_claimed;
    v_unit := v_sub / v_qty;
  END IF;

  SELECT id INTO v_cust FROM customers WHERE store_id = v_shop_id AND phone = v_phone LIMIT 1;
  IF v_cust IS NULL THEN
    INSERT INTO customers(store_id, full_name, phone, country_code, city, address)
    VALUES (v_shop_id, v_name, v_phone, v_country, v_city, v_addr) RETURNING id INTO v_cust;
  END IF;

  v_num := NULLIF(left(trim(COALESCE(p_order->>'orderNumber', '')), 40), '');
  IF v_num IS NULL OR EXISTS (SELECT 1 FROM orders WHERE store_id = v_shop_id AND order_number = v_num) THEN
    v_num := 'ORD-' || to_char(now() AT TIME ZONE 'UTC', 'YYMMDD') || '-' || substr(md5(random()::text), 1, 5);
  END IF;

  INSERT INTO orders(store_id, order_number, customer_id, status, country_code, city, delivery_address,
                     subtotal, shipping_fee, total_amount, currency, payment_method, source)
  VALUES (v_shop_id, v_num, v_cust, 'pending', v_country, v_city, v_addr,
          v_sub, 0, v_sub, 'XOF', 'cod',
          jsonb_build_object('origin', 'storefront', 'product_id', v_prod.id))
  RETURNING id INTO v_order;

  INSERT INTO order_items(order_id, product_id, title_snapshot, unit_price, unit_cost_snapshot, quantity)
  VALUES (v_order, v_prod.id, v_prod.title, v_unit, COALESCE(v_prod.cost_price, 0), v_qty);

  RETURN jsonb_build_object('success', true, 'order_number', v_num, 'total_amount', v_sub, 'id', v_order);
END;
$f$;

CREATE OR REPLACE FUNCTION public.orders_list_server(p_secret text, p_shop_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE v_shop_id uuid;
BEGIN
  IF NOT public._check_product_sync_secret(p_secret) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;
  SELECT id INTO v_shop_id FROM shops WHERE slug = p_shop_slug LIMIT 1;
  IF v_shop_id IS NULL THEN RETURN jsonb_build_object('success', true, 'orders', '[]'::jsonb); END IF;
  RETURN jsonb_build_object('success', true, 'orders', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', o.id, 'order_number', o.order_number, 'customer_name', c.full_name, 'customer_phone', c.phone,
      'city', o.city, 'country', o.country_code, 'currency', o.currency, 'delivery_address', o.delivery_address,
      'status', o.status, 'subtotal', o.subtotal, 'shipping_fee', o.shipping_fee, 'total_amount', o.total_amount,
      'created_at', o.created_at, 'updated_at', o.updated_at,
      'order_items', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', i.id, 'product_name', i.title_snapshot,
          'quantity', i.quantity, 'unit_price', i.unit_price, 'total_price', i.unit_price * i.quantity))
          FROM order_items i WHERE i.order_id = o.id), '[]'::jsonb)
    ) ORDER BY o.created_at DESC)
    FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.store_id = v_shop_id
  ), '[]'::jsonb));
END;
$f$;

REVOKE ALL ON FUNCTION public.create_order_server(text, text, jsonb) FROM public;
REVOKE ALL ON FUNCTION public.orders_list_server(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_order_server(text, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.orders_list_server(text, text) TO anon, authenticated, service_role;
