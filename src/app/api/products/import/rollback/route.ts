import { NextRequest, NextResponse } from "next/server";
import { canImportProducts } from "@/config/permissions";
import { rollbackImportBatch } from "@/lib/csv-import-engine";
import { UserRole } from "@/server/data/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batchId, storeSlug, role = "owner", currentProducts = [] } = body;

    const userRole = role as UserRole;
    if (!canImportProducts(userRole)) {
      return NextResponse.json(
        {
          error: "Accès refusé. L'annulation d'un lot est réservée à l'administrateur de la boutique.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    if (!batchId) {
      return NextResponse.json(
        { error: "Identifiant de lot (batchId) manquant.", code: "INVALID_BATCH_ID" },
        { status: 400 }
      );
    }

    const result = rollbackImportBatch(batchId, currentProducts, storeSlug);

    return NextResponse.json({
      success: true,
      batchId,
      rolledBackCount: result.rolledBackCount,
      remainingCount: result.remainingProducts.length,
      remainingProducts: result.remainingProducts,
    });
  } catch (error: any) {
    console.error("[Rollback Import API] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'annulation du lot.", code: "ROLLBACK_FAILED" },
      { status: 500 }
    );
  }
}
