import { NextRequest, NextResponse } from "next/server";
import { domainPointsToPlatform } from "@/lib/domain-dns";
import { verifyDomainOnVercel } from "@/lib/vercel-domains-api";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const storeSlug = String(body.storeSlug || "");
    const domain = String(body.domain || "").toLowerCase().trim();
    const a = await authorizeShop(req, storeSlug);
    if (!a.ok) return a.res;
    if (!["owner", "admin"].includes(a.role)) return NextResponse.json({ error: "Accès réservé aux administrateurs.", code: "FORBIDDEN" }, { status: 403 });

    const list = await (a.supabase as any).rpc("shop_domains_list_server", { p_secret: a.secret, p_slug: storeSlug });
    const target = (list.data?.domains || []).find((d: any) => d.domain === domain);
    if (!target) return NextResponse.json({ error: "Domaine introuvable pour cette boutique.", code: "NOT_FOUND" }, { status: 404 });

    const dns = await domainPointsToPlatform(domain);
    let status: "active" | "pending_dns" | "verifying" = "pending_dns";
    let reason = dns.reason;
    let records = target.dnsRecords;

    if (dns.ok) {
      const hasVercel = !!(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
      if (hasVercel) {
        const v = await verifyDomainOnVercel(domain);
        if (v.isVerified) { status = "active"; reason = "DNS vérifié, HTTPS actif."; }
        else { status = "verifying"; reason = "DNS correct. Vercel finalise la vérification et le certificat HTTPS, réessayez dans quelques minutes."; }
        if (v.dnsRecords.length) records = v.dnsRecords;
      } else {
        // DNS correct mais rattachement automatique non configuré : activation par l'équipe Kelio
        status = "verifying";
        reason = "DNS correct. Kelio active le certificat HTTPS de votre domaine (sous 24 h).";
      }
    }

    const { data } = await (a.supabase as any).rpc("shop_domain_update_server", {
      p_secret: a.secret, p_slug: storeSlug, p_domain: domain, p_status: status, p_reason: reason, p_records: records,
    });
    if (!data?.success) return NextResponse.json({ error: "Mise à jour impossible.", code: "INTERNAL_ERROR" }, { status: 500 });
    return NextResponse.json({ success: true, domain: data.domain, isVerified: status === "active" });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la vérification.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
