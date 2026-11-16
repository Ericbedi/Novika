-- ==============================================================================
-- AFRIBUILDER COD PLATFORM - EXTENSIONS VAGUE 1 (K1 à K6)
-- Migration : tracking, delivery proofs, quick order drafts, templates,
--             pwa offline actions, themes catalog, plans & billing usage
-- ==============================================================================

-- 1. JETONS DE SUIVI CLIENT SÉCURISÉS (K1)
CREATE TABLE IF NOT EXISTS public.tracking_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 du jeton secret
    expires_at TIMESTAMPTZ NOT NULL,
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_tokens_hash ON public.tracking_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_order ON public.tracking_tokens(order_id);

-- 2. PREUVES DE LIVRAISON COD (K2)
CREATE TABLE IF NOT EXISTS public.delivery_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    proof_type VARCHAR(20) NOT NULL CHECK (proof_type IN ('none', 'code', 'photo')),
    code_entered VARCHAR(10),
    photo_url TEXT,
    rider_id UUID REFERENCES auth.users(id),
    has_rider_consent_geo BOOLEAN NOT NULL DEFAULT FALSE,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('verified', 'failed')),
    failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_delivery_proofs_order ON public.delivery_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_proofs_store ON public.delivery_proofs(store_id);

-- 3. CODES DE CONFIRMATION CLIENT OTP (K2)
CREATE TABLE IF NOT EXISTS public.delivery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    code_hash VARCHAR(64) NOT NULL,
    salt VARCHAR(32) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_codes_order ON public.delivery_codes(order_id);

-- 4. BROUILLONS DE COMMANDE RAPIDE VIA CONVERSATION (K3)
CREATE TABLE IF NOT EXISTS public.quick_order_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    raw_source_text TEXT NOT NULL,
    extracted_data JSONB NOT NULL,
    matched_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    matched_variant_id UUID,
    confidence_score NUMERIC(3, 2) NOT NULL DEFAULT 0.50,
    is_potential_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_details TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'rejected')),
    created_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMPTZ,
    created_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quick_order_drafts_store ON public.quick_order_drafts(store_id);

-- 5. MODÈLES DE MESSAGES WHATSAPP PRÉDÉFINIS (K3)
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('pricing', 'availability', 'confirmation', 'followup', 'delivery_tracking')),
    body_template TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_store ON public.message_templates(store_id);

-- 6. SOUSCRIPTIONS PUSH NOTIFICATIONS (K4)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

-- 7. FILE DE SYNCHRONISATION DES ACTIONS HORS-LIGNE (K4)
CREATE TABLE IF NOT EXISTS public.offline_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    client_timestamp TIMESTAMPTZ NOT NULL,
    server_synced_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'synced' CHECK (status IN ('pending', 'synced', 'conflict_skipped', 'failed')),
    conflict_resolved BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offline_actions_idemp ON public.offline_actions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_offline_actions_store ON public.offline_actions(store_id);

-- 8. CATALOGUE DES THÈMES VITRINE VALIDÉS (K5)
CREATE TABLE IF NOT EXISTS public.themes_catalog (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tagline VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    badge VARCHAR(50),
    preview_thumbnail TEXT NOT NULL,
    primary_color VARCHAR(10) NOT NULL,
    background_color VARCHAR(10) NOT NULL,
    font_family VARCHAR(50) NOT NULL DEFAULT 'Poppins',
    layout_style VARCHAR(40) NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. FORMULES ET PALIERS D'ABONNEMENT (K6)
CREATE TABLE IF NOT EXISTS public.plans (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('usage', 'flat_subscription')),
    price_monthly INTEGER NOT NULL DEFAULT 0, -- en centimes / plus petite unité
    price_yearly_discounted INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(5) NOT NULL DEFAULT 'XOF',
    delivered_orders_included INTEGER NOT NULL DEFAULT 0,
    overage_fee_per_delivered INTEGER NOT NULL DEFAULT 150,
    free_initial_orders INTEGER NOT NULL DEFAULT 0,
    max_stores INTEGER NOT NULL DEFAULT 1,
    max_members INTEGER NOT NULL DEFAULT 3,
    ai_credits_monthly INTEGER NOT NULL DEFAULT 50,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. JAUGE D'USAGE RÉEL PAR BOUTIQUE (K6 - Facturation sur commandes livrées)
CREATE TABLE IF NOT EXISTS public.usage_meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    plan_id VARCHAR(30) NOT NULL REFERENCES public.plans(id),
    delivered_orders_count INTEGER NOT NULL DEFAULT 0,
    received_orders_count INTEGER NOT NULL DEFAULT 0, -- informatif, JAMAIS facturé
    free_orders_remaining INTEGER NOT NULL DEFAULT 20,
    ai_credits_used INTEGER NOT NULL DEFAULT 0,
    ai_credits_limit INTEGER NOT NULL DEFAULT 50,
    is_over_quota BOOLEAN NOT NULL DEFAULT FALSE,
    invoice_amount_subunits INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(store_id, billing_period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_meters_store ON public.usage_meters(store_id);

-- 11. ABONNEMENTS ACTIFS ET SOUSCRIPTIONS (K6)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    plan_id VARCHAR(30) NOT NULL REFERENCES public.plans(id),
    billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    payment_provider VARCHAR(30) NOT NULL DEFAULT 'mobile_money',
    mobile_money_operator VARCHAR(20),
    mobile_money_phone VARCHAR(30),
    currency VARCHAR(5) NOT NULL DEFAULT 'XOF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_store ON public.subscriptions(store_id);

-- SÉCURITÉ RLS (Row Level Security)
ALTER TABLE public.tracking_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_order_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS publiques de lecture pour les jetons de suivi (page /suivi/[token])
CREATE POLICY "Public tracking tokens select by hash" ON public.tracking_tokens
    FOR SELECT TO anon, authenticated
    USING (expires_at > NOW() AND is_revoked = FALSE);

-- Politiques RLS boutique pour membres autorisés
CREATE POLICY "Store members manage quick order drafts" ON public.quick_order_drafts
    FOR ALL TO authenticated
    USING (store_id IN (SELECT store_id FROM public.store_members WHERE user_id = auth.uid()));

CREATE POLICY "Store owners manage subscriptions and usage" ON public.subscriptions
    FOR ALL TO authenticated
    USING (store_id IN (SELECT store_id FROM public.store_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Themes and Plans are readable by all authenticated" ON public.themes_catalog
    FOR SELECT TO authenticated, anon
    USING (is_active = TRUE);

CREATE POLICY "Plans readable by all authenticated" ON public.plans
    FOR SELECT TO authenticated, anon
    USING (TRUE);
