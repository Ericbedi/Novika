"use client";

import React, { useState, useMemo, use } from "react";
import Link from "next/link";
import { BookOpen, Clock, Calendar, ArrowRight, Tag, ChevronRight } from "lucide-react";
import { resolveStorefrontData } from "@/lib/storefront-resolver";
import { getShopBlogPosts, BlogPost } from "@/lib/blog-store";
import { ProductImage } from "@/components/ui/ProductImage";

export default function BlogListingPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: storeSlug } = use(params);
  const store = resolveStorefrontData(storeSlug).store;

  const posts = getShopBlogPosts(storeSlug).filter((p) => p.status === "published");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  const tags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags?.forEach((t) => set.add(t)));
    return ["all", ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedTag === "all") return posts;
    return posts.filter((p) => p.tags?.includes(selectedTag));
  }, [posts, selectedTag]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Fil d'ariane */}
      <nav className="flex items-center gap-1.5 text-xs text-[#666660]">
        <Link href={`/boutique/${storeSlug}`} className="hover:underline">
          Accueil
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="font-bold text-[#111111]">Blog & Conseils</span>
      </nav>

      {/* En-tête */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Le Journal de {store.name}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[#111111] tracking-tight">
          Le Journal & Blog : Conseils, Bien-être & Guides
        </h1>
        <p className="text-xs sm:text-sm text-[#666660] leading-relaxed">
          Découvrez nos astuces d'experts, nos recommandations d'utilisation et nos actualités bien-être.
        </p>
      </div>

      {/* Filtres par Tags */}
      {tags.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedTag === tag
                  ? "bg-[#111111] text-white shadow-xs"
                  : "bg-white text-[#666660] border border-black/10 hover:border-black/25"
              }`}
            >
              {tag === "all" ? "Tous les articles" : tag}
            </button>
          ))}
        </div>
      )}

      {/* Grille des articles */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-black/10 max-w-md mx-auto space-y-3">
          <BookOpen className="w-8 h-8 text-[#888880] mx-auto" />
          <h3 className="text-sm font-black text-[#111111]">Aucun article publié</h3>
          <p className="text-xs text-[#666660]">Les premiers articles seront bientôt disponibles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPosts.map((post) => {
            const dateStr = new Date(post.publishedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <article
                key={post.id}
                className="group rounded-3xl border border-black/[0.08] bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <Link
                    href={`/boutique/${storeSlug}/blog/${post.slug}`}
                    className="relative block aspect-video w-full overflow-hidden bg-black/[0.03]"
                  >
                    <ProductImage
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      fallbackLabel={post.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>

                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-3 text-[11px] font-bold text-[#888880]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {dateStr}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readingTimeMinutes} min de lecture
                      </span>
                    </div>

                    <Link
                      href={`/boutique/${storeSlug}/blog/${post.slug}`}
                      className="block text-base sm:text-lg font-black text-[#111111] tracking-tight leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2"
                    >
                      {post.title}
                    </Link>

                    <p className="text-xs text-[#666660] leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6 pt-0">
                  <Link
                    href={`/boutique/${storeSlug}/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#111111] group-hover:text-emerald-700 transition-colors"
                  >
                    <span>Lire l'article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
