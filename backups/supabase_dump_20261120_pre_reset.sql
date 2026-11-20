-- ==============================================================================
-- SAUVEGARDE COMPLÈTE NOVIKA (PRÉ-RESET) - 20 Novembre 2026
-- ==============================================================================

-- 1. SHOPS
INSERT INTO shops (id, owner_email, name, slug, country_code, primary_currency, created_at, updated_at)
VALUES ('b7e5c920-410a-4a2f-98f1-85e8d3810001', 'promisesbedi@gmail.com', 'Kelio', 'kelio', 'TG', 'XOF', '2026-11-20T15:54:36.983788+00:00', '2026-11-20T15:54:36.983788+00:00')
ON CONFLICT (id) DO NOTHING;

-- 2. LOCATIONS
INSERT INTO locations (id, store_id, name, city, country, is_default, active, created_at)
VALUES ('a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', 'b7e5c920-410a-4a2f-98f1-85e8d3810001', 'Entrepôt Principal Kelio', 'Lomé', 'TG', true, true, '2026-11-20T15:54:36.983788+00:00')
ON CONFLICT (id) DO NOTHING;

-- 3. PRODUCTS
INSERT INTO products (id, store_id, title, slug, description, category, type, supplier_id, sale_price, compare_at_price, cost_price, charge_tax, track_quantity, sku, barcode, low_stock_threshold, is_physical, weight_grams, abc_class, sales_velocity, status, stock_status, badges_config, deleted_at, created_at, updated_at, published_to_storefront, legacy_id, short_code)
VALUES 
('c8f6d031-521b-4b30-a902-96f9e4920002', 'b7e5c920-410a-4a2f-98f1-85e8d3810001', 'Accompagnez votre équilibre glycémique', 'accompagnez-votre-equilibre-glycemique', '<p>Formule naturelle synergique conçue pour aider à maintenir une glycémie équilibrée, réguler l''appétit et favoriser un métabolisme énergétique sain au quotidien.</p>', 'Santé & Bien-être', 'Complément alimentaire', null, 18500, 25000, 7000, false, true, null, null, 10, true, 250, 'A', 0, 'active', 'in_stock', '{}'::jsonb, null, '2026-11-20T15:54:36.983788+00:00', '2026-11-20T15:54:36.983788+00:00', true, null, 'glyc01'),
('6061f941-f956-4ce5-911b-a4bf327ccdc6', 'b7e5c920-410a-4a2f-98f1-85e8d3810001', 'Test Produit Sync', 'test-produit-sync', '', 'Santé & Bien-être', 'Standard', null, 12000, null, 0, false, true, 'SKU-43727c', null, 10, true, 250, 'A', 0, 'archived', 'in_stock', '{}'::jsonb, '2026-11-20T17:46:25.991531+00:00', '2026-11-20T17:46:03.451445+00:00', '2026-11-20T17:46:03.451445+00:00', true, 'prod_imp_test_123', '3c9378')
ON CONFLICT (id) DO NOTHING;

-- 4. VARIANTS
INSERT INTO variants (id, product_id, title, sku, barcode, price, cost_price, weight_grams, image_url, created_at)
VALUES 
('ea88f253-743d-4d52-c124-18ab26140004', 'c8f6d031-521b-4b30-a902-96f9e4920002', 'Flacon 60 gélules', 'KEL-GLYC-60', null, 18500, 7000, 200, null, '2026-11-20T15:54:36.983788+00:00'),
('d6064468-b905-43c0-9c35-aeabb4cf75bf', '6061f941-f956-4ce5-911b-a4bf327ccdc6', 'Standard', 'SKU-43727c', null, 12000, 0, 200, null, '2026-11-20T17:46:03.451445+00:00')
ON CONFLICT (id) DO NOTHING;

-- 5. PRODUCT MEDIA
INSERT INTO product_media (id, product_id, media_url, media_type, position, alt_text, created_at)
VALUES 
('fb99a364-854e-4e63-d235-29bc37250005', 'c8f6d031-521b-4b30-a902-96f9e4920002', '/products/serum-eclat.png', 'image', 0, 'Accompagnez votre équilibre glycémique', '2026-11-20T15:54:36.983788+00:00'),
('5a05100c-194d-4010-8432-b572db5ad77e', '6061f941-f956-4ce5-911b-a4bf327ccdc6', '/products/serum-eclat.png', 'image', 0, 'Test Produit Sync', '2026-11-20T17:46:03.451445+00:00')
ON CONFLICT (id) DO NOTHING;

-- 6. STOCK LEVELS
INSERT INTO stock_levels (id, product_id, variant_id, location_id, physical_stock, reserved_stock, in_transit_stock, available_stock, updated_at)
VALUES 
('d9a7e142-632c-4c41-b013-07fa15030003', 'c8f6d031-521b-4b30-a902-96f9e4920002', 'ea88f253-743d-4d52-c124-18ab26140004', 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', 45, 0, 0, 45, '2026-11-20T15:54:36.983788+00:00'),
('50a7597f-2666-432d-81e6-cc1e3939faec', '6061f941-f956-4ce5-911b-a4bf327ccdc6', 'd6064468-b905-43c0-9c35-aeabb4cf75bf', 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', 15, 0, 0, 15, '2026-11-20T17:46:03.451445+00:00')
ON CONFLICT (id) DO NOTHING;
