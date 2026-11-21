"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ChevronRight,
  AlertCircle,
  Lock,
} from "lucide-react";
import { formatFcfa } from "@/lib/money";
import { Product } from "@/server/data/types";
import { ProductImage } from "@/components/ui/ProductImage";
import { isProductVisibleOnStorefront } from "@/lib/stock-settings-store";
import { getProductPublicUrl } from "@/lib/storefront-urls";
import { getShopProducts } from "@/lib/products-store";
import { ResolvedStorefront } from "@/lib/storefront-resolver";

interface CatalogueClientProps {
  storeSlug: string;
  initialResolved: ResolvedStorefront;
}

export function CatalogueClient({
  storeSlug,
  initialResolved,
}: CatalogueClientProps) {
  const store = initialResolved.store;

  const [productsList, setProductsList] = useState<Product[]>(() => {
    if (initialResolved.products && initialResolved.products.length > 0) {
      return initialResolved.products;
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novika_store_products_${storeSlug}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return getShopProducts(storeSlug);
  });

  const [hideCatalog, setHideCatalog] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProds = localStorage.getItem(`novika_store_products_${storeSlug}`);
      if (savedProds) {
        try {
          const parsed = JSON.parse(savedProds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProductsList(parsed);
          } else if (initialResolved.products.length > 0) {
            setProductsList(initialResolved.products);
          } else {
            setProductsList(getShopProducts(storeSlug));
          }
        } catch {
          setProductsList(initialResolved.products.length > 0 ? initialResolved.products : getShopProducts(storeSlug));
        }
      } else if (initialResolved.products.length > 0) {
        setProductsList(initialResolved.products);
      } else {
        // Synchronisation distante avec la base de données Supabase
        fetch(`/api/products?store=${encodeURIComponent(storeSlug)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
              setProductsList((prev) => {
                const merged = [...prev];
                for (const p of data.products) {
                  if (!merged.some((m) => m.id === p.id || m.slug === p.slug)) {
                    merged.push(p);
                  }
                }
                return merged;
              });
            }
          })
          .catch(() => {});
      }

      const savedSettings = localStorage.getItem(`novika_storefront_settings_${storeSlug}`);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setHideCatalog(Boolean(parsed.hideCatalog));
        } catch {}
      }
    }
  }, [storeSlug, initialResolved]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "sales">("sales");
  const [inStockOnly, setInStockOnly] = useState(false);

  // Extraire les collections uniques
  const collections = useMemo(() => {
    const list = Array.from(new Set(productsList.map((p) => p.collection).filter(Boolean)));
    return ["all", ...list];
  }, [productsList]);

  // Filtrage et Tri des produits (exclut les produits masqués selon la politique de stock)
  const filteredProducts = useMemo(() => {
    return productsList
      .filter((p) => isProductVisibleOnStorefront(p, storeSlug))
      .filter((p) => {
        const matchesSearch =
          searchQuery === "" ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCollection = selectedCollection === "all" || p.collection === selectedCollection;
        const matchesStock = !inStockOnly || p.stock > 0;

        return matchesSearch && matchesCollection && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.salePrice - b.salePrice;
        if (sortBy === "price_desc") return b.salePrice - a.salePrice;
        if (sortBy === "sales") return (b.salesSummary?.unitsSold || 0) - (a.salesSummary?.unitsSold || 0);
        return 0; // newest par défaut
      });
  }, [productsList, searchQuery, selectedCollection, inStockOnly, sortBy, storeSlug]);

  if (hideCatalog) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-[#111111]">Catalogue privé</h1>
        <p className="text-xs text-[#666660] leading-relaxed">
          Le catalogue complet de cette boutique est configuré en mode confidentiel direct.
          Veuillez accéder directement à la page de votre offre via son lien dédié ou contacter le vendeur via WhatsApp.
        </p>
        <div className="pt-2">
          <Link
            href={`/boutique/${storeSlug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-xs text-[#666660]">
        <Link href={`/boutique/${storeSlug}`} className="hover:text-[#111111]">
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-bold text-[#111111]">Catalogue complet</span>
      </div>

      {/* En-tête du Catalogue */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-black/[0.08] pb-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#111111] tracking-tight">
            Catalogue Produits
          </h1>
          <p className="text-xs sm:text-sm text-[#666660] mt-1">
            Découvrez nos articles certifiés en stock et commandez en paiement en espèces à la livraison.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/[0.05] text-[#111111] self-start sm:self-auto">
          {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""} disponible{filteredProducts.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* BARRE DE RECHERCHE, FILTRES & TRI */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, ingrédient ou besoin..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/15 bg-white text-xs font-semibold text-[#111111] placeholder:text-[#888880] focus:outline-hidden focus:border-black shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888880] hover:text-[#111111]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Collections, Tri et Stock */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Sélecteur de Collection */}
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-black/15 bg-white font-bold text-[#111111] focus:outline-hidden shadow-2xs"
          >
            <option value="all">Toutes les collections</option>
            {collections
              .filter((c) => c !== "all")
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>

          {/* Sélecteur de Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-2xl border border-black/15 bg-white font-bold text-[#111111] focus:outline-hidden shadow-2xs"
          >
            <option value="sales">Meilleures ventes</option>
            <option value="newest">Nouveautés</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>

          {/* Filtre En stock uniquement */}
          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3 py-2.5 rounded-2xl border font-bold transition-all shadow-2xs cursor-pointer ${
              inStockOnly
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : "border-black/15 bg-white text-[#666660] hover:text-[#111111]"
            }`}
          >
            En stock uniquement
          </button>
        </div>
      </div>

      {/* GRILLE DES PRODUITS (2 COLONNES SUR SMARTPHONE) */}
      {filteredProducts.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl border border-black/10 bg-white space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-black text-[#111111]">
            Aucun article ne correspond à votre recherche
          </h3>
          <p className="text-xs text-[#666660] leading-relaxed">
            Conseil : Vérifiez l'orthographe du nom ou réinitialisez les filtres. Vous recherchez un produit particulier non répertorié ? Contactez directement notre équipe pour une commande spéciale.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCollection("all");
                setInStockOnly(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
            <a
              href={`https://wa.me/22890000000?text=${encodeURIComponent(
                `Bonjour ${store.name}, je recherche un produit spécifique qui n'apparaît pas sur votre catalogue.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1EBE5D] transition-colors cursor-pointer"
            >
              Demander sur WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {filteredProducts.map((prod) => {
            const isOutOfStock = prod.stock <= 0;
            const threshold = prod.lowStockThreshold ?? 5;
            const isLowStock = prod.stock > 0 && prod.stock <= threshold;

            const prodImageSrc = (prod.images && prod.images[0]) || (prod as any).image || "";
            const prodUrl = getProductPublicUrl(prod, storeSlug);

            return (
              <div
                key={prod.id}
                className="group rounded-3xl border border-black/[0.08] bg-white p-3 sm:p-4 space-y-3 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Photo Produit & Badges */}
                  <Link
                    href={prodUrl}
                    className="relative block h-52 rounded-2xl bg-[#FAF8F5] overflow-hidden border border-black/[0.04]"
                  >
                    <ProductImage
                      src={prodImageSrc}
                      alt={prod.name}
                      fill
                      fallbackLabel={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badge Promo */}
                    {prod.compareAtPrice && !isOutOfStock && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-xs z-10">
                        Promo
                      </span>
                    )}

                    {/* Badge Stock Bas (basé sur le stock réel) */}
                    {isLowStock && (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black shadow-xs z-10">
                        Stock Bas ({prod.stock} restant{prod.stock > 1 ? "s" : ""})
                      </span>
                    )}

                    {/* Badge Épuisé si rupture */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-10">
                        <span className="px-3 py-1 rounded-full bg-[#111111] text-white text-xs font-black">
                          Épuisé
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Catégorie & Titre */}
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

                  {/* Prix réel et comparé */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-black text-[#111111]">
                      {formatFcfa(prod.salePrice)}
                    </span>
                    {prod.compareAtPrice && (
                      <span className="text-xs text-[#888880] line-through font-semibold">
                        {formatFcfa(prod.compareAtPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bouton Action */}
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
                    className="w-full py-2.5 px-3 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all text-center block shadow-2xs group-hover:bg-emerald-700 cursor-pointer"
                  >
                    Commander en Paiement Cash
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
