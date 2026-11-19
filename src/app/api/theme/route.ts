import { NextRequest, NextResponse } from "next/server";
import { getShopTheme, saveDraftTheme, publishTheme, getThemeAuditHistory } from "@/lib/theme-engine/store";
import { canEditStore } from "@/config/permissions";
import { UserRole } from "@/server/data/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId") || searchParams.get("store") || "lome-glow";
    const draft = searchParams.get("draft") === "true";

    const theme = await getShopTheme(shopId, { draft });
    const history = await getThemeAuditHistory(shopId);

    return NextResponse.json({
      success: true,
      theme,
      history,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, action = "save_draft", themeData, actorRole = "owner", actorId = "admin" } = body;

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: "L'identifiant de la boutique (shopId) est obligatoire." },
        { status: 400 }
      );
    }

    // Contrôle d'accès strict (Prompt 12) : Seul owner ou admin peut modifier le thème
    if (!canEditStore(actorRole as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: "Action non autorisée : seuls les administrateurs et fondateurs peuvent modifier le thème.",
        },
        { status: 403 }
      );
    }

    if (action === "publish") {
      const result = await publishTheme(shopId, actorId);
      return NextResponse.json(result);
    }

    // Par défaut : sauvegarde du brouillon
    const result = await saveDraftTheme(shopId, themeData, actorId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la sauvegarde du thème" },
      { status: 500 }
    );
  }
}
