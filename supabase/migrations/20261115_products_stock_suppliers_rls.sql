-- ==============================================================================
-- Migration : Module Produits, Stock, Fournisseurs, Achats, Collections & RLS
-- Date : 15 Novembre 2026
-- Plateforme : AfriBuilder (COD Afrique de l'Ouest)
-- ==============================================================================

-- 1. Types ENUM
DO $$ BEGIN
    CREATE TYPE product_status_type AS ENUM ('active', 'draft', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_status_type AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE po_status_type AS ENUM ('draft', 'ordered', 'shipped', 'partially_received', 'received', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_movement_reason_type AS ENUM ('delivery', 'return', 'purchase_receipt', 'inventory_adjustment', 'loss_damage');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Table des Lieux de Stockage / Entrepôts (locations)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL, -- Ex: "Entrepôt Principal Lomé", "Hub Abidjan"
    city VARCHAR(100) NOT NULL,
    country VARCHAR(10) NOT NULL, -- TG, CI, SN, BJ
    is_default BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table Fournisseurs (suppliers) - Restreint Propriétaire / Admin
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    contact_name VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(150),
    currency VARCHAR(10) DEFAULT 'XOF',
    lead_time_days INT DEFAULT 15,
    moq INT DEFAULT 50,
    payment_terms TEXT,
    notes TEXT,
    actual_lead_time_days INT DEFAULT 18,
    defect_rate_percent DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Table Collections (collections)
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    description TEXT,
    image_url TEXT,
    type VARCHAR(50) DEFAULT 'manual', -- 'manual' ou 'automated'
    rules JSONB DEFAULT '[]'::jsonb,
    position INT DEFAULT 0,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Table Produits (products)
-- Les colonnes de coûts financiers et fournisseurs sont protégées
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    type VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    sale_price INT NOT NULL, -- en FCFA
    compare_at_price INT,
    cost_price INT NOT NULL, -- PUMP confidentiel propriétaire/admin
    charge_tax BOOLEAN DEFAULT false,
    track_quantity BOOLEAN DEFAULT true,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    low_stock_threshold INT DEFAULT 10,
    is_physical BOOLEAN DEFAULT true,
    weight_grams INT DEFAULT 250,
    abc_class VARCHAR(2) DEFAULT 'A', -- 'A', 'B' ou 'C'
    sales_velocity DECIMAL(7,2) DEFAULT 0.0, -- unités livrées / jour
    status product_status_type DEFAULT 'active',
    stock_status stock_status_type DEFAULT 'in_stock',
    badges_config JSONB DEFAULT '{}'::jsonb,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Table Options de Produits (product_options)
CREATE TABLE IF NOT EXISTS product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Ex: "Taille", "Couleur", "Formule"
    position INT DEFAULT 0,
    values JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 7. Table Variantes (variants)
CREATE TABLE IF NOT EXISTS variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL, -- Ex: "Flacon 30ml / Noir"
    sku VARCHAR(100),
    barcode VARCHAR(100),
    price INT NOT NULL, -- en FCFA
    cost_price INT NOT NULL, -- en FCFA
    weight_grams INT DEFAULT 200,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Table Médias Produits (product_media)
CREATE TABLE IF NOT EXISTS product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) DEFAULT 'image', -- 'image' ou 'video'
    position INT DEFAULT 0,
    alt_text VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Table Liaison Produits - Collections (product_collections)
CREATE TABLE IF NOT EXISTS product_collections (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    position INT DEFAULT 0,
    PRIMARY KEY (product_id, collection_id)
);

-- 10. Table Produits Fournisseurs (supplier_products)
CREATE TABLE IF NOT EXISTS supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_sku VARCHAR(100),
    unit_cost INT NOT NULL, -- en FCFA
    moq INT DEFAULT 10,
    lead_time_days INT DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Table Niveaux de Stock (stock_levels)
-- Disponible = Physique - Réservé
CREATE TABLE IF NOT EXISTS stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    physical_stock INT NOT NULL DEFAULT 0,
    reserved_stock INT NOT NULL DEFAULT 0,
    in_transit_stock INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Colonne générée disponible :
ALTER TABLE stock_levels
ADD COLUMN IF NOT EXISTS available_stock INT GENERATED ALWAYS AS (physical_stock - reserved_stock) STORED;

-- 12. Table Mouvements de Stock (stock_movements)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    delta INT NOT NULL, -- +50 ou -2
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason stock_movement_reason_type NOT NULL,
    reason_label VARCHAR(255) NOT NULL,
    reference_id VARCHAR(100), -- Réf commande ou PO
    author VARCHAR(150) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Table Paramètres de Réapprovisionnement (reorder_settings)
CREATE TABLE IF NOT EXISTS reorder_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_lead_time_days INT DEFAULT 18,
    safety_stock_days INT DEFAULT 7,
    target_coverage_days INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Table Bons d'Achat Fournisseurs (purchase_orders)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    po_number VARCHAR(50) NOT NULL UNIQUE, -- Ex: PO-2026-042
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status po_status_type DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    estimated_arrival_date DATE,
    actual_arrival_date DATE,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    destination_location_id UUID REFERENCES locations(id),
    shipping_fee INT DEFAULT 0,
    customs_fee INT DEFAULT 0,
    agent_fee INT DEFAULT 0,
    total_landed_costs INT GENERATED ALWAYS AS (shipping_fee + customs_fee + agent_fee) STORED,
    total_items_cost INT DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Table Lignes de Bons d'Achat (purchase_order_items)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES variants(id),
    quantity_ordered INT NOT NULL,
    quantity_received INT NOT NULL DEFAULT 0,
    quantity_defective INT NOT NULL DEFAULT 0,
    unit_cost INT NOT NULL, -- Prix d'achat unitaire brut (FCFA)
    landed_cost_share INT DEFAULT 0, -- Quote-part transport + douane
    final_unit_landed_cost INT DEFAULT 0 -- Coût unitaire complet rendu entrepôt
);

-- 16. Table Événements de Bon d'Achat (purchase_order_events)
CREATE TABLE IF NOT EXISTS purchase_order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    status po_status_type NOT NULL,
    description TEXT NOT NULL,
    author VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 17. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Activation RLS sur toutes les tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reorder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Politiques pour les Fournisseurs et Achats : PROPRIÉTAIRE ET ADMIN UNIQUEMENT
-- Les closeuses, livreurs et agences n'ont strictement AUCUN accès (0 ligne visible)
CREATE POLICY "suppliers_owner_admin_full" ON suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND active = true
        )
    );

