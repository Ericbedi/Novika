-- Sécurité : ces fonctions SECURITY DEFINER lisent des données de boutique sans contrôle d'identité.
-- Elles ne sont utilisées nulle part dans l'application (les routes serveur passent par les RPC protégées par secret).
revoke execute on function public.get_store_customers(uuid) from public, anon, authenticated;
revoke execute on function public.get_store_orders(uuid, text) from public, anon, authenticated;
revoke execute on function public.get_store_financial_metrics(uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.get_store_dashboard_kpis(uuid) from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
