"use client";

import React, { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import {
  PreviewDeviceId,
  PreviewOrientation,
  PREVIEW_DEVICES,
  getStoredPreviewDevice,
  setStoredPreviewDevice,
  getStoredPreviewOrientation,
  setStoredPreviewOrientation,
  getEffectiveDimensions,
  openInNewWindowAtSize,
} from "@/lib/preview-device";
import { PreviewDeviceSelector } from "./PreviewDeviceSelector";
import { DeviceFrame } from "./DeviceFrame";

interface ClientPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  initialPath?: string;
  modalTitle?: string;
}

export function ClientPreviewModal({
  isOpen,
  onClose,
  storeSlug,
  initialPath,
  modalTitle = "Afficher en tant que client",
}: ClientPreviewModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<PreviewDeviceId>("iphone-15-pro-max");
  const [orientation, setOrientation] = useState<PreviewOrientation>("portrait");
  const [iframeKey, setIframeKey] = useState<number>(1);

  // Mémorisation par utilisateur au chargement
  useEffect(() => {
    if (isOpen) {
      setSelectedDevice(getStoredPreviewDevice());
      setOrientation(getStoredPreviewOrientation());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeviceChange = (dev: PreviewDeviceId) => {
    setSelectedDevice(dev);
    setStoredPreviewDevice(dev);
  };

  const handleToggleOrientation = () => {
    const next: PreviewOrientation = orientation === "portrait" ? "landscape" : "portrait";
    setOrientation(next);
    setStoredPreviewOrientation(next);
  };

  const previewUrl = initialPath || `/boutique/${storeSlug}`;
  const currentDevice = PREVIEW_DEVICES[selectedDevice] || PREVIEW_DEVICES["iphone-15-pro-max"];
  const { width, height } = getEffectiveDimensions(currentDevice, orientation);

  const handleOpenNewTab = () => {
    openInNewWindowAtSize(previewUrl, width, height, `${modalTitle} — ${currentDevice.name}`);
  };

  return (
    <div
      data-testid="client-preview-modal"
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* 1. Barre supérieure : Titre, Sélecteur d'appareil, Bouton fermer */}
      <header className="px-4 py-3 bg-[#111111] text-white border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>{modalTitle}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-white/70">
                {storeSlug}
              </span>
            </h2>
            <p className="text-[11px] text-white/60 hidden sm:block">
              Aperçu en direct tel qu'affiché pour vos clients sur mobile et desktop.
            </p>
          </div>
        </div>

        {/* Sélecteur d'appareil et d'orientation */}
        <div className="flex-1 max-w-2xl mx-auto">
          <PreviewDeviceSelector
            selectedDeviceId={selectedDevice}
            onSelectDevice={handleDeviceChange}
            orientation={orientation}
            onToggleOrientation={handleToggleOrientation}
            previewUrl={previewUrl}
            onOpenNewTab={handleOpenNewTab}
            className="bg-stone-900 border-white/15 text-white"
          />
        </div>

        {/* Bouton Fermer */}
        <button
          type="button"
          data-testid="btn-close-client-preview"
          onClick={onClose}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Fermer l'aperçu"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* 2. Zone d'affichage avec centrage du cadre d'appareil */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center">
        <DeviceFrame
          deviceId={selectedDevice}
          orientation={orientation}
          urlLabel={`novika.africa${previewUrl}`}
          className="my-auto"
        >
          <iframe
            key={`${iframeKey}-${selectedDevice}-${orientation}`}
            src={previewUrl}
            title="Aperçu Vitrine Client"
            className="w-full h-full border-none bg-white min-h-[500px]"
            data-testid="client-preview-iframe"
          />
        </DeviceFrame>
      </div>
    </div>
  );
}
