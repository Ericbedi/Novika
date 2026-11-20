import { NextRequest, NextResponse } from "next/server";
import { getStoreDomains, saveStoreDomains } from "@/lib/custom-domains";
import { verifyDomainOnVercel } from "@/lib/vercel-domains-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeSlug, domain } = body;

    if (!storeSlug || !domain) {
      return NextResponse.json({ error: "Boutique et domaine requis.", code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const currentDomains = getStoreDomains(storeSlug);
    const targetIndex = currentDomains.findIndex((d) => d.domain === domain.toLowerCase().trim());

    if (targetIndex === -1) {
      return NextResponse.json({ error: "Domaine introuvable pour cette boutique.", code: "NOT_FOUND" }, { status: 404 });
    }

    const target = currentDomains[targetIndex];

    // Déclenche la vérification Vercel
    const vercelCheck = await verifyDomainOnVercel(target.domain);

    const updated = {
      ...target,
      status: vercelCheck.isVerified ? ("active" as const) : ("pending_dns" as const),
      statusReason: vercelCheck.statusReason,
      dnsRecords: vercelCheck.dnsRecords.length > 0 ? vercelCheck.dnsRecords : target.dnsRecords,
      verifiedAt: vercelCheck.isVerified ? new Date().toISOString() : target.verifiedAt,
      lastCheckedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    currentDomains[targetIndex] = updated;
    saveStoreDomains(storeSlug, currentDomains);

    return NextResponse.json({
      success: true,
      domain: updated,
      isVerified: vercelCheck.isVerified,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur lors de la vérification.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
