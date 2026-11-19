"use client";

import React, { useState, useMemo, use } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Package,
  BookOpen,
  FileText,
  MessageCircle,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { MOCK_STORES } from "@/mock-data/stores";
import { getShopProducts } from "@/lib/products-store";
import { getShopBlogPosts } from "@/lib/blog-store";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatFcfa } from "@/lib/money";

export default function SearchPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: storeSlug } = use(params);
  const store = MOCK_STORES.find((s) => s.slug === storeSlug) || MOCK_STORES[0];

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "products" | "blog" | "pages">("all");

  const products = getShopProducts(storeSlug).filter(
    (p) => p.productStatus === "active" && !p.hiddenFromCatalog
  );
  const blogPosts = getShopBlogPosts(storeSlug).filter((p) => p.status === "published");

  const legalPages = [
    { title: "Conditions Générales de Vente (CGV)", slug: "cgv", description: "Modalités de vente et paiement à la livraison." },
    { title: "Livraison & Retours", slug: "livraison-retours", description: "Délais, zones desservies et garanties de livraison." },
    { title: "Politique de Confidentialité", slug: "confidentialite", description: "Protection de vos données personnelles." },
    { title: "Notre Histoire", slug: "notre-histoire", description: "Découvrez notre engagement et nos valeurs." },
    { title: "Contactez-nous", slug: "contact", description: "Joindre notre équipe par téléphone ou WhatsApp." },
  ];

  // Normalisation pour recherche insensible aux accents (ex: "serum" trouve "Sérum")
  const normalize = (str: string) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const trimmed = normalize(query.trim());

  const matchedProducts = useMemo(() => {
    if (!trimmed) return [];
    return products.filter((p) => {
      const name = normalize(p.name);
      const cat = normalize(p.category || "");
      const desc = normalize(p.description || "");
      const tags = (p.tags || []).map(normalize).join(" ");
      return (
        name.includes(trimmed) ||
        cat.includes(trimmed) ||
        desc.includes(trimmed) ||
        tags.includes(trimmed)
      );
    });
  }, [products, trimmed]);

  const matchedBlogPosts = useMemo(() => {
    if (!trimmed) return [];
    return blogPosts.filter((b) => {
      const title = normalize(b.title);
      const excerpt = normalize(b.excerpt);
      const tags = (b.tags || []).map(normalize).join(" ");
      return (
        title.includes(trimmed) ||
        excerpt.includes(trimmed) ||
        tags.includes(trimmed)
      );
    });
  }, [blogPosts, trimmed]);

  const matchedPages = useMemo(() => {
    if (!trimmed) return [];
    return legalPages.filter((page) => {
      const title = normalize(page.title);
      const desc = normalize(page.description);
      return title.includes(trimmed) || desc.includes(trimmed);
    });
  }, [trimmed]);

  const totalResults = matchedProducts.length + matchedBlogPosts.length + matchedPages.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 min-h-[70vh]">
      {/* Fil d'ariane */}
      <nav className="flex items-center gap-1.5 text-xs text-[#666660]">
        <Link href={`/boutique/${storeSlug}`} className="hover:underline">
          Accueil
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="font-bold text-[#111111]">Recherche prédictive</span>
      </nav>

      {/* Barre de recherche instantanée */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
          Que recherchez-vous aujourd'hui ?
        </h1>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888880]" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit, une catégorie, un article ou un conseil..."
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-black/15 bg-white text-sm font-semibold text-[#111111] focus:outline-hidden focus:border-black shadow-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#888880] hover:text-[#111111] cursor-pointer"
              title="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Onglets de filtrage par type */}
      {query.trim() !== "" && (
        <div className="flex items-center gap-2 border-b border-black/[0.08] pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-[#111111] text-white shadow-2xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            Tous ({totalResults})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "products"
                ? "bg-[#111111] text-white shadow-2xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Produits ({matchedProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("blog")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "blog"
                ? "bg-[#111111] text-white shadow-2xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Articles ({matchedBlogPosts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pages")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "pages"
                ? "bg-[#111111] text-white shadow-2xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Pages ({matchedPages.length})</span>
          </button>
        </div>
      )}

      {/* Résultats de recherche */}
      {query.trim() === "" ? (
        /* État initial : Suggestions populaires */
        <div className="p-8 rounded-3xl bg-white border border-black/[0.08] space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#888880] tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Recherches fréquentes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Sérum", "Café", "Bio", "Naturel", "Vitalité", "Anti-taches", "Livraison"].map(
              (term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="px-3.5 py-1.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-xs font-bold text-[#333330] transition-colors cursor-pointer"
                >
                  {term}
                </button>
              )
            )}
          </div>
        </div>
      ) : totalResults === 0 ? (
        /* Aucun résultat : Message bienveillant et WhatsApp */
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-black/[0.08] space-y-4 shadow-2xs max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-[#111111]">
            Aucun résultat pour « {query} »
          </h2>
          <p className="text-xs text-[#666660] leading-relaxed">
            Vérifiez l'orthographe du terme ou essayez un mot-clé plus court. Vous cherchez un article spécifique ? Notre équipe peut vérifier sa disponibilité en stock.
          </p>
          <div className="pt-2">
            <a
              href={`https://wa.me/22890123456?text=${encodeURIComponent(
                `Bonjour ${store.name}, je recherche « ${query} » qui n'apparaît pas dans la recherche.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold shadow-xs hover:bg-[#1EBE5D] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Demander la disponibilité sur WhatsApp</span>
            </a>
          </div>
        </div>
      ) : (
        /* Affichage des résultats selon l'onglet actif */
        <div className="space-y-8">
          {/* Produits correspondants */}
          {(activeTab === "all" || activeTab === "products") && matchedProducts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-[#888880] tracking-wider">
                Produits ({matchedProducts.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchedProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/boutique/${storeSlug}/produit/${p.slug || p.id}`}
                    className="p-3.5 rounded-2xl border border-black/[0.08] bg-white flex items-center gap-3 shadow-2xs hover:border-black/25 transition-all group"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/[0.03] shrink-0">
                      <ProductImage
                        src={p.images?.[0] || (p as any).image}
                        alt={p.name}
                        fill
                        fallbackLabel={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase text-[#888880] block truncate">
                        {p.category}
                      </span>
                      <h3 className="text-xs font-black text-[#111111] truncate group-hover:text-emerald-700">
                        {p.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xs font-black text-[#111111]">
                          {formatFcfa(p.salePrice || p.price || 0)}
                        </span>
                        {p.compareAtPrice && (
                          <span className="text-[10px] line-through text-[#888880]">
                            {formatFcfa(p.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#888880] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Articles de blog correspondants */}
          {(activeTab === "all" || activeTab === "blog") && matchedBlogPosts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-[#888880] tracking-wider">
                Articles du Blog ({matchedBlogPosts.length})
              </h2>
              <div className="space-y-2">
                {matchedBlogPosts.map((b) => (
                  <Link
                    key={b.id}
                    href={`/boutique/${storeSlug}/blog/${b.slug}`}
                    className="p-4 rounded-2xl border border-black/[0.08] bg-white block shadow-2xs hover:border-black/25 transition-all group"
                  >
                    <h3 className="text-xs sm:text-sm font-black text-[#111111] group-hover:text-emerald-700">
                      {b.title}
                    </h3>
                    <p className="text-[11px] text-[#666660] line-clamp-2 mt-1">
                      {b.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Pages d'information correspondantes */}
          {(activeTab === "all" || activeTab === "pages") && matchedPages.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-[#888880] tracking-wider">
                Pages d'information ({matchedPages.length})
              </h2>
              <div className="space-y-2">
                {matchedPages.map((page) => (
                  <Link
                    key={page.slug}
                    href={
                      page.slug === "contact"
                        ? `/boutique/${storeSlug}/contact`
                        : `/boutique/${storeSlug}/pages/${page.slug}`
                    }
                    className="p-3.5 rounded-2xl border border-black/[0.08] bg-white flex items-center justify-between gap-3 shadow-2xs hover:border-black/25 transition-all group"
                  >
                    <div>
                      <h3 className="text-xs font-black text-[#111111] group-hover:text-emerald-700">
                        {page.title}
                      </h3>
                      <p className="text-[10px] text-[#888880]">{page.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#888880] shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
