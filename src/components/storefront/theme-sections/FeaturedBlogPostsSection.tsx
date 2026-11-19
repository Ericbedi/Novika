"use client";

import React from "react";
import Link from "next/link";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { FeaturedBlogPostsSettings } from "@/lib/theme-engine/schemas";
import { getShopBlogPosts, BlogPost } from "@/lib/blog-store";
import { ProductImage } from "@/components/ui/ProductImage";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedBlogPostsSectionProps {
  settings: FeaturedBlogPostsSettings;
  palette: ThemeColorPalette;
  storeSlug: string;
  cardRadius?: BorderRadiusOption;
}

export function FeaturedBlogPostsSection({
  settings,
  palette,
  storeSlug,
  cardRadius = "md",
}: FeaturedBlogPostsSectionProps) {
  const posts = getShopBlogPosts(storeSlug)
    .filter((p) => p.status === "published")
    .slice(0, settings.postCount || 3);

  if (posts.length === 0) return null;

  const radiusClass =
    cardRadius === "none"
      ? "rounded-none"
      : cardRadius === "sm"
      ? "rounded-xl"
      : cardRadius === "lg"
      ? "rounded-3xl"
      : "rounded-2xl";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-800">
            <BookOpen className="w-3 h-3" />
            <span>Blog & Conseils</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
            {settings.title || "Nos Derniers Articles"}
          </h2>
          {settings.subtitle && (
            <p className="text-xs sm:text-sm font-medium opacity-80 max-w-lg">
              {settings.subtitle}
            </p>
          )}
        </div>

        <Link
          href={`/boutique/${storeSlug}/blog`}
          className="inline-flex items-center gap-1.5 text-xs font-black hover:underline"
        >
          <span>Voir tous les articles</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => {
          const dateStr = new Date(post.publishedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <article
              key={post.id}
              className={cn(
                "border overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group",
                radiusClass
              )}
              style={{
                backgroundColor: palette.cardBackground || palette.background,
                borderColor: palette.borderColor || "transparent",
              }}
            >
              <div className="space-y-3">
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

                <div className="p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold opacity-60">
                    {settings.showDate !== false && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </span>
                    )}
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTimeMinutes} min
                    </span>
                  </div>

                  <Link
                    href={`/boutique/${storeSlug}/blog/${post.slug}`}
                    className="block text-sm font-black tracking-tight leading-snug hover:underline line-clamp-2"
                  >
                    {post.title}
                  </Link>

                  <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 pt-0">
                <Link
                  href={`/boutique/${storeSlug}/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-black group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Lire l'article</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
