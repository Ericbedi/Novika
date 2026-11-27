import { NextRequest, NextResponse } from "next/server";
import { authorizeShop } from "@/server/auth/shop-access";
import { sanitizeHomeConfig } from "@/lib/storefront-home-config";

export const dynamic = "force-dynamic";

const MANAGERS = ["owner", "admin", "manager"];

/** Indique si la personne connectée peut modifier la vitrine (même réponse sur mobile et navigateur). */
export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return NextResponse.json({ success: true, canEdit: false });
  return NextResponse.json({ success: true, canEdit: MANAGERS.includes(a.role) });
}

/** Enregistre la personnalisation de la page d'accueil (fusionnée avec l'existante). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const a = await authorizeShop(req, body.store || "");
  if (!a.ok) return a.res;
  if (!MANAGERS.includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });

  const incoming = sanitizeHomeConfig(body.config);
  const supabase = a.supabase as any;
  const { data: current } = await supabase.rpc("shop_home_public", { p_slug: body.store });
  const prev = sanitizeHomeConfig(current);
  const merged = sanitizeHomeConfig({
    sections: { ...(prev.sections || {}), ...Object.fromEntries(Object.entries(incoming.sections || {}).map(([id, v]) => [id, { ...(prev.sections?.[id] || {}), ...v, content: { ...(prev.sections?.[id]?.content || {}), ...(v.content || {}) } }])) },
    announcementBar: { ...(prev.announcementBar || {}), ...(incoming.announcementBar || {}) },
    header: { ...(prev.header || {}), ...(incoming.header || {}) },
    footer: { ...(prev.footer || {}), ...(incoming.footer || {}) },
    typography: { ...(prev.typography || {}), ...(incoming.typography || {}) },
    colors: { ...(prev.colors || {}), ...(incoming.colors || {}) },
  });
  const { data, error } = await supabase.rpc("shop_home_save_server", { p_secret: a.secret, p_slug: body.store, p_config: merged });
  if (error || !data?.success) return NextResponse.json({ success: false, error: data?.error || "Enregistrement impossible." }, { status: 500 });
  return NextResponse.json({ success: true, config: merged });
}
