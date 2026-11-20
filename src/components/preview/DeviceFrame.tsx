"use client";

import React from "react";
import {
  PreviewDeviceId,
  PreviewOrientation,
  PREVIEW_DEVICES,
  getEffectiveDimensions,
} from "@/lib/preview-device";
import { cn } from "@/lib/utils";

interface DeviceFrameProps {
  deviceId: PreviewDeviceId;
  orientation?: PreviewOrientation;
  children: React.ReactNode;
  className?: string;
  urlLabel?: string;
}

export function DeviceFrame({
  deviceId,
  orientation = "portrait",
  children,
  className,
  urlLabel,
}: DeviceFrameProps) {
  const device = PREVIEW_DEVICES[deviceId] || PREVIEW_DEVICES["iphone-15-pro-max"];
  const { width, height, isRotated } = getEffectiveDimensions(device, orientation);

  if (device.type === "desktop") {
    return (
      <div
        data-testid="device-frame-desktop"
        className={cn(
          "w-full rounded-2xl border border-black/15 bg-white shadow-xl overflow-hidden flex flex-col",
          className
        )}
      >
        {/* Barre de navigation style macOS / navigateur */}
        <div className="px-4 py-2.5 bg-stone-100 border-b border-black/[0.08] flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500/30 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/30 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500/30 inline-block" />
          </div>
          <div className="flex-1 max-w-md mx-auto text-center">
            <div className="px-3 py-1 bg-white rounded-lg border border-black/10 text-[11px] font-mono text-[#666660] truncate">
              {urlLabel || "https://novika.africa/boutique"}
            </div>
          </div>
          <div className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
            {width} × {height}
          </div>
        </div>

        {/* Contenu */}
        <div className="w-full overflow-y-auto flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div
      data-testid={`device-frame-${deviceId}`}
      className={cn(
        "relative transition-all duration-300 shadow-2xl bg-[#09090b] text-[#111111] shrink-0 mx-auto select-none",
        className
      )}
      style={{
        width: `${width}px`,
        maxWidth: "100%",
        borderRadius: device.borderRadius,
        padding: device.borderWidth,
      }}
    >
      {/* Écran interne */}
      <div
        className="w-full bg-white relative overflow-hidden flex flex-col"
        style={{
          borderRadius: `calc(${device.borderRadius} - ${device.borderWidth})`,
          minHeight: `${Math.min(height, 880)}px`,
          height: device.type === "mobile" ? `${height}px` : "auto",
        }}
      >
        {/* 1. Encoche / Dynamic Island supérieure (si portrait ou mobile) */}
        {!isRotated && device.frameType === "dynamic-island" && (
          <div
            data-testid="device-dynamic-island"
            className="absolute top-2.5 inset-x-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="w-[126px] h-[35px] bg-black rounded-full flex items-center justify-between px-3 shadow-md">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#0a1020] border border-blue-900/50" />
            </div>
          </div>
        )}

        {!isRotated && device.frameType === "notch" && (
          <div
            data-testid="device-notch"
            className="absolute top-0 inset-x-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="w-[154px] h-[28px] bg-black rounded-b-2xl flex items-center justify-center">
              <div className="w-12 h-1 bg-stone-800 rounded-full mb-1" />
            </div>
          </div>
        )}

        {!isRotated && device.frameType === "punch-hole" && (
          <div
            data-testid="device-punch-hole"
            className="absolute top-2.5 inset-x-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="w-3.5 h-3.5 bg-black rounded-full border border-stone-800" />
          </div>
        )}

        {/* 2. Barre de statut mobile */}
        {!isRotated && device.type === "mobile" && (
          <div className="h-11 px-7 flex items-center justify-between text-[11px] font-bold text-[#111111] z-40 bg-white/60 backdrop-blur-xs select-none pointer-events-none">
            <span>09:41</span>
            <div className="flex items-center gap-1 text-[10px]">
              <span>5G</span>
              <span className="w-5 h-2.5 rounded-xs border border-[#111111] flex items-center p-0.5">
                <span className="w-full h-full bg-[#111111] rounded-2xs" />
              </span>
            </div>
          </div>
        )}

        {/* 3. Conteneur défilable du site vitrine */}
        <div className="w-full flex-1 overflow-y-auto overflow-x-hidden relative">
          {children}
        </div>

        {/* 4. Barre d'accueil Home Indicator (iOS) */}
        {!isRotated && (device.frameType === "dynamic-island" || device.frameType === "notch") && (
          <div
            data-testid="device-home-indicator"
            className="py-1.5 bg-white/80 backdrop-blur-xs flex items-center justify-center pointer-events-none z-50"
          >
            <div className="w-[134px] h-[5px] bg-black/40 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
