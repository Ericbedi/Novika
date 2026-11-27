import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/server/auth/request-auth";
import { AI_CONFIG, getGeminiApiKey } from "@/config/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface Content {
  tagline: string;
  shopDescription: string;
  productTitle: string;
  shortDescription: string;
  bullets: string[];
  aiUsed: boolean;
}

function capitalize(s: string): string {
  const t = s.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

/** Texte sobre sans promesse inventée, utilisé quand l'IA n'est pas disponible. */
function fallbackContent(name: string, what: string, city: string): Content {
  const w = what.trim().replace(/^(des|du|de la|de l'|les|la|le|l')\s*/i, "") || what.trim();
  const product = capitalize(w);
  return {
    tagline: `${product} livrés chez vous${city ? " à " + city : ""}, paiement à la livraison`,
    shopDescription: `${name} vous propose ${what.trim()}. Commandez en ligne et payez en espèces à la réception de votre colis.`,
    productTitle: product,
    shortDescription: `${product} proposés par ${name}. Vous commandez en quelques secondes et vous payez uniquement à la livraison.`,
    bullets: ["Paiement à la livraison", "Commande simple en quelques secondes", "Livraison à domicile", "Service client joignable sur WhatsApp"],
    aiUsed: false,
  };
}

export async function POST(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ success: false, error: "Session absente ou expirée." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").slice(0, 80);
  const what = String(body.what || "").slice(0, 300);
  const city = String(body.city || "").slice(0, 60);
  const imageB64 = typeof body.imageBase64 === "string" ? body.imageBase64.replace(/^data:image\/\w+;base64,/, "") : "";
  if (!name || !what) return NextResponse.json({ success: false, error: "Nom et activité requis." }, { status: 400 });

  const fallback = fallbackContent(name, what, city);
  let key = "";
  try {
    key = getGeminiApiKey();
  } catch {
    key = "";
  }
  if (!key) return NextResponse.json({ success: true, content: fallback });

  const prompt = `Tu écris pour une boutique en ligne francophone d'Afrique de l'Ouest (paiement à la livraison).
Boutique : « ${name} ». Ce qu'elle vend : « ${what} ».${imageB64 ? " Une photo du produit est jointe : décris uniquement ce qui est réellement visible." : ""}
Réponds UNIQUEMENT en JSON : {"tagline": "...", "shopDescription": "...", "productTitle": "...", "shortDescription": "...", "bullets": ["...","...","...","..."]}
Règles strictes : français simple et chaleureux ; tagline ≤ 70 caractères ; shopDescription ≤ 200 caractères ; productTitle ≤ 70 caractères ; shortDescription 2 à 3 phrases ; 4 puces courtes.
Interdit : inventer un prix, une promotion, un avis client, une certification, un chiffre de ventes, un effet médical ou une matière non visible.`;

  try {
    const parts: Record<string, unknown>[] = [{ text: prompt }];
    if (imageB64) parts.push({ inline_data: { mime_type: "image/jpeg", data: imageB64 } });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 22000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.DEFAULT_MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.6 } }),
        signal: ctrl.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return NextResponse.json({ success: true, content: fallback });
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const j = JSON.parse(text);
    const bullets = Array.isArray(j.bullets) ? j.bullets.map((b: unknown) => String(b).slice(0, 90)).filter(Boolean).slice(0, 4) : [];
    const content: Content = {
      tagline: String(j.tagline || fallback.tagline).slice(0, 90),
      shopDescription: String(j.shopDescription || fallback.shopDescription).slice(0, 260),
      productTitle: String(j.productTitle || fallback.productTitle).slice(0, 90),
      shortDescription: String(j.shortDescription || fallback.shortDescription).slice(0, 600),
      bullets: bullets.length ? bullets : fallback.bullets,
      aiUsed: true,
    };
    return NextResponse.json({ success: true, content });
  } catch {
    return NextResponse.json({ success: true, content: fallback });
  }
}
