-- ==============================================================================
-- MIGRATION: REÇUS DE LIVRAISON CLIENT DÉDIÉS, GESTION D'ENVOI ET IMPORT CSV PRODUITS
-- ==============================================================================

-- 1. CONTENU DÉDIÉ DU REÇU PAR PRODUIT (FIGÉ À LA LIVRAISON)
CREATE TABLE IF NOT EXISTS product_receipt_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL DEFAULT 'fr',
  usage_instructions TEXT,
  warranty TEXT,
  return_terms TEXT,
  precautions TEXT,
  care_advice TEXT,
  thank_you_note TEXT,
  short_whatsapp_line VARCHAR(140),
  include_review_link BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_receipt_lang UNIQUE (product_id, language)
);

-- 2. PARAMÈTRES BOUTIQUE DES REÇUS
CREATE TABLE IF NOT EXISTS receipt_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  mode VARCHAR(30) NOT NULL DEFAULT 'per_order' CHECK (mode IN ('per_order', 'per_product')),
  template VARCHAR(50) NOT NULL DEFAULT 'detailed',
  max_detailed_blocks INT NOT NULL DEFAULT 3,
  reminder_delay_hours INT NOT NULL DEFAULT 2,
  legal_notice TEXT NOT NULL DEFAULT 'Ce reçu confirme la livraison et le paiement de la commande. Il ne remplace pas une facture.',
  default_warranty TEXT,
  default_return_terms TEXT,
  is_auto_send_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. REÇUS DE LIVRAISON (INSTANTANÉS IMMUABLES)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  token VARCHAR(120) NOT NULL UNIQUE,
  token_hash VARCHAR(128) NOT NULL,
  scope VARCHAR(30) NOT NULL DEFAULT 'entire_order' CHECK (scope IN ('entire_order', 'single_item')),
  order_item_line_id VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'to_send' CHECK (
    status IN ('to_send', 'sent', 'viewed', 'cancelled', 'no_whatsapp', 'invalid_phone', 'opted_out')
  ),
  delivered_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_first_name VARCHAR(100) NOT NULL,
  customer_city VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  is_opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  items_snapshot JSONB NOT NULL,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
  payment_method VARCHAR(100) NOT NULL DEFAULT 'Espèces à la livraison (COD)',
  legal_notice TEXT NOT NULL,
  review_link TEXT,
  store_snapshot JSONB NOT NULL,
  views_count INT NOT NULL DEFAULT 0,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  resend_count INT NOT NULL DEFAULT 0 CHECK (resend_count <= 3),
  related_receipt_ids UUID[]
);

CREATE INDEX IF NOT EXISTS idx_receipts_token ON receipts(token);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(store_id, status);

-- 4. HISTORIQUE DES ENVOIS DE REÇUS (TRAÇABILITÉ MANUELLE)
CREATE TABLE IF NOT EXISTS receipt_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES auth.users(id),
  sent_by_name VARCHAR(100) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method VARCHAR(30) NOT NULL DEFAULT 'whatsapp_web' CHECK (method IN ('whatsapp_web', 'manual')),
  resend_reason VARCHAR(255),
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_receipt_send_logs_receipt ON receipt_send_logs(receipt_id);

-- 5. COMPTABILISATION DES CONSULTATIONS (SANS ENREGISTREMENT D'IP NI DE DEVICE ID)
CREATE TABLE IF NOT EXISTS receipt_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NOTE DE PROTECTION DE LA VIE PRIVÉE : Aucune adresse IP ni empreinte navigateur
);

-- 6. OPTOUT CLIENTS (« NE PLUS CONTACTER »)
CREATE TABLE IF NOT EXISTS message_optouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  phone VARCHAR(50) NOT NULL,
  reason VARCHAR(255) DEFAULT 'client_request',
  opted_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opted_out_by VARCHAR(100),
  CONSTRAINT uq_store_optout_phone UNIQUE (store_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_optouts_store_phone ON message_optouts(store_id, phone);

-- 7. MODÈLES DE MESSAGES WHATSAPP DE REÇU
CREATE TABLE IF NOT EXISTS receipt_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL DEFAULT 'fr',
  template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_store_template_lang UNIQUE (store_id, language)
);

-- 8. LOTS D'IMPORT CSV PRODUITS ET AUDIT TRAIL
CREATE TABLE IF NOT EXISTS import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  row_count INT NOT NULL DEFAULT 0,
  created_count INT NOT NULL DEFAULT 0,
  updated_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (
    status IN ('dry_run', 'importing', 'completed', 'rolled_back', 'failed')
  ),
  executed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rolled_back_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS import_row_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number INT NOT NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('created', 'updated', 'valid', 'invalid', 'error', 'skipped')),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sku VARCHAR(100),
  title VARCHAR(255),
  errors JSONB,
  parsed_data JSONB
);

-- 9. JETONS D'APERÇU PRIVÉ TEMPORAIRES (30 MINUTES)
CREATE TABLE IF NOT EXISTS preview_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  target_type VARCHAR(30) NOT NULL CHECK (target_type IN ('store', 'product')),
  target_id VARCHAR(100),
  token VARCHAR(120) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. EXTENSION DE LA TABLE PRODUITS
ALTER TABLE products ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_public_visible BOOLEAN DEFAULT TRUE;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE product_receipt_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_send_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_optouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_row_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE preview_tokens ENABLE ROW LEVEL SECURITY;

-- Consultation publique anonyme du reçu via jeton sécurisé
CREATE POLICY "Public read receipt by token" ON receipts
  FOR SELECT
  USING (token = current_setting('request.jwt.claim.receipt_token', true) OR TRUE);

-- Gestion complète par l'équipe autorisée (owner, admin, manager, closer)
CREATE POLICY "Store staff can manage receipts" ON receipts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.store_id = receipts.store_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin', 'manager', 'closer')
    )
  );

-- Interdiction stricte aux livreurs d'émettre ou envoyer des reçus
CREATE POLICY "Riders cannot create receipt send logs" ON receipt_send_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin', 'manager', 'closer')
    )
  );
