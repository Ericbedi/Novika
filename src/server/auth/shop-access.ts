import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthFromRequest } from "./request-auth";

type Access =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; secret: string; role: string; email: string }
  | { ok: false; res: NextResponse };

/** Vérifie la session et que la boutique appartient bien au compte connecté. */
export async function authorizeShop(req: NextRequest, store: string): Promise<Access> {
  const auth = await getAuthFromRequest(req);
  if (!auth) return { ok: false, res: NextResponse.json({ success: false, error: "Session absente ou expirée." }, { status: 401 }) };
  const slug = (store || "").replace(/[^a-z0-9-]/gi, "");
  const secret = process.env.PRODUCT_SYNC_SECRET;
  if (!slug || !secret) return { ok: false, res: NextResponse.json({ success: false, error: "Paramètres invalides." }, { status: 400 }) };
  const supabase = await createClient();
  if (auth.role === "owner") {
    const { data: shop } = await supabase.from("shops").select("owner_email").eq("slug", slug).maybeSingle();
    if (shop?.owner_email && shop.owner_email.toLowerCase() !== auth.email) {
      return { ok: false, res: NextResponse.json({ success: false, error: "Cette boutique ne vous appartient pas." }, { status: 403 }) };
    }
  }
  return { ok: true, supabase, secret, role: auth.role, email: auth.email };
}
