"use client";

import { useEffect, useState } from "react";

/**
 * Hook détectant si l'utilisateur ou le système préfère un mouvement réduit.
 * Respecte :
 * 1. La requête média système `(prefers-reduced-motion: reduce)`
 * 2. L'attribut document `data-reduced-motion="true"` (Mode Léger pour rôles mobiles/terrain)
 * 3. Le réglage stocké dans `localStorage.getItem("novika_reduced_motion")`
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const checkMotion = () => {
      const stored = localStorage.getItem("novika_reduced_motion");
      const docReduced = document.documentElement.getAttribute("data-reduced-motion") === "true";
      setPrefersReducedMotion(mediaQuery.matches || stored === "true" || docReduced);
    };

    checkMotion();

    // Écouter les changements système
    mediaQuery.addEventListener?.("change", checkMotion);
    return () => {
      mediaQuery.removeEventListener?.("change", checkMotion);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Configure le mode léger (réduction des animations)
 */
export function setReducedMotionMode(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("novika_reduced_motion", enabled ? "true" : "false");
  if (enabled) {
    document.documentElement.setAttribute("data-reduced-motion", "true");
  } else {
    document.documentElement.removeAttribute("data-reduced-motion");
  }
}
