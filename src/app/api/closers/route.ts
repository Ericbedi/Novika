import { NextRequest, NextResponse } from "next/server";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

const MANAGERS = ["owner", "admin", "manager"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const store = sp.get("store") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!MANAGERS.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  const today = new Date().toISOString().slice(0, 10);
  const from = DATE.test(sp.get("from") || "") ? sp.get("from")! : "2000-01-01";
  const to = DATE.test(sp.get("to") || "") ? sp.get("to")! : today;
  const { data, error } = await (a.supabase as any).rpc("closers_list_server", { p_secret: a.secret, p_slug: store, p_from: from, p_to: to });
  if (error || !data?.success) return NextResponse.json({ success: false, error: "Lecture impossible." }, { status: 500 });
  return NextResponse.json({ success: true, closers: data.closers });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const a = await authorizeShop(req, body.store || "");
  if (!a.ok) return a.res;
  if (!MANAGERS.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  const c = body.closer || {};
  const { data, error } = await (a.supabase as any).rpc("closer_save_server", {
    p_secret: a.secret,
    p_slug: body.store,
    p_closer: { id: c.id, name: c.name, phone: c.phone, country: c.country, commission: Math.round(Number(c.commission) || 0), active: c.active },
  });
  if (error || !data?.success) return NextResponse.json({ success: false, error: data?.error || "Enregistrement impossible." }, { status: error ? 500 : 422 });
  return NextResponse.json({ success: true, id: data.id });
}

export async function DELETE(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") || "";
  const id = req.nextUrl.searchParams.get("id") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!MANAGERS.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, error: "Identifiant invalide." }, { status: 400 });
  const { data, error } = await (a.supabase as any).rpc("closer_delete_server", { p_secret: a.secret, p_slug: store, p_id: id });
  if (error || !data?.success) return NextResponse.json({ success: false, error: "Suppression impossible." }, { status: 500 });
  return NextResponse.json({ success: true });
}
