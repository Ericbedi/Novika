-- ==============================================================================
-- MIGRATION SUPABASE : FORMULAIRE DE COMMANDE, MODÈLE PAGE PRODUIT,
-- BANNIÈRE DÉFILANTE, THÈMES PAR IMAGE, AVIS CLIENTS ET AUTHENTIFICATION
-- ==============================================================================

-- 1. Table des réglages du formulaire de commande par boutique
CREATE TABLE IF NOT EXISTS order_form_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Remplissez le formulaire pour confirmer votre commande',
  warning_text TEXT DEFAULT 'Réservé aux personnes disponibles pour recevoir et payer leur commande à la livraison.',
  is_warning_enabled BOOLEAN NOT NULL DEFAULT true,
  offer_badge_text TEXT NOT NULL DEFAULT 'Offre Spéciale COD',
  require_commitment_checkbox BOOLEAN NOT NULL DEFAULT true,
  commitment_checkbox_text TEXT NOT NULL DEFAULT 'Je confirme être disponible et prêt à payer à la réception',
  reassurance_microtexts JSONB NOT NULL DEFAULT '["Vous vérifiez avant de payer", "Nous vous appelons pour confirmer sous 15 min"]'::jsonb,
  show_email_field BOOLEAN NOT NULL DEFAULT false,
  show_district_field BOOLEAN NOT NULL DEFAULT true,
  show_delivery_instructions BOOLEAN NOT NULL DEFAULT true,
  served_countries JSONB NOT NULL DEFAULT '["TG", "CI", "BJ", "SN"]'::jsonb,
  shipping_fees_by_city JSONB NOT NULL DEFAULT '{"Lomé": 1000, "Abidjan": 2000, "Cotonou": 1500, "Dakar": 2500}'::jsonb,
  abandoned_cart_capture_enabled BOOLEAN NOT NULL DEFAULT false,
  abandoned_cart_consent_notice TEXT DEFAULT 'En renseignant votre numéro, vous acceptez d''être recontacté en cas d''interruption.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table des offres de quantité par produit
CREATE TABLE IF NOT EXISTS quantity_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  label TEXT NOT NULL,
  badge TEXT,
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  savings_amount INTEGER NOT NULL DEFAULT 0 CHECK (savings_amount >= 0),
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table des 15 sections ordonnées de la page produit
CREATE TABLE IF NOT EXISTS product_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  section_key TEXT NOT NULL,
  title TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_section UNIQUE (product_id, section_key)
);

-- 4. Table des palettes de thèmes déduites de l'image du produit
CREATE TABLE IF NOT EXISTS product_theme_palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE,
  primary_hex TEXT NOT NULL CHECK (primary_hex ~ '^#[0-9a-fA-F]{6}$'),
  hover_hex TEXT NOT NULL CHECK (hover_hex ~ '^#[0-9a-fA-F]{6}$'),
  contrast_text TEXT NOT NULL CHECK (contrast_text IN ('#FFFFFF', '#111111')),
  soft_bg_hex TEXT NOT NULL CHECK (soft_bg_hex ~ '^#[0-9a-fA-F]{6}$'),
  border_hex TEXT NOT NULL CHECK (border_hex ~ '^#[0-9a-fA-F]{6}$'),
  accent_hex TEXT NOT NULL CHECK (accent_hex ~ '^#[0-9a-fA-F]{6}$'),
  is_derived_from_image BOOLEAN NOT NULL DEFAULT true,
  source_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Table des garanties configurées par boutique
CREATE TABLE IF NOT EXISTS shop_guarantees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  guarantee_type TEXT NOT NULL CHECK (guarantee_type IN ('cod', 'inspection', 'delivery_time', 'money_back', 'phone_confirmation')),
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_terms TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'ShieldCheck',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Table des éléments de la bannière défilante
CREATE TABLE IF NOT EXISTS shop_banner_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('guarantee', 'verified_review', 'custom_announcement')),
  content TEXT NOT NULL CHECK (length(content) <= 120),
  author_name TEXT,
  author_city TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  guarantee_ref_id UUID REFERENCES shop_guarantees(id) ON DELETE SET NULL,
  is_verified_buyer BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Table des jetons d'avis post-livraison à usage unique
CREATE TABLE IF NOT EXISTS review_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL,
  store_id UUID NOT NULL,
  product_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Table des avis clients
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  product_id UUID NOT NULL,
  order_id UUID,
  is_verified_buyer BOOLEAN NOT NULL DEFAULT false,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  customer_name TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  comment TEXT NOT NULL,
  photo_urls JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'pending_moderation', 'rejected')),
  moderation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Table des réponses du vendeur aux avis
CREATE TABLE IF NOT EXISTS review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  store_id UUID NOT NULL,
  replied_by_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Table des signalements d'avis abusifs
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Table des codes de vérification d'email
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts_left INTEGER NOT NULL DEFAULT 5 CHECK (attempts_left >= 0),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  resend_cooldown_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Table de journalisation des tentatives d'inscription
CREATE TABLE IF NOT EXISTS signup_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  country_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'rejected_disposable', 'rejected_weak_password', 'rate_limited')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Table des domaines d'emails jetables interdits
CREATE TABLE IF NOT EXISTS disposable_domains (
  domain TEXT PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Données initiales de domaines jetables
INSERT INTO disposable_domains (domain) VALUES
  ('tempmail.com'),
  ('mailinator.com'),
  ('guerrillamail.com'),
  ('10minutemail.com'),
  ('yopmail.com'),
  ('yopmail.fr'),
  ('throwawaymail.com'),
  ('trashmail.com')
ON CONFLICT (domain) DO NOTHING;

-- INDEX DE PERFORMANCE ET SÉCURITÉ
CREATE INDEX IF NOT EXISTS idx_order_form_settings_store ON order_form_settings(store_id);
CREATE INDEX IF NOT EXISTS idx_quantity_offers_product ON quantity_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_page_sections_product ON product_page_sections(product_id);
CREATE INDEX IF NOT EXISTS idx_shop_banner_store ON shop_banner_items(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON reviews(product_id, status);
CREATE INDEX IF NOT EXISTS idx_review_tokens_hash ON review_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE order_form_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quantity_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_theme_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_banner_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS publiques de lecture
CREATE POLICY "Public read active order form settings" ON order_form_settings FOR SELECT USING (true);
CREATE POLICY "Public read quantity offers" ON quantity_offers FOR SELECT USING (true);
CREATE POLICY "Public read product sections" ON product_page_sections FOR SELECT USING (is_enabled = true);
CREATE POLICY "Public read product theme palettes" ON product_theme_palettes FOR SELECT USING (true);
CREATE POLICY "Public read shop guarantees" ON shop_guarantees FOR SELECT USING (is_enabled = true);
CREATE POLICY "Public read shop banner items" ON shop_banner_items FOR SELECT USING (is_enabled = true);
CREATE POLICY "Public read published reviews" ON reviews FOR SELECT USING (status = 'published');
CREATE POLICY "Public read review replies" ON review_replies FOR SELECT USING (true);
