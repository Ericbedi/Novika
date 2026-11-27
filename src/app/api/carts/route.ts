import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

/** Vitrine (publique) : mémorise un numéro saisi sans commande finalisée. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const store = String(body.store || "").replace(/[^a-z0-9-]/gi, "").slice(0, 60);
  const phone = "+" + String(body.phone || "").replace(/\D/g, "");
  if (!store || !/^\+\d{8,15}$/.test(phone) || body.hp) return NextResponse.json({ success: true });
  try {
    const supabase = await createClient();
    await (supabase as any).rpc("cart_capture_public", {
      p_slug: store,
      p_cart: { phone, name: body.name, city: body.city, productId: body.productId, productName: body.productName },
    });
  } catch {
    /* la capture ne doit jamais gêner le client */
  }
  return NextResponse.json({ success: true });
}

const MANAGERS = ["owner", "admin", "manager", "closer"];

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!MANAGERS.includes(a.role)) return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });
  const { data, error } = await (a.supabase as any).rpc("carts_list_server", { p_secret: a.secret, p_slug: store });
  if (error || !data?.success) return NextResponse.json({ success: false, error: "Lecture impossible." }, { status: 500 });
  return NextResponse.json({ success: true, carts: data.carts });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const a = await authorizeShop(req, body.store || "");
  if (!a.ok) return a.res;
  if (!MANAGERS.includes(a.role)) return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });
  if (!/^[0-9a-f-]{36}$/i.test(String(body.id || "")) || !["contacted", "delete"].includes(body.action)) return NextResponse.json({ success: false, error: "Paramètres invalides." }, { status: 400 });
  const { data, error } = await (a.supabase as any).rpc("cart_update_server", { p_secret: a.secret, p_slug: body.store, p_id: body.id, p_action: body.action });
  if (error || !data?.success) return NextResponse.json({ success: false, error: "Action impossible." }, { status: 500 });
  return NextResponse.json({ success: true });
}
