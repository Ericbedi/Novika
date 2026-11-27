import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthFromRequest } from "@/server/auth/request-auth";

export const dynamic = "force-dynamic";

/** Mise à jour de l'identité publique de la boutique (accroche, description, couleur, style, WhatsApp). */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: "Session absente ou expirée." }, { status: 401 });
    const { slug, brand } = await req.json();
    const cleanSlug = String(slug || "").replace(/[^a-z0-9-]/gi, "");
    if (!cleanSlug || !brand || typeof brand !== "object") {
      return NextResponse.json({ success: false, error: "Paramètres invalides." }, { status: 400 });
    }
    const allowed = ["color", "style", "tagline", "description", "whatsapp"];
    const clean: Record<string, string> = {};
    for (const k of allowed) if (typeof brand[k] === "string") clean[k] = brand[k].slice(0, 300);
    if (clean.color && !/^#[0-9a-fA-F]{6}$/.test(clean.color)) delete clean.color;

    const secret = process.env.PRODUCT_SYNC_SECRET;
    if (!secret) return NextResponse.json({ success: false, error: "Non configuré." }, { status: 500 });
    const supabase = await createClient();
    const { data: shop } = await supabase.from("shops").select("owner_email").eq("slug", cleanSlug).maybeSingle();
    if (!shop || (auth.role === "owner" && shop.owner_email?.toLowerCase() !== auth.email)) {
      return NextResponse.json({ success: false, error: "Cette boutique ne vous appartient pas." }, { status: 403 });
    }
    const { data } = await (supabase as any).rpc("shop_set_brand_server", { p_secret: secret, p_slug: cleanSlug, p_brand: clean });
    return NextResponse.json({ success: !!data?.success });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
