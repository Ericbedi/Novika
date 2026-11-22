import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthFromRequest } from "@/server/auth/request-auth";
import { logAuthAudit } from "@/lib/audit-auth";

export const dynamic = "force-dynamic";

/**
 * Publication des produits (localStorage / admin) vers Supabase.
 * - L'identité vient UNIQUEMENT du cookie de session signé (jamais du corps de la requête).
 * - Réservée au propriétaire / admin / manager.
 * - L'écriture passe par la fonction sync_products_server, protégée par PRODUCT_SYNC_SECRET (serveur uniquement).
 * - Les images locales (data:) ne sont pas envoyées : seules les URL publiques le sont.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Session absente ou expirée.", code: "UNAUTHORIZED" }, { status: 401 });
    }
    if (!["owner", "admin", "manager"].includes(auth.role)) {
      logAuthAudit({
        event: "unauthorized_access",
        details: `Tentative non autorisée de publication de produits par le rôle '${auth.role}'`,
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });
      return NextResponse.json(
        { success: false, error: "Accès refusé. La publication est réservée aux administrateurs.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const storeSlug: string = typeof body.storeSlug === "string" && body.storeSlug ? body.storeSlug : "kelio";
    const rawProducts: unknown = body.products;

    if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
      return NextResponse.json({
        success: true,
        report: { total_received: 0, synced_count: 0, existing_count: 0, error_count: 0, errors: [], message: "Aucun produit à publier." },
      });
    }

    const secret = process.env.PRODUCT_SYNC_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Publication non configurée sur le serveur.", code: "NOT_CONFIGURED" }, { status: 500 });
    }

    const supabase = await createClient();

    // Un propriétaire ne publie que dans SA boutique
    const { data: shop } = await supabase.from("shops").select("owner_email").eq("slug", storeSlug).maybeSingle();
    if (!shop) {
      return NextResponse.json({ success: false, error: "Boutique introuvable.", code: "SHOP_NOT_FOUND" }, { status: 404 });
    }
    if (auth.role === "owner" && shop.owner_email && shop.owner_email.toLowerCase() !== auth.email) {
      return NextResponse.json({ success: false, error: "Cette boutique ne vous appartient pas.", code: "FORBIDDEN" }, { status: 403 });
    }

    // Nettoyage : pas d'images locales encodées en base64 dans la base de données
    let skippedLocalImages = 0;
    const products = (rawProducts as Record<string, unknown>[]).map((p) => {
      const imgs = Array.isArray(p.images) ? (p.images as unknown[]) : [];
      const kept = imgs.filter((u) => {
        const ok = typeof u === "string" && /^https?:\/\//i.test(u);
        if (!ok) skippedLocalImages += 1;
        return ok;
      });
      return { ...p, images: kept };
    });

    const { data, error } = await (supabase as any).rpc("sync_products_server", {
      p_secret: secret,
      p_shop_slug: storeSlug,
      p_products: products,
    });

    if (error) {
      console.error("[Product publish error]:", error.code, error.message);
      return NextResponse.json({ success: false, error: "Erreur lors de la publication.", code: error.code || "DB_SYNC_ERROR" }, { status: 500 });
    }
    if (data && data.success === false) {
      return NextResponse.json({ success: false, error: data.error || "Publication refusée.", code: "DB_REFUSED" }, { status: 403 });
    }

    // Répercute aussi les modifications (prix, titre, description, statut, images) sur les produits déjà publiés
    try {
      await (supabase as any).rpc("sync_products_update_server", {
        p_secret: secret,
        p_shop_slug: storeSlug,
        p_products: products,
      });
    } catch {
      /* mise à jour best-effort */
    }

    return NextResponse.json({
      success: true,
      report: { ...(data || {}), skipped_local_images: skippedLocalImages },
    });
  } catch (err: unknown) {
    console.error("[Product publish crash]:", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: "Erreur serveur inattendue.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
