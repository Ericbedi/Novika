import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Collecte des visiteurs sans cookie et sans adresse IP enregistrée.
 * Le pays est déduit de l'en-tête d'hébergement puis l'IP est jetée ; seule une session volatile (id aléatoire de l'onglet) est conservée.
 */
const PAGES = ["home", "catalog", "product", "checkout"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const shopSlug = String(body.shopSlug || "").replace(/[^a-z0-9-]/gi, "").slice(0, 60);
    const visitorId = String(body.visitorId || "");
    const pageType = PAGES.includes(body.pageType) ? body.pageType : "home";
    if (!shopSlug || !visitorId) return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });

    const country = (req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "").slice(0, 2).toUpperCase();
    const secret = process.env.PRODUCT_SYNC_SECRET;
    if (!secret) return NextResponse.json({ success: false });
    const supabase = await createClient();
    await (supabase as any).rpc("visit_ping_server", { p_secret: secret, p_slug: shopSlug, p_visitor: visitorId, p_page: pageType, p_country: country });
    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch {
    return NextResponse.json({ error: "Erreur traitement présence" }, { status: 500 });
  }
}
