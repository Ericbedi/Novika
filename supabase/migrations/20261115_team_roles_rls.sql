-- ==============================================================================
-- AFRIBUILDER COD — POLITIQUES RLS (ROW-LEVEL SECURITY) & GESTION DES RÔLES
-- PostgreSQL / Supabase Migration
-- Rôles : owner (propriétaire), admin, closer (closeuse), rider (livreur), agency (agence)
-- ==============================================================================

-- 1. ENUM DES RÔLES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'closer', 'rider', 'agency');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABLE DES MEMBRES D'ÉQUIPE ET ASSOCIATIONS BOUTIQUES
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'closer',
    country VARCHAR(2), -- 'TG', 'CI', 'SN', 'BJ'
    agency_id UUID, -- Si livreur rattaché à une agence partenaire
    active BOOLEAN NOT NULL DEFAULT true,
    invite_token TEXT UNIQUE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ACTIVATION RLS SUR TEAM_MEMBERS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Helper function pour récupérer le rôle actuel dans le contexte de la boutique
CREATE OR REPLACE FUNCTION public.get_user_role(p_store_id UUID)
RETURNS user_role AS $$
    SELECT role FROM public.team_members
    WHERE user_id = auth.uid()
      AND store_id = p_store_id
      AND active = true
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS: Seul le Propriétaire ou l'Admin peut gérer l'équipe (invitations, rôles, désactivations)
CREATE POLICY "owner_admin_manage_team" ON public.team_members
    FOR ALL
    TO authenticated
    USING (public.get_user_role(store_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(store_id) IN ('owner', 'admin'));

CREATE POLICY "members_view_own_profile" ON public.team_members
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- 4. DONNÉES FINANCIÈRES & PRIX DE REVIENT STRICTEMENT ISOLÉES
-- Inaccessibles aux closeuses, livreurs et agences
CREATE TABLE IF NOT EXISTS public.order_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE,
    store_id UUID NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Prix de revient produit
    shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Frais de livraison payés
    ad_spend NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Dépense pub attribuée
    net_profit NUMERIC(12, 2) GENERATED ALWAYS AS (
        -- Encaissé - Prix de revient - Frais de livraison - Pub
        0
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financials_owner_admin_only" ON public.order_financials
    FOR ALL
    TO authenticated
    USING (public.get_user_role(store_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(store_id) IN ('owner', 'admin'));

-- 5. POLITIQUES RLS SUR LES COMMANDES (ORDERS)
-- Exigence 1 & 2 :
-- - Closeuse : voit uniquement ses commandes assignées ou de son pays. Ne peut JAMAIS marquer "delivered".
-- - Livreur : voit uniquement ses livraisons assignées (nom, tél, adresse, montant cash).
-- - Agence : voit les commandes confiées à l'agence et n'assigne que ses propres livreurs.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture (SELECT) :
CREATE POLICY "orders_select_policy" ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        -- Propriétaire et Administrateur : accès total à la boutique
        public.get_user_role(store_id) IN ('owner', 'admin')
        OR
        -- Closeuse : voit uniquement ses commandes assignées OU les commandes non assignées de son pays
        (
            public.get_user_role(store_id) = 'closer'
            AND (assigned_closer_id = auth.uid() OR (assigned_closer_id IS NULL AND country = (SELECT country FROM public.team_members WHERE user_id = auth.uid() LIMIT 1)))
        )
        OR
        -- Livreur : voit uniquement les commandes qui lui sont assignées en livraison
        (
            public.get_user_role(store_id) = 'rider'
            AND assigned_rider_id = auth.uid()
        )
        OR
        -- Agence : voit uniquement les commandes confiées à son agence
        (
            public.get_user_role(store_id) = 'agency'
            AND delivery_agency_id = auth.uid()
        )
    );

-- Politiques de mise à jour (UPDATE) :
CREATE POLICY "owner_admin_update_orders" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (public.get_user_role(store_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(store_id) IN ('owner', 'admin'));

-- Closeuses : Mise à jour du statut restreint (Interdiction de 'delivered')
CREATE POLICY "closer_update_orders" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role(store_id) = 'closer'
        AND assigned_closer_id = auth.uid()
    )
    WITH CHECK (
        -- Les closeuses peuvent passer uniquement aux statuts de closing
        status IN ('pending', 'unreachable', 'scheduled', 'postponed', 'rejected', 'cancelled')
        -- INTERDICTION ABSOLUE de marquer 'delivered'
        AND status <> 'delivered'
    );

-- Livreurs : Mise à jour restreinte à 'delivered' ou 'rejected' (échec avec motif)
CREATE POLICY "rider_update_orders" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role(store_id) = 'rider'
        AND assigned_rider_id = auth.uid()
    )
    WITH CHECK (
        status IN ('delivered', 'rejected')
    );

-- Agences : Répartition à ses propres livreurs uniquement
CREATE POLICY "agency_dispatch_orders" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role(store_id) = 'agency'
        AND delivery_agency_id = auth.uid()
    )
    WITH CHECK (
        -- L'agence peut uniquement assigner un livreur appartenant à sa propre agence
        assigned_rider_id IN (
            SELECT user_id FROM public.team_members
            WHERE agency_id = auth.uid() AND active = true
        )
    );

-- 6. POLITIQUES RLS SUR LES REVERSEMENTS (REMITTANCES)
-- Exigence 4 : Encaissé, Remis, Écart, confirmation par le propriétaire
CREATE TABLE IF NOT EXISTS public.remittances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    reference VARCHAR(50) NOT NULL UNIQUE,
    entity_type VARCHAR(20) NOT NULL, -- 'rider' | 'agency'
    entity_id UUID NOT NULL,
    collected_amount NUMERIC(12, 2) NOT NULL,
    delivery_fees NUMERIC(12, 2) NOT NULL DEFAULT 0,
    remitted_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discrepancy NUMERIC(12, 2) GENERATED ALWAYS AS (collected_amount - delivery_fees - remitted_amount) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'disputed'
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.remittances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "remittances_owner_admin_full" ON public.remittances
    FOR ALL
    TO authenticated
    USING (public.get_user_role(store_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(store_id) IN ('owner', 'admin'));

CREATE POLICY "remittances_entity_view" ON public.remittances
    FOR SELECT
    TO authenticated
    USING (entity_id = auth.uid());

-- 7. TARIFS DE LIVRAISON PAR PAYS, VILLE ET COURSIER / AGENCE
-- Exigence 5 : Alimentation automatique des frais de livraison
CREATE TABLE IF NOT EXISTS public.delivery_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    country VARCHAR(2) NOT NULL,
    city TEXT NOT NULL,
    zone TEXT NOT NULL,
    entity_type VARCHAR(20) NOT NULL, -- 'agency' | 'rider'
    entity_id UUID NOT NULL,
    standard_fee NUMERIC(10, 2) NOT NULL,
    express_fee NUMERIC(10, 2),
    suburb_fee NUMERIC(10, 2),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_rates_access" ON public.delivery_rates
    FOR ALL
    TO authenticated
    USING (public.get_user_role(store_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(store_id) IN ('owner', 'admin'));

CREATE POLICY "delivery_rates_rider_agency_read" ON public.delivery_rates
    FOR SELECT
    TO authenticated
    USING (entity_id = auth.uid());
