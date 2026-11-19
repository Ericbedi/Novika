import { NextRequest, NextResponse } from "next/server";
import { importThemeFromJson, duplicateThemeToShop } from "@/lib/theme-engine/store";
import { canEditStore } from "@/config/permissions";
import { UserRole } from "@/server/data/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = (request.headers.get("x-user-role") || body.actorRole || "owner") as UserRole;

    if (!canEditStore(role)) {
      return NextResponse.json({ error: "Autorisation refusée : Seul l'administrateur peut importer un thème." }, { status: 403 });
    }

    const { jsonContent, action, sourceShopId } = body;
    const shopId = body.shopId || body.targetShopId;

    if (!shopId) {
      return NextResponse.json({ error: "Paramètre 'shopId' ou 'targetShopId' requis." }, { status: 400 });
    }

    // Cas 1 : Duplication depuis une autre boutique
    if (action === "duplicate" && sourceShopId) {
      const dupResult = await duplicateThemeToShop({
        sourceShopId,
        targetShopId: shopId,
        actorId: "admin",
      });
      if (!dupResult.success) {
        return NextResponse.json({ error: dupResult.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, theme: dupResult.theme });
    }

    // Cas 2 : Import d'un fichier JSON
    if (!jsonContent) {
      return NextResponse.json({ error: "Contenu JSON manquant." }, { status: 400 });
    }

    const importResult = await importThemeFromJson(shopId, typeof jsonContent === "string" ? jsonContent : JSON.stringify(jsonContent));
    if (!importResult.success) {
      return NextResponse.json({ error: importResult.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, theme: importResult.theme });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
