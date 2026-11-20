-- ==============================================================================
-- Migration : Réglages de Stock par Boutique & Réservations (Prompt 16-b)
-- Date : 19 Novembre 2026
-- Plateforme : Novika / AfriBuilder (COD Afrique de l'Ouest)
-- ATTENTION : Ne rien appliquer en production sans l'accord explicite de l'administrateur.
-- ==============================================================================

-- 1. Types ENUM pour les réglages de stock
DO $$ BEGIN
    CREATE TYPE out_of_stock_visibility_type AS ENUM ('show_badge', 'hide');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_reservation_timing_type AS ENUM ('on_order_received', 'on_closer_confirmation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE out_of_stock_override_type AS ENUM ('store_default', 'always_show', 'always_hide');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ajout de la surcharge de rupture sur la table products
ALTER TABLE IF EXISTS products
    ADD COLUMN IF NOT EXISTS out_of_stock_visibility_override out_of_stock_override_type DEFAULT 'store_default';

-- 3. Ajout du statut 'pending_stock' au type order_status si existant
DO $$ BEGIN
    ALTER TYPE order_status_type ADD VALUE IF NOT EXISTS 'pending_stock';
EXCEPTION
    WHEN others THEN null;
END $$;

-- 4. Table des Réglages de Stock par Boutique (shop_stock_settings)
CREATE TABLE IF NOT EXISTS shop_stock_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    out_of_stock_visibility out_of_stock_visibility_type NOT NULL DEFAULT 'show_badge',
    reservation_timing stock_reservation_timing_type NOT NULL DEFAULT 'on_order_received',
    reservation_timeout_hours INT NOT NULL DEFAULT 48 CHECK (reservation_timeout_hours >= 1 AND reservation_timeout_hours <= 168),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by VARCHAR(150) DEFAULT 'Administrateur',
    CONSTRAINT unique_store_stock_settings UNIQUE (store_id)
);

-- Index pour recherche rapide par boutique
CREATE INDEX IF NOT EXISTS idx_shop_stock_settings_store ON shop_stock_settings(store_id);

-- 5. Table des Réservations Actives de Stock (stock_reservations)
CREATE TABLE IF NOT EXISTS stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    product_id UUID NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    reserved_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    timing stock_reservation_timing_type NOT NULL,
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_store_order ON stock_reservations(store_id, order_number);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_expiry ON stock_reservations(expires_at) WHERE is_confirmed = false;

-- 6. Table du Journal d'Audit de Stock (stock_audit_logs)
CREATE TABLE IF NOT EXISTS stock_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(150) NOT NULL,
    user_role VARCHAR(50),
    details TEXT NOT NULL,
    previous_settings JSONB,
    new_settings JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_audit_logs_store ON stock_audit_logs(store_id, created_at DESC);

-- 7. Politiques de Sécurité RLS (Row Level Security)
ALTER TABLE shop_stock_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_audit_logs ENABLE ROW LEVEL SECURITY;

-- Lecture publique de la visibilité pour la vitrine
CREATE POLICY "Public storefront can read stock visibility"
    ON shop_stock_settings
    FOR SELECT
    USING (true);

-- Modification réservée aux administrateurs et propriétaires de la boutique
CREATE POLICY "Only store owners and admins can update stock settings"
    ON shop_stock_settings
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM shop_members
            WHERE shop_id = shop_stock_settings.store_id
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Admins and system can manage stock reservations"
    ON stock_reservations
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM shop_members
            WHERE shop_id = stock_reservations.store_id
            AND role IN ('owner', 'admin', 'closer')
        )
    );

CREATE POLICY "Admins can view stock audit logs"
    ON stock_audit_logs
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM shop_members
            WHERE shop_id = stock_audit_logs.store_id
            AND role IN ('owner', 'admin')
        )
    );
