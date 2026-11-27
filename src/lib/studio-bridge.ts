"use client";

/**
 * Pont entre l'éditeur visuel (Studio) et l'aperçu de la vitrine affiché dans un cadre.
 * Le Studio envoie le brouillon à l'aperçu avec postMessage ; l'aperçu l'applique sans rien enregistrer.
 * Sécurité : seuls les messages venant de la fenêtre parente ET de la même origine sont acceptés.
 */
import { useEffect, useState } from "react";
import { sanitizeHomeConfig, type HomeConfig } from "./storefront-home-config";

export const STUDIO_MESSAGE = "kelio-studio-draft";

export interface StudioDraft {
  config?: HomeConfig;
  pageSections?: unknown[];
}

export function useStudioDraft(): { active: boolean; draft: StudioDraft } {
  const [active, setActive] = useState(false);
  const [draft, setDraft] = useState<StudioDraft>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const embedded = window.parent !== window && new URLSearchParams(window.location.search).get("studio") === "1";
    if (!embedded) return;
    setActive(true);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const d = e.data;
      if (!d || d.type !== STUDIO_MESSAGE) return;
      setDraft({
        config: d.config ? sanitizeHomeConfig(d.config) : undefined,
        pageSections: Array.isArray(d.pageSections) ? d.pageSections : undefined,
      });
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "kelio-studio-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return { active, draft };
}

/** Envoie à l'éditeur la configuration actuellement affichée (point de départ des réglages). */
export function postStudioBase(source: "home" | "layout", config: unknown) {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage({ type: "kelio-studio-base", source, config }, window.location.origin);
}
