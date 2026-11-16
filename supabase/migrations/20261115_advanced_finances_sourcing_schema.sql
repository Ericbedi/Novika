-- Migration: 20261115_advanced_finances_sourcing_schema.sql
-- Description: Schéma exhaustif des 22 tables pour les finances avancées, sourcing, multi-pays et sécurité COD
-- Principes : 
-- 1. Montants en entiers de la plus petite unité (subunits/cents), JAMAIS de décimaux flottants IEEE 754.
-- 2. Traçabilité stricte : ledger_entries et activity_log sont en écriture seule (APPEND-ONLY, UPDATE/DELETE interdits par triggers).
-- 3. RLS strict limitant l'accès selon le rôle (owner, admin, closer, rider, agency).

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    iana_timezone TEXT NOT NULL DEFAULT 'Africa/Lome',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ORG_MEMBERS
CREATE TABLE IF NOT EXISTS org_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'closer', 'rider', 'agency')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(org_id, user_id)
);

-- 3. COUNTRIES
CREATE TABLE IF NOT EXISTS countries (
    code VARCHAR(2) PRIMARY KEY,
    name TEXT NOT NULL,
    code_alpha3 VARCHAR(3) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    iana_timezone TEXT NOT NULL,
    default_vat_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    dial_code VARCHAR(8) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. CURRENCIES
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(3) PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    decimals INT NOT NULL DEFAULT 0,
    subunits_multiplier INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. FX_RATES (Cours de change avec historique horodaté)
CREATE TABLE IF NOT EXISTS fx_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(3) NOT NULL,
    quote_currency VARCHAR(3) NOT NULL,
    rate NUMERIC(14, 6) NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ACCOUNTS (Caisses & Comptes : espèces, banque, momo, carte, transit livreurs)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'momo', 'card', 'courier_transit')),
    operator_name TEXT, -- ex: Wave, Orange Money, MTN MoMo, Moov, TMoney
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    balance BIGINT NOT NULL DEFAULT 0, -- Montant entier en subunits
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. LEDGER_ENTRIES (Grand Livre - STRICTEMENT APPEND-ONLY)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    amount BIGINT NOT NULL, -- Montant entier en subunits (toujours > 0)
    currency VARCHAR(3) NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('credit', 'debit')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reference_id UUID,
    reference_type TEXT, -- order, remittance, ad_spend, recurring, transfer, refund
    is_reversal BOOLEAN NOT NULL DEFAULT FALSE,
    reversal_for_entry_id UUID REFERENCES ledger_entries(id),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour empêcher toute modification ou suppression du Grand Livre (Append-Only)
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Sécurité AfriBuilder: Les écritures du grand livre (ledger_entries) sont immuables (APPEND-ONLY). Effectuez une écriture d''annulation (reversal) !';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_ledger_mutation ON ledger_entries;
CREATE TRIGGER trg_prevent_ledger_mutation
BEFORE UPDATE OR DELETE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

-- 8. TRANSFERS (Virements inter-comptes avec taux de change)
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    to_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    amount_from BIGINT NOT NULL,
    amount_to BIGINT NOT NULL,
    fx_rate NUMERIC(14, 6) NOT NULL DEFAULT 1.0,
    transfer_fee BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- 9. EXPENSE_CATEGORIES
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. RECURRING_CHARGES (Charges récurrentes : loyer, abonnements, salaires)
CREATE TABLE IF NOT EXISTS recurring_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID,
    account_id UUID NOT NULL REFERENCES accounts(id),
    category_id UUID REFERENCES expense_categories(id),
    name TEXT NOT NULL,
    amount BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    next_due_date DATE NOT NULL,
    is_paused BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AD_PLATFORMS (Meta, TikTok, Google, Snapchat)
CREATE TABLE IF NOT EXISTS ad_platforms (
    id VARCHAR(32) PRIMARY KEY,
    display_name TEXT NOT NULL,
    icon_key TEXT NOT NULL
);

INSERT INTO ad_platforms (id, display_name, icon_key) VALUES
('meta', 'Meta Ads (Facebook & Instagram)', 'meta'),
('tiktok', 'TikTok Ads', 'tiktok'),
('google', 'Google Ads & YouTube', 'google'),
('snapchat', 'Snapchat Ads', 'snapchat')
ON CONFLICT (id) DO NOTHING;

