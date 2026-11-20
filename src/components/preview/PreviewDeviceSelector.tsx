"use client";

import React from "react";
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import {
  PreviewDeviceId,
  PreviewOrientation,
  PREVIEW_DEVICES,
  PREVIEW_DEVICE_LIST,
  getEffectiveDimensions,
  openInNewWindowAtSize,
} from "@/lib/preview-device";
import { cn } from "@/lib/utils";

interface PreviewDeviceSelectorProps {
  selectedDeviceId: PreviewDeviceId;
  onSelectDevice: (deviceId: PreviewDeviceId) => void;
  orientation: PreviewOrientation;
  onToggleOrientation: () => void;
  previewUrl?: string;
  onOpenNewTab?: () => void;
  className?: string;
}

export function PreviewDeviceSelector({
  selectedDeviceId,
  onSelectDevice,
  orientation,
  onToggleOrientation,
  previewUrl,
  onOpenNewTab,
  className,
}: PreviewDeviceSelectorProps) {
  const currentDevice = PREVIEW_DEVICES[selectedDeviceId] || PREVIEW_DEVICES["iphone-15-pro-max"];
  const { width, height } = getEffectiveDimensions(currentDevice, orientation);

  const handleOpenWindow = () => {
    if (onOpenNewTab) {
      onOpenNewTab();
    } else if (previewUrl) {
      openInNewWindowAtSize(previewUrl, width, height, "Aperçu Novika");
    }
  };

  const getDeviceIcon = (type: string, id: string) => {
    if (type === "desktop") return <Monitor className="w-3.5 h-3.5" />;
    if (type === "tablet") return <Tablet className="w-3.5 h-3.5" />;
    return <Smartphone className="w-3.5 h-3.5" />;
  };

  return (
    <div
      data-testid="preview-device-selector-bar"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-2xl bg-white border border-[#E6E0D4] shadow-2xs text-xs",
        className
      )}
    >
      {/* 1. Sélecteur d'appareil (Boutons + Dropdown standard) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Sélecteur natif pour accessibilité & tests automatisés */}
        <div className="relative inline-block">
          <select
            data-testid="select-preview-device"
            value={selectedDeviceId}
            onChange={(e) => onSelectDevice(e.target.value as PreviewDeviceId)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs font-bold text-[#111111] cursor-pointer hover:border-black/30 transition-all focus:outline-none"
            aria-label="Sélectionner un appareil d'aperçu"
          >
            {PREVIEW_DEVICE_LIST.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name} ({dev.width} × {dev.height} px) {dev.id === "iphone-15-pro-max" ? "— Par défaut" : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#7A7A7A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Boutons d'accès rapide (Pills) */}
        <div className="hidden sm:flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E6E0D4]/60">
          {PREVIEW_DEVICE_LIST.map((dev) => {
            const isSelected = selectedDeviceId === dev.id;
            return (
              <button
                key={dev.id}
                type="button"
                data-testid={`btn-device-${dev.id}`}
                onClick={() => onSelectDevice(dev.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#111111] text-white shadow-2xs"
                    : "text-[#666660] hover:text-[#111111] hover:bg-white/80"
                )}
                title={`${dev.name} (${dev.width} × ${dev.height} px)`}
              >
                {getDeviceIcon(dev.type, dev.id)}
                <span>{dev.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Orientation & Dimensions & Bouton d'ouverture externe */}
      <div className="flex items-center gap-2">
        {/* Toggle Orientation Portrait / Paysage (actif pour mobiles et tablettes) */}
        {currentDevice.type !== "desktop" && (
          <button
            type="button"
            data-testid="btn-toggle-orientation"
            onClick={onToggleOrientation}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs font-semibold text-[#111111] hover:bg-[#EFECE6] transition-colors cursor-pointer"
            title={`Basculer en ${orientation === "portrait" ? "Paysage" : "Portrait"}`}
          >
            <RotateCw className="w-3.5 h-3.5 text-[#666660]" />
            <span className="capitalize hidden md:inline">{orientation === "portrait" ? "Portrait" : "Paysage"}</span>
          </button>
        )}

        {/* Badge dimensions en px */}
        <span
          data-testid="preview-dimensions-badge"
          className="px-2.5 py-1 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] font-mono text-[11px] font-bold text-[#111111] select-none"
        >
          {width} × {height} px
        </span>

        {/* Bouton Ouvrir dans un nouvel onglet à cette taille */}
        <button
          type="button"
          data-testid="btn-open-preview-window"
          onClick={handleOpenWindow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-2xs"
          title={`Ouvrir dans une fenêtre à ${width} × ${height} px`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ouvrir à cette taille</span>
        </button>
      </div>
    </div>
  );
}
