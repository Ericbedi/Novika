"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { sanitizeProductDescription } from "@/lib/server-html-sanitizer";

interface ProductDescriptionProps {
  html: string;
  productTitle?: string;
  className?: string;
  themePrimaryColor?: string;
  isStorefront?: boolean;
}

/**
 * Composant unique de rendu de la description produit Kelio (Prompt 17-F, 2).
 * Assure un affichage identique, responsive, élégant et sécurisé sur :
 * - La vitrine client publique
 * - L'aperçu en direct dans l'éditeur de fiche produit
 * - Mobile (iPhone 13 / 390px) et Desktop
 */
export function ProductDescription({
  html,
  productTitle = "Produit",
  className,
  isStorefront = true,
}: ProductDescriptionProps) {
  // Assainissement strict pour garantir qu'aucun code malveillant ne s'affiche
  const sanitizedHtml = useMemo(() => {
    if (!html) return "";
    const report = sanitizeProductDescription(html, { productTitle });
    return report.cleanedHtml;
  }, [html, productTitle]);

  if (!sanitizedHtml) {
    return (
      <div className={cn("text-sm text-[#7A7A7A] italic py-4", className)}>
        Aucune description détaillée disponible pour ce produit.
      </div>
    );
  }

  return (
    <div
      data-testid="novika-product-description"
      className={cn(
        "novika-product-description leading-relaxed text-[#2B2B2B] text-sm sm:text-base break-words selection:bg-amber-100 selection:text-black",
        // Paragraphes lisibles (interligne 1,6)
        "[&>p]:mb-4 [&>p]:leading-[1.65] [&>p:last-child]:mb-0",
        // Titres hiérarchisés
        "[&>h2]:text-xl sm:[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:text-[#111111] [&>h2]:mt-6 [&>h2]:mb-3 [&>h2:first-child]:mt-0",
        "[&>h3]:text-lg sm:[&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-[#111111] [&>h3]:mt-5 [&>h3]:mb-2.5",
        "[&>h4]:text-base sm:[&>h4]:text-lg [&>h4]:font-semibold [&>h4]:text-[#111111] [&>h4]:mt-4 [&>h4]:mb-2",
        // Listes à puces et numérotées margées
        "[&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>ul]:my-4 [&>ul>li]:leading-normal",
        "[&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-2 [&>ol]:my-4 [&>ol>li]:leading-normal",
        // Gras, italique et souligné
        "[&_strong]:font-bold [&_strong]:text-[#111111]",
        "[&_em]:italic",
        "[&_u]:underline [&_u]:decoration-1 [&_u]:underline-offset-2",
        // Centrage de blocs sûrs
        "[&_[data-align=center]]:text-center [&_[data-align=center]]:mx-auto",
        // Images centrées, largeur max 100 %, coins arrondis
        "[&_img]:max-w-full [&_img]:h-auto [&_img]:mx-auto [&_img]:block [&_img]:rounded-2xl [&_img]:my-5 [&_img]:shadow-xs",
        // Rognage non destructif des images (data-ratio / data-pos / data-size) — identique sur mobile et ordinateur
        "[&_img[data-ratio]]:w-full [&_img[data-ratio]]:object-cover",
        "[&_img[data-ratio='1-1']]:aspect-square [&_img[data-ratio='4-3']]:aspect-[4/3] [&_img[data-ratio='3-4']]:aspect-[3/4] [&_img[data-ratio='16-9']]:aspect-video",
        "[&_img[data-pos='top']]:object-top [&_img[data-pos='bottom']]:object-bottom",
        "[&_img[data-size='small']]:max-w-[260px] [&_img[data-size='medium']]:max-w-[420px]",
        "[&_img[data-size='w25']]:w-1/4 [&_img[data-size='w50']]:w-1/2 [&_img[data-size='w75']]:w-3/4 [&_img[data-size^='w']]:h-auto",
        // Liens sécurisés
        "[&_a]:text-blue-600 hover:[&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-medium [&_a]:transition-colors",
        // Tableaux responsives avec défilement horizontal automatique sur mobile
        "[&_table]:w-full [&_table]:border-collapse [&_table]:my-5 [&_table]:text-left [&_table]:text-xs sm:[&_table]:text-sm",
        "[&_thead]:bg-[#F9F7F2] [&_thead]:border-b-2 [&_thead]:border-[#E6E0D4]",
        "[&_th]:py-3 [&_th]:px-3.5 [&_th]:font-bold [&_th]:text-[#111111] [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-[11px]",
        "[&_td]:py-2.5 [&_td]:px-3.5 [&_td]:border-b [&_td]:border-[#E6E0D4]/70",
        "[&_tr:last-child>td]:border-b-0",
        "[&_tbody>tr:hover]:bg-[#FAF8F5]/60",
        // Citations stylées
        "[&>blockquote]:border-l-4 [&>blockquote]:border-amber-500 [&>blockquote]:bg-amber-50/40 [&>blockquote]:py-2.5 [&>blockquote]:px-4 [&>blockquote]:my-4 [&>blockquote]:rounded-r-xl [&>blockquote]:italic [&>blockquote]:text-[#4A4A4A]",
        // Séparateurs discrets
        "[&>hr]:border-0 [&>hr]:border-t [&>hr]:border-[#E6E0D4] [&>hr]:my-6",
        // Iframes vidéo 16:9 responsives
        "[&_iframe]:w-full [&_iframe]:max-w-2xl [&_iframe]:aspect-video [&_iframe]:rounded-2xl [&_iframe]:mx-auto [&_iframe]:block [&_iframe]:my-5 [&_iframe]:shadow-sm",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
