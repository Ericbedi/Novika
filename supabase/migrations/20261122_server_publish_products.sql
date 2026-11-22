-- Publication des produits depuis le serveur Novika, protégée par un secret (jamais exposé au navigateur)
CREATE TABLE IF NOT EXISTS public.app_server_secrets (
  name text PRIMARY KEY,
  secret_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_server_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_server_secrets FROM anon, authenticated, public;

INSERT INTO public.app_server_secrets(name, secret_hash) VALUES ('product_sync', '6b104920682da5bd51b4cde560c2c16d854964573e694ff5acd5ce542eff66f9')
ON CONFLICT (name) DO UPDATE SET secret_hash = EXCLUDED.secret_hash;

-- Respecter le statut choisi (brouillon / archivé) à l'insertion d'un NOUVEAU produit
DO $$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.sync_products_to_supabase(text,jsonb)'::regprocedure);
  d := replace(d, E'          ''active''::product_status_type,\n',
    E'          (CASE WHEN lower(COALESCE(v_item->>''productStatus'', v_item->>''status'', '''')) = ''draft'' THEN ''draft'' WHEN lower(COALESCE(v_item->>''productStatus'', v_item->>''status'', '''')) = ''archived'' THEN ''archived'' ELSE ''active'' END)::product_status_type,\n');
  d := replace(d, E'          true,\n          v_track_quantity',
    E'          (lower(COALESCE(v_item->>''productStatus'', v_item->>''status'', '''')) NOT IN (''draft'',''archived'') AND COALESCE(v_item->>''published_to_storefront'', ''true'') <> ''false''),\n          v_track_quantity');
  EXECUTE d;
END $$;

CREATE OR REPLACE FUNCTION public.sync_products_server(p_secret text, p_shop_slug text, p_products jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $f$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.app_server_secrets
    WHERE name = 'product_sync' AND secret_hash = encode(sha256(convert_to(COALESCE(p_secret, ''), 'UTF8')), 'hex')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;
  RETURN public.sync_products_to_supabase(p_shop_slug, p_products);
END;
$f$;
REVOKE ALL ON FUNCTION public.sync_products_server(text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.sync_products_server(text, text, jsonb) TO anon, authenticated, service_role;
