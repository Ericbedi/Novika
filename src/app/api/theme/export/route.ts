import { NextRequest, NextResponse } from "next/server";
import { exportThemeToJson } from "@/lib/theme-engine/store";
import { canEditStore } from "@/config/permissions";
import { UserRole } from "@/server/data/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId") || "lome-glow";
    const role = (request.headers.get("x-user-role") || "owner") as UserRole;

    if (!canEditStore(role)) {
      return NextResponse.json({ error: "Autorisation refusée : Seul l'administrateur peut exporter le thème." }, { status: 403 });
    }

    const jsonString = await exportThemeToJson(shopId);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="theme-${shopId}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
