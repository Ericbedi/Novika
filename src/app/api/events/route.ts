import { NextRequest, NextResponse } from "next/server";

// Prompt 05-E : Collecte anonyme des événements du parcours client & entonnoir
// Interdictions strictes : Aucune valeur saisie (nom, tel, adresse), aucune IP stockée, aucune empreinte d'appareil.

export type FunnelEventType =
  | "page_produit_vue"
  | "defilement"
  | "image_vue"
  | "variante_choisie"
  | "offre_choisie"
  | "clic_commander"
  | "formulaire_commence"
  | "champ_rempli"
  | "erreur_champ"
  | "commande_envoyee"
  | "commande_confirmee";

export interface AnonymousEventPayload {
  storeSlug: string;
  productId?: string;
  eventType: FunnelEventType;
  timestamp?: string;
  deviceType?: "mobile" | "desktop" | "tablet";
  browser?: string;
  trafficSource?: "meta_ads" | "tiktok_ads" | "google_ads" | "whatsapp" | "direct" | "other";
  utmCampaign?: string;
  fieldName?: string; // Nom du champ SEULEMENT (ex: "phone", "city", "name"). JAMAIS la valeur.
  fieldErrorType?: string; // Type d'erreur (ex: "invalid_phone_digits", "empty").
  scrollPercent?: 25 | 50 | 75 | 100;
  hasAudienceConsent: boolean; // Consentement obligatoire
}

// In-memory events store pour la démo / test
const IN_MEMORY_EVENTS: AnonymousEventPayload[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events: AnonymousEventPayload[] = Array.isArray(body) ? body : [body];

    const sanitizedEvents: AnonymousEventPayload[] = [];

    for (const ev of events) {
      // 1. Règle absolue de conformité : Consentement obligatoire pour "Mesure d'audience"
      if (!ev.hasAudienceConsent) {
        continue; // Ignoré sans consentement
      }

      // 2. Vérification d'intégrité anti-PII : S'assurer qu'aucune valeur de données personnelles n'a été transmise
      const rawObj = ev as Record<string, any>;
      if (rawObj.phone || rawObj.name || rawObj.address || rawObj.clientIp || rawObj.email) {
        return NextResponse.json(
          { error: "Violation de confidentialité : Les données personnelles (nom, téléphone, adresse, IP) sont formellement interdites dans la collecte d'événements." },
          { status: 400 }
        );
      }

      sanitizedEvents.push({
        storeSlug: ev.storeSlug,
        productId: ev.productId,
        eventType: ev.eventType,
        timestamp: ev.timestamp || new Date().toISOString(),
        deviceType: ev.deviceType || "mobile",
        trafficSource: ev.trafficSource || "direct",
        utmCampaign: ev.utmCampaign,
        fieldName: ev.fieldName,
        fieldErrorType: ev.fieldErrorType,
        scrollPercent: ev.scrollPercent,
        hasAudienceConsent: true,
      });
    }

    IN_MEMORY_EVENTS.push(...sanitizedEvents);

    return NextResponse.json({
      success: true,
      received: sanitizedEvents.length,
      message: "Événements anonymes enregistrés avec succès.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erreur lors du traitement du lot d'événements : " + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeSlug = searchParams.get("store") || "lome-glow";

  // Filtrer par boutique (isolation multi-boutique)
  const storeEvents = IN_MEMORY_EVENTS.filter((e) => e.storeSlug === storeSlug);

  return NextResponse.json({
    store: storeSlug,
    count: storeEvents.length,
    events: storeEvents.slice(-50), // Derniers 50 événements
  });
}
