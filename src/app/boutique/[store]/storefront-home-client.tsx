"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  MessageCircle,
  Award,
  Star,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Phone,
  Clock,
  Edit3,
  Plus,
} from "lucide-react";
import { resolveStorefrontData, ResolvedStorefront } from "@/lib/storefront-resolver";
import { StorePreparationScreen } from "@/components/storefront/store-preparation-screen";
import { StorefrontAdminBar } from "@/components/storefront/storefront-admin-bar";
import { SectionEditorDrawer } from "@/components/storefront/storefront-section-editor-drawer";
import { PageSection } from "@/server/data/storefront-types";
import { formatFcfa } from "@/lib/money";
import { getLiveStoreOpenStatus, buildStoreWhatsAppLink } from "@/lib/storefront-security";
import { cn } from "@/lib/utils";

interface StorefrontHomeClientProps {
  storeSlug: string;
  initialResolved: ResolvedStorefront;
}

export function StorefrontHomeClient({
  storeSlug,
  initialResolved,
}: StorefrontHomeClientProps) {
  const [data, setData] = useState<ResolvedStorefront>(initialResolved);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);

  // Détection sécurisée du rôle propriétaire côté client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const verified = localStorage.getItem("novika_user_verified") === "true";
      const role = localStorage.getItem("novika_active_role");
      const ownerStatus = verified && role === "owner";
      setIsOwner(ownerStatus);

      // Rafraîchir les données depuis le localStorage pour cette boutique
      const resolved = resolveStorefrontData(storeSlug);
      setData(resolved);
    }
  }, [storeSlug]);

  const { store, storefront, activeProducts, deliveredOrdersCount, averageRating, totalReviewsCount } = data;
  const themePrimary = storefront.activeTheme?.colors?.primary || "#C2410C";

  // Bascule du mode édition
  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // Bascule Publier / Dépublier la vitrine
  const handleTogglePublish = () => {
    const updatedStorefront = {
      ...storefront,
      isPublished: !storefront.isPublished,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(`novika_storefront_settings_${storeSlug}`, JSON.stringify(updatedStorefront));
    }
    setData((prev) => ({
      ...prev,
      storefront: updatedStorefront,
      isPreparationMode: !updatedStorefront.isPublished || activeProducts.length === 0,
    }));
  };

  // Enregistrement d'une section modifiée
  const handleSaveSection = (updatedSection: PageSection) => {
    const updatedSections = (storefront.sections || []).map((s) =>
      s.id === updatedSection.id ? updatedSection : s
    );
    const updatedStorefront = {
      ...storefront,
      sections: updatedSections,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(`novika_storefront_settings_${storeSlug}`, JSON.stringify(updatedStorefront));
    }
    setData((prev) => ({
      ...prev,
      storefront: updatedStorefront,
    }));
  };

  // Cas 1 : Boutique en préparation et visiteur public -> Écran neutre strict
  if (data.isPreparationMode && !isOwner) {
    return (
      <StorePreparationScreen
        storeName={store.name}
        storeSlug={storeSlug}
        isOwner={false}
      />
    );
  }

  // Cas 2 : Boutique en préparation mais visiteur propriétaire -> Écran de préparation avec barre admin
  if (data.isPreparationMode && isOwner && !isEditMode) {
    return (
      <>
        <StorePreparationScreen
          storeName={store.name}
          storeSlug={storeSlug}
          isOwner={true}
        />
        <StorefrontAdminBar
          storeSlug={storeSlug}
          isPublished={storefront.isPublished}
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
          onTogglePublish={handleTogglePublish}
        />
      </>
    );
  }

  // Cas 3 : Boutique active ou Mode Édition Admin actif
  const heroSection = storefront.sections?.find((s) => s.id === "sec_hero");
  const benefitsSection = storefront.sections?.find((s) => s.id === "sec_benefits");
  const brandStorySection = storefront.sections?.find((s) => s.id === "sec_brand_story");
  const reviewsSection = storefront.sections?.find((s) => s.id === "sec_customer_reviews");
  const faqSection = storefront.sections?.find((s) => s.id === "sec_faq");

  // Statut WhatsApp direct
  const whatsappNum = storefront.contact?.whatsappNumber || store.whatsappNumber;
  const openStatus = getLiveStoreOpenStatus(0, 8, 19);
  const whatsAppDirectLink = whatsappNum
    ? buildStoreWhatsAppLink(whatsappNum, `Bonjour ${store.name}, je souhaite des renseignements sur vos produits.`)
    : "";

  return (
    <div className="space-y-16 pb-28 relative">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER */}
      {/* ========================================================================= */}
      {heroSection && (heroSection.isVisible || isEditMode) ? (
        <section className="relative group max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          {/* Crayon de modification admin */}
          {isOwner && isEditMode && (
            <button
              type="button"
              onClick={() => setEditingSection(heroSection)}
              className="absolute top-8 right-8 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modifier la Bannière Hero</span>
            </button>
          )}

          {heroSection.isVisible && heroSection.content?.headline ? (
            <div
              className="rounded-[36px] p-8 sm:p-14 text-white relative overflow-hidden shadow-lg"
              style={{ backgroundColor: themePrimary }}
            >
              <div className="max-w-2xl space-y-4">
                {heroSection.content.badgeText && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
                    {heroSection.content.badgeText}
                  </span>
                )}
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  {heroSection.content.headline}
                </h1>
                {heroSection.content.subheadline && (
                  <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed">
                    {heroSection.content.subheadline}
                  </p>
                )}
                <div className="pt-2">
                  <Link
                    href={heroSection.content.ctaUrl || `/boutique/${storeSlug}/catalogue`}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-[#111111] text-xs sm:text-sm font-black hover:bg-[#FAF8F5] transition-all shadow-md"
                  >
                    <span>{heroSection.content.ctaText || "Commander maintenant"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : isOwner && isEditMode ? (
            <div
              onClick={() => setEditingSection(heroSection)}
              className="border-2 border-dashed border-amber-400/80 bg-amber-50/40 rounded-[36px] p-10 text-center space-y-2 cursor-pointer hover:bg-amber-50 transition-colors"
            >
              <Sparkles className="w-6 h-6 text-amber-600 mx-auto" />
              <div className="text-xs font-black text-amber-950">+ Ajouter une Bannière d'Accueil (Hero)</div>
              <p className="text-[11px] text-amber-800">
                Section actuellement masquée ou vide pour le public. Cliquez pour configurer votre titre d'accroche.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ========================================================================= */}
      {/* 2. REASSURANCE COD (BENEFITS) */}
      {/* ========================================================================= */}
      {benefitsSection && (benefitsSection.isVisible || isEditMode) ? (
        <section className="relative group max-w-6xl mx-auto px-4 sm:px-6">
          {isOwner && isEditMode && (
            <button
              type="button"
              onClick={() => setEditingSection(benefitsSection)}
              className="absolute top-2 right-6 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modifier la Réassurance</span>
            </button>
          )}

          {benefitsSection.isVisible && (benefitsSection.content?.items || []).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefitsSection.content.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-2xs space-y-2 text-center sm:text-left"
                >
                  <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto sm:mx-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-black text-[#111111]">{item.title}</h3>
                  <p className="text-[11px] text-[#666660] leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          ) : isOwner && isEditMode ? (
            <div
              onClick={() => setEditingSection(benefitsSection)}
              className="border-2 border-dashed border-amber-400/80 bg-amber-50/40 rounded-3xl p-6 text-center space-y-1 cursor-pointer hover:bg-amber-50 transition-colors"
            >
              <div className="text-xs font-black text-amber-950">+ Ajouter des Blocs de Réassurance (COD)</div>
              <p className="text-[11px] text-amber-800">
                Paiement à la livraison, délais réels et garanties.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ========================================================================= */}
      {/* 3. PRODUITS VEDETTES PUBLIÉS */}
      {/* ========================================================================= */}
      {activeProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <span
                className="text-xs font-bold uppercase tracking-wider block"
                style={{ color: themePrimary }}
              >
                Catalogue COD
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
                Produits Disponibles
              </h2>
            </div>
            <Link
              href={`/boutique/${storeSlug}/catalogue`}
              className="text-xs font-bold text-[#111111] hover:underline inline-flex items-center gap-1"
            >
              <span>Voir tout ({activeProducts.length} articles)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {activeProducts.slice(0, 4).map((prod) => (
              <div
                key={prod.id}
                className="group rounded-3xl border border-black/[0.08] bg-white p-3.5 sm:p-4 space-y-3 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <Link
                    href={`/boutique/${storeSlug}/produit/${prod.id}`}
                    className="relative block h-40 sm:h-48 rounded-2xl bg-[#FAF8F5] overflow-hidden border border-black/[0.04]"
                  >
                    {prod.images && prod.images[0] ? (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
                        <span className="text-xs font-black text-[#111111]">{prod.name}</span>
                      </div>
                    )}
                    {prod.compareAtPrice && prod.compareAtPrice > (prod.price || (prod as any).sellingPrice || 0) && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black shadow-xs">
                        Promo
                      </span>
                    )}
                  </Link>

                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-[#111111] line-clamp-2">
                      {prod.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-sm sm:text-base font-black text-[#111111]">
                        {formatFcfa(prod.price || (prod as any).sellingPrice || 0)}
                      </span>
                      {prod.compareAtPrice && (
                        <span className="text-[11px] text-[#888880] line-through">
                          {formatFcfa(prod.compareAtPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/boutique/${storeSlug}/produit/${prod.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors"
                >
                  <span>Commander</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. HISTOIRE DE LA MARQUE & CHIFFRES RÉELS */}
      {/* ========================================================================= */}
      {brandStorySection && (brandStorySection.isVisible || isEditMode) ? (
        <section className="relative group max-w-6xl mx-auto px-4 sm:px-6">
          {isOwner && isEditMode && (
            <button
              type="button"
              onClick={() => setEditingSection(brandStorySection)}
              className="absolute top-4 right-8 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modifier la Mission / Histoire</span>
            </button>
          )}

          {brandStorySection.isVisible && brandStorySection.content?.title ? (
            <div className="rounded-[36px] bg-[#FAF8F5] border border-black/[0.08] p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span
                  className="text-xs font-bold uppercase tracking-wider block"
                  style={{ color: themePrimary }}
                >
                  {brandStorySection.content.tagline || "Notre Mission"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
                  {brandStorySection.content.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#444440] leading-relaxed">
                  {brandStorySection.content.text}
                </p>

                {brandStorySection.content.showDeliveredCount && deliveredOrdersCount > 0 && (
                  <div className="pt-2">
                    <span className="text-2xl sm:text-3xl font-black text-[#111111] block">
                      +{deliveredOrdersCount}
                    </span>
                    <span className="text-[11px] text-[#666660]">
                      Colis livrés avec succès (Données réelles)
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-white border border-black/[0.06] p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Engagement & Transparence</span>
                </div>
                <p className="text-xs text-[#666660] leading-relaxed">
                  « Chaque commande est inspectée et validée par le client avant tout paiement en espèces. »
                </p>
                <span className="text-xs font-black text-[#111111] block">
                  — L'équipe {store.name}
                </span>
              </div>
            </div>
          ) : isOwner && isEditMode ? (
            <div
              onClick={() => setEditingSection(brandStorySection)}
              className="border-2 border-dashed border-amber-400/80 bg-amber-50/40 rounded-[36px] p-6 text-center space-y-1 cursor-pointer hover:bg-amber-50 transition-colors"
            >
              <div className="text-xs font-black text-amber-950">+ Ajouter la Section Histoire & Mission</div>
              <p className="text-[11px] text-amber-800">Présentez votre entreprise de manière authentique.</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ========================================================================= */}
      {/* 5. AVIS CLIENTS RÉELS (ZÉRO CHIFFRE OU AVIS INVENTÉ) */}
      {/* ========================================================================= */}
      {reviewsSection && (reviewsSection.isVisible || isEditMode) ? (
        <section className="relative group max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          {isOwner && isEditMode && (
            <button
              type="button"
              onClick={() => setEditingSection(reviewsSection)}
              className="absolute top-2 right-6 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Gérer les Avis Clients</span>
            </button>
          )}

          {reviewsSection.isVisible && (storefront.reviews || []).length > 0 ? (
            <>
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider block"
                  style={{ color: themePrimary }}
                >
                  Témoignages Vérifiés
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
                  Avis de Nos Clients
                </h2>

                {/* Note moyenne uniquement calculée si >= 5 avis réels */}
                {averageRating !== null && (
                  <div className="flex items-center justify-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                    <span className="text-xs font-black text-[#111111] ml-1.5">
                      {averageRating} / 5 ({totalReviewsCount} avis)
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {storefront.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                      <p className="text-xs text-[#444440] leading-relaxed italic">« {rev.comment} »</p>
                    </div>

                    <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs">
                      <div>
                        <p className="font-black text-[#111111]">{rev.authorName}</p>
                        <p className="text-[10px] text-[#888880]">
                          {rev.authorCity ? `${rev.authorCity}, ${rev.authorCountry}` : rev.authorCountry}
                        </p>
                      </div>
                      {rev.verifiedPurchase && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Achat vérifié</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : isOwner && isEditMode ? (
            <div
              onClick={() => setEditingSection(reviewsSection)}
              className="border-2 border-dashed border-amber-400/80 bg-amber-50/40 rounded-3xl p-6 text-center space-y-1 cursor-pointer hover:bg-amber-50 transition-colors"
            >
              <div className="text-xs font-black text-amber-950">+ Gérer la Section Avis</div>
              <p className="text-[11px] text-amber-800">
                Les avis s'affichent uniquement lorsque de vraies commandes sont livrées.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ========================================================================= */}
      {/* 6. FAQ (FOIRE AUX QUESTIONS) */}
      {/* ========================================================================= */}
      {faqSection && (faqSection.isVisible || isEditMode) ? (
        <section className="relative group max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          {isOwner && isEditMode && (
            <button
              type="button"
              onClick={() => setEditingSection(faqSection)}
              className="absolute top-2 right-6 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modifier la FAQ</span>
            </button>
          )}

          {faqSection.isVisible && (faqSection.content?.questions || []).length > 0 ? (
            <>
              <div className="text-center space-y-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider block"
                  style={{ color: themePrimary }}
                >
                  Questions Fréquentes
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
                  Tout sur la livraison et le paiement
                </h2>
              </div>

              <div className="space-y-3">
                {faqSection.content.questions.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-1.5"
                  >
                    <h3 className="text-xs sm:text-sm font-black text-[#111111] flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 shrink-0" style={{ color: themePrimary }} />
                      <span>{item.q}</span>
                    </h3>
                    <p className="text-xs text-[#666660] leading-relaxed pl-6">{item.a}</p>
                  </div>
                ))}
              </div>
            </>
          ) : isOwner && isEditMode ? (
            <div
              onClick={() => setEditingSection(faqSection)}
              className="border-2 border-dashed border-amber-400/80 bg-amber-50/40 rounded-2xl p-6 text-center space-y-1 cursor-pointer hover:bg-amber-50 transition-colors"
            >
              <div className="text-xs font-black text-amber-950">+ Ajouter une FAQ</div>
              <p className="text-[11px] text-amber-800">Ajoutez des questions/réponses claires pour rassurer vos acheteurs.</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ========================================================================= */}
      {/* 7. BLOC CONTACT WHATSAPP (SI NUMÉRO CONFIGURÉ) */}
      {/* ========================================================================= */}
      {whatsappNum && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-[36px] bg-white border border-black/[0.08] p-6 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                    openStatus.isOpen ? "bg-emerald-100 text-emerald-800" : "bg-black/[0.06] text-[#666660]"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      openStatus.isOpen ? "bg-emerald-600 animate-pulse" : "bg-gray-400"
                    )}
                  />
                  <span>{openStatus.statusLabel}</span>
                </span>
                <span className="text-[11px] text-[#666660]">{openStatus.nextOpenLabel}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                Une question avant de commander ?
              </h3>
              <p className="text-xs text-[#666660] max-w-md">
                Échangez en direct avec notre équipe sur WhatsApp.
              </p>
            </div>

            <a
              href={whatsAppDirectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Discuter sur WhatsApp</span>
            </a>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* BARRE FLOTTANTE D'ADMINISTRATION POUR LE PROPRIÉTAIRE */}
      {/* ========================================================================= */}
      {isOwner && (
        <StorefrontAdminBar
          storeSlug={storeSlug}
          isPublished={storefront.isPublished}
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
          onTogglePublish={handleTogglePublish}
        />
      )}

      {/* PANNEAU LATÉRAL DE MODIFICATION DE SECTION */}
      {editingSection && (
        <SectionEditorDrawer
          section={editingSection}
          isOpen={Boolean(editingSection)}
          onClose={() => setEditingSection(null)}
          onSave={handleSaveSection}
        />
      )}
    </div>
  );
}