CREATE POLICY "purchase_orders_owner_admin_full" ON purchase_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND active = true
        )
    );

CREATE POLICY "purchase_order_items_owner_admin_full" ON purchase_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND active = true
        )
    );

CREATE POLICY "reorder_settings_owner_admin_full" ON reorder_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND active = true
        )
    );

-- Politiques Produits :
-- Propriétaire & Admin : Accès complet
CREATE POLICY "products_owner_admin_full" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND active = true
        )
    );

-- Closeuse : Lecture catalogue actif uniquement
CREATE POLICY "products_closer_view" ON products
    FOR SELECT USING (
        status = 'active'
        AND EXISTS (
            SELECT 1 FROM team_members
            WHERE user_id = auth.uid()
            AND role = 'closer'
            AND active = true
        )
    );

-- Vue sécurisée pour Closeuses sans les données de coût/marge :
CREATE OR REPLACE VIEW closer_products_catalog AS
SELECT
    p.id,
    p.store_id,
    p.title,
    p.slug,
    p.description,
    p.category,
    p.type,
    p.sale_price,
    p.compare_at_price,
    p.status,
    p.stock_status,
    sl.available_stock
FROM products p
LEFT JOIN stock_levels sl ON p.id = sl.product_id
WHERE p.status = 'active';

-- Politiques Stock :
-- Propriétaire & Admin : Accès complet
CREATE POLICY "stock_levels_owner_admin_full" ON stock_levels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND active = true
        )
    );

-- Closeuse : Lecture du stock disponible uniquement
CREATE POLICY "stock_levels_closer_view" ON stock_levels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE user_id = auth.uid()
            AND role = 'closer'
            AND active = true
        )
    );

-- ==============================================================================
-- 18. DÉCLENCHEUR MÉTIER : MISE À JOUR DU COÛT MOYEN PONDÉRÉ (PUMP)
-- À la réception d'un bon d'achat, le stock physique augmente et le coût unitaire
-- est automatiquement recalculé avec inclusion des frais d'approche réels.
-- ==============================================================================
CREATE OR REPLACE FUNCTION process_purchase_order_receipt()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    current_physical INT;
    current_cost INT;
    new_physical INT;
    new_unit_pump INT;
BEGIN
    -- S'exécute uniquement lors du passage à 'received' ou 'partially_received'
    IF NEW.status IN ('received', 'partially_received') AND OLD.status NOT IN ('received', 'partially_received') THEN
        FOR item IN SELECT * FROM purchase_order_items WHERE purchase_order_id = NEW.id LOOP
            -- Récupérer l'ancien stock et ancien coût du produit
            SELECT cost_price INTO current_cost FROM products WHERE id = item.product_id;
            SELECT COALESCE(SUM(physical_stock), 0) INTO current_physical FROM stock_levels WHERE product_id = item.product_id;

            -- Calcul du nouveau coût unitaire moyen pondéré (PUMP)
            new_physical := current_physical + item.quantity_received;
            IF new_physical > 0 THEN
                new_unit_pump := ((current_physical * current_cost) + (item.quantity_received * item.final_unit_landed_cost)) / new_physical;
            ELSE
                new_unit_pump := item.final_unit_landed_cost;
            END IF;

            -- Mettre à jour le produit avec le nouveau coût de revient PUMP
            UPDATE products
            SET cost_price = new_unit_pump,
                updated_at = now()
            WHERE id = item.product_id;

            -- Incrémenter le stock physique dans le stock_level de destination
            UPDATE stock_levels
            SET physical_stock = physical_stock + item.quantity_received,
                updated_at = now()
            WHERE product_id = item.product_id
            AND location_id = NEW.destination_location_id;

            -- Enregistrer le mouvement de stock
            INSERT INTO stock_movements (
                product_id,
                variant_id,
                location_id,
                delta,
                previous_stock,
                new_stock,
                reason,
                reason_label,
                reference_id,
                author,
                notes
            ) VALUES (
                item.product_id,
                item.variant_id,
                NEW.destination_location_id,
                item.quantity_received,
                current_physical,
                new_physical,
                'purchase_receipt',
                'Réception bon de commande ' || NEW.po_number,
                NEW.po_number,
                'Système Réception Achats',
                'PUMP recalculé : ' || new_unit_pump || ' FCFA'
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_po_receipt ON purchase_orders;
CREATE TRIGGER trg_po_receipt
AFTER UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION process_purchase_order_receipt();
