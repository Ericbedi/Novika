import { NextRequest, NextResponse } from "next/server";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const a = await authorizeShop(req, body.store || "");
  if (!a.ok) return a.res;
  if (!["owner", "admin", "manager"].includes(a.role)) return NextResponse.json({ success: false, error: "Seule la direction peut affecter une closeuse." }, { status: 403 });
  const orderNumber = String(body.orderNumber || "").slice(0, 60);
  const closerId = body.closerId ? String(body.closerId) : null;
  if (!orderNumber || (closerId && !/^[0-9a-f-]{36}$/i.test(closerId))) return NextResponse.json({ success: false, error: "Paramètres invalides." }, { status: 400 });
  const { data, error } = await (a.supabase as any).rpc("order_assign_closer_server", { p_secret: a.secret, p_slug: body.store, p_order_number: orderNumber, p_closer_id: closerId });
  if (error || !data?.success) return NextResponse.json({ success: false, error: data?.error || "Affectation impossible." }, { status: error ? 500 : 422 });
  return NextResponse.json({ success: true, closerName: data.closerName });
}