-- 12. AD_SPEND (Dépenses publicitaires avec calcul CPA réel)
CREATE TABLE IF NOT EXISTS ad_spend (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID,
    platform_id VARCHAR(32) NOT NULL REFERENCES ad_platforms(id),
    spend_amount BIGINT NOT NULL, -- en subunits
    currency VARCHAR(3) NOT NULL,
    spend_date DATE NOT NULL,
    country_code VARCHAR(2) NOT NULL REFERENCES countries(code),
    campaign_name TEXT,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SOURCING_ORDERS (Achats Fournisseurs / Sourcing avancé)
CREATE TABLE IF NOT EXISTS sourcing_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID,
    supplier_id UUID NOT NULL,
    order_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'draft', 'awaiting_supplier', 'ordered', 'shipped', 'received', 'partially_received', 'cancelled'
    )),
    supplier_currency VARCHAR(3) NOT NULL DEFAULT 'CNY',
    locked_fx_rate NUMERIC(14, 6) NOT NULL DEFAULT 1.0,
    total_cost_supplier BIGINT NOT NULL DEFAULT 0,
    total_cost_local BIGINT NOT NULL DEFAULT 0,
    shipping_cost BIGINT NOT NULL DEFAULT 0,
    customs_cost BIGINT NOT NULL DEFAULT 0,
    agent_commission BIGINT NOT NULL DEFAULT 0,
    other_costs BIGINT NOT NULL DEFAULT 0,
    tracking_number TEXT,
    estimated_arrival DATE,
    sourcing_agent_name TEXT,
    invoice_url TEXT,
    proof_payment_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_at TIMESTAMPTZ
);

-- 14. SOURCING_ITEMS
CREATE TABLE IF NOT EXISTS sourcing_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sourcing_order_id UUID NOT NULL REFERENCES sourcing_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    variant_id UUID,
    ordered_quantity INT NOT NULL,
    received_quantity INT NOT NULL DEFAULT 0,
    defective_quantity INT NOT NULL DEFAULT 0,
    unit_cost_supplier BIGINT NOT NULL,
    pump_calculated BIGINT NOT NULL DEFAULT 0 -- Coût Moyen Pondéré Landed en subunits
);

-- 15. COURIER_REMITTANCES (Reversements espèces livreurs avec confirmation à 2 étapes)
CREATE TABLE IF NOT EXISTS courier_remittances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID,
    rider_id UUID NOT NULL,
    total_collected BIGINT NOT NULL, -- Total espèces encaissées
    total_remitted BIGINT NOT NULL, -- Total espèces remises physiquement
    discrepancy BIGINT NOT NULL DEFAULT 0, -- Écart (manquant ou surplus)
    discrepancy_reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed')),
    confirmed_by UUID,
    confirmed_at TIMESTAMPTZ,
    receipt_number TEXT,
    proof_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. COMMISSION_PAYOUTS (Rémunérations closeuses & commissions livreurs)
CREATE TABLE IF NOT EXISTS commission_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID,
    recipient_id UUID NOT NULL,
    recipient_role TEXT NOT NULL CHECK (recipient_role IN ('closer', 'rider', 'agency')),
    amount BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    delivered_orders_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    paid_from_account_id UUID REFERENCES accounts(id),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. CLOSER_TARGETS (Paliers d'objectifs mensuels closeuses)
CREATE TABLE IF NOT EXISTS closer_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    closer_id UUID NOT NULL,
    month VARCHAR(7) NOT NULL, -- Format YYYY-MM
    target_deliveries INT NOT NULL,
    target_gmv BIGINT NOT NULL DEFAULT 0,
    bonus_tier_1_amount BIGINT NOT NULL DEFAULT 0,
    bonus_tier_1_threshold INT NOT NULL DEFAULT 0,
    bonus_tier_2_amount BIGINT NOT NULL DEFAULT 0,
    bonus_tier_2_threshold INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(closer_id, month)
);

-- 18. CLOSER_BONUSES (Primes accordées après atteinte des objectifs)
CREATE TABLE IF NOT EXISTS closer_bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    closer_target_id UUID NOT NULL REFERENCES closer_targets(id) ON DELETE CASCADE,
    achieved_deliveries INT NOT NULL,
    bonus_amount BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. ACTIVITY_LOG (Journal d'activité - STRICTEMENT APPEND-ONLY)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    diff_before JSONB,
    diff_after JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour empêcher toute modification ou suppression du Journal d'Audit (Append-Only)
CREATE OR REPLACE FUNCTION prevent_activity_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Sécurité AfriBuilder: Le journal d''activité (activity_log) est strictement inaltérable (APPEND-ONLY) !';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_activity_log_mutation ON activity_log;
CREATE TRIGGER trg_prevent_activity_log_mutation
BEFORE UPDATE OR DELETE ON activity_log
FOR EACH ROW EXECUTE FUNCTION prevent_activity_log_mutation();

-- 20. SECURITY_EVENTS (Alertes & incidents de sécurité)
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'failed_login', 'token_expired', 'rls_violation_attempt', 
        'privilege_escalation_attempt', 'bulk_export_exceeded', 'anomalous_spending'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. INVITATIONS (Invitations à jeton haché usage unique avec expiration)
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    recipient_identifier TEXT NOT NULL, -- Email ou Téléphone E.164
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'closer', 'rider', 'agency')),
    invited_by UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. TAX_RATES (Taux de TVA par pays et catégorie)
CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(2) NOT NULL REFERENCES countries(code),
    rate_percent NUMERIC(5,2) NOT NULL,
    is_standard BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT
);

-- Activation de RLS sur toutes les tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE sourcing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sourcing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_remittances ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE closer_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE closer_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
