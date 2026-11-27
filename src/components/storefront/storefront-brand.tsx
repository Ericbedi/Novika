"use client";

import { useEffect } from "react";
import { loadShopBrand } from "@/lib/use-shop-brand";
import { readableTextOn } from "@/lib/store-wizard-presets";

/** Applique la couleur et le style choisis par le marchand à toute la vitrine. */
export function StorefrontBrand({ storeSlug }: { storeSlug: string }) {
  useEffect(() => {
    let alive = true;
    const root = document.documentElement;
    loadShopBrand(storeSlug).then((b) => {
      if (!alive) return;
      if (b.color && /^#[0-9a-fA-F]{6}$/.test(b.color)) {
        root.style.setProperty("--nv-accent", b.color);
        root.style.setProperty("--nv-on-accent", readableTextOn(b.color));
        root.setAttribute("data-nv-brand", "1");
      }
      if (b.style) root.setAttribute("data-nv-style", b.style);
    });
    return () => {
      alive = false;
      root.removeAttribute("data-nv-brand");
      root.removeAttribute("data-nv-style");
      root.style.removeProperty("--nv-accent");
      root.style.removeProperty("--nv-on-accent");
    };
  }, [storeSlug]);
  return null;
}
