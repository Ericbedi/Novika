"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MOCK_STORES } from "@/mock-data/stores";
import {
  MOCK_ORDER_FORM_SETTINGS,
  MOCK_QUANTITY_OFFERS,
  MOCK_SHOP_GUARANTEES,
  MOCK_PRODUCT_REVIEWS,
} from "@/mock-data/product-page-data";
import { NovikaProductPage } from "@/components/storefront/product/NovikaProductPage";
import { getProductByShopAndSlugOrId, getShopProducts } from "@/lib/products-store";
import { Product } from "@/server/data/types";
import { QuantityOffer } from "@/server/data/product-page-types";
import {
  shouldDisplayUnavailableScreen,
  isProductVisibleOnStorefront,
} from "@/lib/stock-settings-store";
import { AlertTriangle, MessageCircle, ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatFcfa } from "@/lib/money";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ store: string; id: string }>;
}) {
  const { store: storeSlug, id: productId } = use(params);
  const searchParams = useSearchParams();
  const urlTemplate = searchParams?.get("template") as any;

  const [product, setProduct] = useState<Product | null>(() => {
    return getProductByShopAndSlugOrId({
      shopSlug: storeSlug,
      slugOrId: productId,
      allowDraft: false,
    });
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = getProductByShopAndSlugOrId({
      shopSlug: storeSlug,
      slugOrId: productId,
      allowDraft: false,
    });
    setProduct(loaded);
    setIsLoaded(true);
  }, [storeSlug, productId]);

  // Si le produit n'existe pas ou n'est pas actif : Page 404 en français (Zéro repli sur un autre produit)
  if (isLoaded && !product) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-black/[0.04] flex items-center justify-center text-2xl font-black text-[#555550]">
          404
        </div>
        <h1 className="text-2xl font-black text-[#111111]">Produit introuvable ou indisponible</h1>
        <p className="text-sm text-[#666660] max-w-md mx-auto">
          Ce produit n'existe pas ou n'est plus actif dans le catalogue de cette boutique.
        </p>
        <div className="pt-4">
          <Link
            href={`/boutique/${storeSlug}/catalogue`}
            className="inline-flex px-6 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-colors"
          >
            Retourner au catalogue
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return null; // En cours de chargement initial
  }

  // Écran spécial Option B : "Produit indisponible pour le moment" (Prompt 16-b)
  if (isLoaded && shouldDisplayUnavailableScreen(product, storeSlug)) {
    const store = MOCK_STORES.find((s) => s.slug === storeSlug) || MOCK_STORES[0];
    const phone = (store as any).phone || "+22890000000";
    const cleanPhone = phone.replace(/\D/g, "");
    const waText = encodeURIComponent(
      `Bonjour ${store.name}, je souhaitais commander "${product.title || product.name}" mais il est temporairement indisponible. Pouvez-vous me prévenir dès son réassort ou me conseiller un produit similaire ?`
    );
    const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

    // Suggestions d'autres produits disponibles en stock
    const allShopProducts = getShopProducts(storeSlug);
    const suggestions = allShopProducts
      .filter((p) => p.id !== product.id && isProductVisibleOnStorefront(p, storeSlug))
      .slice(0, 4);

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-12">
        {/* Balise SEO noindex, nofollow pour ne pas indexer tant que masqué */}
        <head>
          <meta name="robots" content="noindex, nofollow" />
        </head>

        {/* Bloc Indisponible */}
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

        {/* Suggestions de produits alternatifs */}
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
                    href={`/boutique/${storeSlug}/produit/${sug.slug || sug.id}`}
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

  // Prix et offres de quantité dynamiques pour ce produit spécifique (Prompt 05-V)
  const productPrice = product.price || product.salePrice || 0;
  const productOffers: QuantityOffer[] = [
    {
      id: `q1_${product.id}`,
      productId: product.id,
      quantity: 1,
      label: "1 Unité",
      badge: "Découverte",
      unitPrice: productPrice,
      totalPrice: productPrice,
      savingsAmount: 0,
      isDefault: true,
    },
    {
      id: `q2_${product.id}`,
      productId: product.id,
      quantity: 2,
      label: "Pack Duo (2 Unités)",
      badge: "Populaire · -15%",
      unitPrice: Math.round(productPrice * 0.85),
      totalPrice: Math.round(productPrice * 0.85 * 2),
      savingsAmount: Math.round(productPrice * 2 - productPrice * 0.85 * 2),
      isDefault: false,
    },
    {
      id: `q3_${product.id}`,
      productId: product.id,
      quantity: 3,
      label: "Pack Famille (3 Unités)",
      badge: "Meilleure offre · -25%",
      unitPrice: Math.round(productPrice * 0.75),
      totalPrice: Math.round(productPrice * 0.75 * 3),
      savingsAmount: Math.round(productPrice * 3 - productPrice * 0.75 * 3),
      isDefault: false,
    },
  ];

  return (
    <>
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
