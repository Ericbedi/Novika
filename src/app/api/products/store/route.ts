import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthFromRequest } from "@/server/auth/request-auth";

export const dynamic = "force-dynamic";

/**
 * Catalogue admin partagé entre appareils (mobile / navigateur).
 * GET  ?storeSlug=…  → liste des produits (y compris suppressions)
 * PUT  {storeSlug, products} → enregistre les produits modifiés
 * Identité = cookie de session signé uniquement ; boutique vérifiée côté serveur.
 */
async function authorize(req: NextRequest, storeSlug: string) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return { error: NextResponse.json({ success: false, error: "Session absente ou expirée." }, { status: 401 }) };
  if (!["owner", "admin", "manager"].includes(auth.role)) {
    return { error: NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 }) };
  }
  const secret = process.env.PRODUCT_SYNC_SECRET;
  if (!secret) return { error: NextResponse.json({ success: false, error: "Non configuré." }, { status: 500 }) };
  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("owner_email").eq("slug", storeSlug).maybeSingle();
  if (!shop) return { error: NextResponse.json({ success: false, error: "Boutique introuvable." }, { status: 404 }) };
  if (auth.role === "owner" && shop.owner_email && shop.owner_email.toLowerCase() !== auth.email) {
    return { error: NextResponse.json({ success: false, error: "Cette boutique ne vous appartient pas." }, { status: 403 }) };
  }
  return { supabase, secret };
}

export async function GET(req: NextRequest) {
  try {
    const storeSlug = req.nextUrl.searchParams.get("storeSlug") || "";
    if (!storeSlug) return NextResponse.json({ success: false, error: "Boutique manquante." }, { status: 400 });
    const ctx = await authorize(req, storeSlug);
    if ("error" in ctx && ctx.error) return ctx.error;
    const { supabase, secret } = ctx as { supabase: any; secret: string };
    const { data, error } = await supabase.rpc("admin_products_list_server", { p_secret: secret, p_shop_slug: storeSlug });
    if (error || !data?.success) return NextResponse.json({ success: false, error: "Lecture impossible." }, { status: 500 });
    return NextResponse.json({ success: true, products: data.products || [] });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const storeSlug: string = typeof body.storeSlug === "string" ? body.storeSlug : "";
    const products: unknown = body.products;
    if (!storeSlug || !Array.isArray(products)) {
      return NextResponse.json({ success: false, error: "Requête invalide." }, { status: 400 });
    }
    if (products.length === 0) return NextResponse.json({ success: true, count: 0 });
    const ctx = await authorize(req, storeSlug);
    if ("error" in ctx && ctx.error) return ctx.error;
    const { supabase, secret } = ctx as { supabase: any; secret: string };
    const { data, error } = await supabase.rpc("admin_products_upsert_server", {
      p_secret: secret,
      p_shop_slug: storeSlug,
      p_products: products,
    });
    if (error || !data?.success) return NextResponse.json({ success: false, error: "Enregistrement impossible." }, { status: 500 });
    return NextResponse.json({ success: true, count: data.count });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
