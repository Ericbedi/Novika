import { NextRequest, NextResponse } from "next/server";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

const ALLOWED = ["owner", "admin", "manager"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Résumé financier + liste des dépenses sur une période. Réservé à la direction. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const store = sp.get("store") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!ALLOWED.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  const today = new Date().toISOString().slice(0, 10);
  const from = DATE.test(sp.get("from") || "") ? sp.get("from")! : today;
  const to = DATE.test(sp.get("to") || "") ? sp.get("to")! : today;
  const db = a.supabase as any;
  const [s, e] = await Promise.all([
    db.rpc("finance_summary_server", { p_secret: a.secret, p_slug: store, p_from: from, p_to: to }),
    db.rpc("expenses_list_server", { p_secret: a.secret, p_slug: store, p_from: from, p_to: to }),
  ]);
  if (s.error || !s.data?.success || e.error || !e.data?.success) return NextResponse.json({ success: false, error: "Lecture impossible." }, { status: 500 });
  return NextResponse.json({ success: true, summary: s.data, expenses: e.data.expenses });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const a = await authorizeShop(req, body.store || "");
  if (!a.ok) return a.res;
  if (!ALLOWED.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  const x = body.expense || {};
  const { data, error } = await (a.supabase as any).rpc("expense_add_server", {
    p_secret: a.secret,
    p_slug: body.store,
    p_expense: { category: x.category, amount: Math.round(Number(x.amount) || 0), spent_on: DATE.test(x.spent_on || "") ? x.spent_on : null, note: x.note },
  });
  if (error || !data?.success) return NextResponse.json({ success: false, error: data?.error || "Enregistrement impossible." }, { status: error ? 500 : 422 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") || "";
  const id = req.nextUrl.searchParams.get("id") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!ALLOWED.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, error: "Identifiant invalide." }, { status: 400 });
  const { data, error } = await (a.supabase as any).rpc("expense_delete_server", { p_secret: a.secret, p_slug: store, p_id: id });
  if (error || !data?.success) return NextResponse.json({ success: false, error: "Suppression impossible." }, { status: 500 });
  return NextResponse.json({ success: true });
}
