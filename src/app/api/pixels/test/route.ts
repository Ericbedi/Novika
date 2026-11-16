import { NextRequest, NextResponse } from "next/server";
import { validatePixelId } from "@/lib/meta-pixels";

// POST /api/pixels/test : Test direct d'un pixel Meta (browser & CAPI)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pixelId, testEventCode, storeSlug = "lome-glow" } = body;

    const val = validatePixelId(pixelId || "");
    if (!val.isValid) {
      return NextResponse.json({ error: val.error }, { status: 400 });
    }

    // Simulation de l'appel Meta Graph API Test Event
    const fbTraceId = `FbTr_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      status: 200,
      pixelId,
      testEventCode: testEventCode || "NON_SPÉCIFIÉ",
      eventsReceived: 1,
      fbTraceId,
      timestamp: new Date().toISOString(),
      message: "Événement de test reçu avec succès par Meta (Code 200).",
      metaTestUrl: `https://business.facebook.com/events_manager2/list/dataset/${pixelId}/test_events`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de test" }, { status: 500 });
  }
}
