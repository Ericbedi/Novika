import { NextRequest, NextResponse } from "next/server";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

const MANAGERS = ["owner", "admin", "manager"];

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!MANAGERS.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  const { data, error } = await (a.supabase as any).rpc("stock_list_server", { p_secret: a.secret, p_slug: store });
  if (error || !data?.success) return NextResponse.json({ success: false, error: "Lecture impossible." }, { status: 500 });
  return NextResponse.json({ success: true, products: data.products, movements: data.movements });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const a = await authorizeShop(req, body.store || "");
  if (!a.ok) return a.res;
  if (!MANAGERS.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  if (!/^[0-9a-f-]{36}$/i.test(String(body.productId || ""))) return NextResponse.json({ success: false, error: "Produit invalide." }, { status: 400 });
  const { data, error } = await (a.supabase as any).rpc("stock_adjust_server", {
    p_secret: a.secret,
    p_slug: body.store,
    p_product_id: body.productId,
    p_mode: body.mode,
    p_qty: Math.round(Number(body.qty)),
    p_reason: body.reason || "inventory_adjustment",
    p_note: body.note || null,
    p_author: a.email,
  });
  if (error || !data?.success) return NextResponse.json({ success: false, error: data?.error || "Ajustement impossible." }, { status: error ? 500 : 422 });
  return NextResponse.json({ success: true, stock: data.stock });
}
