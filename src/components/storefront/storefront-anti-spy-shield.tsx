"use client";

import React, { useEffect } from "react";

interface StorefrontAntiSpyShieldProps {
  storeSlug?: string;
  enableAntiInspect?: boolean;
  enableAntiExtension?: boolean;
}

const SPY_EXTENSION_PATTERNS = [
  "ppspy",
  "alihunter",
  "koala",
  "inspector",
  "dropship",
  "shophunter",
  "uapspy",
  "everbee",
  "commerce-inspector",
  "shopify-spy",
  "spyecom",
  "aliexpress-hunter",
  "sellerpulse",
  "ecomhunt",
  "niche-scraper",
  "pipiads-extension",
];

export function StorefrontAntiSpyShield({
  storeSlug,
  enableAntiInspect = true,
  enableAntiExtension = true,
}: StorefrontAntiSpyShieldProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Désactivation du clic droit (Context Menu) pour empêcher "Inspecter l'élément" et le vol d'images
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Blocage des raccourcis clavier d'inspection et de scraping
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (ou Cmd+Option+I sur macOS)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ["i", "I", "j", "J", "c", "C"].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+U (Afficher le code source de la page), Ctrl+S (Enregistrer la page)
      if ((e.ctrlKey || e.metaKey) && ["u", "U", "s", "S"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. Empêcher le glisser-déposer des images produits pour recherche inversée ou copie de masse
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "IMG" ||
          target.closest("img") ||
          target.closest(".product-card") ||
          target.closest("[data-product-card]"))
      ) {
        e.preventDefault();
        return false;
      }
    };

    // 4. Suppression active des nœuds injectés par les extensions Chrome espionnes (AliHunter, PPSPY, Koala, etc.)
    let observer: MutationObserver | null = null;
    if (enableAntiExtension) {
      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof HTMLElement) {
              const id = (node.id || "").toLowerCase();
              const className = (node.className || "").toString().toLowerCase();
              const src = (node.getAttribute("src") || "").toLowerCase();

              const isSpyNode =
                src.startsWith("chrome-extension://") ||
                SPY_EXTENSION_PATTERNS.some(
                  (pat) => id.includes(pat) || className.includes(pat)
                ) ||
                node.hasAttribute("data-extension-id") ||
                node.hasAttribute("data-ppspy");

              if (isSpyNode) {
                try {
                  node.remove();
                } catch {}
              }
            }
          }
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      // Nettoyer les extensions déjà injectées avant le montage
      const injected = document.querySelectorAll(
        SPY_EXTENSION_PATTERNS.map((p) => `[id*="${p}"], [class*="${p}"]`).join(
          ", "
        )
      );
      injected.forEach((el) => {
        try {
          el.remove();
        } catch {}
      });
    }

    // 5. Piège anti-débogueur léger : paralyse les inspecteurs automatiques d'extensions
    let debugInterval: NodeJS.Timeout | null = null;
    if (enableAntiInspect) {
      debugInterval = setInterval(() => {
        const start = performance.now();
        // eslint-disable-next-line no-eval
        (function () {
          return false;
        })["constructor"]("debugger")();
        if (performance.now() - start > 100) {
          // DevTools ou extension Chrome active en train de déboguer
          console.clear();
        }
      }, 3500);
    }

    // 6. Injection des balises meta anti-indexation / anti-archivage pour scrapers
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      metaRobots.setAttribute(
        "content",
        "noindex, nofollow, noarchive, nosnippet, max-image-preview:none"
      );
      document.head.appendChild(metaRobots);
    }

    if (enableAntiInspect) {
      document.addEventListener("contextmenu", handleContextMenu, { capture: true });
      window.addEventListener("keydown", handleKeyDown, { capture: true });
      document.addEventListener("dragstart", handleDragStart, { capture: true });
    }

    return () => {
      if (enableAntiInspect) {
        document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
        window.removeEventListener("keydown", handleKeyDown, { capture: true });
        document.removeEventListener("dragstart", handleDragStart, { capture: true });
      }
      if (observer) {
        observer.disconnect();
      }
      if (debugInterval) {
        clearInterval(debugInterval);
      }
    };
  }, [enableAntiInspect, enableAntiExtension]);

  return (
    <>
      {/* Piège Honeypot invisible pour tromper les robots et scrapers automatisés */}
      <div
        aria-hidden="true"
        style={{
          display: "none",
          visibility: "hidden",
          opacity: 0,
          pointerEvents: "none",
          position: "absolute",
          left: "-9999px",
        }}
        data-novika-shield="anti-spy-v1"
      >
        <span data-price="0">Private Product Vault</span>
        <a href="/boutique-trap" rel="nofollow">
          Do not follow
        </a>
      </div>
    </>
  );
}
