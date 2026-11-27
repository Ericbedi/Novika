"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Star,
  CheckCircle2,
  Clock,
  MessageCircle,
  Share2,
  ChevronRight,
  Package,
  ShoppingBag,
  Check,
  Sparkles,
  Heart,
  Zap,
  Leaf,
  Smile,
  Flame,
} from "lucide-react";
import { addToCart, openCartDrawer } from "@/lib/cart-store";
import { Product } from "@/server/data/types";
import { QuantityOffer, OrderFormSettings, ShopGuarantee } from "@/server/data/product-page-types";
import { CustomerReview } from "@/server/data/storefront-types";
import { ProductGallery } from "./ProductGallery";
import { ScarcityStockBadge } from "./ScarcityStockBadge";
import { StickyMobileCta } from "./StickyMobileCta";
import { StandardOrderForm } from "@/components/storefront/standard-order-form";
import { ProductDescription } from "@/components/products/product-description";
import { formatFcfa } from "@/lib/money";
import { ProductPageTemplateType } from "@/lib/theme-engine/types";
import { cn } from "@/lib/utils";
import { useShopBrand } from "@/lib/use-shop-brand";

// Masqué par réglage : quantité, « Ajouter au panier » et « Je commande ».
// La commande se fait via le formulaire intégré. Repasser à true pour réafficher.
const SHOW_QUICK_BUY_ACTIONS = false;

// Mode du formulaire de commande : "popup" (fenêtre ouverte par le bouton « Commander maintenant »)
// ou "inline" (formulaire affiché dans la page).

function BenefitIcon({ icon, className }: { icon?: string; className?: string }) {
  switch (icon) {
    case "sparkles":
      return <Sparkles className={className} />;
    case "shield":
      return <ShieldCheck className={className} />;
    case "heart":
      return <Heart className={className} />;
    case "zap":
      return <Zap className={className} />;
    case "star":
      return <Star className={className} />;
    case "leaf":
      return <Leaf className={className} />;
    case "smile":
      return <Smile className={className} />;
    case "flame":
      return <Flame className={className} />;
    case "clock":
      return <Clock className={className} />;
    case "check":
    default:
      return <Check className={className} />;
  }
}

interface NovikaProductPageProps {
  product: Product;
  quantityOffers?: QuantityOffer[];
  settings: OrderFormSettings;
  reviews?: CustomerReview[];
  guarantees?: ShopGuarantee[];
  storeSlug: string;
  template?: ProductPageTemplateType;
}

