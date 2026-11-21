"use client";

import React, { useState, use, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Flag,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
  ChevronDown,
  ShoppingBag,
  Search,
  Menu,
} from "lucide-react";
import { StorefrontCountrySelector } from "@/components/storefront/StorefrontCountrySelector";
import { MOCK_STORES } from "@/mock-data/stores";
import { MOCK_STOREFRONT_LOME } from "@/mock-data/storefront-data";
import { MOCK_SHOP_BANNER_ITEMS } from "@/mock-data/product-page-data";
import { ShopBannerItem } from "@/server/data/product-page-types";
import { resolveStorefrontData } from "@/lib/storefront-resolver";
import { brandConfig, APP_NAME } from "@/config/brand";
import { AnnouncementBanner } from "@/components/storefront/announcement-banner";
import { StorefrontPresencePing } from "@/components/storefront/storefront-presence-ping";
import { MetaPixelRunner } from "@/components/storefront/meta-pixel-runner";
import { CookieConsentBanner } from "@/components/storefront/cookie-consent-banner";
import { StorefrontAntiSpyShield } from "@/components/storefront/storefront-anti-spy-shield";
import { HeaderCartButton } from "@/components/storefront/cart/HeaderCartButton";
import { CartDrawer } from "@/components/storefront/cart/CartDrawer";

function StorefrontPreviewBanner({ previewTokenValue }: { previewTokenValue?: string }) {
  const searchParams = useSearchParams();
  const previewToken = searchParams.get("preview_token");
  const isPreviewMode = Boolean(previewToken && previewToken === previewTokenValue);

  if (!isPreviewMode) return null;

  return (
    <div className="bg-amber-500 text-black px-4 py-2 text-center text-xs font-black flex items-center justify-center gap-2 shadow-sm z-50">
      <Lock className="h-3.5 w-3.5" />
      <span>
        Mode Aperçu Privé (Brouillon non publié) — Lien confidentiel temporaire (Expire dans 72h)
      </span>
    </div>
  );
}

