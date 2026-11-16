"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Truck,
  PhoneCall,
  PackageCheck,
  Star,
  Check,
  Play,
  Pause,
  X,
} from "lucide-react";
import { ShopBannerItem } from "@/server/data/product-page-types";
import { cn } from "@/lib/utils";

interface AnnouncementBannerProps {
  items: ShopBannerItem[];
  storeSlug: string;
  isDismissible?: boolean;
  speed?: "slow" | "normal" | "fast";
  themePrimary?: string;
  themeContrastText?: string;
}

export function AnnouncementBanner({
  items,
  storeSlug,
  isDismissible = true,
  speed = "normal",
  themePrimary = "#111111",
  themeContrastText = "#FAF8F5",
}: AnnouncementBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true); // SSR safe initial state
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isHoveredOrFocused, setIsHoveredOrFocused] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [animationDuration, setAnimationDuration] = useState("35s");
  const trackRef = useRef<HTMLDivElement>(null);

  // Vérifier la session et l'accessibilité côté client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem(`afribuilder_banner_${storeSlug}_dismissed`);
      if (!dismissed) {
        setIsDismissed(false);
      }

      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setIsReducedMotion(mediaQuery.matches);

      const handleMotionChange = (e: MediaQueryListEvent) => {
        setIsReducedMotion(e.matches);
      };
      mediaQuery.addEventListener("change", handleMotionChange);

      return () => {
        mediaQuery.removeEventListener("change", handleMotionChange);
      };
    }
  }, [storeSlug]);

  // Calcul de la durée d'animation en vitesse constante (px/s)
  useEffect(() => {
    if (!trackRef.current) return;

    const speedPxPerSec = speed === "slow" ? 28 : speed === "fast" ? 65 : 45;
    const updateDuration = () => {
      if (trackRef.current) {
        // La piste contient 2 copies identiques, on mesure la moitié pour la boucle à 50%
        const singleCopyWidth = trackRef.current.scrollWidth / 2;
        if (singleCopyWidth > 0) {
          const duration = Math.max(12, Math.round(singleCopyWidth / speedPxPerSec));
          setAnimationDuration(`${duration}s`);
        }
      }
    };

    updateDuration();
    window.addEventListener("resize", updateDuration);
    return () => window.removeEventListener("resize", updateDuration);
  }, [items, speed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`afribuilder_banner_${storeSlug}_dismissed`, "true");
    }
  };

  const handleTogglePlayPause = () => {
    setIsManuallyPaused((prev) => !prev);
  };

  if (isDismissed || !items || items.length === 0) return null;

  const activeItems = items.filter((it) => it.isEnabled).slice(0, 10);
  if (activeItems.length === 0) return null;

  const isPaused = isManuallyPaused || isHoveredOrFocused;

  // Rendu de l'icône SVG monochrome selon la garantie
  const renderGuaranteeIcon = (item: ShopBannerItem) => {
    if (item.content.toLowerCase().includes("livraison") || item.content.toLowerCase().includes("expédition")) {
      return <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    }
    if (item.content.toLowerCase().includes("appel") || item.content.toLowerCase().includes("confirmation")) {
      return <PhoneCall className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    }
    if (item.content.toLowerCase().includes("colis") || item.content.toLowerCase().includes("vérifi")) {
      return <PackageCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    }
    return <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
  };

  // Si l'utilisateur demande de réduire les animations : texte fixe sans défilement
  if (isReducedMotion) {
    const firstGuarantee = activeItems.find((it) => it.type === "guarantee") || activeItems[0];
    return (
      <aside
        role="region"
        aria-label="Garanties et avis clients"
        style={{ backgroundColor: themePrimary, color: themeContrastText }}
        className="relative z-40 h-10 sm:h-11 px-4 flex items-center justify-between border-b border-black/[0.08]"
      >
        <div className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold truncate text-center">
          {renderGuaranteeIcon(firstGuarantee)}
          <span className="truncate">{firstGuarantee.content}</span>
        </div>
        {isDismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer le bandeau"
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </aside>
    );
  }

  // Rendu d'une liste d'éléments (utilisée pour la copie 1 et la copie 2)
  const renderItemsList = (isScreenReaderAccessible: boolean) => (
    <div
      aria-hidden={!isScreenReaderAccessible}
      className="flex shrink-0 items-center whitespace-nowrap"
    >
      {activeItems.map((item, idx) => (
        <span
          key={`banner-item-${idx}`}
          className="inline-flex items-center text-xs font-medium"
        >
          {item.type === "guarantee" && (
            <span className="inline-flex items-center gap-1.5 font-semibold">
              {renderGuaranteeIcon(item)}
              <span>{item.content}</span>
            </span>
          )}

          {item.type === "verified_review" && (
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold" aria-hidden="true">
                {[...Array(item.rating || 5)].map((_, starIdx) => (
                  <Star key={starIdx} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </span>
              <span className="italic">« {item.content.replace(/^★+\s*["“]?|["”]?$/g, "").trim().slice(0, 100)} »</span>
              <span className="opacity-80 font-semibold">— {item.authorName}{item.authorCity ? `, ${item.authorCity}` : ""}</span>
              {item.isVerifiedBuyer ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-current/30 opacity-90">
                  <Check className="h-2.5 w-2.5" />
                  Acheteur vérifié
                </span>
              ) : (
                <span className="text-[10px] font-medium opacity-70 border border-current/20 px-1.5 py-0.5 rounded-full">
                  Témoignage client
                </span>
              )}
            </span>
          )}

          {item.type === "custom_announcement" && (
            <span className="font-semibold">{item.content}</span>
          )}

          {/* Séparateur discret */}
          <span className="mx-6 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-30 shrink-0" aria-hidden="true" />
        </span>
      ))}
    </div>
  );

  return (
    <aside
      role="region"
      aria-label="Garanties et avis clients"
      style={{
        backgroundColor: themePrimary,
        color: themeContrastText,
      }}
      onMouseEnter={() => setIsHoveredOrFocused(true)}
      onMouseLeave={() => setIsHoveredOrFocused(false)}
      onTouchStart={() => setIsHoveredOrFocused(true)}
      onTouchEnd={() => setIsHoveredOrFocused(false)}
      className="relative z-40 h-10 sm:h-11 overflow-hidden select-none flex items-center border-b border-black/[0.08]"
    >
      {/* Zone défilante avec masque de dégradé sur les bords (24px) */}
      <div
        className="flex-1 overflow-hidden relative"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
        }}
      >
        <div
          ref={trackRef}
          style={{
            animationDuration,
            animationPlayState: isPaused ? "paused" : "running",
            willChange: "transform",
          }}
          className="flex w-max animate-marquee"
        >
          {/* Copie 1 (Vocalisée par le lecteur d'écran) */}
          {renderItemsList(true)}
          {/* Copie 2 (Visuelle uniquement pour la boucle continue sans saut, aria-hidden) */}
          {renderItemsList(false)}
        </div>
      </div>

      {/* Zone de contrôles fixe à droite avec fond plein assorti */}
      <div
        style={{ backgroundColor: themePrimary }}
        className="relative z-10 shrink-0 pl-2 pr-3 flex items-center gap-1 shadow-[-8px_0_12px_rgba(0,0,0,0.15)]"
      >
        {/* Bouton Pause / Lecture */}
        <button
          type="button"
          onClick={handleTogglePlayPause}
          aria-label={isManuallyPaused ? "Reprendre le défilement du bandeau" : "Mettre en pause le défilement du bandeau"}
          title={isManuallyPaused ? "Lecture" : "Pause"}
          className="h-8 w-8 min-w-[32px] rounded-lg flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-white/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          {isManuallyPaused ? (
            <Play className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Pause className="h-3.5 w-3.5 fill-current" />
          )}
        </button>

        {/* Bouton Fermer */}
        {isDismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer le bandeau d'annonces"
            title="Fermer"
            className="h-8 w-8 min-w-[32px] rounded-lg flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-white/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
