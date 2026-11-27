-- Enregistre l'évaluation IP (Robtex) dans la colonne source des commandes
DO $$ DECLARE d text; BEGIN
  d := pg_get_functiondef('public.create_order_server(text,text,jsonb)'::regprocedure);
  d := replace(d, $q$jsonb_build_object('origin', 'storefront', 'product_id', v_prod.id)$q$,
                  $q$jsonb_build_object('origin', 'storefront', 'product_id', v_prod.id, 'ip', p_order->'ipInfo')$q$);
  EXECUTE d;
END $$;
