"use client";

import React, { useEffect, useState } from "react";
import { ShopPixel, StorePixelSettings } from "@/lib/meta-pixels";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

interface MetaPixelRunnerProps {
  storeSlug: string;
  productId?: string;
  productName?: string;
  salePrice?: number;
  currency?: string;
}

export function MetaPixelRunner({
  storeSlug,
  productId,
  productName,
  salePrice,
  currency = "XOF",
}: MetaPixelRunnerProps) {
  const [hasMarketingConsent, setHasMarketingConsent] = useState(false);
  const [pixels, setPixels] = useState<ShopPixel[]>([]);
  const [settings, setSettings] = useState<StorePixelSettings>({
    storeSlug,
    orderEventToSend: "Purchase",
  });
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // 1. Vérification du consentement aux cookies (catégorie Marketing)
  useEffect(() => {
    const checkConsent = () => {
      if (typeof window !== "undefined") {
        const consent = window.localStorage.getItem("afribuilder_consent_marketing");
        // Par défaut en démo/test on vérifie le stockage local
        setHasMarketingConsent(consent === "true");
      }
    };

    checkConsent();

    const handleConsentChange = () => checkConsent();
    window.addEventListener("afribuilder:consent_updated", handleConsentChange);
    return () => window.removeEventListener("afribuilder:consent_updated", handleConsentChange);
  }, []);

  // 2. Charger les pixels de la boutique depuis l'API
  useEffect(() => {
    let isMounted = true;
    async function loadPixels() {
      try {
        const res = await fetch(`/api/pixels?store=${encodeURIComponent(storeSlug)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success) {
          setPixels(data.pixels || []);
          if (data.settings) setSettings(data.settings);
        }
      } catch {
        // En cas d'échec réseau, n'interrompt jamais l'expérience utilisateur
      }
    }
    loadPixels();
    return () => {
      isMounted = false;
    };
  }, [storeSlug]);

  // 3. Charger le SDK Meta officiel UNIQUEMENT après consentement explicite
  useEffect(() => {
    if (!hasMarketingConsent || pixels.length === 0) {
      return; // Règle stricte : Sans consentement, aucun script Meta ni appel réseau
    }

    // Filtrer les pixels actifs s'appliquant à ce produit
    const applicablePixels = pixels.filter((p) => {
      if (!p.isActive) return false;
      if (p.applyToAllProducts) return true;
      if (productId && p.productIds && p.productIds.includes(productId)) return true;
      return false;
    });

    if (applicablePixels.length === 0) return;

    // Initialisation sécurisée du SDK Meta (fbevents.js)
    if (!window.fbq) {
      const n: any = (window.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      });
      if (!window._fbq) window._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];

      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.src = "https://connect.facebook.net/fr_FR/fbevents.js";
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }

    // Initialiser chaque pixel applicable
    applicablePixels.forEach((p) => {
      window.fbq("init", p.pixelId);
    });

    // Événement PageView sur toutes les pages
    window.fbq("track", "PageView");

    // Événement ViewContent si sur une fiche produit
    if (productId && productName) {
      window.fbq("track", "ViewContent", {
        content_name: productName,
        content_ids: [productId],
        content_type: "product",
        value: salePrice || 0,
        currency: currency === "XAF" ? "XAF" : "XOF",
      });
    }
  }, [hasMarketingConsent, pixels, productId, productName, salePrice, currency]);

  // 4. Écoute des événements du formulaire de commande (InitiateCheckout, Lead/Purchase)
  useEffect(() => {
    if (!hasMarketingConsent || !window.fbq) return;

    const applicablePixels = pixels.filter((p) => {
      if (!p.isActive) return false;
      if (p.applyToAllProducts) return true;
      if (productId && p.productIds && p.productIds.includes(productId)) return true;
      return false;
    });

    if (applicablePixels.length === 0) return;

    // Début de formulaire -> InitiateCheckout
    const handleInitiateCheckout = (e: any) => {
      const detail = e.detail || {};
      window.fbq("track", "InitiateCheckout", {
        content_name: detail.productName || productName,
        content_ids: [detail.productId || productId],
        value: detail.amount || salePrice || 0,
        currency: currency === "XAF" ? "XAF" : "XOF",
      });
    };

    // Validation de commande -> Purchase ou Lead (avec même event_id pour déduplication)
    const handleOrderCompleted = (e: any) => {
      const detail = e.detail || {};
      const eventId = detail.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const targetEvent = settings.orderEventToSend || "Purchase";

      window.fbq(
        "track",
        targetEvent,
        {
          content_name: detail.productName || productName,
          content_ids: [detail.productId || productId],
          value: Math.round(detail.amount || salePrice || 0),
          currency: currency === "XAF" ? "XAF" : "XOF",
          order_id: detail.orderNumber,
        },
        { eventID: eventId }
      );
    };

    window.addEventListener("novika:initiate_checkout", handleInitiateCheckout);
    window.addEventListener("novika:order_completed", handleOrderCompleted);

    return () => {
      window.removeEventListener("novika:initiate_checkout", handleInitiateCheckout);
      window.removeEventListener("novika:order_completed", handleOrderCompleted);
    };
  }, [hasMarketingConsent, pixels, settings, productId, productName, salePrice, currency]);

  return null;
}
