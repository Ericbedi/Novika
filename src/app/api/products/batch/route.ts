import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/server/data/types";
import { canBatchManageProducts, canHardDeleteProduct } from "@/config/permissions";
import { batchUpdateProductsStatus } from "@/lib/products-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopSlug, productIds = [], action, role = "owner" } = body || {};

    if (!shopSlug || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "shopSlug et productIds (tableau non vide) requis." },
        { status: 400 }
      );
    }

    const validActions = ["publish", "unpublish", "archive", "trash", "restore", "hard_delete"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Action invalide: ${action}.` },
        { status: 400 }
      );
    }

    const userRole = (role || "owner") as UserRole;

    if (action === "hard_delete") {
      if (!canHardDeleteProduct(userRole)) {
        return NextResponse.json(
          {
            success: false,
            error: "Suppression définitive en lot réservée exclusivement au PROPRIÉTAIRE de la boutique.",
          },
          { status: 403 }
        );
      }
    } else {
      if (!canBatchManageProducts(userRole)) {
        return NextResponse.json(
          { success: false, error: "Actions en lot non autorisées pour votre rôle." },
          { status: 403 }
        );
      }
    }

    // Limite de 100 max par lot (Prompt 14-B)
    const limitedIds = productIds.slice(0, 100);
    const result = batchUpdateProductsStatus(shopSlug, limitedIds, action, userRole);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
