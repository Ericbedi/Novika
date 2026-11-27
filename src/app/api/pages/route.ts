import { NextRequest, NextResponse } from "next/server";
import { sanitizePageBlocks } from "@/lib/page-sections";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

const MANAGERS = ["owner", "admin", "manager"];

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!MANAGERS.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  const { data, error } = await (a.supabase as any).rpc("shop_pages_list_server", { p_secret: a.secret, p_slug: store });
  if (error || !data?.success) return NextResponse.json({ success: false, error: "Lecture impossible." }, { status: 500 });
  return NextResponse.json({ success: true, pages: data.pages });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const a = await authorizeShop(req, body.store || "");
  if (!a.ok) return a.res;
  if (!MANAGERS.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  const p = body.page || {};
  const { data, error } = await (a.supabase as any).rpc("shop_page_save_server", {
    p_secret: a.secret,
    p_slug: body.store,
    p_page: { id: p.id || null, title: String(p.title || ""), slug: String(p.slug || ""), content: String(p.content || ""), sections: sanitizePageBlocks(p.sections), published: p.published !== false },
  });
  if (error || !data?.success) return NextResponse.json({ success: false, error: data?.error || "Enregistrement impossible." }, { status: error ? 500 : 422 });
  return NextResponse.json({ success: true, id: data.id, slug: data.slug });
}

export async function DELETE(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") || "";
  const id = req.nextUrl.searchParams.get("id") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!MANAGERS.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, error: "Identifiant invalide." }, { status: 400 });
  const { data, error } = await (a.supabase as any).rpc("shop_page_delete_server", { p_secret: a.secret, p_slug: store, p_id: id });
  if (error || !data?.success) return NextResponse.json({ success: false, error: "Suppression impossible." }, { status: 500 });
  return NextResponse.json({ success: true });
}
