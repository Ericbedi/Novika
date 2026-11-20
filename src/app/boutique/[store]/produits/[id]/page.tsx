"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MOCK_STORES } from "@/mock-data/stores";
import {
  MOCK_ORDER_FORM_SETTINGS,
  MOCK_QUANTITY_OFFERS,
  MOCK_SHOP_GUARANTEES,
  MOCK_PRODUCT_REVIEWS,
} from "@/mock-data/product-page-data";
import { NovikaProductPage } from "@/components/storefront/product/NovikaProductPage";
import {
  findProductInShopRaw,
  getShopProducts,
} from "@/lib/products-store";
import { Product } from "@/server/data/types";
import { QuantityOffer } from "@/server/data/product-page-types";
import {
  shouldDisplayUnavailableScreen,
  isProductVisibleOnStorefront,
} from "@/lib/stock-settings-store";
import {
  AlertTriangle,
  MessageCircle,
  Eye,
  Store as StoreIcon,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatFcfa } from "@/lib/money";
import { verifyPreviewToken, getStorePublicUrl } from "@/lib/storefront-urls";

export default function ProductCanonicalDetailPage({
  params,
}: {
  params: Promise<{ store: string; id: string }>;
}) {
  const { store: storeSlug, id: productId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTemplate = searchParams?.get("template") as any;
  const token = searchParams?.get("token");
  const isPreviewQuery = searchParams?.get("preview") === "true";

  // Récupération de la boutique pour le branding
  const store = useMemo(() => {
    return (
      MOCK_STORES.find((s) => s.slug === storeSlug) || {
        id: `store_${storeSlug}`,
        name: storeSlug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        slug: storeSlug,
        country: "TG",
        countryName: "Togo",
        flag: "🇹🇬",
        currency: "XOF",
        whatsappNumber: "+22890000000",
        role: "owner" as const,
      }
    );
  }, [storeSlug]);

  // État initial résolu avec tolérance (id, slug, short_code)
  const [productData, setProductData] = useState(() => {
    return findProductInShopRaw(storeSlug, productId);
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const raw = findProductInShopRaw(storeSlug, productId);
    setProductData(raw);
    setIsLoaded(true);

    // Détection rôle admin connecté
    try {
      const activeRole = localStorage.getItem("novika_active_role");
      const hasCookieRole =
        document.cookie.includes("novika_active_role=owner") ||
        document.cookie.includes("novika_active_role=admin");
      setIsAdminUser(
        activeRole === "owner" ||
          activeRole === "admin" ||
          activeRole === "manager" ||
          hasCookieRole
      );
    } catch {
      setIsAdminUser(false);
    }
  }, [storeSlug, productId]);

  const product = productData.product;
  const isTokenValid = useMemo(() => {
    if (!token || !product) return false;
    return verifyPreviewToken(token, product.id, storeSlug);
  }, [token, product, storeSlug]);

  const isPreview = isPreviewQuery || isTokenValid;

  // Redirection 301 / replace vers l'URL canonique (/produits/{slug}) si accédé via id ou short_code
  useEffect(() => {
    if (
      isLoaded &&
      product &&
      product.slug &&
      !isPreview &&
      !productData.isUnpublished &&
      !productData.isDeleted
    ) {
      const canonicalSlug = product.slug;
      if (productId !== canonicalSlug) {
        router.replace(`/boutique/${storeSlug}/produits/${canonicalSlug}`);
      }
    }
  }, [isLoaded, product, productId, isPreview, productData, router, storeSlug]);

  // =========================================================================
  // CAS 1 : PRODUIT INTROUVABLE OU EN CORBEILLE -> PAGE 404 DE LA BOUTIQUE
  // =========================================================================
  if (isLoaded && (!product || productData.isDeleted)) {
    const diagnosticReason = productData.isDeleted
      ? `Ce produit existe mais a été déplacé dans la corbeille le ${new Date(product?.deletedAt || "").toLocaleDateString("fr-FR")}.`
      : `Aucun produit ne correspond à l'identifiant, slug ou code court « ${productId} » dans le catalogue de la boutique « ${storeSlug} ».`;

    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <head>
          <title>{`Page introuvable · ${store.name}`}</title>
          <meta name="robots" content="noindex, nofollow" />
        </head>

        <div className="max-w-md w-full mx-auto text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-[#E6E0D4] shadow-xs">
          {/* Logo ou Identité de la boutique */}
          <div className="flex items-center justify-center gap-2.5 pb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center font-black text-sm shadow-2xs">
              {store.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <span className="block text-xs font-black text-[#111111] leading-tight">
                {store.name}
              </span>
              <span className="text-[10px] text-[#888880]">Vitrine officielle</span>
            </div>
          </div>

          <div className="w-16 h-16 mx-auto rounded-2xl bg-black/[0.04] flex items-center justify-center text-xl font-black text-[#666660]">
            404
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
              Page ou produit introuvable
            </h1>
            <p className="text-xs sm:text-sm text-[#666660] leading-relaxed">
              L'article que vous recherchez n'existe pas ou n'est plus répertorié dans la boutique <strong>{store.name}</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href={`/boutique/${storeSlug}`}
              className="w-full px-5 py-3 rounded-2xl bg-[#111111] text-[#FAF8F5] text-xs font-black hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <StoreIcon className="w-4 h-4" />
              <span>Retourner à l'accueil de la boutique</span>
            </Link>

            <Link
              href={`/boutique/${storeSlug}/catalogue`}
              className="w-full px-5 py-3 rounded-2xl bg-white border border-[#E6E0D4] text-[#111111] text-xs font-bold hover:bg-[#FAF8F5] transition-colors flex items-center justify-center gap-2"
            >
              <span>Consulter le catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Diagnostic technique affiché uniquement si administrateur connecté */}
          {(isAdminUser || isPreview) && (
            <div className="mt-6 pt-5 border-t border-amber-200/80 bg-amber-50/60 p-3.5 rounded-2xl text-left space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-black text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>Diagnostic Administrateur Novika</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                {diagnosticReason}
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-amber-900 font-bold">
                <span>Boutique : {storeSlug}</span>
                <Link
                  href={`/app/${storeSlug}/produits`}
                  className="underline hover:text-black"
                >
                  Gérer les produits &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!product) {
    return null; // En attente de chargement
  }

  // =========================================================================
  // CAS 2 : PRODUIT BROUILLON OU NON PUBLIÉ (SANS MODE PRÉVISUALISATION)
  // =========================================================================
  if (isLoaded && productData.isUnpublished && !isPreview) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <head>
          <title>{`Produit indisponible · ${store.name}`}</title>
          <meta name="robots" content="noindex, nofollow" />
        </head>

        <div className="max-w-md w-full mx-auto text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-[#E6E0D4] shadow-xs">
          {/* Logo Boutique */}
          <div className="flex items-center justify-center gap-2.5 pb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center font-black text-sm shadow-2xs">
              {store.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <span className="block text-xs font-black text-[#111111] leading-tight">
                {store.name}
              </span>
              <span className="text-[10px] text-[#888880]">Vitrine officielle</span>
            </div>
          </div>

          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100/70 border border-amber-200 text-amber-800 flex items-center justify-center text-2xl font-black">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/60 px-2.5 py-1 rounded-full">
              Non disponible
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
              Produit indisponible
            </h1>
            <p className="text-xs sm:text-sm text-[#666660] leading-relaxed">
              Ce produit n'est pas encore disponible à la vente dans notre boutique. Notre équipe prépare actuellement sa mise en ligne.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href={`/boutique/${storeSlug}`}
              className="w-full px-5 py-3 rounded-2xl bg-[#111111] text-[#FAF8F5] text-xs font-black hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <StoreIcon className="w-4 h-4" />
              <span>Retourner à l'accueil de la boutique</span>
            </Link>

            <Link
              href={`/boutique/${storeSlug}/catalogue`}
              className="w-full px-5 py-3 rounded-2xl bg-white border border-[#E6E0D4] text-[#111111] text-xs font-bold hover:bg-[#FAF8F5] transition-colors flex items-center justify-center gap-2"
            >
              <span>Voir les autres articles disponibles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Diagnostic si admin connecté tentant d'accéder sans jeton */}
          {isAdminUser && (
            <div className="mt-6 pt-5 border-t border-amber-200/80 bg-amber-50/60 p-3.5 rounded-2xl text-left space-y-2">
              <div className="flex items-center gap-1.5 text-amber-900 font-black text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>Diagnostic Administrateur</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Ce produit est en statut <strong>{product.productStatus || product.status || "brouillon"}</strong> et n'est pas publié pour les clients.
              </p>
              <div className="pt-1 flex items-center justify-between">
                <Link
                  href={`/boutique/${storeSlug}/produits/${product.slug || product.id}?preview=true`}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ouvrir en mode aperçu</span>
                </Link>
                <Link
                  href={`/app/${storeSlug}/produits/${product.id}/modifier`}
                  className="text-[11px] font-bold text-amber-900 underline hover:text-black"
                >
                  Modifier le produit
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // CAS 3 : ÉCRAN SPÉCIAL RUPTURE DE STOCK (Prompt 16-b)
  // =========================================================================
  if (isLoaded && shouldDisplayUnavailableScreen(product, storeSlug) && !isPreview) {
    const phone = (store as any).whatsappNumber || (store as any).phone || "+22890000000";
    const cleanPhone = phone.replace(/\D/g, "");
    const waText = encodeURIComponent(
      `Bonjour ${store.name}, je souhaitais commander "${product.title || product.name}" mais il est temporairement indisponible. Pouvez-vous me prévenir dès son réassort ou me conseiller un produit similaire ?`
    );
    const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

    const allShopProducts = getShopProducts(storeSlug);
    const suggestions = allShopProducts
      .filter((p) => p.id !== product.id && isProductVisibleOnStorefront(p, storeSlug))
      .slice(0, 4);

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-12">
        <head>
          <meta name="robots" content="noindex, nofollow" />
        </head>

        <div className="max-w-xl mx-auto text-center space-y-5 p-8 rounded-3xl bg-[#FAF8F5] border border-black/[0.08] shadow-2xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100/80 border border-amber-200 text-amber-800 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#C2410C] bg-orange-100/60 px-2.5 py-1 rounded-full">
              Disponibilité
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
              Produit indisponible pour le moment
            </h1>
            <p className="text-xs sm:text-sm text-[#666660] leading-relaxed max-w-md mx-auto">
              L'article <strong>{product.title || product.name}</strong> est actuellement épuisé. Notre équipe prépare un réapprovisionnement express.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="btn-whatsapp-unavailable"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Me prévenir sur WhatsApp</span>
            </a>

            <Link
              href={`/boutique/${storeSlug}/catalogue`}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white border border-black/[0.1] text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-colors"
            >
              Voir d'autres produits
            </Link>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-black/[0.08]">
            <div className="text-center space-y-1">
              <h2 className="text-base sm:text-lg font-black text-[#111111]">
                Ces articles disponibles pourraient vous intéresser
              </h2>
              <p className="text-xs text-[#666660]">
                Sélectionnés avec soin pour vous parmi nos meilleures ventes en stock.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {suggestions.map((sug) => {
                const sugPrice = sug.price || sug.salePrice || 0;
                return (
                  <Link
                    key={sug.id}
                    href={`/boutique/${storeSlug}/produits/${sug.slug || sug.id}`}
                    className="group rounded-2xl border border-black/[0.08] bg-white p-3 space-y-2.5 hover:border-black/20 transition-all shadow-2xs flex flex-col justify-between"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-black/[0.03] relative">
                      <ProductImage
                        src={sug.images?.[0]}
                        alt={sug.title || sug.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-[#111111] line-clamp-2 leading-snug">
                        {sug.title || sug.name}
                      </h3>
                      <p className="text-xs font-black text-[#C2410C]">
                        {formatFcfa(sugPrice)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CAS 4 : AFFICHAGE NORMAL DU PRODUIT (OU EN MODE APERÇU ADMINISTRATEUR)
  // =========================================================================
  const productPrice = product.price || product.salePrice || 0;
  // Prompt 17-L : Plus aucune formule automatique injectée en vitrine.
  // Seules les offres créées par l'admin s'affichent si showQuantityOffers est activé.
  const productOffers: QuantityOffer[] =
    product.showQuantityOffers && Array.isArray(product.quantityOffers) && product.quantityOffers.length > 0
      ? product.quantityOffers.map((qo) => ({
          id: qo.id,
          productId: product.id,
          quantity: qo.quantity,
          label: qo.quantity === 1 ? "1 Unité" : `${qo.quantity} Unités`,
          unitPrice: qo.unitPrice || Math.round(qo.totalPrice / (qo.quantity || 1)),
          totalPrice: qo.totalPrice,
          badge: qo.badgeText || (qo as any).badge,
          savingsAmount:
            productPrice * qo.quantity > qo.totalPrice
              ? productPrice * qo.quantity - qo.totalPrice
              : 0,
          isPopular: Boolean(qo.badgeText?.toLowerCase().includes("populaire")),
        }))
      : [];

  return (
    <>
      {/* Bandeau d'aperçu administrateur si produit non publié ou mode preview */}
      {isPreview && (
        <div
          data-testid="admin-preview-banner"
          className="sticky top-0 z-50 bg-amber-500 text-black px-4 py-2.5 text-xs font-bold shadow-md flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>
              Aperçu : ce produit n'est pas encore publié sur la vitrine officielle.
            </span>
          </div>
          <Link
            href={`/app/${storeSlug}/produits/${product.id}/modifier`}
            className="px-2.5 py-1 rounded-lg bg-black text-white hover:bg-neutral-800 text-[11px] font-bold transition-colors"
          >
            Modifier le produit &rarr;
          </Link>
        </div>
      )}

      {/* Balise SEO noindex si en mode preview */}
      {isPreview && (
        <head>
          <meta name="robots" content="noindex, nofollow" />
        </head>
      )}

      {/* Données structurées JSON-LD Schema.org Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            name: product.title || product.name,
            image: product.images || [],
            description: product.description || "",
            offers: {
              "@type": "Offer",
              priceCurrency: "XOF",
              price: productPrice,
              availability: "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "28",
            },
          }),
        }}
      />

      <NovikaProductPage
        product={product}
        settings={MOCK_ORDER_FORM_SETTINGS}
        quantityOffers={productOffers}
        reviews={MOCK_PRODUCT_REVIEWS.map((r) => ({
          id: r.id,
          authorName: r.customerName,
          authorCity: r.customerCity,
          authorCountry: "TG",
          rating: r.rating,
          comment: r.comment,
          date: r.createdAt,
          verifiedPurchase: r.isVerifiedBuyer,
        }))}
        guarantees={MOCK_SHOP_GUARANTEES}
        storeSlug={storeSlug}
        template={urlTemplate || (product as any).pageTemplate || (product as any).template}
      />
    </>
  );
}
