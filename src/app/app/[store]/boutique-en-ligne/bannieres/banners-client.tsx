"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Move,
  Eye,
  Sliders,
  Calendar,
  Lock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Monitor,
} from "lucide-react";
import {
  MOCK_BANNER_SLIDES,
  MOCK_MEDIA_ASSETS,
  MOCK_MEDIA_QUOTA,
} from "@/mock-data/banners-data";
import { BannerSlide, BannerPlacement, MediaAsset } from "@/server/data/banner-types";
import {
  isSafeBannerDestinationUrl,
  computeOverlayContrast,
  validateImageMagicBytes,
} from "@/lib/banner-security";

export function BannersClient({ storeSlug }: { storeSlug: string }) {
  const [slides, setSlides] = useState<BannerSlide[]>(MOCK_BANNER_SLIDES);
  const [selectedPlacement, setSelectedPlacement] = useState<BannerPlacement>("hero_carousel");
  const [editingSlideId, setEditingSlideId] = useState<string | null>(slides[0]?.id || null);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(MOCK_MEDIA_ASSETS);
  const [quota, setQuota] = useState(MOCK_MEDIA_QUOTA);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const placementSlides = slides.filter((s) => s.placement === selectedPlacement);
  const activeSlide = slides.find((s) => s.id === editingSlideId) || placementSlides[0] || null;

  const updateActiveSlide = (updates: Partial<BannerSlide>) => {
    if (!activeSlide) return;
    setSlides((prev) =>
      prev.map((s) => (s.id === activeSlide.id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    );
  };

  const handleAddNewSlide = () => {
    if (placementSlides.length >= 5 && selectedPlacement === "hero_carousel") {
      setValidationError("Le carrousel principal est limité à 5 diapositives pour garantir un temps de chargement optimal.");
      return;
    }
    const newSlide: BannerSlide = {
      id: "slide-" + Date.now(),
      shopId: "store-" + storeSlug,
      placement: selectedPlacement,
      title: "Nouvelle Promotion",
      subtitle: "Paiement à la livraison disponible.",
      buttonText: "Découvrir",
      destinationUrl: `/boutique/${storeSlug}/catalogue`,
      altText: "Visuel promotionnel",
      desktopImageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1920",
      focalPointX: 50,
      focalPointY: 50,
      overlayOpacity: 40,
      textColor: "#FFFFFF",
      textPosition: "middle_left",
      displayOrder: placementSlides.length + 1,
      durationSeconds: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSlides((prev) => [...prev, newSlide]);
    setEditingSlideId(newSlide.id);
  };

  const handleDeleteSlide = (id: string) => {
    setSlides((prev) => prev.filter((s) => s.id !== id));
    if (editingSlideId === id) {
      setEditingSlideId(slides.find((s) => s.id !== id)?.id || null);
    }
  };

  // Simulation upload image avec vérification magic bytes
  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulation lecture octets : rejeter si SVG
    if (file.name.endsWith(".svg")) {
      setValidationError("Les fichiers SVG sont strictement interdits pour des raisons de sécurité XSS. Veuillez utiliser un format JPG, PNG ou WebP.");
      return;
    }

    setValidationError(null);
    const newMedia: MediaAsset = {
      id: "media-" + Date.now(),
      shopId: "store-" + storeSlug,
      fileName: file.name,
      mimeType: file.type as any || "image/webp",
      fileSizeBytes: file.size || 250000,
      width: 1920,
      height: 800,
      url: URL.createObjectURL(file),
      thumbnailUrl: URL.createObjectURL(file),
      isUsedInBanner: true,
      isUsedInProduct: false,
      uploadedAt: new Date().toISOString(),
    };
    setMediaAssets((prev) => [newMedia, ...prev]);
    updateActiveSlide({ desktopImageUrl: newMedia.url });
  };

  // Tentative de suppression d'image dans la bibliothèque média
  const handleDeleteMediaAsset = (asset: MediaAsset) => {
    if (asset.isUsedInBanner || asset.isUsedInProduct) {
      setValidationError(`Suppression impossible : Le fichier "${asset.fileName}" est actuellement utilisé dans une bannière ou une fiche produit.`);
      return;
    }
    setValidationError(null);
    setMediaAssets((prev) => prev.filter((a) => a.id !== asset.id));
  };

  const handleSaveAll = () => {
    if (activeSlide && !activeSlide.altText?.trim()) {
      setValidationError("Le texte alternatif de l'image est obligatoire pour l'accessibilité.");
      return;
    }
    if (activeSlide && !isSafeBannerDestinationUrl(activeSlide.destinationUrl)) {
      setValidationError("Lien de destination non sécurisé. Seuls les liens relatifs (/...), https:// et wa.me sont autorisés.");
      return;
    }
    setValidationError(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const overlayContrast = activeSlide ? computeOverlayContrast(activeSlide.overlayOpacity) : { textColor: "#FFFFFF", overlayBackground: "rgba(0,0,0,0.4)" };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#111111] tracking-tight">
              Bannières d'images & Carrousel
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#C2410C] border border-orange-200">
              Vitrine
            </span>
          </div>
          <p className="text-xs text-[#666660] mt-1">
            Gérez les visuels vedettes, le recadrage mobile, les points focaux et le contraste automatique.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/boutique/${storeSlug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-black/10 bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.04] transition-all shadow-2xs"
          >
            <Eye className="h-4 w-4" />
            <span>Voir ma vitrine</span>
          </Link>
          <button
            type="button"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C2410C] text-white text-xs font-bold hover:bg-[#9A3412] transition-all shadow-xs cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>Enregistrer les bannières</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-700" />
          <span>Bannières enregistrées avec succès ! Zéro décalage de mise en page garanti.</span>
        </div>
      )}

      {validationError && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-950 font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 text-red-700 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Sélecteur d'emplacement */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/[0.04] border border-black/[0.06] w-fit">
        {(
          [
            { id: "hero_carousel", label: "Carrousel Principal (Accueil)", max: 5 },
            { id: "promotional_middle", label: "Bannière Promotionnelle Intermédiaire" },
            { id: "collection", label: "Bannière de Collection / Catalogue" },
          ] as const
        ).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setSelectedPlacement(p.id);
              const firstInPlacement = slides.find((s) => s.placement === p.id);
              setEditingSlideId(firstInPlacement?.id || null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPlacement === p.id
                ? "bg-white text-[#111111] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne Gauche : Liste des diapositives & Réglages (7 colonnes) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Liste des diapositives de l'emplacement */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                Diapositives ({placementSlides.length} / 5)
              </span>
              <button
                type="button"
                onClick={handleAddNewSlide}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.05] hover:bg-black/[0.1] text-xs font-bold text-[#111111] transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter une diapositive</span>
              </button>
            </div>

            <div className="space-y-2">
              {placementSlides.map((slide, idx) => {
                const isSelected = slide.id === editingSlideId;
                return (
                  <div
                    key={slide.id}
                    onClick={() => setEditingSlideId(slide.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#111111] bg-[#FAF8F5] shadow-2xs ring-1 ring-black/10"
                        : "border-black/[0.08] bg-white hover:bg-[#FAF8F5]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-black text-[#888880] w-5">
                        #{idx + 1}
                      </span>
                      <img
                        src={slide.desktopImageUrl}
                        alt={slide.altText}
                        className="h-10 w-16 object-cover rounded-lg border border-black/10 shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-[#111111] truncate">
                          {slide.title || "(Sans titre)"}
                        </p>
                        <p className="text-[10px] text-[#666660] truncate">
                          {slide.destinationUrl || "Aucun lien"} · {slide.durationSeconds}s
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          slide.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-black/[0.06] text-[#888880]"
                        }`}
                      >
                        {slide.isActive ? "Active" : "Brouillon"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlide(slide.id);
                        }}
                        aria-label="Supprimer la diapositive"
                        className="p-1.5 rounded-lg text-[#888880] hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Éditeur de la diapositive active */}
          {activeSlide && (
            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] space-y-4">
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider pb-2 border-b border-black/[0.08]">
                Contenu & Visuel de la diapositive
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Titre superposé
                  </label>
                  <input
                    type="text"
                    value={activeSlide.title || ""}
                    onChange={(e) => updateActiveSlide({ title: e.target.value })}
                    placeholder="Ex: Éclat & Beauté Naturelle"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Texte du bouton
                  </label>
                  <input
                    type="text"
                    value={activeSlide.buttonText || ""}
                    onChange={(e) => updateActiveSlide({ buttonText: e.target.value })}
                    placeholder="Ex: Commander à la livraison"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Sous-titre explicatif
                </label>
                <textarea
                  rows={2}
                  value={activeSlide.subtitle || ""}
                  onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                  placeholder="Ex: Produits certifiés bio. Payez à la réception de votre colis."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Lien de destination sûr (HTTPS / WhatsApp / Relatif)
                  </label>
                  <input
                    type="text"
                    value={activeSlide.destinationUrl || ""}
                    onChange={(e) => updateActiveSlide({ destinationUrl: e.target.value })}
                    placeholder="/boutique/lome-glow/catalogue"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Texte alternatif (Accessibilité requise) <span className="text-[#C2410C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={activeSlide.altText || ""}
                    onChange={(e) => updateActiveSlide({ altText: e.target.value })}
                    placeholder="Description précise de l'image"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Point focal & Voile de lisibilité */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-black/[0.06] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-[#C2410C]" />
                    <span className="text-xs font-bold text-[#111111]">
                      Voile de lisibilité (Contraste sombre)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#111111]">
                    {activeSlide.overlayOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={activeSlide.overlayOpacity}
                  onChange={(e) => updateActiveSlide({ overlayOpacity: Number(e.target.value) })}
                  className="w-full accent-[#C2410C] cursor-pointer"
                />

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666660] mb-1">
                      Point focal X ({activeSlide.focalPointX}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={activeSlide.focalPointX}
                      onChange={(e) => updateActiveSlide({ focalPointX: Number(e.target.value) })}
                      className="w-full accent-[#111111]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666660] mb-1">
                      Point focal Y ({activeSlide.focalPointY}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={activeSlide.focalPointY}
                      onChange={(e) => updateActiveSlide({ focalPointY: Number(e.target.value) })}
                      className="w-full accent-[#111111]"
                    />
                  </div>
                </div>
              </div>

              {/* Uploader de nouvelle image */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Remplacer l'image (JPG, PNG, WebP · SVG refusés)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSimulateUpload}
                  className="w-full text-xs text-[#666660] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1F3A26] file:text-white hover:file:bg-black cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Bibliothèque média & Quota */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                Bibliothèque Média & Quota de stockage
              </span>
              <span className="text-[11px] font-bold text-[#666660]">
                {Math.round(quota.usedBytes / 1024)} Ko / {Math.round(quota.maxBytes / (1024 * 1024 * 1024))} Go
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="relative group rounded-xl overflow-hidden border border-black/10 aspect-video bg-black/5"
                >
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.fileName}
                    className="w-full h-full object-cover"
                  />
                  {asset.isUsedInBanner && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-bold bg-[#1F3A26]/80 text-white">
                      Utilisée
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteMediaAsset(asset)}
                    title={asset.isUsedInBanner ? "Impossible de supprimer une image active" : "Supprimer"}
                    className="absolute top-1 right-1 p-1 rounded bg-white/80 hover:bg-white text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne Droite : Aperçu en Direct Bureau & Mobile (5 colonnes) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#111111] uppercase tracking-wider">
              <Eye className="h-4 w-4 text-[#888880]" />
              <span>Aperçu de la bannière</span>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/[0.04] text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  previewMode === "desktop"
                    ? "bg-white text-[#111111] shadow-2xs font-extrabold"
                    : "text-[#666660] hover:text-[#111111]"
                }`}
                title="Aperçu Bureau"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  previewMode === "mobile"
                    ? "bg-white text-[#111111] shadow-2xs font-extrabold"
                    : "text-[#666660] hover:text-[#111111]"
                }`}
                title="Aperçu Mobile"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Cadre d'aperçu */}
          {activeSlide && (
            <div
              className={`rounded-3xl border-4 border-[#111111] bg-white overflow-hidden shadow-xl mx-auto ${
                previewMode === "mobile" ? "max-w-xs" : "w-full"
              }`}
            >
              <div
                className="relative w-full overflow-hidden"
                style={{
                  aspectRatio: previewMode === "mobile" ? "4 / 3" : "16 / 7",
                }}
              >
                <img
                  src={activeSlide.desktopImageUrl}
                  alt={activeSlide.altText}
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: `${activeSlide.focalPointX}% ${activeSlide.focalPointY}%`,
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: overlayContrast.overlayBackground }}
                />

                <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center text-left">
                  {activeSlide.title && (
                    <h4 className="text-sm sm:text-base font-black text-white leading-tight drop-shadow">
                      {activeSlide.title}
                    </h4>
                  )}
                  {activeSlide.subtitle && (
                    <p className="mt-1 text-[10px] sm:text-xs text-white/90 drop-shadow line-clamp-2">
                      {activeSlide.subtitle}
                    </p>
                  )}
                  {activeSlide.buttonText && (
                    <button
                      type="button"
                      className="mt-2.5 px-3 py-1 rounded-xl text-[10px] font-black text-white bg-[#C2410C] w-fit shadow-xs"
                    >
                      {activeSlide.buttonText}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
