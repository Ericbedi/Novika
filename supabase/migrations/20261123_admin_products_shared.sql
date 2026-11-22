-- Catalogue admin partagé entre appareils (mobile / navigateur) + mise à jour des produits publiés
CREATE TABLE IF NOT EXISTS public.admin_products (
  shop_slug text NOT NULL,
  product_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shop_slug, product_id)
);
ALTER TABLE public.admin_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_products FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public._check_product_sync_secret(p_secret text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $f$
  SELECT EXISTS (
    SELECT 1 FROM public.app_server_secrets
    WHERE name = 'product_sync' AND secret_hash = encode(sha256(convert_to(COALESCE(p_secret, ''), 'UTF8')), 'hex')
  );
$f$;
REVOKE ALL ON FUNCTION public._check_product_sync_secret(text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_products_list_server(p_secret text, p_shop_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
BEGIN
  IF NOT public._check_product_sync_secret(p_secret) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;
  RETURN jsonb_build_object('success', true, 'products', COALESCE((
    SELECT jsonb_agg(CASE WHEN deleted THEN jsonb_build_object('id', product_id, '__deleted', true, 'updatedAt', to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
                          ELSE data END)
    FROM public.admin_products WHERE shop_slug = p_shop_slug
  ), '[]'::jsonb));
END;
$f$;

CREATE OR REPLACE FUNCTION public.admin_products_upsert_server(p_secret text, p_shop_slug text, p_products jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE v_item jsonb; v_id text; v_count int := 0;
BEGIN
  IF NOT public._check_product_sync_secret(p_secret) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_products) LOOP
    v_id := v_item->>'id';
    IF v_id IS NULL OR v_id = '' THEN CONTINUE; END IF;
    INSERT INTO public.admin_products(shop_slug, product_id, data, deleted, updated_at)
    VALUES (p_shop_slug, v_id, v_item, COALESCE((v_item->>'__deleted')::boolean, false), now())
    ON CONFLICT (shop_slug, product_id) DO UPDATE
      SET data = CASE WHEN COALESCE((v_item->>'__deleted')::boolean, false) THEN public.admin_products.data ELSE EXCLUDED.data END,
          deleted = EXCLUDED.deleted, updated_at = now();
    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$f$;

-- Met à jour les produits DÉJÀ publiés (prix, titre, description, statut, images) pour que la vitrine reflète les modifications
CREATE OR REPLACE FUNCTION public.sync_products_update_server(p_secret text, p_shop_slug text, p_products jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE
  v_shop_id uuid; v_item jsonb; v_pid uuid; v_legacy text; v_slug text; v_status text;
  v_updated int := 0; v_img text; v_idx int;
BEGIN
  IF NOT public._check_product_sync_secret(p_secret) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;
  SELECT id INTO v_shop_id FROM shops WHERE slug = p_shop_slug LIMIT 1;
  IF v_shop_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Boutique introuvable'); END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_products) LOOP
    BEGIN
      v_pid := NULL;
      v_legacy := NULLIF(TRIM(COALESCE(v_item->>'id', '')), '');
      v_slug := NULLIF(TRIM(COALESCE(v_item->>'slug', '')), '');
      IF v_legacy IS NOT NULL THEN SELECT id INTO v_pid FROM products WHERE store_id = v_shop_id AND legacy_id = v_legacy LIMIT 1; END IF;
      IF v_pid IS NULL AND v_slug IS NOT NULL THEN SELECT id INTO v_pid FROM products WHERE store_id = v_shop_id AND slug = v_slug LIMIT 1; END IF;
      IF v_pid IS NULL THEN CONTINUE; END IF;
      v_status := lower(COALESCE(v_item->>'productStatus', v_item->>'status', 'active'));
      UPDATE products SET
        title = COALESCE(NULLIF(TRIM(COALESCE(v_item->>'title', v_item->>'name', '')), ''), title),
        description = COALESCE(v_item->>'description', description),
        sale_price = COALESCE(NULLIF(COALESCE(v_item->>'salePrice', v_item->>'price'), '')::int, sale_price),
        compare_at_price = NULLIF(v_item->>'compareAtPrice', '')::int,
        status = (CASE WHEN v_status = 'draft' THEN 'draft' WHEN v_status = 'archived' THEN 'archived' ELSE 'active' END)::product_status_type,
        published_to_storefront = (v_status NOT IN ('draft','archived') AND COALESCE(v_item->>'published_to_storefront', 'true') <> 'false' AND (v_item->>'deletedAt') IS NULL)
      WHERE id = v_pid;
      IF jsonb_typeof(v_item->'images') = 'array' AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_item->'images') u WHERE u ~* '^https?://') THEN
        DELETE FROM product_media WHERE product_id = v_pid;
        v_idx := 0;
        FOR v_img IN SELECT jsonb_array_elements_text(v_item->'images') LOOP
          IF v_img ~* '^https?://' THEN
            INSERT INTO product_media(product_id, media_url, media_type, position, alt_text)
            VALUES (v_pid, TRIM(v_img), 'image', v_idx, COALESCE(v_item->>'title', v_item->>'name'));
            v_idx := v_idx + 1;
          END IF;
        END LOOP;
      END IF;
      v_updated := v_updated + 1;
    EXCEPTION WHEN OTHERS THEN CONTINUE;
    END;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'updated_count', v_updated);
END;
$f$;

REVOKE ALL ON FUNCTION public.admin_products_list_server(text, text) FROM public;
REVOKE ALL ON FUNCTION public.admin_products_upsert_server(text, text, jsonb) FROM public;
REVOKE ALL ON FUNCTION public.sync_products_update_server(text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_products_list_server(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_products_upsert_server(text, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_products_update_server(text, text, jsonb) TO anon, authenticated, service_role;
