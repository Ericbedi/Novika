import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canImportProducts } from "@/config/permissions";
import { UserRole } from "@/server/data/types";
import { logAuthAudit } from "@/lib/audit-auth";

/**
 * Route de synchronisation des produits locaux (localStorage / client) vers Supabase (Prompt 17-O).
 * 
 * GARANTIES :
 * 1. Source de vérité = Supabase : enregistrement des produits, variantes, stocks et médias.
 * 2. Unicité et anti-doublon par legacy_id, slug et titre.
 * 3. Ne détruit jamais les données locales de l'utilisateur.
 * 4. Fournit un rapport clair et détaillé (envoyés, insérés, déjà existants, erreurs).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      storeSlug = "kelio",
      products = [],
      role = "owner",
    } = body;

    // 1. Contrôle strict d'autorisation
    const userRole = role as UserRole;
    if (!canImportProducts(userRole) && userRole !== "owner" && userRole !== "admin" && userRole !== "manager") {
      logAuthAudit({
        event: "unauthorized_access",
        details: `Tentative non autorisée de synchronisation Supabase par le rôle '${role}'`,
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json(
        {
          error: "Accès refusé. La synchronisation vers la base de données est réservée aux administrateurs.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({
        success: true,
        report: {
          total_received: 0,
          synced_count: 0,
          existing_count: 0,
          error_count: 0,
          errors: [],
          message: "Aucun produit local à synchroniser.",
        },
      });
    }

    // 2. Appel de la procédure stockée Supabase sécurisée
    const supabase = await createClient();
    const { data, error } = await (supabase as any).rpc("sync_products_to_supabase", {
      p_shop_slug: storeSlug,
      p_products: products,
    });

    if (error) {
      console.error("[Supabase Product Sync Error]:", error);
      return NextResponse.json(
        {
          success: false,
          error: `Erreur Supabase lors de la synchronisation : ${error.message}`,
          code: error.code || "DB_SYNC_ERROR",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report: data || {
        total_received: products.length,
        synced_count: 0,
        existing_count: products.length,
        error_count: 0,
        errors: [],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur inattendue lors de la synchronisation";
    console.error("[Sync API Crash]:", err);
    return NextResponse.json(
      {
        success: false,
        error: msg,
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
