-- ==============================================================================
-- MIGRATION: 54 PAYS AFRICAINS, ZONES DE LIVRAISON PAR VILLE, TRANSPORTEURS,
-- PREUVES DE PAIEMENT PRÉPAYÉ & RÈGLE ABSOLUE DE LIVRAISON GRATUITE CLIENT
-- Date: 15 Novembre 2026
-- ==============================================================================

-- 1. Table des devises officielles ISO 4217
CREATE TABLE IF NOT EXISTS public.currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimals SMALLINT NOT NULL CHECK (decimals IN (0, 2, 3)),
    smallest_unit_name VARCHAR(50) NOT NULL,
    is_african BOOLEAN NOT NULL DEFAULT TRUE,
    cma_pegged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Table des 54 pays africains officiels
CREATE TABLE IF NOT EXISTS public.countries (
    code VARCHAR(2) PRIMARY KEY, -- ISO 3166-1 alpha-2
    name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    region VARCHAR(20) NOT NULL CHECK (region IN ('north', 'west', 'central', 'east', 'southern')),
    official_currency VARCHAR(3) NOT NULL REFERENCES public.currencies(code),
    accepted_currencies TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    default_dial_code VARCHAR(10) NOT NULL,
    capital VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Extension de la table des boutiques (Shops) avec verrouillage de devise
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    country_code VARCHAR(2) NOT NULL REFERENCES public.countries(code),
    primary_currency VARCHAR(3) NOT NULL REFERENCES public.currencies(code),
    currency_locked BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_policy VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (delivery_policy = 'free'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Table des pays desservis par boutique (Zone monétaire partagée)
CREATE TABLE IF NOT EXISTS public.shop_countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL REFERENCES public.countries(code),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(shop_id, country_code)
);

-- 5. Équipes par pays (Country teams)
CREATE TABLE IF NOT EXISTS public.country_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL REFERENCES public.countries(code),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('country_lead', 'closer', 'rider_lead', 'finance')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(shop_id, country_code, user_id)
);

-- 6. Table des Transporteurs et Agences Relais (Carriers)
CREATE TABLE IF NOT EXISTS public.carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    supported_payment_modes TEXT[] NOT NULL DEFAULT ARRAY['prepaid']::TEXT[],
    average_delivery_days VARCHAR(50) NOT NULL DEFAULT '3 à 5 jours',
    seller_reference_rate INTEGER NOT NULL DEFAULT 2500, -- Coût vendeur en centimes/unités
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Table des Points Relais des Transporteurs (Pickup Points)
CREATE TABLE IF NOT EXISTS public.pickup_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    opening_hours VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Table des Zones de Livraison par Ville (Shipping Zones)
CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    city_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) NOT NULL REFERENCES public.countries(code),
    zone_type VARCHAR(20) NOT NULL CHECK (zone_type IN ('local', 'expedition', 'not_served')),
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('cod', 'prepaid', 'cod_pickup')),
    carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
    default_pickup_point_id UUID REFERENCES public.pickup_points(id) ON DELETE SET NULL,
    seller_cost INTEGER NOT NULL DEFAULT 1000, -- Coût livraison supporté par le vendeur
    client_delivery_fee INTEGER NOT NULL DEFAULT 0 CHECK (client_delivery_fee = 0), -- RÈGLE ABSOLUE : GRATUITE POUR LE CLIENT
    estimated_delivery_time VARCHAR(50) NOT NULL DEFAULT '24h à 48h',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(shop_id, city_name, country_code)
);

-- 9. Table des Méthodes de Paiement Mobile Money du Vendeur (Payment Methods)
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('tmoney', 'flooz', 'wave', 'orange_money', 'mtn_momo', 'bank_transfer')),
    provider_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Table des Expéditions (Shipments)
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
    pickup_point_id UUID REFERENCES public.pickup_points(id) ON DELETE SET NULL,
    waybill_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'in_transit', 'ready_for_pickup', 'delivered', 'not_collected', 'returned')),
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Table des Preuves de Paiement Client (Payment Proofs)
CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    order_number VARCHAR(100) NOT NULL,
    transaction_reference VARCHAR(100) NOT NULL UNIQUE, -- UNICITÉ OBLIGATOIRE (Anti-rejouement)
    payment_method VARCHAR(50) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(50) NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL REFERENCES public.currencies(code),
    screenshot_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Quotas d'invitation et demandes d'adhésion (Join requests)
CREATE TABLE IF NOT EXISTS public.invitation_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_invites_allowed INTEGER NOT NULL DEFAULT 5,
    invites_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    requested_role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique pour pays, devises et points relais
CREATE POLICY "Currencies read policy" ON public.currencies FOR SELECT USING (true);
CREATE POLICY "Countries read policy" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Carriers read policy" ON public.carriers FOR SELECT USING (true);
CREATE POLICY "Pickup points read policy" ON public.pickup_points FOR SELECT USING (true);

-- Politiques d'accès aux boutiques et zones
CREATE POLICY "Shops select for authenticated users" ON public.shops
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Shops insert for authenticated users" ON public.shops
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Shipping zones read policy" ON public.shipping_zones
    FOR SELECT USING (true);

CREATE POLICY "Payment proofs insert for public orders" ON public.payment_proofs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Payment proofs select for shop staff" ON public.payment_proofs
    FOR SELECT TO authenticated USING (true);

-- Trigger pour verrouiller irréversiblement la devise de la boutique après 1ère commande
CREATE OR REPLACE FUNCTION public.lock_shop_currency_on_first_order()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.shops
    SET currency_locked = TRUE
    WHERE id = NEW.shop_id AND currency_locked = FALSE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
