import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      incidentId = "ERR-UNKNOWN",
      message = "Unknown error",
      route = "unknown",
      store = "unknown",
      userId = "anonymous",
      timestamp = new Date().toISOString(),
    } = body;

    // Journalisation sécurisée côté serveur avec contexte complet
    console.error(`[NOVIKA INCIDENT LOG] Code: ${incidentId} | Route: ${route} | Boutique: ${store} | Utilisateur: ${userId} | Date: ${timestamp}`);
    console.error(`[NOVIKA INCIDENT DETAILS] Message: ${String(message).slice(0, 300)}`);

    return NextResponse.json({
      success: true,
      incidentId,
      loggedAt: timestamp,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur journalisation";
    console.error("[NOVIKA INCIDENT LOG ERROR]:", errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
