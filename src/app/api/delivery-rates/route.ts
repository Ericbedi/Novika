import { NextRequest, NextResponse } from "next/server";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  const { data, error } = await (a.supabase as any).rpc("rates_list_server", { p_secret: a.secret, p_slug: store });
  if (error || !data?.success) return NextResponse.json({ success: false, error: "Lecture impossible." }, { status: 500 });
  return NextResponse.json({ success: true, rates: data.rates });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const a = await authorizeShop(req, body.store || "");
  if (!a.ok) return a.res;
  const { data, error } = await (a.supabase as any).rpc("rate_save_server", {
    p_secret: a.secret,
    p_slug: body.store,
    p_city: String(body.city || ""),
    p_fee: Math.round(Number(body.fee)),
  });
  if (error || !data?.success) return NextResponse.json({ success: false, error: data?.error || "Enregistrement impossible." }, { status: error ? 500 : 422 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") || "";
  const id = req.nextUrl.searchParams.get("id") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, error: "Identifiant invalide." }, { status: 400 });
  const { data, error } = await (a.supabase as any).rpc("rate_delete_server", { p_secret: a.secret, p_slug: store, p_id: id });
  if (error || !data?.success) return NextResponse.json({ success: false, error: "Suppression impossible." }, { status: 500 });
  return NextResponse.json({ success: true });
}
