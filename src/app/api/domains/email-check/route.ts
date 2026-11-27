import { NextRequest, NextResponse } from "next/server";
import { analyzeEmailDns, type ZohoRegion } from "@/lib/email-pro";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

async function doh(name: string, type: "MX" | "TXT"): Promise<string[]> {
  try {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(4000), cache: "no-store",
    });
    const d = await r.json();
    return (Array.isArray(d?.Answer) ? d.Answer : []).map((a: { data: string }) => String(a.data));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const storeSlug = String(body.storeSlug || "");
  const a = await authorizeShop(req, storeSlug);
  if (!a.ok) return a.res;
  if (!["owner", "admin"].includes(a.role)) return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });

  const domain = String(body.domain || "").toLowerCase().trim();
  const region: ZohoRegion = body.region === "eu" ? "eu" : "com";
  // Le domaine doit appartenir à cette boutique
  const list = await (a.supabase as any).rpc("shop_domains_list_server", { p_secret: a.secret, p_slug: storeSlug });
  if (!(list.data?.domains || []).some((d: { domain: string }) => d.domain === domain)) {
    return NextResponse.json({ error: "Domaine introuvable pour cette boutique." }, { status: 404 });
  }
  const [mx, txt, dkim] = await Promise.all([doh(domain, "MX"), doh(domain, "TXT"), doh(`zmail._domainkey.${domain}`, "TXT")]);
  return NextResponse.json({ success: true, result: analyzeEmailDns(region, mx, txt, dkim) });
}
