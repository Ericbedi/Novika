-- ==============================================================================
-- AFRIBUILDER : EXTENSION BANNIÈRES, DEVISES AFRICAINES, THÈMES & BÊTA PRIVÉE
-- MIGRATION SQL SUPABASE (17 TABLES AVEC CONTRAINTES, INDEX ET POLITIQUES RLS)
-- ==============================================================================

-- 1. TABLE DES DEVISES OFFICIELLES (ISO 4217)
CREATE TABLE IF NOT EXISTS public.currencies (
    code VARCHAR(3) PRIMARY KEY, -- ISO 4217 (ex: XOF, NGN, KES)
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(15) NOT NULL,
    decimals SMALLINT NOT NULL CHECK (decimals IN (0, 2, 3)),
    smallest_unit_name VARCHAR(50) NOT NULL,
    is_african BOOLEAN NOT NULL DEFAULT true,
    cma_parity_zar BOOLEAN NOT NULL DEFAULT false, -- Parité 1:1 avec le Rand sud-africain (CMA)
    is_international BOOLEAN NOT NULL DEFAULT false,
    disabled_by_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PARAMÈTRES DE DEVISE PAR BOUTIQUE (1 BOUTIQUE = 1 DEVISE PRINCIPALE)
CREATE TABLE IF NOT EXISTS public.shop_currency_settings (
    shop_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    primary_currency VARCHAR(3) NOT NULL REFERENCES public.currencies(code),
    has_orders BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    lock_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_lock_consistency CHECK (NOT (has_orders = true AND is_locked = false))
);

-- 3. GESTION DES TAUX DE CHANGE DATÉS POUR CONSOLIDATION ORGANISATIONNELLE
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(3) NOT NULL REFERENCES public.currencies(code),
    to_currency VARCHAR(3) NOT NULL REFERENCES public.currencies(code),
    rate_scaled BIGINT NOT NULL, -- Taux multiplié par 1 000 000 pour éviter les flottants
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_currency_pair_date UNIQUE (from_currency, to_currency, effective_date)
);

-- 4. BANNIÈRES D'IMAGES (ACCUEIL, CATALOGUE, PROMOTIONS)
CREATE TABLE IF NOT EXISTS public.banner_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    placement VARCHAR(30) NOT NULL CHECK (placement IN ('hero_carousel', 'collection', 'promotional_middle')),
    title VARCHAR(150),
    subtitle TEXT,
    button_text VARCHAR(60),
    destination_url TEXT,
    alt_text VARCHAR(255) NOT NULL, -- Requis pour l'accessibilité WCAG
    desktop_image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    focal_point_x SMALLINT NOT NULL DEFAULT 50 CHECK (focal_point_x BETWEEN 0 AND 100),
    focal_point_y SMALLINT NOT NULL DEFAULT 50 CHECK (focal_point_y BETWEEN 0 AND 100),
    overlay_opacity SMALLINT NOT NULL DEFAULT 40 CHECK (overlay_opacity BETWEEN 0 AND 80),
    text_color VARCHAR(7) NOT NULL DEFAULT '#FFFFFF' CHECK (text_color IN ('#FFFFFF', '#111111')),
    text_position VARCHAR(30) NOT NULL DEFAULT 'middle_left' CHECK (text_position IN ('middle_center', 'middle_left', 'middle_right', 'bottom_left', 'bottom_center')),
    display_order SMALLINT NOT NULL DEFAULT 1,
    duration_seconds SMALLINT NOT NULL DEFAULT 5 CHECK (duration_seconds >= 5),
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. BIBLIOTHÈQUE MÉDIA & ASSETS
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(50) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    file_size_bytes BIGINT NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    is_used_in_banner BOOLEAN NOT NULL DEFAULT false,
    is_used_in_product BOOLEAN NOT NULL DEFAULT false,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. QUOTAS DE STOCKAGE MÉDIA
