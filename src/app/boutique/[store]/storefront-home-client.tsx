"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  Star,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Edit3,
} from "lucide-react";
import {
  resolveStorefrontData,
  ResolvedStorefront,
} from "@/lib/storefront-resolver";
import { StorePreparationScreen } from "@/components/storefront/store-preparation-screen";
import { StorefrontAdminBar } from "@/components/storefront/storefront-admin-bar";
import { SectionEditorDrawer } from "@/components/storefront/storefront-section-editor-drawer";
import { PageSection } from "@/server/data/storefront-types";
import { formatFcfa } from "@/lib/money";
import { ProductImage } from "@/components/ui/ProductImage";
import { getProductPublicUrl } from "@/lib/storefront-urls";
import { cn } from "@/lib/utils";
import { applyHomeConfig } from "@/lib/storefront-home-config";
import { useStudioDraft, postStudioBase } from "@/lib/studio-bridge";
import { HomeBannerCarousel } from "@/components/storefront/home-banner-carousel";
import { buildHomeConfig, saveHomeConfig } from "@/lib/storefront-home-config";

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
  const [editingSection, setEditingSection] = useState<PageSection | null>(
    null,
  );

  // État local de la newsletter
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Détection sécurisée du rôle propriétaire côté client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const verified = localStorage.getItem("novika_user_verified") === "true";
      const role = localStorage.getItem("novika_active_role");
      const ownerStatus = verified && role === "owner";
      setIsOwner(ownerStatus);
      // Droit de modification vérifié côté serveur : identique sur mobile et navigateur
      fetch(`/api/stores/home?store=${encodeURIComponent(storeSlug)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setIsOwner(Boolean(d?.canEdit)))
        .catch(() => {});
    }
  }, [storeSlug, initialResolved]);

  // Aperçu dans le Studio : le brouillon remplace temporairement la configuration enregistrée
  const studio = useStudioDraft();
  const { store, activeProducts } = data;
  const storefront = studio.draft.config ? applyHomeConfig(data.storefront, studio.draft.config) : data.storefront;
  const DEFAULT_ORDER = ["banners", "sec_hero", "sec_benefits", "sec_featured_products", "sec_customer_reviews", "sec_newsletter", "sec_brand_story"];
  const orderList = [...(storefront.homeOrder || []), ...DEFAULT_ORDER.filter((id) => !(storefront.homeOrder || []).includes(id))];
  const ord = (id: string) => ({ order: Math.max(0, orderList.indexOf(id)) * 10 });
  const hasStudioDraft = !!studio.draft.config;
  useEffect(() => {
    if (studio.active && !hasStudioDraft) postStudioBase("home", buildHomeConfig(data.storefront));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio.active, hasStudioDraft]);
  const featuredSection = storefront.sections?.find((s) => s.id === "sec_featured_products");
  const themePrimary = storefront.activeTheme?.colors?.primary || "#111111";

  // Bascule du mode édition
  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // Bascule Publier / Dépublier la vitrine
  const handleTogglePublish = async () => {
    const updatedStorefront = {
      ...storefront,
      isPublished: !storefront.isPublished,
    };
    setData((prev) => ({
      ...prev,
      storefront: updatedStorefront,
      isPreparationMode:
        !updatedStorefront.isPublished || activeProducts.length === 0,
    }));
  };

  // Enregistrement d'une section modifiée
  const handleSaveSection = (updatedSection: PageSection) => {
    const updatedSections = (storefront.sections || []).map((s) =>
      s.id === updatedSection.id ? updatedSection : s,
    );
    const updatedStorefront = {
      ...storefront,
      sections: updatedSections,
    };
    // Enregistrement en base : visible tout de suite sur mobile et navigateur
    void saveHomeConfig(storeSlug, buildHomeConfig(updatedStorefront));
    setData((prev) => ({
      ...prev,
      storefront: updatedStorefront,
    }));
  };

  // La vitrine est 100% publique pour tous les clients (aucun écran de préparation ni blocage)

  // Sections du modèle Kaelis
  const heroSection = storefront.sections?.find((s) => s.id === "sec_hero");
  const heroBgRaw = String(heroSection?.content?.imageUrl || "");
  const heroBgUrl = /^(https?:\/\/|\/)/.test(heroBgRaw) ? heroBgRaw : "";
  const heroOverlay = Math.min(0.8, Math.max(0, Number(heroSection?.content?.overlay ?? 35) / 100));
  const benefitsSection = storefront.sections?.find(
    (s) => s.id === "sec_benefits",
  );
  const reviewsSection = storefront.sections?.find(
    (s) => s.id === "sec_customer_reviews",
  );
  const newsletterSection = storefront.sections?.find(
    (s) => s.id === "sec_newsletter",
  );
  const brandStorySection = storefront.sections?.find(
    (s) => s.id === "sec_brand_story",
  );

  // Données par défaut de secours si section non encore initialisée
  const heroHeadline =
    heroSection?.content?.headline ??
    `Bienvenue chez ${store.name.toUpperCase()}.`;
  const heroSubheadline =
    heroSection?.content?.subheadline ??
    "Ici, on n'achète pas un logo — on construit une allure. Chaque pièce est choisie pour notre climat, nos morphologies et nos journées qui commencent tôt et finissent après la nuit tombée.";
  const heroCtaText =
    heroSection?.content?.ctaText ?? "Découvrir nos collections";
  const heroCtaUrl =
    heroSection?.content?.ctaUrl ?? `/boutique/${storeSlug}/catalogue`;

  const benefitsTitle =
    benefitsSection?.content?.title ?? `Pourquoi Choisir ${store.name} ?`;
  const benefitsSubtitle =
    benefitsSection?.content?.subtitle ??
    "Nous mettons tout en œuvre pour vous offrir une expérience d'achat simple, sûre et satisfaisante.";
  const benefitsItems = benefitsSection?.content?.items ?? [
    {
      id: "b1",
      title: "Livraison Rapide",
      description:
        "Vos commandes sont expédiées en 24 à 48 heures pour une réception ultra-rapide.",
      icon: "truck",
    },
    {
      id: "b2",
      title: "Paiement Sécurisé",
      description:
        "Toutes vos transactions sont protégées par un cryptage SSL de haute sécurité.",
      icon: "shield",
    },
    {
      id: "b3",
      title: "Retours Faciles",
      description:
        "Profitez de 30 jours pour retourner votre article sans aucune question posée.",
      icon: "rotate-ccw",
    },
    {
      id: "b4",
      title: "Qualité Garantie",
      description:
        "Chaque produit est sélectionné avec soin pour vous garantir un niveau de qualité irréprochable.",
      icon: "award",
    },
  ];

  const reviewsList = storefront.reviews || [];
  const reviewsTitle =
    reviewsSection?.content?.title ?? "Ce Que Disent Nos Clients";

  const newsletterTitle =
    newsletterSection?.content?.title ??
    `Rejoignez la Communauté ${store.name}`;
  const newsletterSubtitle =
    newsletterSection?.content?.subtitle ??
    "Inscrivez-vous à notre newsletter et soyez le premier à découvrir nos nouvelles collections et offres exclusives.";

  const storyTitle = brandStorySection?.content?.title ?? "Notre Histoire";
  const storyText =
    brandStorySection?.content?.text ??
    `Chez ${store.name}, nous sélectionnons avec soin chaque produit pour vous garantir une expérience de qualité au quotidien.`;
  const storyImageUrl =
    brandStorySection?.content?.imageUrl || "";
  const storyCtaText =
    brandStorySection?.content?.ctaText ?? "Voir nos collections";
  const storyCtaUrl =
    brandStorySection?.content?.ctaUrl ?? `/boutique/${storeSlug}/catalogue`;

  return (
    <div className="flex flex-col gap-16 sm:gap-24 pb-20 relative">
      {/* BANNIÈRES D'ACCUEIL (images choisies par le vendeur) */}
      {storefront.homeBanners && storefront.homeBanners.length > 0 && (
        <div style={ord("banners")}>
          <HomeBannerCarousel banners={storefront.homeBanners} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HÉRO CENTRÉ ÉPURÉ */}
      {/* ========================================================================= */}
      {heroSection &&
        (heroSection.isVisible || isEditMode) &&
        (heroHeadline || isEditMode) && (
          <section
            style={{
              ...ord("sec_hero"),
              ...(heroBgUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,${heroOverlay}), rgba(0,0,0,${heroOverlay})), url(${JSON.stringify(heroBgUrl)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {}),
            }}
            className={`relative group mx-auto px-4 sm:px-6 text-center space-y-6 ${
              heroBgUrl
                ? "w-[calc(100%-2rem)] max-w-6xl rounded-3xl py-16 sm:py-28 [&_h1]:!text-white [&_p]:!text-white/90"
                : "max-w-4xl pt-12 sm:pt-20 pb-4"
            }`}
          >
            {isOwner && isEditMode && (
              <button
                type="button"
                onClick={() => setEditingSection(heroSection)}
                className="absolute top-2 right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier le Héro</span>
              </button>
            )}

            {heroHeadline ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#111111] tracking-tight leading-[1.18]">
                  {heroHeadline}
                </h1>
                {heroSubheadline && (
                  <p className="text-xs sm:text-base text-[#666660] max-w-2xl mx-auto leading-relaxed font-normal">
                    {heroSubheadline}
                  </p>
                )}
                <div className="pt-3">
                  <Link
                    href={heroCtaUrl}
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold text-white shadow-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    style={{ backgroundColor: themePrimary }}
                  >
                    {heroCtaText}
                  </Link>
                </div>
              </div>
            ) : isOwner && isEditMode ? (
              <div
                onClick={() => setEditingSection(heroSection)}
                className="border-2 border-dashed border-amber-400/80 bg-amber-50/40 rounded-3xl p-8 text-center space-y-2 cursor-pointer hover:bg-amber-50 transition-colors"
              >
                <Sparkles className="w-6 h-6 text-amber-600 mx-auto" />
                <div className="text-xs font-black text-amber-950">
                  + Configurer le Héro d'accueil
                </div>
                <p className="text-[11px] text-amber-800">
                  Section actuellement masquée pour le public.
                </p>
              </div>
            ) : null}
          </section>
        )}

      {/* ========================================================================= */}
      {/* 2. LES 4 AVANTAGES (POURQUOI CHOISIR KAELIS) */}
      {/* ========================================================================= */}
      {benefitsSection &&
        (benefitsSection.isVisible || isEditMode) &&
        (benefitsItems.length > 0 || isEditMode) && (
          <section style={ord("sec_benefits")} className="relative group max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-6 space-y-10 sm:space-y-12">
            {isOwner && isEditMode && (
              <button
                type="button"
                onClick={() => setEditingSection(benefitsSection)}
                className="absolute top-2 right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier les Avantages</span>
              </button>
            )}

            <div className="text-center max-w-2xl mx-auto space-y-2.5">
              <h2 className="text-2xl sm:text-4xl font-black text-[#111111] tracking-tight">
                {benefitsTitle}
              </h2>
              {benefitsSubtitle && (
                <p className="text-xs sm:text-sm text-[#666660] font-normal leading-relaxed">
                  {benefitsSubtitle}
                </p>
              )}
            </div>

            {benefitsItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {benefitsItems.map((item: any, idx: number) => {
                  const iconKey = String(item.icon || "").toLowerCase();
                  const IconComponent =
                    iconKey === "truck"
                      ? Truck
                      : iconKey === "shield"
                        ? ShieldCheck
                        : iconKey === "rotate-ccw" || iconKey === "return"
                          ? RotateCcw
                          : Award;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center text-center space-y-3 p-4 rounded-3xl bg-white border border-black/[0.04] shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="h-16 w-16 rounded-full border border-black/10 flex items-center justify-center text-[#111111] bg-[#FAF8F5]">
                        <IconComponent className="h-7 w-7 stroke-[1.5]" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#111111]">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#666660] leading-relaxed max-w-xs">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : isOwner && isEditMode ? (
              <div
                onClick={() => setEditingSection(benefitsSection)}
                className="border-2 border-dashed border-amber-400/80 bg-amber-50/40 rounded-3xl p-8 text-center space-y-2 cursor-pointer hover:bg-amber-50 transition-colors"
              >
                <div className="text-xs font-black text-amber-950">
                  + Configurer les 4 Avantages
                </div>
                <p className="text-[11px] text-amber-800">
                  Ajoutez vos arguments de réassurance client.
                </p>
              </div>
            ) : null}
          </section>
        )}

      {/* ========================================================================= */}
      {/* 6. PRODUITS DISPONIBLES (GRILLE VENTE DIRECTE COD) */}
      {/* ========================================================================= */}
      {(featuredSection?.isVisible ?? true) && (
      <section style={ord("sec_featured_products")} className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-black/[0.08] pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              {featuredSection?.content?.title ?? "Nos Coups de Cœur"}
            </h2>
            <p className="text-xs text-[#666660] mt-0.5">
              {featuredSection?.content?.subtitle ?? "Découvrez notre sélection : commandez en ligne et payez à la livraison."}
            </p>
          </div>
          {activeProducts.length > 0 && (
            <Link
              href={`/boutique/${storeSlug}/catalogue`}
              className="text-xs font-bold text-[#111111] hover:underline inline-flex items-center gap-1"
            >
              <span>Découvrir tout le catalogue ({activeProducts.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {activeProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {activeProducts.slice(0, Math.min(24, Math.max(1, Number(featuredSection?.content?.maxProducts) || 8))).map((prod) => {
              const isOutOfStock = false;
              const threshold = prod.lowStockThreshold ?? 5;
              const isLowStock = prod.stock > 0 && prod.stock <= threshold;
              const prodUrl = getProductPublicUrl(prod, storeSlug);
              const prodImageSrc =
                (prod.images && prod.images[0]) || (prod as any).image || "";

              return (
                <div
                  key={prod.id}
                  className="group rounded-3xl border border-black/[0.08] bg-white p-3 sm:p-4 space-y-3 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <Link
                      href={prodUrl}
                      className="relative block h-44 sm:h-52 rounded-2xl bg-[#FAF8F5] overflow-hidden border border-black/[0.04]"
                    >
                      <ProductImage
                        src={prodImageSrc}
                        alt={prod.name}
                        fill
                        fallbackLabel={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {Number(prod.compareAtPrice) > 0 && (
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-xs z-10">
                          Promo
                        </span>
                      )}

                      {isLowStock && (
                        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black shadow-xs z-10">
                          Stock Bas ({prod.stock})
                        </span>
                      )}

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-10">
                          <span className="px-3 py-1 rounded-full bg-[#111111] text-white text-xs font-black">
                            Épuisé
                          </span>
                        </div>
                      )}
                    </Link>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#888880] block">
                        {prod.category}
                      </span>
                      <Link
                        href={prodUrl}
                        className="text-xs sm:text-sm font-black text-[#111111] hover:text-emerald-700 transition-colors line-clamp-2 mt-0.5"
                      >
                        {prod.name}
                      </Link>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-[#111111]">
                        {formatFcfa(prod.salePrice)}
                      </span>
                      {Number(prod.compareAtPrice) > 0 && (
                        <span className="text-xs text-[#888880] line-through font-semibold">
                          {formatFcfa(prod.compareAtPrice as number)}
                        </span>
                      )}
                    </div>
                  </div>

                  {isOutOfStock ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-3 rounded-xl bg-black/5 text-[#888880] text-xs font-bold cursor-not-allowed text-center block"
                    >
                      Victime de son succès
                    </button>
                  ) : (
                    <Link
                      href={prodUrl}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all text-center block shadow-2xs cursor-pointer"
                      style={{ backgroundColor: themePrimary }}
                    >
                      Commander en Paiement Cash
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 px-6 rounded-3xl border border-black/[0.06] bg-[#FAF8F5] text-center max-w-md mx-auto space-y-2">
            <p className="text-xs font-semibold text-[#666660]">
              Aucun produit n'est actuellement publié sur cette boutique.
            </p>
          </div>
        )}
      </section>
      )}

      {/* ========================================================================= */}
      {/* 3. AVIS CLIENTS (RÈGLE STRICTE : MASQUÉ SI AUCUN AVIS DISPONIBLE) */}
      {/* ========================================================================= */}
      {reviewsSection &&
        (reviewsSection.isVisible || isEditMode) &&
        (reviewsList.length > 0 || isEditMode) && (
          <section style={ord("sec_customer_reviews")} className="relative group max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-6 space-y-8 sm:space-y-10">
            {isOwner && isEditMode && (
              <button
                type="button"
                onClick={() => setEditingSection(reviewsSection)}
                className="absolute top-2 right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Gérer les Avis</span>
              </button>
            )}

            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-[#111111] tracking-tight">
                {reviewsTitle}
              </h2>
            </div>

            {reviewsList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {reviewsList.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-6 sm:p-7 rounded-3xl border border-black/10 bg-white shadow-2xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm italic text-[#333330] leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-black/[0.04]">
                      <span className="text-xs sm:text-sm font-bold text-[#111111] block">
                        {rev.authorName}
                      </span>
                      <span className="text-[11px] font-medium text-[#888880] block">
                        Acheteur Vérifié{" "}
                        {rev.authorCity ? `· ${rev.authorCity}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : isOwner && isEditMode ? (
              <div
                onClick={() => setEditingSection(reviewsSection)}
                className="border-2 border-dashed border-amber-400/80 bg-amber-50/40 rounded-3xl p-8 text-center space-y-2 cursor-pointer hover:bg-amber-50 transition-colors"
              >
                <div className="text-xs font-black text-amber-950">
                  + Ajouter des Avis Clients
                </div>
                <p className="text-[11px] text-amber-800">
                  Aucun avis actuellement. Le bloc est masqué pour le public
                  tant qu'il est vide.
                </p>
              </div>
            ) : null}
          </section>
        )}

      {/* ========================================================================= */}
      {/* 4. NEWSLETTER KAELIS */}
      {/* ========================================================================= */}
      {newsletterSection &&
        (newsletterSection.isVisible || isEditMode) &&
        (newsletterTitle || newsletterSubtitle || isEditMode) && (
          <section style={ord("sec_newsletter")} className="relative group max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-6 text-center space-y-6">
            {isOwner && isEditMode && (
              <button
                type="button"
                onClick={() => setEditingSection(newsletterSection)}
                className="absolute top-2 right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier la Newsletter</span>
              </button>
            )}

            <div className="space-y-2.5">
              <h2 className="text-2xl sm:text-4xl font-black text-[#111111] tracking-tight">
                {newsletterTitle}
              </h2>
              {newsletterSubtitle && (
                <p className="text-xs sm:text-sm text-[#666660] font-normal leading-relaxed max-w-xl mx-auto">
                  {newsletterSubtitle}
                </p>
              )}
            </div>

            {newsletterSubscribed ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  Merci ! Vous êtes bien inscrit(e) à notre newsletter.
                </span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail.trim()) {
                    setNewsletterSubscribed(true);
                  }
                }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={
                    newsletterSection?.content?.placeholder ||
                    "Votre adresse e-mail"
                  }
                  className="w-full px-4 py-3 rounded-xl border border-black/15 bg-white text-xs sm:text-sm font-medium text-[#111111] focus:outline-hidden focus:border-black shadow-2xs"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-sm hover:opacity-90 transition-all cursor-pointer shrink-0"
                  style={{ backgroundColor: themePrimary }}
                >
                  {newsletterSection?.content?.buttonText || "S'abonner"}
                </button>
              </form>
            )}
          </section>
        )}

      {/* ========================================================================= */}
      {/* 5. NOTRE HISTOIRE (DISPOSITION 2 COLONNES KAELIS) */}
      {/* ========================================================================= */}
      {brandStorySection &&
        (brandStorySection.isVisible || isEditMode) &&
        (storyText || isEditMode) && (
          <section style={ord("sec_brand_story")}
            id="notre-histoire"
            className="relative group max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-6"
          >
            {isOwner && isEditMode && (
              <button
                type="button"
                onClick={() => setEditingSection(brandStorySection)}
                className="absolute top-2 right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier Notre Histoire</span>
              </button>
            )}

            <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center", !storyImageUrl && "max-w-3xl mx-auto text-center")}>
              {/* Photo d'illustration à gauche (masquée si aucune image) */}
              <div className={cn("lg:col-span-6", !storyImageUrl && "hidden")}>
                <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden shadow-sm border border-black/[0.06] bg-stone-100">
                  <img
                    src={storyImageUrl}
                    alt={storyTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Texte à droite */}
              <div className={cn("space-y-6", storyImageUrl ? "lg:col-span-6" : "lg:col-span-12")}>
                <h2 className="text-2xl sm:text-4xl font-black text-[#111111] tracking-tight">
                  {storyTitle}
                </h2>
                <p className="text-xs sm:text-sm text-[#444440] font-normal leading-relaxed whitespace-pre-line">
                  {storyText}
                </p>
                <div>
                  <Link
                    href={storyCtaUrl}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-[#111111] text-[#111111] text-xs sm:text-sm font-bold hover:bg-[#111111] hover:text-white transition-all cursor-pointer"
                  >
                    {storyCtaText}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}


      {/* TIROIR D'ÉDITION EN DIRECT (MODE ADMIN PROPRIÉTAIRE) */}
      <SectionEditorDrawer
        isOpen={Boolean(editingSection)}
        section={editingSection}
        onClose={() => setEditingSection(null)}
        onSave={handleSaveSection}
      />

      {/* BARRE D'ADMINISTRATION FLOTTANTE */}
      {isOwner && (
        <StorefrontAdminBar
          storeSlug={storeSlug}
          isPublished={storefront.isPublished}
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
          onTogglePublish={handleTogglePublish}
        />
      )}
    </div>
  );
}
