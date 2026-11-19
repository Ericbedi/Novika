import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/server/data/types";
import { canTrashProduct, canHardDeleteProduct } from "@/config/permissions";
import {
  softDeleteProduct,
  hardDeleteProduct,
  restoreProduct,
  getPendingOrdersCountForProduct,
} from "@/lib/products-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      shopSlug,
      productId,
      isHardDelete = false,
      confirmation = "",
      action = "trash",
      role = "owner",
    } = body || {};

    if (!shopSlug || !productId) {
      return NextResponse.json(
        { success: false, error: "shopSlug et productId requis." },
        { status: 400 }
      );
    }

    const userRole = (role || "owner") as UserRole;

    if (action === "restore") {
      if (!canTrashProduct(userRole)) {
        return NextResponse.json(
          { success: false, error: "Action non autorisée pour votre rôle." },
          { status: 403 }
        );
      }
      const res = restoreProduct(shopSlug, productId, userRole);
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    if (isHardDelete || action === "hard_delete") {
      if (!canHardDeleteProduct(userRole)) {
        return NextResponse.json(
          {
            success: false,
            error: "Suppression définitive réservée exclusivement au PROPRIÉTAIRE de la boutique.",
          },
          { status: 403 }
        );
      }

      const pendingOrders = getPendingOrdersCountForProduct(shopSlug, productId);
      if (pendingOrders > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Impossible de supprimer : ${pendingOrders} commande(s) en cours contiennent ce produit. Traitez ou annulez ces commandes d'abord, ou conservez le produit dans la corbeille.`,
          },
          { status: 400 }
        );
      }

      const res = hardDeleteProduct(shopSlug, productId, confirmation, userRole);
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    // Soft delete (Corbeille)
    if (!canTrashProduct(userRole)) {
      return NextResponse.json(
        { success: false, error: "Action non autorisée pour votre rôle." },
        { status: 403 }
      );
    }

    const res = softDeleteProduct(shopSlug, productId, userRole);
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
