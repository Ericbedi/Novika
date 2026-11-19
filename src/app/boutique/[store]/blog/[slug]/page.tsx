"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Share2,
  ChevronRight,
  MessageCircle,
  Copy,
  Check,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import { MOCK_STORES } from "@/mock-data/stores";
import { getBlogPostBySlug } from "@/lib/blog-store";
import { getShopProducts } from "@/lib/products-store";
import { ProductImage } from "@/components/ui/ProductImage";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { formatFcfa } from "@/lib/money";

export default function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ store: string; slug: string }>;
}) {
  const { store: storeSlug, slug: postSlug } = use(params);
  const store = MOCK_STORES.find((s) => s.slug === storeSlug) || MOCK_STORES[0];

  const post = getBlogPostBySlug({
    shopSlug: storeSlug,
    slug: postSlug,
    allowDraft: false,
  });

  const [copied, setCopied] = useState(false);

  if (!post) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <h1 className="text-xl font-black text-[#111111]">Article introuvable</h1>
        <p className="text-xs text-[#666660]">Cet article n'existe pas ou n'est plus accessible.</p>
        <Link
          href={`/boutique/${storeSlug}/blog`}
          className="inline-flex px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold"
        >
          Retour au blog
        </Link>
      </div>
    );
  }

  // Produits associés cités dans l'article
  const allProducts = getShopProducts(storeSlug);
  const associatedProducts = allProducts.filter((p) =>
    post.associatedProductIds?.includes(p.id) || post.associatedProductIds?.includes(p.slug)
  );

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnWhatsApp = () => {
    if (typeof window !== "undefined") {
      const url = `https://wa.me/?text=${encodeURIComponent(
        `Je viens de lire cet article passionnant : "${post.title}" sur ${store.name} : ${window.location.href}`
      )}`;
      window.open(url, "_blank");
    }
  };

  const dateStr = new Date(post.publishedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sanitizedContent = sanitizeHtml(post.content || "");

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Fil d'ariane */}
      <nav className="flex items-center gap-1.5 text-xs text-[#666660]">
        <Link href={`/boutique/${storeSlug}`} className="hover:underline">
          Accueil
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <Link href={`/boutique/${storeSlug}/blog`} className="hover:underline">
          Blog
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="font-bold text-[#111111] truncate max-w-[220px]">
          {post.title}
        </span>
      </nav>

      {/* En-tête de l'article */}
      <header className="space-y-4">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#111111] tracking-tight leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#888880] pb-4 border-b border-black/[0.08]">
          <span className="flex items-center gap-1.5 text-[#111111]">
            <User className="w-3.5 h-3.5" />
            {post.authorName}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {dateStr}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {post.readingTimeMinutes} min de lecture
          </span>
        </div>
      </header>

      {/* Image à la une */}
      {post.featuredImage && (
        <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-black/[0.08] shadow-xs">
          <ProductImage
            src={post.featuredImage}
            alt={post.title}
            fill
            priority
            fallbackLabel={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Corps du texte assaini */}
      <div
        className="prose prose-sm sm:prose-base max-w-none text-[#222220] leading-relaxed space-y-4"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      {/* Boutons de partage social */}
      <div className="pt-6 border-t border-black/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase text-[#888880] tracking-wider">
            Partager l'article :
          </span>
          <button
            type="button"
            onClick={shareOnWhatsApp}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#25D366] text-white text-xs font-bold shadow-2xs hover:bg-[#1EBE5D] transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/[0.06] text-[#111111] text-xs font-bold hover:bg-black/10 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Lien copié !" : "Copier le lien"}</span>
          </button>
        </div>

        <Link
          href={`/boutique/${storeSlug}/blog`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#666660] hover:text-[#111111]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tous les articles</span>
        </Link>
      </div>

      {/* Produits associés mentionnés dans l'article */}
      {associatedProducts.length > 0 && (
        <section className="pt-8 border-t border-black/[0.08] space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#111111]" />
            <h3 className="text-base font-black text-[#111111] tracking-tight">
              Produits recommandés dans cet article
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {associatedProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-4 rounded-2xl border border-black/[0.08] bg-white flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-black/[0.03]">
                    <ProductImage
                      src={prod.images?.[0] || (prod as any).image}
                      alt={prod.name}
                      fill
                      fallbackLabel={prod.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-[#111111] truncate">
                      {prod.name}
                    </h4>
                    <p className="text-xs font-bold text-emerald-800">
                      {formatFcfa(prod.salePrice || prod.price || 0)}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/boutique/${storeSlug}/produit/${prod.slug || prod.id}`}
                  className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-black shrink-0 hover:bg-black transition-transform active:scale-95 shadow-xs"
                >
                  Commander (COD)
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