CREATE TABLE IF NOT EXISTS public.org_quotas (
    shop_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    plan_id VARCHAR(20) NOT NULL CHECK (plan_id IN ('starter', 'pro', 'scale')),
    used_bytes BIGINT NOT NULL DEFAULT 0,
    max_bytes BIGINT NOT NULL DEFAULT 524288000, -- 500 Mo en starter
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. PALETTES DE THÈME ET JETONS HEXADÉCIMAUX STRICTS
CREATE TABLE IF NOT EXISTS public.theme_palettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    palette_name VARCHAR(100) NOT NULL,
    primary_color VARCHAR(7) NOT NULL CHECK (primary_color ~* '^#[A-Fa-f0-9]{6}$'),
    primary_hover VARCHAR(7) NOT NULL CHECK (primary_hover ~* '^#[A-Fa-f0-9]{6}$'),
    accent_color VARCHAR(7) CHECK (accent_color ~* '^#[A-Fa-f0-9]{6}$'),
    wcag_contrast_ratio NUMERIC(4,2) NOT NULL,
    is_wcag_aa_compliant BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. CODES D'INVITATION BÊTA PRIVÉE
CREATE TABLE IF NOT EXISTS public.beta_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    organization_name VARCHAR(150),
    recipient_email VARCHAR(255),
    max_uses INT NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
    times_used INT NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. LISTE D'ATTENTE BÊTA PRIVÉE
CREATE TABLE IF NOT EXISTS public.beta_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    country VARCHAR(3) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    monthly_orders_estimated VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'rejected')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. ACCEPTATION VERSIONNÉE DES CONDITIONS BÊTA
CREATE TABLE IF NOT EXISTS public.beta_terms_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    terms_version VARCHAR(30) NOT NULL, -- Ex: "2026-beta-v1"
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ip_hash VARCHAR(64) NOT NULL -- Hachage anonymisé sans stockage de l'IP brute
);

-- 11. INTERRUPTEURS DE FONCTIONNALITÉS (FEATURE FLAGS)
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL,
    is_enabled_globally BOOLEAN NOT NULL DEFAULT false,
    rollout_percentage SMALLINT NOT NULL DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by VARCHAR(255) NOT NULL
);

-- 12. RÈGLES CIBLÉES PAR BOUTIQUE POUR FEATURE FLAGS
CREATE TABLE IF NOT EXISTS public.feature_flag_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(80) NOT NULL REFERENCES public.feature_flags(key) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_flag_shop UNIQUE (flag_key, shop_id)
);

-- 13. RETOURS TESTEURS BÊTA (FEEDBACKS SANS PII)
CREATE TABLE IF NOT EXISTS public.feedback_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    category VARCHAR(30) NOT NULL CHECK (category IN ('bug', 'suggestion', 'satisfaction', 'other')),
    satisfaction_rating SMALLINT CHECK (satisfaction_rating BETWEEN 1 AND 5),
    message TEXT NOT NULL,
    browser_info VARCHAR(150),
    os_info VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. ACCÈS SUPPORT TEMPORAIRE OCTROYÉ PAR LE VENDEUR
CREATE TABLE IF NOT EXISTS public.support_access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    granted_by_user_id UUID NOT NULL,
    granted_to_admin_email VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. JOURNAL D'AUDIT IMMUABLE DE LA PLATEFORME (SANS PII)
CREATE TABLE IF NOT EXISTS public.platform_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id VARCHAR(100) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(80) NOT NULL,
    target_resource VARCHAR(150) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 16. ANNONCES ET MESSAGES DÉFILANTS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    message VARCHAR(255) NOT NULL,
    link_url TEXT,
    bg_color VARCHAR(7) DEFAULT '#111111',
    text_color VARCHAR(7) DEFAULT '#FAF8F5',
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 17. COUPE-CIRCUITS ET ÉTAT GLOBAL DU SYSTÈME (KILL SWITCHES)
CREATE TABLE IF NOT EXISTS public.system_status (
    id VARCHAR(10) PRIMARY KEY DEFAULT 'current',
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT NOT NULL DEFAULT 'AfriBuilder effectue une maintenance programmée.',
    block_signups BOOLEAN NOT NULL DEFAULT false,
    block_orders BOOLEAN NOT NULL DEFAULT false,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by VARCHAR(255) NOT NULL
);

-- ==============================================================================
-- INDEX D'OPTIMISATION DE PERFORMANCES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_banner_slides_shop_placement ON public.banner_slides(shop_id, placement, display_order);
CREATE INDEX IF NOT EXISTS idx_media_assets_shop ON public.media_assets(shop_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_code ON public.beta_invitations(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_support_grants_shop_expires ON public.support_access_grants(shop_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_platform_audit_created ON public.platform_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_created ON public.feedback_reports(created_at DESC);

-- ==============================================================================
-- POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.banner_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_currency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;

-- Les visiteurs publics peuvent lire les diapositives actives des boutiques publiées
CREATE POLICY "Public read active banners" ON public.banner_slides
    FOR SELECT USING (is_active = true);

-- Les commerçants gèrent leurs propres bannières
CREATE POLICY "Shop owners manage banners" ON public.banner_slides
    FOR ALL USING (shop_id = auth.uid());

-- Les commerçants gèrent leurs propres fichiers média
CREATE POLICY "Shop owners manage media" ON public.media_assets
    FOR ALL USING (shop_id = auth.uid());

-- Journal d'audit : uniquement accessible par les super-admins (lecture seule pour intégrité)
CREATE POLICY "Superadmin read audit log" ON public.platform_audit_log
    FOR SELECT USING (auth.jwt() ->> 'role' = 'superadmin');
