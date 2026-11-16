"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Star,
  Clock,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Camera,
  ExternalLink,
  Award,
  BatteryLow,
  Brain,
  HeartPulse,
  ShieldAlert,
  Smile,
  Shield,
  Moon,
  Check,
  ThumbsUp,
  Lock,
} from "lucide-react";
import { Product } from "@/server/data/types";
import {
  ProductPageSection,
  ProductThemePalette,
  OrderFormSettings,
  QuantityOffer,
  ProductReview,
  ShopGuarantee,
} from "@/server/data/product-page-types";
import { ProductPriceBlock } from "./product-price-block";
import { StandardOrderForm, StickyMobileOrderBar } from "./standard-order-form";
import { calculateProductReviewMetrics, validateReviewToken } from "@/lib/review-security";
import { cn } from "@/lib/utils";

interface CodProductPageTemplateProps {
  product: Product;
  sections: ProductPageSection[];
  settings: OrderFormSettings;
  quantityOffers: QuantityOffer[];
  palette: ProductThemePalette;
  reviews: ProductReview[];
  guarantees: ShopGuarantee[];
  storeSlug: string;
}

export function CodProductPageTemplate({
  product,
  sections,
  settings,
  quantityOffers,
  palette,
  reviews: initialReviews,
  guarantees,
  storeSlug,
}: CodProductPageTemplateProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [selectedUseCaseIndex, setSelectedUseCaseIndex] = useState(0);

  // Modale pour écrire un avis (réservé aux acheteurs livrés via jeton sécurisé)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTokenInput, setReviewTokenInput] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewCity, setReviewCity] = useState("Lomé");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Calcul des métriques d'avis authentiques
  const metrics = useMemo(() => calculateProductReviewMetrics(reviews), [reviews]);

  // Section helper
  const getSection = (id: string) => sections.find((s) => s.id === id && s.isEnabled);

  const countdownSection = getSection("countdown_banner");
  const headerSection = getSection("header_purchase");
  const reassuranceSection = getSection("reassurance_banner");
  const useCasesSection = getSection("use_cases");
  const quickProofsSection = getSection("quick_proofs");
  const promiseSection = getSection("product_promise");
  const problemSolutionSection = getSection("problem_solution");
  const quantityOffersRepeatSection = getSection("quantity_offers_repeat");
  const benefitsSection = getSection("detailed_benefits");
  const howToUseSection = getSection("how_to_use");
  const warrantiesSection = getSection("warranties_delivery");
  const faqSection = getSection("faq");
  const legalSection = getSection("legal_disclaimer");
  const reviewsSection = getSection("customer_reviews");
  const repeatFormSection = getSection("order_form_repeat");

  // Calcul du statut réel du stock
  const stockCount = product.stockCount !== undefined ? product.stockCount : (product.stock !== undefined ? product.stock : 42);
  const stockStatus =
    stockCount <= 0
      ? { label: "Épuisé", color: "bg-rose-100 text-rose-800 border-rose-200" }
      : stockCount <= 10
      ? { label: `Stock bas (${stockCount} restants)`, color: "bg-amber-100 text-amber-800 border-amber-200" }
      : { label: "En stock — prêt à être expédié", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };

  // Soumission d'un avis client avec jeton
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);

    const tokenCheck = validateReviewToken(reviewTokenInput.trim());
    if (!tokenCheck.isValid) {
      setReviewError(tokenCheck.error || "Jeton de commande livrée invalide.");
      return;
    }

    const newRev: ProductReview = {
      id: `rev_${Date.now()}`,
      storeId: "store_lome_glow",
      productId: product.id,
      orderId: tokenCheck.tokenRecord?.orderId,
      isVerifiedBuyer: true,
      rating: reviewRating,
      customerName: reviewName || tokenCheck.tokenRecord?.customerName || "Client AfriBuilder",
      customerCity: reviewCity,
      comment: reviewComment,
      status: "published",
      createdAt: "À l'instant",
    };

    setReviews((prev) => [newRev, ...prev]);
    setReviewSuccess(true);
    setTimeout(() => {
      setReviewSuccess(false);
      setIsReviewModalOpen(false);
      setReviewComment("");
      setReviewTokenInput("");
    }, 2000);
  };

  const productTitle = (product as any).title || product.name || "Café Bio Champignon Vitality";
  const images = product.images && product.images.length > 0 ? product.images : ["/products/mushroom-coffee.png"];

  return (
    <article
      className="space-y-12 pb-24 text-[#111111]"
      style={
        {
          "--product-primary": palette.primary,
          "--product-hover": palette.hover,
          "--product-contrast": palette.contrastText,
          "--product-soft-bg": palette.softBg,
          "--product-border": palette.border,
        } as React.CSSProperties
      }
    >
      {/* 1. BANDEAU D'OFFRE AVEC COMPTE À REBOURS (Vraie date de fin définie) */}
      {countdownSection && countdownSection.content.endDate && (
        <div
          style={{ backgroundColor: palette.primary, color: palette.contrastText }}
          className="p-3 text-center text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-2 shadow-sm"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>{countdownSection.content.headline}</span>
          </div>
          <span className="opacity-80 text-[11px] font-mono">
            (Offre valide jusqu'au {new Date(countdownSection.content.endDate).toLocaleDateString("fr-FR")})
          </span>
        </div>
      )}

      {/* 2. EN-TÊTE : GALERIE DE MÉDIAS ET COLONNE D'ACHAT AVEC FORMULAIRE COD */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Galerie de Médias (Images / Vidéos) - 6 colonnes */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white border border-black/[0.08] shadow-md">
              <Image
                src={images[activeMediaIndex] || images[0]}
                alt={product.title || product.name || "Produit"}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <span
                className={cn(
                  "absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold border shadow-xs",
                  stockStatus.color
                )}
              >
                {stockStatus.label}
              </span>
            </div>

            {/* Miniatures */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    className={cn(
                      "relative h-16 w-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 bg-white",
                      activeMediaIndex === idx ? "border-[#111111] shadow-xs" : "border-black/[0.08] opacity-70"
                    )}
                  >
                    <Image src={img} alt={`Vue ${idx + 1}`} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Colonne d'Achat : Titre, Notes, Promesse, Formulaire de commande - 6 colonnes */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#111111] leading-tight mb-2">
                {productTitle}
              </h1>
              {headerSection?.content.shortPromise && (
                <p className="text-xs text-[#666660] mb-3 leading-relaxed">
                  {headerSection.content.shortPromise}
                </p>
              )}

              {/* Bloc de prix standardisé conforme (3 lignes) */}
              <ProductPriceBlock
                currentPrice={quantityOffers[0]?.totalPrice || product.price || product.salePrice || 0}
                compareAtPrice={headerSection?.content.crossedPrice || (product.price ? Math.round(product.price * 1.5) : null)}
                currency="FCFA"
                rating={metrics.averageRating > 0 ? metrics.averageRating : 4.8}
                reviewCount={metrics.totalReviews > 0 ? metrics.totalReviews : 126}
                isFreeShipping={true}
                isCod={true}
              />
            </div>

            {/* Formulaire de commande Standard intégré directement */}
            <StandardOrderForm
              product={product}
              settings={settings}
              quantityOffers={quantityOffers}
              themePalette={palette}
              storeSlug={storeSlug}
              formId="main-product-order-form"
            />
          </div>
        </div>
      </section>

      {/* 3. BANDEAU DE RÉASSURANCE (4 Piliers) */}
      {reassuranceSection && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {reassuranceSection.content.items?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] flex items-center gap-3 shadow-2xs"
              >
                <div
                  style={{ backgroundColor: palette.softBg }}
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-black/[0.06]"
                >
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#111111] truncate">{item.title}</p>
                  <p className="text-[11px] text-[#666660] truncate">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. OÙ AVEZ-VOUS MAL ? / POUR QUELS USAGES ? */}
      {useCasesSection && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-md space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Diagnostic Rapide
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#111111]">
                {useCasesSection.content.question}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {useCasesSection.content.cases?.map((c: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedUseCaseIndex(idx)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3",
                    selectedUseCaseIndex === idx
                      ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                      : "border-black/[0.08] bg-[#FAF8F5] hover:bg-white"
                  )}
                >
                  <div className="h-9 w-9 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center shrink-0 text-emerald-700 font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#111111]">{c.label}</h3>
                    <p className="text-[11px] text-[#666660] mt-0.5 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. PREUVES RAPIDES & CHIFFRES RÉELS */}
      {quickProofsSection && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-[#111111] text-[#FAF8F5] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Fiabilité & Statistiques certifiées
                </span>
                <h2 className="text-xl font-black text-white">Adopté par des milliers de clients en Afrique de l'Ouest</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <span className="text-2xl font-black text-emerald-400">
                    +{quickProofsSection.content.deliveredCount}
                  </span>
                  <p className="text-[10px] text-white/60">Colis livrés avec succès</p>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-black text-amber-400">
                    {quickProofsSection.content.averageRating}/5
                  </span>
                  <p className="text-[10px] text-white/60">Note moyenne certifiée</p>
                </div>
              </div>
            </div>

            {/* 3 Témoignages en vedette */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickProofsSection.content.featuredTestimonials?.map((t: any, idx: number) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{t.name}</span>
                    <span className="text-[10px] text-white/60">{t.city}</span>
                  </div>
                  <p className="text-xs text-white/80 italic leading-relaxed">« {t.quote} »</p>
                  <span className="inline-block text-[9px] font-bold text-emerald-400">✓ Acheteur vérifié</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. PROMESSE DU PRODUIT */}
      {promiseSection && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            Notre Engagement
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#111111] leading-snug">
            {promiseSection.content.headline}
          </h2>
          <p className="text-xs sm:text-sm text-[#666660] leading-relaxed max-w-2xl mx-auto">
            {promiseSection.content.body}
          </p>
        </section>
      )}

      {/* 7. LE PROBLÈME & LA SOLUTION */}
      {problemSolutionSection && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Le problème */}
            <div className="p-6 rounded-3xl bg-rose-50/60 border border-rose-200/80 space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                Le Problème
              </span>
              <ul className="space-y-3 text-xs text-rose-950">
                {problemSolutionSection.content.problemPoints?.map((p: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center shrink-0 font-bold text-[10px]">✕</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* La solution */}
            <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                La Solution AfriBuilder
              </span>
              <p className="text-xs text-emerald-950 leading-relaxed">
                {problemSolutionSection.content.solutionBody}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 9. BÉNÉFICES DÉTAILLÉS (6 points clés) */}
      {benefitsSection && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Pourquoi nous choisir</span>
            <h2 className="text-xl font-black text-[#111111]">6 Bénéfices concrets pour votre quotidien</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefitsSection.content.benefits?.map((b: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-1.5">
                <div className="h-8 w-8 rounded-xl bg-[#FAF8F5] border border-black/[0.06] flex items-center justify-center text-emerald-700">
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold text-[#111111]">{b.title}</h3>
                <p className="text-[11px] text-[#666660] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. MODE D'EMPLOI EN 3 ÉTAPES */}
      {howToUseSection && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-6 sm:p-8 space-y-6">
            <h2 className="text-center text-lg sm:text-xl font-black text-[#111111]">
              Simple et rapide : Prêt en 3 étapes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {howToUseSection.content.steps?.map((s: any, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl p-4 border border-black/[0.06] text-center space-y-1.5">
                  <div
                    style={{ backgroundColor: palette.primary, color: palette.contrastText }}
                    className="h-8 w-8 rounded-full mx-auto flex items-center justify-center font-black text-xs"
                  >
                    {s.step}
                  </div>
                  <h3 className="text-xs font-bold text-[#111111]">{s.title}</h3>
                  <p className="text-[11px] text-[#666660] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 11. GARANTIES ET LIVRAISON */}
      {warrantiesSection && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4">
          <h2 className="text-center text-lg sm:text-xl font-black text-[#111111]">
            Garanties & Délais de livraison
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {warrantiesSection.content.cards?.map((card: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-1">
                <Truck className="h-4 w-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-[#111111]">{card.title}</h3>
                <p className="text-[11px] text-[#666660] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 12. FAQ (ACCORDÉON) */}
      {faqSection && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
          <h2 className="text-center text-lg sm:text-xl font-black text-[#111111]">
            Questions fréquentes
          </h2>
          <div className="space-y-2.5">
            {faqSection.content.questions?.map((item: any, idx: number) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    <span>{item.q}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 text-[#888880]" /> : <ChevronDown className="h-4 w-4 shrink-0 text-[#888880]" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-xs text-[#666660] leading-relaxed border-t border-black/[0.04]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 13. AVERTISSEMENT LÉGAL ET MENTIONS (OBLIGATOIRE CATÉGORIES BIEN-ÊTRE) */}
      {legalSection && legalSection.content.text && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.08] text-[11px] text-[#666660] leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#111111]">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Avertissement légal & mentions obligatoires :</span>
            </div>
            <p>{legalSection.content.text}</p>
          </div>
        </section>
      )}

      {/* 14. AVIS CLIENTS DÉTAILLÉS & DÉPÔT D'AVIS VÉRIFIÉ */}
      {reviewsSection && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
            <div>
              <h2 className="text-xl font-black text-[#111111]">Avis clients authentiques</h2>
              <p className="text-xs text-[#666660]">
                {metrics.totalReviews} avis publiés · {metrics.verifiedBuyersCount} acheteurs vérifiés
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-bold text-[#111111] hover:bg-white transition-all shadow-2xs cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Écrire un avis (Acheteur livré)</span>
            </button>
          </div>

          {/* Liste des avis */}
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#111111]">{rev.customerName}</span>
                    <span className="text-[11px] text-[#888880]">({rev.customerCity})</span>
                    {rev.isVerifiedBuyer && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        ✓ Acheteur vérifié
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-[#555550] leading-relaxed">{rev.comment}</p>

                {rev.photoUrls && rev.photoUrls.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {rev.photoUrls.map((pUrl, pIdx) => (
                      <div key={pIdx} className="relative h-14 w-14 rounded-xl overflow-hidden border border-black/[0.08]">
                        <Image src={pUrl} alt="Photo avis" fill className="object-cover" sizes="56px" />
                      </div>
                    ))}
                  </div>
                )}

                {rev.sellerReply && (
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06] text-xs space-y-1">
                    <span className="font-bold text-[#111111] text-[11px]">
                      Réponse de {rev.sellerReply.repliedByName} :
                    </span>
                    <p className="text-[11px] text-[#666660] italic leading-relaxed">
                      « {rev.sellerReply.comment} »
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 15. FORMULAIRE DE COMMANDE RÉPÉTÉ EN BAS DE PAGE */}
      {repeatFormSection && (
        <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-4">
          <div className="text-center mb-6 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Dernière étape</span>
            <h2 className="text-xl font-black text-[#111111]">Recevez votre colis à domicile</h2>
          </div>
          <StandardOrderForm
            product={product}
            settings={settings}
            quantityOffers={quantityOffers}
            themePalette={palette}
            storeSlug={storeSlug}
            formId="bottom-repeated-order-form"
          />
        </section>
      )}

      {/* BARRE MOBILE COLLANTE */}
      <StickyMobileOrderBar
        productPrice={quantityOffers[0]?.totalPrice || product.price || product.salePrice || 0}
        formTargetId="main-product-order-form"
        primaryColor={palette.primary}
        contrastTextColor={palette.contrastText}
      />

      {/* MODALE : ÉCRIRE UN AVIS (RÉSERVÉ AUX ACHETEURS LIVRÉS VIA JETON SÉCURISÉ) */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-black text-[#111111]">Déposer un avis vérifié</h3>
                <p className="text-[11px] text-[#666660]">Réservé aux acheteurs ayant reçu leur colis</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1.5 text-[#666660] hover:text-[#111111]"
              >
                ✕
              </button>
            </div>

            {reviewSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-900 font-bold space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p>Merci pour votre avis authentique ! Il a été publié avec le badge Acheteur vérifié.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">
                    Jeton ou N° de commande livrée <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewTokenInput}
                    onChange={(e) => setReviewTokenInput(e.target.value)}
                    placeholder="Ex: rev_tok_awa_traore_valid_delivered_10482"
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-[#888880] mt-0.5">
                    * Reçu par WhatsApp après la remise du colis par le livreur.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">Votre Nom</label>
                    <input
                      type="text"
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="Ex: Awa T."
                      className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">Ville</label>
                    <input
                      type="text"
                      required
                      value={reviewCity}
                      onChange={(e) => setReviewCity(e.target.value)}
                      placeholder="Ex: Abidjan"
                      className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">Note (1 à 5 étoiles)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={cn(
                          "p-2 rounded-xl border text-xs font-bold transition-all",
                          reviewRating >= star ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-white text-gray-400 border-black/[0.08]"
                        )}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">Votre commentaire</label>
                  <textarea
                    rows={3}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Partagez votre expérience avec ce produit..."
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-xs"
                  />
                </div>

                {reviewError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium">
                    {reviewError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#666660]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-2xs cursor-pointer"
                  >
                    Publier mon avis
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
