-- Appliquée via MCP (shop_pages_sections) : colonne shop_pages.sections jsonb + RPC shop_pages_list_server /
-- shop_page_save_server / shop_page_public mises à jour pour porter les sections (blocs) de page.
alter table public.shop_pages add column if not exists sections jsonb not null default '[]';
