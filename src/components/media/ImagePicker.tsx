"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Library,
  Link2,
  X,
  Search,
  Check,
  Camera,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { useImageUpload } from "./useImageUpload";
import { StoredMediaItem } from "@/lib/media-storage";
import { cn } from "@/lib/utils";

export interface SelectedImageData {
  url: string;
  altText?: string;
  align?: "left" | "center" | "right";
  width?: "small" | "medium" | "full";
}

export interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (data: SelectedImageData) => void;
  storeSlug?: string;
  context?: "product" | "gallery" | "variant" | "description" | "logo" | "banner" | "favicon" | "theme" | "review" | "profile";
  defaultAlt?: string;
  showFormatOptions?: boolean; // Alignement & largeur pour l'éditeur de description
}

export function ImagePicker({
  isOpen,
  onClose,
  onSelectImage,
  storeSlug = "lome-glow",
  context = "description",
  defaultAlt = "",
  showFormatOptions = false,
}: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "library" | "url">("upload");
  const [altText, setAltText] = useState(defaultAlt);
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("center");
  const [widthOption, setWidthOption] = useState<"small" | "medium" | "full">("medium");

  // Médiathèque
  const [libraryItems, setLibraryItems] = useState<StoredMediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<StoredMediaItem | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // Import depuis URL
  const [externalUrl, setExternalUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { isUploading, progress, error, uploadFile, uploadFromUrl, clearError } =
    useImageUpload({
      storeSlug,
      contextType: context,
    });

  const loadLibrary = async () => {
    setIsLoadingLibrary(true);
    try {
      const res = await fetch(`/api/media/library?storeSlug=${encodeURIComponent(storeSlug)}`);
      const data = await res.json();
      if (data.items) {
        setLibraryItems(data.items);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleProcessFile = async (file: File) => {
    clearError();
    const media = await uploadFile(file, altText);
    if (media) {
      onSelectImage({
        url: media.url,
        altText: altText.trim() || media.altText || defaultAlt,
        align: alignment,
        width: widthOption,
      });
      onClose();
    }
  };

  // Chargement de la médiathèque quand l'onglet s'ouvre
  useEffect(() => {
    if (isOpen && activeTab === "library") {
      loadLibrary();
    }
  }, [isOpen, activeTab, storeSlug]);

  // Support du collage direct (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleProcessFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalUrl.trim()) return;

    clearError();
    const media = await uploadFromUrl(externalUrl.trim(), altText);
    if (media) {
      onSelectImage({
        url: media.url,
        altText: altText.trim() || media.altText || defaultAlt,
        align: alignment,
        width: widthOption,
      });
      onClose();
    }
  };

  const handleSelectFromLibrary = () => {
    if (!selectedLibraryItem) return;
    onSelectImage({
      url: selectedLibraryItem.url,
      altText: altText.trim() || selectedLibraryItem.altText || defaultAlt,
      align: alignment,
      width: widthOption,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-novika-image-picker"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl rounded-3xl bg-white border border-[#E6E0D4] p-6 shadow-2xl space-y-4">
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E0D4]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] flex items-center justify-center text-[#111111]">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">
                Sélectionner une image
              </h3>
              <p className="text-[11px] text-[#7A7A7A]">
                Formats autorisés : JPG, PNG, WebP, GIF (Max 5 Mo). Pas de SVG.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-image-picker"
            onClick={onClose}
            className="p-1 rounded-xl text-[#7A7A7A] hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3 Onglets : Importer, Médiathèque, Depuis un lien */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D4] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              activeTab === "upload"
                ? "bg-white text-[#111111] shadow-2xs border border-black/5"
                : "text-[#7A7A7A] hover:text-[#111111]"
            )}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Importer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              activeTab === "library"
                ? "bg-white text-[#111111] shadow-2xs border border-black/5"
                : "text-[#7A7A7A] hover:text-[#111111]"
            )}
          >
            <Library className="h-3.5 w-3.5" />
            <span>Médiathèque</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              activeTab === "url"
                ? "bg-white text-[#111111] shadow-2xs border border-black/5"
                : "text-[#7A7A7A] hover:text-[#111111]"
            )}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Depuis un lien</span>
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Barre de progression */}
        {isUploading && (
          <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D4]">
            <div className="flex justify-between text-[11px] font-bold text-[#111111]">
              <span>Téléversement et conversion WebP...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E6E0D4] overflow-hidden">
              <div
                className="h-full bg-[#111111] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* CONTENU ONGLETS */}
        {/* 1. IMPORTER */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
                e.target.value = "";
              }}
            />

            {/* Input spécifique caméra pour mobile */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
                e.target.value = "";
              }}
            />

            {/* Zone Glisser-Déposer */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcessFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-3xl border-2 border-dashed border-[#E6E0D4] hover:border-[#111111] bg-[#FAF8F5] hover:bg-[#F3EFE6]/50 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3"
            >
              <div className="h-12 w-12 rounded-2xl bg-white border border-[#E6E0D4] flex items-center justify-center text-[#111111] shadow-2xs">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#111111]">
                  Glissez-déposez une image ici ou collez-la (Ctrl + V)
                </p>
                <p className="text-[11px] text-[#7A7A7A] mt-1">
                  Ou cliquez pour parcourir les dossiers de votre appareil
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors"
                >
                  Choisir un fichier
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="sm:hidden px-3 py-2 rounded-xl border border-[#E6E0D4] bg-white text-[#111111] text-xs font-bold flex items-center gap-1.5"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Caméra</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. MÉDIATHÈQUE */}
        {activeTab === "library" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 text-[#7A7A7A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom d'image..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
              {libraryItems
                .filter(
                  (item) =>
                    !searchQuery ||
                    item.originalName.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item) => {
                  const isSelected = selectedLibraryItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedLibraryItem(item)}
                      className={cn(
                        "relative aspect-square rounded-2xl overflow-hidden border border-[#E6E0D4] bg-[#FAF8F5] transition-all cursor-pointer group",
                        isSelected && "ring-2 ring-[#111111] border-transparent"
                      )}
                    >
                      <img
                        src={item.url}
                        alt={item.altText || item.originalName}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-[#111111] text-white flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E6E0D4]">
              <button
                type="button"
                disabled={!selectedLibraryItem}
                onClick={handleSelectFromLibrary}
                className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors disabled:opacity-50"
              >
                Insérer l'image sélectionnée
              </button>
            </div>
          </div>
        )}

        {/* 3. DEPUIS UN LIEN */}
        {activeTab === "url" && (
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D4] text-[11px] text-[#7A7A7A] leading-relaxed">
              <strong>Sécurité Novika :</strong> L'image sera téléchargée et enregistrée sur nos serveurs sécurisés. Aucun lien externe direct n'est conservé.
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Adresse URL de l'image (HTTP / HTTPS)
              </label>
              <input
                type="url"
                required
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://exemple.com/photo.webp"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E0D4] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploading || !externalUrl.trim()}
                className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors disabled:opacity-50"
              >
                {isUploading ? "Copie sécurisée..." : "Télécharger et insérer"}
              </button>
            </div>
          </form>
        )}

        {/* OPTIONS COMPLÉMENTAIRES (Pour description de produit) */}
        {showFormatOptions && (
          <div className="pt-3 border-t border-[#E6E0D4] space-y-3">
            {/* Texte alternatif */}
            <div>
              <label className="block text-[11px] font-bold text-[#111111] mb-1">
                Texte alternatif SEO (Description de l'image)
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Ex : Flacon de sérum 100ml vue de face"
                className="w-full px-3 py-1.5 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>

            {/* Alignement & Largeur */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Alignement
                </label>
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4]">
                  <button
                    type="button"
                    onClick={() => setAlignment("left")}
                    className={cn(
                      "flex-1 p-1.5 rounded-lg flex justify-center text-xs",
                      alignment === "left" ? "bg-white text-black shadow-2xs font-bold" : "text-[#7A7A7A]"
                    )}
                    title="Aligner à gauche"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlignment("center")}
                    className={cn(
                      "flex-1 p-1.5 rounded-lg flex justify-center text-xs",
                      alignment === "center" ? "bg-white text-black shadow-2xs font-bold" : "text-[#7A7A7A]"
                    )}
                    title="Centrer"
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlignment("right")}
                    className={cn(
                      "flex-1 p-1.5 rounded-lg flex justify-center text-xs",
                      alignment === "right" ? "bg-white text-black shadow-2xs font-bold" : "text-[#7A7A7A]"
                    )}
                    title="Aligner à droite"
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Largeur
                </label>
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4]">
                  <button
                    type="button"
                    onClick={() => setWidthOption("small")}
                    className={cn(
                      "flex-1 p-1.5 rounded-lg text-center text-[10px] font-bold",
                      widthOption === "small" ? "bg-white text-black shadow-2xs" : "text-[#7A7A7A]"
                    )}
                  >
                    Petite
                  </button>
                  <button
                    type="button"
                    onClick={() => setWidthOption("medium")}
                    className={cn(
                      "flex-1 p-1.5 rounded-lg text-center text-[10px] font-bold",
                      widthOption === "medium" ? "bg-white text-black shadow-2xs" : "text-[#7A7A7A]"
                    )}
                  >
                    Moyenne
                  </button>
                  <button
                    type="button"
                    onClick={() => setWidthOption("full")}
                    className={cn(
                      "flex-1 p-1.5 rounded-lg text-center text-[10px] font-bold",
                      widthOption === "full" ? "bg-white text-black shadow-2xs" : "text-[#7A7A7A]"
                    )}
                  >
                    100%
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
