"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface StorefrontPresencePingProps {
  storeSlug: string;
}

/**
 * Télémétrie éphémère sans cookie ni IP persistée.
 * L'identifiant est généré en mémoire vive pour la durée de l'onglet uniquement.
 * Aucun cookie ni localStorage n'est utilisé conformément aux règles RGPD / APDP.
 */
export function StorefrontPresencePing({ storeSlug }: StorefrontPresencePingProps) {
  const pathname = usePathname();
  // Identifiant de session volatile éphémère en mémoire vive uniquement
  const visitorIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visitorIdRef.current) {
      visitorIdRef.current = "v_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    }

    const visitorId = visitorIdRef.current;

    // Détermination du type de page
    let pageType: "home" | "catalog" | "product" | "checkout" = "home";
    if (pathname.includes("/catalogue")) pageType = "catalog";
    else if (pathname.includes("/produit")) pageType = "product";
    else if (pathname.includes("/commande") || pathname.includes("/checkout")) pageType = "checkout";

    const sendPing = async () => {
      // Si l'onglet est en arrière-plan, ne pas envoyer de signal inutile
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      try {
        await fetch("/api/live/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopSlug: storeSlug,
            visitorId,
            pageType,
          }),
        });
      } catch {
        // Échec silencieux
      }
    };

    // Ping initial
    sendPing();

    // Répétition toutes les 30 secondes
    const interval = setInterval(sendPing, 30_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendPing();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [storeSlug, pathname]);

  return null;
}
