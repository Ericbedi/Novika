import { NextRequest, NextResponse } from "next/server";
import { migrateExternalImagesBatch } from "@/lib/media-storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeSlug = "lome-glow", urls = [] } = body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Veuillez fournir une liste d'URLs d'images à migrer." },
        { status: 400 }
      );
    }

    const report = await migrateExternalImagesBatch(storeSlug, urls);

    return NextResponse.json({
      success: true,
      report,
      message: `Migration terminée : ${report.migratedCount} image(s) copiée(s) dans votre stockage, ${report.failedCount} échec(s).`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
