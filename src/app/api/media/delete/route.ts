import { NextRequest, NextResponse } from "next/server";
import { deleteShopMediaItem } from "@/lib/media-storage";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get("id");
    const storeSlug = searchParams.get("storeSlug") || "lome-glow";

    if (!mediaId) {
      return NextResponse.json({ error: "Identifiant du média manquant." }, { status: 400 });
    }

    const result = deleteShopMediaItem(storeSlug, mediaId);
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          usageCount: result.usageCount,
          code: "MEDIA_IN_USE",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Image retirée de la médiathèque.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
