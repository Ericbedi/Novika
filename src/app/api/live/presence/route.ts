import { NextRequest, NextResponse } from "next/server";

/**
 * Collecte des visiteurs sans cookie et sans adresse IP enregistrée.
 * Le serveur déduit le code pays depuis l'en-tête d'hébergement ou la requête,
 * puis jette immédiatement l'adresse IP (ni enregistrée, ni journalisée).
 */

interface PresenceRecord {
  shopSlug: string;
  visitorId: string;
  country: string;
  pageType: "home" | "catalog" | "product" | "checkout";
  lastActivity: number;
}

// Magasin éphémère en mémoire (nettoyage automatique)
const presenceStore: Map<string, PresenceRecord> = new Map();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopSlug, visitorId, pageType = "home", country: reqCountry, token } = body;

    if (!shopSlug || !visitorId) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Déduction du pays via les en-têtes d'hébergement (Vercel / Cloudflare)
    // L'adresse IP est STRICTEMENT jetée et n'est jamais consignée dans les logs
    const geoCountry =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      reqCountry ||
      "TG";

    const cleanCountry = typeof geoCountry === "string" ? geoCountry.slice(0, 2).toUpperCase() : "TG";

    const recordKey = `${shopSlug}:${visitorId}`;
    presenceStore.set(recordKey, {
      shopSlug,
      visitorId,
      country: cleanCountry,
      pageType,
      lastActivity: Date.now(),
    });

    // Nettoyage des sessions inactives (> 5 minutes)
    const now = Date.now();
    for (const [key, record] of presenceStore.entries()) {
      if (now - record.lastActivity > 5 * 60 * 1000) {
        presenceStore.delete(key);
      }
    }

    return NextResponse.json({ success: true, timestamp: now });
  } catch (error) {
    return NextResponse.json({ error: "Erreur traitement présence" }, { status: 500 });
  }
}
