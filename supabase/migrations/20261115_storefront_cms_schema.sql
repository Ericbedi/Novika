-- =====================================================================================
-- Migration Supabase : Vitrine Publique, Éditeur CMS, Onboarding & Sécurité RLS
-- Plateforme AfriBuilder COD - Module Boutique en Ligne
-- Date: 15 Novembre 2026
-- =====================================================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------------------
-- 1. Table : themes (Modèles et palettes de design)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    preset VARCHAR(50) NOT NULL UNIQUE,
    colors JSONB NOT NULL,
    typography JSONB NOT NULL,
    styles JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------------------
-- 2. Table : storefronts (Vitrines des boutiques)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS storefronts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    subdomain VARCHAR(50) NOT NULL UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    last_draft_updated_at TIMESTAMPTZ DEFAULT NOW(),
    theme_id UUID REFERENCES themes(id),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_subdomain_format CHECK (subdomain ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$')
);

-- -------------------------------------------------------------------------------------
-- 3. Table : storefront_versions (Historique immuable des versions publiées)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS storefront_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storefront_id UUID NOT NULL REFERENCES storefronts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    config_snapshot JSONB NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(storefront_id, version_number)
);

-- -------------------------------------------------------------------------------------
-- 4. Table : pages (Pages de la vitrine : Accueil, À propos, CGV, etc.)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storefront_id UUID NOT NULL REFERENCES storefronts(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    page_type VARCHAR(50) DEFAULT 'custom',
    seo_meta JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(storefront_id, slug)
);

-- -------------------------------------------------------------------------------------
-- 5. Table : page_sections (Sections configurables de l'accueil)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS page_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    section_type VARCHAR(50) NOT NULL,
    title VARCHAR(150),
    position INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------------------
-- 6. Table : navigation_menus (Menus et liens)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS navigation_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storefront_id UUID NOT NULL REFERENCES storefronts(id) ON DELETE CASCADE,
    location VARCHAR(50) NOT NULL, -- 'header' ou 'footer'
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------------------
-- 7. Table : store_contacts (Coordonnées et zones de livraison)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    whatsapp_number VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    opening_hours VARCHAR(150),
    social_links JSONB DEFAULT '{}'::jsonb,
    delivery_zones JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------------------
-- 8. Table : contact_messages (Messages reçus avec protection honeypot & IP)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sender_name VARCHAR(150) NOT NULL,
    sender_phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    ip_address INET,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------------------
-- 9. Table : media_assets (Bibliothèque de fichiers et médias)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------------------
-- 10. Table : onboarding_steps (Suivi calculé des étapes d'installation)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    step_key VARCHAR(50) NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(store_id, step_key)
);

-- -------------------------------------------------------------------------------------
-- 11. Table : preview_tokens (Jetons signés d'aperçu privé avec expiration)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preview_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storefront_id UUID NOT NULL REFERENCES storefronts(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------------------
-- 12. Table : store_reports (Signalements de sécurité, phishing et contrefaçon)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    reporter_email VARCHAR(150),
    reporter_ip INET,
    status VARCHAR(30) DEFAULT 'pending', -- pending, investigated, dismissed, store_suspended
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------------------
-- 13. Fonction de validation : Blocage des sous-domaines réservés
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_reserved_subdomain()
RETURNS TRIGGER AS $$
DECLARE
    reserved TEXT[] := ARRAY['www', 'app', 'api', 'admin', 'administrator', 'support', 'mail', 'auth', 'login', 'billing', 'dashboard', 'static', 'cdn', 'root', 'help'];
BEGIN
    IF NEW.subdomain = ANY(reserved) THEN
        RAISE EXCEPTION 'Le sous-domaine % est réservé par la plateforme AfriBuilder.', NEW.subdomain;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_reserved_subdomain
BEFORE INSERT OR UPDATE OF subdomain ON storefronts
FOR EACH ROW EXECUTE FUNCTION check_reserved_subdomain();

-- -------------------------------------------------------------------------------------
-- 14. Vue Sécurisée Publique : public_storefront_catalog
-- Garantit qu'AUCUN prix de revient, AUCUNE marge et AUCUN fournisseur n'est exposé.
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public_storefront_catalog AS
SELECT 
    p.id AS product_id,
    p.store_id,
    p.name,
    p.slug,
    p.description,
    p.category,
    p.collection_id,
    p.images,
    p.sale_price,
    p.compare_at_price,
    CASE 
        WHEN p.stock <= 0 THEN 'out_of_stock'
        WHEN p.stock <= p.low_stock_threshold THEN 'low_stock'
        ELSE 'in_stock'
    END AS stock_availability,
    p.variants,
    p.quantity_offers
FROM products p
WHERE p.product_status = 'active';

-- -------------------------------------------------------------------------------------
-- 15. Politiques de Sécurité Row Level Security (RLS)
-- -------------------------------------------------------------------------------------
ALTER TABLE storefronts ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE preview_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_reports ENABLE ROW LEVEL SECURITY;

-- Les propriétaires et administrateurs peuvent lire et modifier leur boutique
CREATE POLICY rls_storefront_owner_admin ON storefronts
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.store_id = storefronts.store_id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'admin')
    )
);

-- Les visiteurs publics peuvent lire UNIQUEMENT les vitrines publiées
CREATE POLICY rls_storefront_public_read ON storefronts
FOR SELECT TO anon
USING (is_published = true);

-- Les messages de contact peuvent être insérés par tout visiteur public
CREATE POLICY rls_contact_messages_insert ON contact_messages
FOR INSERT TO anon
WITH CHECK (true);

-- Seuls les propriétaires et administrateurs de la boutique peuvent lire les messages de contact
CREATE POLICY rls_contact_messages_select ON contact_messages
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.store_id = contact_messages.store_id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'admin')
    )
);
