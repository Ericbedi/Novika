"use client";

import { useEffect } from "react";
import { pullAndMergeProducts, flushRemoteProducts } from "@/lib/products-remote-sync";

/**
 * Garde le catalogue produits identique sur tous les appareils (mobile et navigateur) :
 * récupération au chargement, au retour sur l'onglet et toutes les 45 secondes.
 */
export function ProductsRemoteSync({ storeSlug }: { storeSlug: string }) {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const changed = await pullAndMergeProducts(storeSlug);
      await flushRemoteProducts(storeSlug);
      if (changed && !cancelled) window.dispatchEvent(new Event("novika:products-synced"));
    };
    void run();
    const interval = setInterval(run, 45000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [storeSlug]);
  return null;
}
