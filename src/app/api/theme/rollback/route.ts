import { NextRequest, NextResponse } from "next/server";
import { restoreThemeVersion } from "@/lib/theme-engine/store";
import { canEditStore } from "@/config/permissions";
import { UserRole } from "@/server/data/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, targetVersion, actorRole = "owner", actorId = "admin" } = body;

    if (!shopId || targetVersion === undefined) {
      return NextResponse.json(
        { success: false, error: "shopId et targetVersion sont obligatoires." },
        { status: 400 }
      );
    }

    if (!canEditStore(actorRole as UserRole)) {
      return NextResponse.json(
        { success: false, error: "Action non autorisée pour ce rôle." },
        { status: 403 }
      );
    }

    const result = await restoreThemeVersion(shopId, Number(targetVersion), actorId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la restauration" },
      { status: 500 }
    );
  }
}
