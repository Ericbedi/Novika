import { NextRequest, NextResponse } from "next/server";
import {
  metaPixelsStore,
  validatePixelId,
  canAddPixel,
  ShopPixel,
} from "@/lib/meta-pixels";
import { canManagePixels, canViewPixels } from "@/config/permissions";
import { UserRole } from "@/server/data/types";

// Helper d'extraction du rôle utilisateur simulé ou session
function getUserRole(req: NextRequest): UserRole {
  const roleHeader = req.headers.get("x-user-role");
  if (
    roleHeader === "owner" ||
    roleHeader === "admin" ||
    roleHeader === "manager" ||
    roleHeader === "closer" ||
    roleHeader === "rider" ||
    roleHeader === "agency"
  ) {
    return roleHeader as UserRole;
  }
  return "owner"; // Par défaut owner en session de test
}

// GET /api/pixels?store=<storeSlug>
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeSlug = searchParams.get("store") || "lome-glow";
    const role = getUserRole(req);

    if (!canViewPixels(role)) {
      return NextResponse.json(
        { error: "Accès refusé : Votre rôle n'est pas autorisé à consulter les pixels." },
        { status: 403 }
      );
    }

    const pixels = metaPixelsStore.getPixels(storeSlug, true);
    const settings = metaPixelsStore.getSettings(storeSlug);
    const auditLogs = metaPixelsStore.getAuditLogs(storeSlug);

    return NextResponse.json({
      success: true,
      storeSlug,
      pixels,
      settings,
      auditLogs,
      canManage: canManagePixels(role),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/pixels
export async function POST(req: NextRequest) {
  try {
    const role = getUserRole(req);
    if (!canManagePixels(role)) {
      return NextResponse.json(
        { error: "Accès refusé : Seuls les administrateurs peuvent ajouter un pixel." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      storeSlug,
      name,
      pixelId,
      isActive = true,
      applyToAllProducts = true,
      productIds = [],
      capiEnabled = false,
      capiToken,
      capiTrigger = "on_order",
      testEventCode,
    } = body;

    if (!storeSlug || !name || !pixelId) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (nom, identifiant de pixel)." },
        { status: 400 }
      );
    }

    // 1. Validation de l'ID (15-16 chiffres uniquement)
    const val = validatePixelId(pixelId);
    if (!val.isValid) {
      return NextResponse.json({ error: val.error }, { status: 400 });
    }

    // 2. Vérification de la limite de 3 pixels et des doublons côté serveur
    const current = metaPixelsStore.getPixels(storeSlug, false);
    const check = canAddPixel(current, pixelId);
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const result = metaPixelsStore.addPixel(
      storeSlug,
      {
        name: name.trim(),
        pixelId: pixelId.trim(),
        isActive: Boolean(isActive),
        applyToAllProducts: Boolean(applyToAllProducts),
        productIds: Array.isArray(productIds) ? productIds : [],
        capiEnabled: Boolean(capiEnabled),
        capiToken: capiToken?.trim() || undefined,
        capiTrigger: capiTrigger === "on_delivery" ? "on_delivery" : "on_order",
        testEventCode: testEventCode?.trim() || undefined,
      },
      `${role} (API)`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      pixel: result.pixel,
      message: "Pixel Meta ajouté avec succès.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/pixels
export async function PUT(req: NextRequest) {
  try {
    const role = getUserRole(req);
    if (!canManagePixels(role)) {
      return NextResponse.json(
        { error: "Accès refusé : Seuls les administrateurs peuvent modifier un pixel." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { storeSlug, id, updates, settingsUpdate } = body;

    if (!storeSlug) {
      return NextResponse.json({ error: "Boutique requise." }, { status: 400 });
    }

    // Mise à jour des paramètres globaux de la boutique (ex: orderEventToSend)
    if (settingsUpdate) {
      const s = metaPixelsStore.updateSettings(storeSlug, settingsUpdate.orderEventToSend);
      return NextResponse.json({ success: true, settings: s });
    }

    if (!id || !updates) {
      return NextResponse.json({ error: "Identifiant interne du pixel et mises à jour requis." }, { status: 400 });
    }

    const res = metaPixelsStore.updatePixel(storeSlug, id, updates, `${role} (API)`);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      pixel: res.pixel,
      message: "Pixel Meta mis à jour.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/pixels?id=<pixelIdInternal>&store=<storeSlug>
export async function DELETE(req: NextRequest) {
  try {
    const role = getUserRole(req);
    if (!canManagePixels(role)) {
      return NextResponse.json(
        { error: "Accès refusé : Seuls les administrateurs peuvent supprimer un pixel." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const storeSlug = searchParams.get("store") || "lome-glow";
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Identifiant du pixel requis." }, { status: 400 });
    }

    const res = metaPixelsStore.deletePixel(storeSlug, id, `${role} (API)`);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Pixel supprimé avec succès.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
