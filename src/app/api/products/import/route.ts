import { NextRequest, NextResponse } from "next/server";
import { canImportProducts } from "@/config/permissions";
import { executeAutoCsvImport } from "@/lib/csv-import-engine";
import { UserRole } from "@/server/data/types";
import { logAuthAudit } from "@/lib/audit-auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      csvContent,
      fileName = "import.csv",
      fileSizeBytes = 0,
      storeSlug,
      role = "owner",
      existingProducts = [],
      duplicateStrategy = "skip",
      currency = "XOF",
    } = body;

    // 1. Vérification stricte des permissions (Admin et Co-admin uniquement)
    const userRole = role as UserRole;
    if (!canImportProducts(userRole)) {
      logAuthAudit({
        event: "unauthorized_access",
        details: `Tentative non autorisée d'importation CSV par le rôle '${role}'`,
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json(
        {
          error: "Accès refusé. L'importation de produits est réservée à l'administrateur de la boutique.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json(
        { error: "Contenu CSV requis.", code: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    // 2. Limite de taille de fichier (20 Mo)
    if (fileSizeBytes > 20 * 1024 * 1024 || csvContent.length > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Le fichier dépasse la taille maximale autorisée de 20 Mo.", code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    // 3. Exécution de l'import
    const report = await executeAutoCsvImport({
      csvContent,
      fileName,
      fileSizeBytes: fileSizeBytes || new Blob([csvContent]).size,
      storeSlug: storeSlug || "lome-glow",
      userRole,
      existingProducts,
      duplicateStrategy,
      currency,
    });

    // 4. Persistance directe dans Supabase (Prompt 17-O)
    if (report?.importedProducts && report.importedProducts.length > 0) {
      try {
        const supabase = await createClient();
        await (supabase as any).rpc("sync_products_to_supabase", {
          p_shop_slug: storeSlug || "lome-glow",
          p_products: report.importedProducts,
        });
      } catch (dbSyncErr) {
        console.warn("[CSV Import] Note: Écriture Supabase asynchrone / hors ligne:", dbSyncErr);
      }
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("[CSV Import API] Erreur:", error);
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de l'importation du fichier CSV.",
        code: "IMPORT_FAILED",
      },
      { status: 500 }
    );
  }
}
