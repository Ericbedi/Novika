"use client";

import { useEffect, useState } from "react";

export interface ShopBrand {
  color?: string;
  style?: string;
  tagline?: string;
  description?: string;
  whatsapp?: string;
}

const cache = new Map<string, Promise<ShopBrand>>();

/** Identité publique de la boutique (couleur, style, accroche, WhatsApp), mise en cache par page. */
export function loadShopBrand(storeSlug: string): Promise<ShopBrand> {
  let p = cache.get(storeSlug);
  if (!p) {
    p = fetch(`/api/shop-brand?store=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((d) => (d?.brand && typeof d.brand === "object" ? (d.brand as ShopBrand) : {}))
      .catch(() => ({}));
    cache.set(storeSlug, p);
  }
  return p;
}

export function useShopBrand(storeSlug: string): ShopBrand {
  const [brand, setBrand] = useState<ShopBrand>({});
  useEffect(() => {
    let alive = true;
    loadShopBrand(storeSlug).then((b) => alive && setBrand(b));
    return () => {
      alive = false;
    };
  }, [storeSlug]);
  return brand;
}