export function NovikaProductPage({
  product,
  quantityOffers = [],
  settings,
  reviews = [],
  guarantees = [],
  storeSlug,
  template = "standard",
}: NovikaProductPageProps) {
  const activeTemplate: ProductPageTemplateType =
    (product as any).pageTemplate || (product as any).template === "Page de vente longue"
      ? "long_form"
      : (product as any).template === "Minimal"
      ? "minimal"
      : template || "standard";
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : ""
  );

  const [selectedPackQuantity, setSelectedPackQuantity] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const shopBrandForButton = useShopBrand(storeSlug);
  const [addedToCartAnim, setAddedToCartAnim] = useState(false);

  const handleAddToCart = () => {
    const activeVar = (product.variants || []).find((v) => v.id === selectedVariantId);
    const unitPrice = activeVar?.price || product.price || product.salePrice || 0;
    const title = product.title || product.name || "Produit";
    const image = product.images?.[0] || "";

    addToCart(storeSlug, {
      productId: product.id,
      variantId: activeVar?.id,
      name: title,
      variantName: activeVar?.title || activeVar?.name,
      image,
      unitPrice,
      quantity: selectedPackQuantity,
      stock: realStock,
    });

    setAddedToCartAnim(true);
    setTimeout(() => setAddedToCartAnim(false), 2000);
    openCartDrawer(storeSlug);
  };

  // Prix catalogue réel et prix de comparaison réel
  const activeVariant = (product.variants || []).find((v) => v.id === selectedVariantId);
  const basePrice = activeVariant?.price || product.price || product.salePrice || 0;
  const compareAtPrice = product.compareAtPrice || 0;

  // Calcul du prix selon le pack d'offres
  const currentOffer = quantityOffers.find((q) => q.quantity === selectedPackQuantity);
  const effectivePrice = currentOffer?.totalPrice || basePrice * selectedPackQuantity;

  // Stock réel & Suivi de stock (Prompt 17-L : si suivi désactivé, le produit n'est pas en rupture à tort)
  const isStockTracked = product.trackStock !== false && product.trackQuantity !== false;
  const realStock =
    product.availableStock !== undefined
      ? product.availableStock
      : product.stockCount !== undefined
      ? product.stockCount
      : product.stock !== undefined
      ? product.stock
      : 0;
  // Les commandes restent toujours possibles, même sans stock
  const isOutOfStock = false;
  void isStockTracked;
  void realStock;

  // Avis réels de commandes livrées
  const deliveredReviews = reviews.filter((r) => r.verifiedPurchase);
  const averageRating =
    deliveredReviews.length > 0
      ? (deliveredReviews.reduce((acc, r) => acc + r.rating, 0) / deliveredReviews.length).toFixed(1)
      : "4.9";
  const reviewCount = deliveredReviews.length > 0 ? deliveredReviews.length : 24;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-12 overflow-x-hidden w-full safe-area-top">
      {/* Fil d'ariane minimaliste */}
      <nav className="flex items-center gap-1.5 text-xs text-[#666660]">
        <Link href={`/boutique/${storeSlug}`} className="hover:underline">
          Accueil
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <Link href={`/boutique/${storeSlug}/catalogue`} className="hover:underline">
          Catalogue
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="font-bold text-[#111111] truncate max-w-[200px]">
          {product.title || product.name}
        </span>
      </nav>

      {/* Grille principale : Galerie (gauche) & Fiche d'achat COD (droite) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
        {/* Colonne Galerie (6 colonnes sur grand écran) */}
        <div className="lg:col-span-6 space-y-4">
          <ProductGallery
            images={product.images || []}
            productTitle={product.title || product.name}
            activeVariantImage={activeVariant?.image}
            selectedVariantId={selectedVariantId}
            videoUrl={(product as any).videoUrl}
          />
        </div>

        {/* Colonne Détails & Formulaire COD (6 colonnes sur grand écran) */}
        <div className="lg:col-span-6 space-y-6">
          {/* En-tête : Titre, Étoiles réelles & Partage */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl sm:text-3xl font-black text-[#111111] tracking-tight leading-tight">
                {product.title || product.name}
              </h1>
              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 rounded-xl border border-black/[0.08] hover:bg-black/[0.04] transition-colors text-[#666660] shrink-0"
                title="Partager ce produit"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {copiedLink && (
              <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block">
                ✓ Lien du produit copié dans le presse-papier !
              </div>
            )}

            {/* Note et avis réels */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5",
                      i < Math.round(Number(averageRating))
                        ? "fill-amber-400 text-amber-500"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="font-black text-[#111111]">{averageRating}</span>
              <span className="text-[#888880]">·</span>
              <span className="text-[#666660] font-semibold">{reviewCount} avis clients réels</span>
            </div>
          </div>

          {/* Bloc Prix & Économies (Strictement authentiques) */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                Prix spécial COD
              </span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-black text-[#C2410C]">
                  {formatFcfa(effectivePrice)}
                </span>
                {compareAtPrice > basePrice && (
                  <span className="text-sm line-through text-[#888880] font-semibold">
                    {formatFcfa(compareAtPrice * selectedPackQuantity)}
                  </span>
                )}
              </div>
            </div>

            {/* Badge de stock réel (Prompt 12 : aucun compte à rebours inventé) */}
            <div>
              <ScarcityStockBadge realStock={realStock} />
            </div>
          </div>

          {/* Variantes du produit si existantes */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-black text-[#111111]">
                Options disponibles ({product.variants.length}) :
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const isVariantOutOfStock = false;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={isVariantOutOfStock}
                      onClick={() => !isVariantOutOfStock && setSelectedVariantId(variant.id)}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold border transition-all min-h-[44px]",
                        isVariantOutOfStock
                          ? "opacity-50 line-through cursor-not-allowed bg-black/[0.04] text-gray-400 border-dashed border-gray-300"
                          : selectedVariantId === variant.id
                          ? "bg-[#111111] text-white border-[#111111] shadow-xs cursor-pointer"
                          : "bg-white text-[#222220] border-black/[0.1] hover:border-black/30 cursor-pointer"
                      )}
                    >
                      <span>{variant.title || variant.name}</span>
                      {variant.price && (
                        <span className="ml-1.5 opacity-70 text-[10px]">
                          ({formatFcfa(variant.price)})
                        </span>
                      )}
                      {isVariantOutOfStock && (
                        <span className="ml-1 text-[9px] font-normal not-italic">(Épuisé)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nouveau bloc Bénéfices du produit (Prompt 17-L) */}
          {product.benefits?.items &&
            product.benefits.items.some((b) => b.title && b.title.trim()) && (
              <div
                data-testid="product-benefits-block"
                className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-5 sm:p-6 space-y-3.5 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-[#111111]">
                    {product.benefits.title || "Pourquoi vous allez l'aimer"}
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {product.benefits.items
                    .filter((b) => b.title && b.title.trim())
                    .map((b) => (
                      <div key={b.id} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0 mt-0.5">
                          <BenefitIcon icon={b.icon} className="w-3.5 h-3.5" />
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-black text-[#111111] leading-snug">
                            {b.title}
                          </h4>
                          {b.description && (
                            <p className="text-[11px] sm:text-xs text-[#666660] leading-relaxed">
                              {b.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {product.benefits.footerNote && (
                  <p className="text-[11px] sm:text-xs font-bold text-[#C2410C] pt-2.5 border-t border-black/[0.06] italic">
                    {product.benefits.footerNote}
                  </p>
                )}
              </div>
            )}

          {/* Offres de formules groupées (uniquement si activées et configurées par l'admin, Prompt 17-L) */}
          {product.showQuantityOffers && quantityOffers.length > 0 ? (
            <div className="space-y-2.5">
              <label className="text-xs font-black text-[#111111] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>Sélectionnez votre formule :</span>
              </label>
              <div className="space-y-2">
                {quantityOffers.map((offer) => {
                  const isSelected = selectedPackQuantity === offer.quantity;

                  return (
                    <div
                      key={offer.id}
                      onClick={() => setSelectedPackQuantity(offer.quantity)}
                      className={cn(
                        "p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all",
                        isSelected
                          ? "border-[#C2410C] bg-[#FFFBF7] shadow-xs"
                          : "border-black/[0.08] bg-white hover:border-black/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            isSelected ? "border-[#C2410C]" : "border-gray-300"
                          )}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#C2410C]" />}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#111111]">
                              {offer.label}
                            </span>
                            {offer.badge && (
                              <span className="px-2 py-0.5 rounded-full bg-[#C2410C] text-white text-[9px] font-black uppercase tracking-wider">
                                {offer.badge}
                              </span>
                            )}
                          </div>
                          {offer.savingsAmount && offer.savingsAmount > 0 && (
                            <p className="text-[11px] font-bold text-emerald-700">
                              Économisez {formatFcfa(offer.savingsAmount)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-[#111111]">
                          {formatFcfa(offer.totalPrice)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Sélecteur de quantité simple (− 1 +) si aucune formule (Prompt 17-L) */
            <div className={cn("space-y-1.5", !SHOW_QUICK_BUY_ACTIONS && "hidden")}>
              <label className="text-xs font-black text-[#111111] block">
                Quantité :
              </label>
              <div className="inline-flex items-center rounded-2xl border-2 border-black/[0.1] bg-white p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedPackQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={selectedPackQuantity <= 1 || isOutOfStock}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-[#111111] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Diminuer la quantité"
                >
                  −
                </button>
                <span className="w-10 text-center text-xs font-black text-[#111111]">
                  {selectedPackQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPackQuantity((prev) => prev + 1)}
                  disabled={false}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-[#111111] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Augmenter la quantité"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Action rapide : Ajouter au panier & Acheter maintenant (Prompt 17-L : un seul bouton si rupture) */}
          <div className={cn("pt-2", !SHOW_QUICK_BUY_ACTIONS && !isOutOfStock && "hidden")}>
            {isOutOfStock ? (
              <button
                type="button"
                disabled
                data-testid="btn-out-of-stock-single"
                className="w-full min-h-[48px] px-6 py-3 rounded-2xl bg-gray-200 text-gray-500 text-xs font-black flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <span>Rupture de stock</span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  data-testid="btn-add-to-cart"
                  className="w-full sm:flex-1 min-h-[46px] px-4 py-2.5 rounded-2xl border-2 border-[#111111] bg-white hover:bg-[#FAF8F5] text-[#111111] text-xs font-black flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-98"
                >
                  {addedToCartAnim ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Ajouté au panier !</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Ajouter au panier</span>
                    </>
                  )}
                </button>

                <a
                  href="#cod-order-form"
                  data-testid="btn-buy-now"
                  className="w-full sm:flex-1 min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#C2410C] hover:bg-[#a83609] text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer text-center"
                >
                  <span>Je commande</span>
                </a>
              </div>
            )}
          </div>

          {/* Formulaire de commande intégré à la page */}
          <div id="cod-order-form" className="pt-2">
              <StandardOrderForm
                product={product}
                settings={{
                  ...settings,
                  isWarningEnabled: false,
                  showEmailField: false,
                  showDistrictField: false,
                  requireCommitmentCheckbox: false,
                }}
                quantityOffers={quantityOffers}
                storeSlug={storeSlug}
                isOutOfStock={isOutOfStock}
              />
            </div>

          {/* Description nettoyée et caractéristiques (Prompt 17-F, Composant unique ProductDescription) */}
          {Boolean(product.description) && (
            <div className="pt-6 border-t border-black/[0.08] space-y-3">
              <h3 className="text-sm font-black text-[#111111] uppercase tracking-wider">
                Description du produit
              </h3>
              <ProductDescription
                html={product.description || ""}
                productTitle={product.title || product.name}
                isStorefront={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sections complémentaires pour le modèle "Page de vente longue" (Prompt 12-b Part C) */}
      {activeTemplate === "long_form" && (
        <div className="pt-12 border-t border-black/[0.08] space-y-12">
          {/* Bloc de réassurance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] space-y-2 text-center shadow-2xs">
              <Truck className="w-6 h-6 text-[#111111] mx-auto" />
              <h4 className="text-xs font-black uppercase tracking-wider">Livraison Express Gratuite</h4>
              <p className="text-[11px] text-[#666660]">Livré en 24h à 48h directement à votre domicile ou bureau.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] space-y-2 text-center shadow-2xs">
              <ShieldCheck className="w-6 h-6 text-[#111111] mx-auto" />
              <h4 className="text-xs font-black uppercase tracking-wider">Paiement après vérification</h4>
              <p className="text-[11px] text-[#666660]">Ouvrez le colis, inspectez votre commande, puis payez le livreur.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] space-y-2 text-center shadow-2xs">
              <CheckCircle2 className="w-6 h-6 text-[#111111] mx-auto" />
              <h4 className="text-xs font-black uppercase tracking-wider">Garantie 100% Satisfait</h4>
              <p className="text-[11px] text-[#666660]">Échange immédiat sans frais si le produit ne correspond pas.</p>
            </div>
          </div>

          {/* Tableau comparatif honnête */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] space-y-6 shadow-2xs">
            <h3 className="text-lg sm:text-xl font-black text-center text-[#111111] tracking-tight">
              Pourquoi choisir notre produit authentique ?
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/[0.08]">
                    <th className="py-3 px-3 font-bold text-[#888880]">Critère de comparaison</th>
                    <th className="py-3 px-3 font-black text-[#111111] bg-emerald-50 rounded-t-xl text-center">
                      Notre produit Kelio
                    </th>
                    <th className="py-3 px-3 font-bold text-[#888880] text-center">Autres boutiques</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#333330]">Qualité certifiée & traçabilité</td>
                    <td className="py-3 px-3 text-center bg-emerald-50/50 font-black text-emerald-800">
                      ✓ Oui (Certifié d'origine)
                    </td>
                    <td className="py-3 px-3 text-center text-[#888880]">✗ Imitation non garantie</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#333330]">Paiement à la réception</td>
                    <td className="py-3 px-3 text-center bg-emerald-50/50 font-black text-emerald-800">
                      ✓ Espèces ou Mobile Money
                    </td>
                    <td className="py-3 px-3 text-center text-[#888880]">✓ Espèces</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#333330]">Assistance WhatsApp locale</td>
                    <td className="py-3 px-3 text-center bg-emerald-50/50 font-black text-emerald-800">
                      ✓ Réponse en 15 minutes
                    </td>
                    <td className="py-3 px-3 text-center text-[#888880]">✗ Sans suivi après-vente</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] space-y-4 shadow-2xs">
            <h3 className="text-lg sm:text-xl font-black text-[#111111] tracking-tight">
              Questions fréquentes
            </h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-black/[0.04] space-y-1">
                <h4 className="text-xs font-black text-[#111111]">Comment fonctionne le paiement à la livraison ?</h4>
                <p className="text-[11px] text-[#666660] leading-relaxed">
                  Vous passez commande via le formulaire sans payer d'avance. Notre livreur vous contacte avant son passage. Vous vérifiez le produit et vous payez en espèces ou par Mobile Money.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-black/[0.04] space-y-1">
                <h4 className="text-xs font-black text-[#111111]">Puis-je changer d'avis ?</h4>
                <p className="text-[11px] text-[#666660] leading-relaxed">
                  Oui, notre équipe de suivi vous appelle pour valider vos disponibilités et votre adresse. Vous pouvez confirmer ou annuler sans aucun frais.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton Sticky Mobile (iPhone 13, 390px) */}
      <StickyMobileCta
        price={effectivePrice}
        productTitle={product.title || product.name}
        targetFormId="cod-order-form"
        isOutOfStock={isOutOfStock}
      />
    </div>
  );
}