export default function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ store: string }>;
}) {
  const { store: storeSlug } = use(params);
  const pathname = usePathname();

  const resolved = resolveStorefrontData(storeSlug);
  const store = resolved.store;
  const storefront = resolved.storefront;

  const bannerItems: ShopBannerItem[] =
    storeSlug === "lome-glow"
      ? MOCK_SHOP_BANNER_ITEMS
      : storefront.announcementBar?.isEnabled && storefront.announcementBar.text
      ? [
          {
            id: "ann_01",
            storeId: storeSlug,
            type: "custom_announcement",
            content: storefront.announcementBar.text,
            isEnabled: true,
          },
        ]
      : [];

  // Modal Signaler cette boutique
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [reportReason, setReportReason] = useState("contrefacon");
  const [reportDetails, setReportDetails] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Champ piège anti-robot
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Protection anti-robot honeypot
    if (honeypot) {
      console.warn("Bot submission detected via honeypot.");
      setIsReportModalOpen(false);
      return;
    }
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setIsReportModalOpen(false);
      setReportDetails("");
      setReportEmail("");
    }, 2500);
  };

  const [themeSettings, setThemeSettings] = useState({
    hideHeaderMenu: false,
    hideCatalog: false,
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novika_storefront_settings_${storeSlug}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setThemeSettings({
            hideHeaderMenu: Boolean(parsed.hideHeaderMenu),
            hideCatalog: Boolean(parsed.hideCatalog),
          });
        } catch { }
      }
    }
  }, [storeSlug]);

  // Vitrine à 3 pages UNIQUEMENT (Prompt 21-b : Accueil, Catalogue, Contact)
  const navLinks = [
    { label: "Accueil", href: `/boutique/${storeSlug}` },
    { label: "Catalogue", href: `/boutique/${storeSlug}/catalogue` },
    { label: "Contact", href: `/boutique/${storeSlug}/contact` },
  ];

  return (
    <div
      className="min-h-screen flex flex-col font-sans text-[#111111] antialiased selection:bg-emerald-100 overflow-x-clip"
      style={{
        backgroundColor: storefront.activeTheme.colors.background,
        fontFamily: storefront.activeTheme.typography.fontFamily,
      }}
    >
      {/* Réglage d'indexation « Visible sur Google » (Prompt 21-b) : noindex par défaut */}
      {storefront.seo?.visibleOnGoogle ? (
        <meta name="robots" content="index, follow" />
      ) : (
        <meta name="robots" content="noindex, nofollow" />
      )}

      {/* Bouclier Anti-Espion & Anti-Extensions Chrome (Empêche le scan et le vol de catalogue) */}
      <StorefrontAntiSpyShield storeSlug={storeSlug} />

      {/* Télémétrie anonyme de présence en direct (sans cookie ni stockage d'IP) */}
      <StorefrontPresencePing storeSlug={storeSlug} />

      {/* BANDEAU MODE APERÇU PRIVÉ SIGNÉ (Isolé dans un Suspense boundary) */}
      <Suspense fallback={null}>
        <StorefrontPreviewBanner previewTokenValue={storefront.previewToken?.token} />
      </Suspense>

      {/* BANDEAU D'ANNONCE DÉFILANT SUPÉRIEUR (Marquee CSS, avis vérifiés et garanties) */}
      <AnnouncementBanner
        items={bannerItems}
        storeSlug={storeSlug}
        isDismissible={true}
        themePrimary={storefront.activeTheme.colors.primary}
        themeContrastText={storefront.activeTheme.colors.buttonText || "#FAF8F5"}
      />

      {/* EN-TÊTE DE LA VITRINE (MODÈLE KAELIS) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-black/[0.08] shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Mobile : Menu Hamburger */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-2 -ml-2 text-[#111111] hover:bg-black/5 rounded-xl transition-colors"
              aria-label="Ouvrir le menu"
            >
              {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Desktop : Navigation principale (Accueil, Catalogue, Contact) */}
          {!themeSettings.hideHeaderMenu && (
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#444440]">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors hover:text-[#111111] ${
                      isActive ? "text-[#111111] font-black underline underline-offset-8" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Logo centré KAELIS / Boutique */}
          <Link
            href={`/boutique/${storeSlug}`}
            className="flex items-center justify-center group flex-1 md:flex-initial text-center"
          >
            {storefront.header?.logoUrl ? (
              <img
                src={storefront.header.logoUrl}
                alt={store.name}
                className="h-8 sm:h-9 w-auto object-contain max-w-[160px]"
              />
            ) : (
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[#111111] font-sans lowercase">
                {store.name.toLowerCase()}
              </span>
            )}
          </Link>

          {/* Raccourcis Droite : Pays, Panier & WhatsApp */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <StorefrontCountrySelector
              storeSlug={storeSlug}
              storeCurrency={store.currency || "XOF"}
              defaultCountryCode={store.country || "TG"}
            />

            <HeaderCartButton storeSlug={storeSlug} />

            <a
              href={`https://wa.me/${storefront.contact?.whatsappNumber ? storefront.contact.whatsappNumber.replace(/[^0-9]/g, "") : ""}?text=${encodeURIComponent(
                "Bonjour, je souhaite des informations sur vos produits en vente."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] transition-all shadow-xs shrink-0"
              title="Discuter sur WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Menu Déroulant Mobile */}
        {isMobileNavOpen && (
          <div className="md:hidden border-t border-black/[0.08] bg-white px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`block py-2 text-sm font-bold ${
                    isActive ? "text-[#111111] underline underline-offset-4" : "text-[#555550] hover:text-[#111111]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* CONTENU PRINCIPAL DE LA PAGE */}
      <main className="flex-1">{children}</main>

      {/* PIED DE PAGE DE LA VITRINE (MODÈLE KAELIS) */}
      <footer className="bg-white border-t border-black/[0.08] pt-14 pb-10 mt-16 font-sans">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Colonne 1 (Gauche) : Logo & Slogan Kaelis */}
            <div className="md:col-span-5 space-y-3">
              <Link href={`/boutique/${storeSlug}`} className="inline-block">
                {storefront.header?.logoUrl ? (
                  <img
                    src={storefront.header.logoUrl}
                    alt={store.name}
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <span className="font-extrabold text-xl tracking-tight text-[#111111] lowercase block">
                    {store.name.toLowerCase()}
                  </span>
                )}
              </Link>
              <p className="text-xs sm:text-sm text-[#666660] leading-relaxed max-w-sm">
                {storefront.footer?.tagline || `${store.name} — La mode qui vous ressemble, chaque jour.`}
              </p>
            </div>

            {/* Colonnes de liens Kaelis (Droite) : 7 colonnes */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 text-xs">
              {/* Liens Rapides */}
              <div className="space-y-3">
                <p className="font-bold text-sm text-[#111111]">Liens Rapides</p>
                <ul className="space-y-2 text-[#666660]">
                  <li>
                    <Link href={`/boutique/${storeSlug}#notre-histoire`} className="hover:text-[#111111] transition-colors">
                      Notre Histoire
                    </Link>
                  </li>
                  <li>
                    <Link href={`/boutique/${storeSlug}/contact`} className="hover:text-[#111111] transition-colors">
                      Nous Contacter
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Service Client */}
              <div className="space-y-3">
                <p className="font-bold text-sm text-[#111111]">Service Client</p>
                <ul className="space-y-2 text-[#666660]">
                  <li>
                    <Link href={`/boutique/${storeSlug}/contact`} className="hover:text-[#111111] transition-colors">
                      Questions Fréquentes
                    </Link>
                  </li>
                  <li>
                    <Link href={`/boutique/${storeSlug}/pages/livraison-retours`} className="hover:text-[#111111] transition-colors">
                      Livraison et Retours
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Suivez-Nous */}
              <div className="space-y-3">
                <p className="font-bold text-sm text-[#111111]">Suivez-Nous</p>
                <ul className="space-y-2 text-[#666660]">
                  <li>
                    <Link href={`/boutique/${storeSlug}/catalogue`} className="hover:text-[#111111] transition-colors">
                      Products
                    </Link>
                  </li>
                  <li>
                    <Link href={`/boutique/${storeSlug}/contact`} className="hover:text-[#111111] transition-colors">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ligne inférieure : Divider & Copyright Kaelis */}
          <div className="pt-8 border-t border-black/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#888880]">
            <p>
              {storefront.footer?.copyright || `© 2026 ${store.name.toLowerCase()}. All rights reserved.`}
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <AlertTriangle className="h-3 w-3 text-rose-500" />
                <span>Signaler cette boutique</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL SIGNALER CETTE BOUTIQUE (ANTI-HAMEÇONNAGE & CONTREFAÇON) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF8F5] border border-black/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-black text-[#111111]">Signaler cette boutique</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="text-[#666660] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-950">Signalement transmis à l'équipe de sécurité</p>
                <p className="text-[11px] text-emerald-800">
                  Merci de contribuer à la sécurité et à l'intégrité de la communauté {brandConfig.name}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                <p className="text-[#666660] text-[11px] leading-relaxed">
                  Si vous suspectez une fraude, une contrefaçon, une usurpation d'identité ou un manquement grave, notre équipe de conformité enquêtera sous 24h.
                </p>

                {/* Champ Honeypot caché pour piéger les bots */}
                <input
                  type="text"
                  name="user_website_trap"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Motif du signalement *</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-semibold text-[#111111] focus:outline-hidden"
                  >
                    <option value="contrefacon">Produit contrefait ou trompeur</option>
                    <option value="usurpation">Usurpation d'une autre marque / Phishing</option>
                    <option value="non_livraison">Colis non conforme ou escroquerie</option>
                    <option value="autre">Autre problème de sécurité</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Détails ou précisions *</label>
                  <textarea
                    required
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Expliquez brièvement ce qui pose problème..."
                    className="w-full px-3 py-2 rounded-xl border border-black/15 bg-white text-xs text-[#111111] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Votre adresse e-mail (facultatif)</label>
                  <input
                    type="email"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    placeholder="Pour recevoir le suivi de votre signalement"
                    className="w-full px-3 py-2 rounded-xl border border-black/15 bg-white text-xs text-[#111111] focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#666660] hover:text-[#111111]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-sm cursor-pointer"
                  >
                    Envoyer le signalement
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tiroir Panier latéral & Commande COD */}
      <CartDrawer storeSlug={storeSlug} />

      {/* Exécuteur sécurisé des Pixels Meta (respect absolu du consentement et non bloquant) */}
      <MetaPixelRunner storeSlug={storeSlug} />

      {/* Bandeau de consentement aux cookies avec catégorie Marketing */}
      <CookieConsentBanner storeSlug={storeSlug} />
    </div>
  );
}
