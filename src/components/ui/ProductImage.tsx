"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

export interface ProductImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  aspectRatio?: "square" | "portrait" | "video" | "auto";
  fallbackLabel?: string;
}

/**
 * Placeholder neutre élégant rendu en SVG vectoriel inline pour parer à tout échec de chargement
 * ou image manquante (Prompt 13 - Étape 3). Aucun trou ni icône cassée.
 */
export function NeutralProductPlaceholder({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center bg-[#F7F5F0] text-[#888880] select-none p-4 ${className}`}
      aria-label={label || "Image de produit non disponible"}
    >
      <svg
        className="w-10 h-10 text-[#C4C0B6] mb-1.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
      {label && (
        <span className="text-[11px] font-medium text-[#777770] text-center line-clamp-1 max-w-[90%]">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Composant ProductImage universel pour Kelio (Prompt 13 - Étape 3).
 * Utilisé partout : catalogue, page produit, miniatures, formulaires COD, confirmation, aperçus.
 */
export function ProductImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  aspectRatio = "auto",
  fallbackLabel,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  // Réinitialiser l'état d'erreur si la source change
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Si pas de source ou source vide ou échec de chargement : remplaçant neutre
  if (!src || src.trim() === "" || hasError) {
    return (
      <NeutralProductPlaceholder
        label={fallbackLabel || alt}
        className={className}
      />
    );
  }

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "portrait"
        ? "aspect-[3/4]"
        : aspectRatio === "video"
          ? "aspect-video"
          : "";

  // Gestion des images distantes et locales avec fallback gracieux
  if (fill) {
    return (
      <div className={`relative overflow-hidden ${aspectClass} ${className}`}>
        <Image
          src={src}
          alt={alt || "Produit Kelio"}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-center"
          onError={() => setHasError(true)}
          unoptimized={src.startsWith("http") || src.startsWith("data:")}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || "Produit Kelio"}
      width={width || 400}
      height={height || 400}
      priority={priority}
      className={`object-cover object-center ${aspectClass} ${className}`}
      onError={() => setHasError(true)}
      unoptimized={src.startsWith("http") || src.startsWith("data:")}
    />
  );
}

export default ProductImage;
