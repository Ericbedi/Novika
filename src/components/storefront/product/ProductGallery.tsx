"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImage, NeutralProductPlaceholder } from "@/components/ui/ProductImage";
import { parseVideoUrl } from "@/lib/image-utils";

export interface GalleryMediaItem {
  id?: string;
  url: string;
  alt?: string;
  variantId?: string;
  type?: "image" | "video";
  isPrimary?: boolean;
}

export interface ProductGalleryProps {
  images?: (string | GalleryMediaItem)[];
  productTitle: string;
  videoUrl?: string;
  aspectRatio?: "1:1" | "4:5" | "3:4";
  activeVariantImage?: string;
  selectedVariantId?: string;
  className?: string;
  enableZoomHover?: boolean;
  onImageChange?: (index: number) => void;
}

export function ProductGallery({
  images = [],
  productTitle,
  videoUrl,
  aspectRatio = "1:1",
  activeVariantImage,
  selectedVariantId,
  className = "",
  enableZoomHover = false,
  onImageChange,
}: ProductGalleryProps) {
  // 1. Normalisation des médias (Images + Vidéo optionnelle)
  const normalizedMedia: GalleryMediaItem[] = React.useMemo(() => {
    const list: GalleryMediaItem[] = [];

    // Ajouter les images valides
    (images || []).forEach((item, idx) => {
      if (!item) return;
      if (typeof item === "string") {
        if (item.trim() !== "") {
          list.push({
            id: `img-${idx}`,
            url: item.trim(),
            alt: `${productTitle} - Vue ${idx + 1}`,
            type: "image",
            isPrimary: idx === 0,
          });
        }
      } else if (typeof item === "object" && item.url?.trim()) {
        list.push({
          id: item.id || `img-${idx}`,
          url: item.url.trim(),
          alt: item.alt || `${productTitle} - Vue ${idx + 1}`,
          variantId: item.variantId,
          type: item.type || "image",
          isPrimary: item.isPrimary ?? idx === 0,
        });
      }
    });

    // Ajouter la vidéo optionnelle si fournie
    if (videoUrl?.trim()) {
      const parsed = parseVideoUrl(videoUrl);
      if (parsed.type !== "invalid") {
        list.push({
          id: "gallery-video",
          url: videoUrl.trim(),
          alt: `${productTitle} - Vidéo de démonstration`,
          type: "video",
        });
      }
    }

    // Si aucune image ni vidéo, un slot vide pour afficher le placeholder neutre
    if (list.length === 0) {
      list.push({
        id: "placeholder",
        url: "",
        alt: productTitle,
        type: "image",
        isPrimary: true,
      });
    }

    return list;
  }, [images, videoUrl, productTitle]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isHoverZoomActive, setIsHoverZoomActive] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 50, y: 50 });

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const zoomTriggerBtnRef = useRef<HTMLButtonElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const lastSyncedVariantRef = useRef<string | undefined>(undefined);

  // Synchronisation avec la variante sélectionnée (uniquement si la variante change)
  useEffect(() => {
    const variantKey = `${selectedVariantId || ""}:${activeVariantImage || ""}`;
    if (lastSyncedVariantRef.current === variantKey) return;
    lastSyncedVariantRef.current = variantKey;

    if (!activeVariantImage && !selectedVariantId) return;

    let targetIdx = -1;

    // Priorité 1 : URL d'image exacte de la variante
    if (activeVariantImage) {
      targetIdx = normalizedMedia.findIndex((m) => m.url === activeVariantImage);
    }

    // Priorité 2 : ID de la variante associée
    if (targetIdx === -1 && selectedVariantId) {
      targetIdx = normalizedMedia.findIndex((m) => m.variantId === selectedVariantId);
    }

    if (targetIdx !== -1) {
      setSelectedIndex(targetIdx);
      onImageChange?.(targetIdx);
    }
  }, [activeVariantImage, selectedVariantId, normalizedMedia, onImageChange]);


  // Changement d'index avec notification
  const handleSelectIndex = useCallback(
    (index: number) => {
      const total = normalizedMedia.length;
      const validIndex = (index + total) % total;
      setSelectedIndex(validIndex);
      setLightboxZoom(1);
      setLightboxPan({ x: 0, y: 0 });
      onImageChange?.(validIndex);
    },
    [normalizedMedia.length, onImageChange]
  );

  const handlePrev = useCallback(() => {
    handleSelectIndex(selectedIndex - 1);
  }, [handleSelectIndex, selectedIndex]);

  const handleNext = useCallback(() => {
    handleSelectIndex(selectedIndex + 1);
  }, [handleSelectIndex, selectedIndex]);

  // 2. Navigation tactile (Mobile Swipe)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      touchMoveRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current) {
      touchMoveRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchMoveRef.current) {
      touchStartRef.current = null;
      touchMoveRef.current = null;
      return;
    }

    const deltaX = touchMoveRef.current.x - touchStartRef.current.x;
    const deltaY = touchMoveRef.current.y - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;

    // Détection d'un swipe horizontal franc (min 40px et plus horizontal que vertical)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) && elapsed < 800) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartRef.current = null;
    touchMoveRef.current = null;
  };

  // 3. Navigation au clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLightbox();
    }
  };

  // 4. Gestion de la Lightbox Zoom Plein Écran
  const openLightbox = () => {
    setIsLightboxOpen(true);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    // Renvoyer le focus au bouton déclencheur
    setTimeout(() => {
      zoomTriggerBtnRef.current?.focus();
    }, 50);
  };

  // Fermeture Lightbox avec touche Échap & gestion clavier
  useEffect(() => {
    if (!isLightboxOpen) return;

    const onWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowLeft" && lightboxZoom <= 1) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight" && lightboxZoom <= 1) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [isLightboxOpen, lightboxZoom, handlePrev, handleNext]);

  // Double-tap zoom sur mobile dans la Lightbox
  const lastTapRef = useRef<number>(0);
  const handleLightboxDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Basculer entre 1x et 2.5x
      setLightboxZoom((prev) => (prev > 1.2 ? 1 : 2.5));
      setLightboxPan({ x: 0, y: 0 });
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // Pinch-to-zoom sur mobile dans la Lightbox
  const pinchStartDistRef = useRef<number | null>(null);
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
    } else if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      touchMoveRef.current = null;
    }
  };

  const handleLightboxTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / pinchStartDistRef.current;
      setLightboxZoom((prev) => Math.min(Math.max(prev * factor, 1), 3.5));
      pinchStartDistRef.current = dist;
    } else if (e.touches.length === 1 && lightboxZoom <= 1 && touchStartRef.current) {
      touchMoveRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleLightboxTouchEnd = () => {
    pinchStartDistRef.current = null;
    if (lightboxZoom <= 1 && touchStartRef.current && touchMoveRef.current) {
      const deltaX = touchMoveRef.current.x - touchStartRef.current.x;
      const deltaY = touchMoveRef.current.y - touchStartRef.current.y;
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) handleNext();
        else handlePrev();
      }
    }
    touchStartRef.current = null;
    touchMoveRef.current = null;
  };

  // Zoom au survol desktop sur l'image principale
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoomHover || !mainContainerRef.current) return;
    const rect = mainContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoverPosition({ x, y });
  };

  const currentMedia = normalizedMedia[selectedIndex] || normalizedMedia[0];
  const isVideo = currentMedia?.type === "video";
  const videoDetails = isVideo && currentMedia?.url ? parseVideoUrl(currentMedia.url) : null;

  // Calcul du ratio d'aspect Tailwind
  const aspectClass =
    aspectRatio === "4:5"
      ? "aspect-[4/5]"
      : aspectRatio === "3:4"
      ? "aspect-[3/4]"
      : "aspect-square";

  return (
    <div className={cn("space-y-3 w-full max-w-full select-none", className)}>
      {/* 1. Cadre Image / Vidéo Principale */}
      <div
        ref={mainContainerRef}
        tabIndex={0}
        role="region"
        aria-label={`Galerie produit - image ${selectedIndex + 1} sur ${normalizedMedia.length}`}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => enableZoomHover && setIsHoverZoomActive(true)}
        onMouseLeave={() => enableZoomHover && setIsHoverZoomActive(false)}
        className={cn(
          "relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#F7F5F0] border border-black/[0.08] shadow-2xs group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]",
          aspectClass
        )}
      >
        {isVideo && videoDetails && videoDetails.type !== "invalid" ? (
          // Affichage Vidéo
          <div className="w-full h-full flex items-center justify-center bg-black">
            {videoDetails.type === "mp4" ? (
              <video
                src={videoDetails.embedUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe
                src={videoDetails.embedUrl}
                title={currentMedia.alt || "Vidéo produit"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            )}
          </div>
        ) : (
          // Affichage Image Principale
          <div
            className="w-full h-full cursor-zoom-in relative"
            onClick={openLightbox}
          >
            {currentMedia?.url ? (
              <div
                className={cn(
                  "w-full h-full transition-transform duration-200",
                  enableZoomHover && isHoverZoomActive ? "scale-150" : "scale-100"
                )}
                style={
                  enableZoomHover && isHoverZoomActive
                    ? {
                        transformOrigin: `${hoverPosition.x}% ${hoverPosition.y}%`,
                      }
                    : undefined
                }
              >
                <ProductImage
                  src={currentMedia.url}
                  alt={currentMedia.alt || `${productTitle} - Image ${selectedIndex + 1}`}
                  fill
                  priority={selectedIndex === 0}
                  fallbackLabel={productTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <NeutralProductPlaceholder
                label={productTitle}
                className="w-full h-full"
              />
            )}
          </div>
        )}

        {/* Badge "Image principale" si premier élément */}
        {selectedIndex === 0 && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tracking-wide uppercase z-10 pointer-events-none">
            Principale
          </span>
        )}

        {/* Compteur "2 / 5" */}
        {normalizedMedia.length > 1 && (
          <span
            data-testid="gallery-counter"
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs text-white text-xs font-semibold z-10 pointer-events-none"
          >
            {selectedIndex + 1} / {normalizedMedia.length}
          </span>
        )}

        {/* Bouton Agrandir / Zoom en bas à droite */}
        {!isVideo && currentMedia?.url && (
          <button
            ref={zoomTriggerBtnRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox();
            }}
            aria-label="Agrandir l'image"
            className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-white/90 hover:bg-white text-[#111111] shadow-md backdrop-blur-xs transition-transform active:scale-95 cursor-pointer z-10"
            title="Agrandir en plein écran"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        )}

        {/* Flèches Précédent / Suivant Desktop */}
        {normalizedMedia.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Image précédente"
              className="p-2 sm:p-2.5 rounded-full bg-white/90 shadow-md text-[#111111] hover:bg-white pointer-events-auto transition-all active:scale-90 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Image suivante"
              className="p-2 sm:p-2.5 rounded-full bg-white/90 shadow-md text-[#111111] hover:bg-white pointer-events-auto transition-all active:scale-90 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {/* Points de pagination (Dots) */}
        {normalizedMedia.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 pointer-events-none">
            {normalizedMedia.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  selectedIndex === idx
                    ? "w-5 bg-white shadow-xs"
                    : "w-1.5 bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Miniatures horizontales (5 visibles sans scroll horizontal de la page entière) */}
      {normalizedMedia.length > 1 && (
        <div
          ref={thumbnailsRef}
          role="tablist"
          aria-label="Miniatures des images du produit"
          className="grid grid-cols-5 gap-2 w-full focus:outline-none"
        >
          {normalizedMedia.map((item, idx) => {
            const isItemVideo = item.type === "video";
            const isSelected = selectedIndex === idx;

            return (
              <button
                key={item.id || idx}
                role="tab"
                aria-selected={isSelected}
                aria-label={`Afficher ${isItemVideo ? "la vidéo" : `l'image ${idx + 1}`}`}
                type="button"
                onClick={() => handleSelectIndex(idx)}
                className={cn(
                  "relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-[#F7F5F0]",
                  isSelected
                    ? "border-[#111111] ring-1 ring-[#111111] shadow-xs"
                    : "border-black/[0.08] opacity-70 hover:opacity-100"
                )}
              >
                {isItemVideo ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#111111] text-white">
                    <Play className="w-5 h-5 fill-white text-white" />
                    <span className="text-[8px] font-bold mt-0.5 uppercase tracking-wider">
                      Vidéo
                    </span>
                  </div>
                ) : item.url ? (
                  <ProductImage
                    src={item.url}
                    alt={item.alt || `${productTitle} - Miniature ${idx + 1}`}
                    fill
                    fallbackLabel={`#${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <NeutralProductPlaceholder
                    label={`#${idx + 1}`}
                    className="w-full h-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Modal Lightbox Plein Écran (Zoom, Pinch, Double-Tap, Clavier, Esc) */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visionneuse plein écran du produit"
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between backdrop-blur-md animate-in fade-in duration-200"
        >
          {/* Barre supérieure : Compteur, Zoom controls, Bouton Fermer */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 text-white z-20">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-wide">
                {selectedIndex + 1} / {normalizedMedia.length}
              </span>
              <span className="text-xs text-white/60 hidden sm:inline truncate max-w-xs">
                {productTitle}
              </span>
            </div>

            {/* Contrôles de zoom */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.max(1, prev - 0.5))}
                disabled={lightboxZoom <= 1}
                aria-label="Réduire le zoom"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors text-white cursor-pointer"
                title="Dézoomer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono px-2 py-1 rounded bg-white/10 text-white min-w-[50px] text-center">
                {Math.round(lightboxZoom * 100)}%
              </span>

              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.min(3.5, prev + 0.5))}
                disabled={lightboxZoom >= 3.5}
                aria-label="Augmenter le zoom"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors text-white cursor-pointer"
                title="Zoomer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {lightboxZoom > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setLightboxZoom(1);
                    setLightboxPan({ x: 0, y: 0 });
                  }}
                  aria-label="Réinitialiser le zoom"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Réinitialiser"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* Bouton Fermer */}
              <button
                type="button"
                onClick={closeLightbox}
                aria-label="Fermer la vue agrandie"
                className="ml-2 p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Zone Centrale de la Lightbox */}
          <div
            className="relative flex-1 flex items-center justify-center p-4 overflow-hidden touch-none"
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
            onClick={handleLightboxDoubleTap}
          >
            {isVideo && videoDetails && videoDetails.type !== "invalid" ? (
              <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black">
                {videoDetails.type === "mp4" ? (
                  <video
                    src={videoDetails.embedUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={videoDetails.embedUrl}
                    title={currentMedia?.alt || "Vidéo produit"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                )}
              </div>
            ) : currentMedia?.url ? (
              <div
                className="relative max-w-full max-h-[75vh] transition-transform duration-150 cursor-grab active:cursor-grabbing"
                style={{
                  transform: `scale(${lightboxZoom}) translate(${lightboxPan.x}px, ${lightboxPan.y}px)`,
                }}
              >
                <img
                  src={currentMedia.url}
                  alt={currentMedia.alt || productTitle}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl select-none"
                  draggable={false}
                />
              </div>
            ) : (
              <NeutralProductPlaceholder
                label={productTitle}
                className="w-64 h-64 rounded-2xl"
              />
            )}

            {/* Flèches de navigation dans la lightbox */}
            {normalizedMedia.length > 1 && lightboxZoom <= 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  aria-label="Précédent"
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-transform active:scale-95 cursor-pointer z-20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  aria-label="Suivant"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-transform active:scale-95 cursor-pointer z-20"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bande inférieure de miniatures dans la lightbox */}
          {normalizedMedia.length > 1 && (
            <div className="px-4 sm:px-6 py-4 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar z-20">
              {normalizedMedia.map((item, idx) => (
                <button
                  key={item.id || idx}
                  type="button"
                  onClick={() => handleSelectIndex(idx)}
                  className={cn(
                    "relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                    selectedIndex === idx
                      ? "border-white ring-2 ring-white/50 scale-105"
                      : "border-white/20 opacity-50 hover:opacity-100"
                  )}
                >
                  {item.type === "video" ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/60 text-white">
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </div>
                  ) : item.url ? (
                    <img
                      src={item.url}
                      alt={`Miniature ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
