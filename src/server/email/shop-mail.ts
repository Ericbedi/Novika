/**
 * E-mails envoyés au nom d'une boutique (confirmation de commande au client).
 * Si la boutique a validé son domaine d'envoi, l'expéditeur est « Boutique <contact@sondomaine.com> » ; sinon l'expéditeur Kelio.
 * Ne bloque jamais une commande : aucune exception n'est propagée.
 */
export interface EmailSender {
  domain: string;
  address: string;
  status: "pending" | "verified" | "failed";
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
export const isEmail = (v: unknown): v is string => typeof v === "string" && v.length <= 254 && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(v);

export function resolveFrom(shopName: string, sender?: Partial<EmailSender> | null): string {
  const safeName = shopName.replace(/[<>"\r\n]/g, "").trim().slice(0, 60) || "Boutique";
  if (sender && sender.status === "verified" && isEmail(sender.address)) return `${safeName} <${sender.address}>`;
  return process.env.EMAIL_FROM || `${safeName} via Kelio <onboarding@resend.dev>`;
}

export async function sendShopEmail(opts: {
  shopName: string;
  sender?: Partial<EmailSender> | null;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || !isEmail(opts.to)) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: resolveFrom(opts.shopName, opts.sender),
        to: [opts.to],
        subject: opts.subject.slice(0, 200),
        html: opts.html,
        text: opts.text,
        ...(opts.replyTo && isEmail(opts.replyTo) ? { reply_to: opts.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(4000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export function orderConfirmationEmail(a: {
  shopName: string;
  orderNumber: string;
  customerName: string;
  total: number;
  currency?: string;
  quantity?: number;
}): { subject: string; html: string; text: string } {
  const cur = a.currency || "FCFA";
  const total = `${Math.round(a.total).toLocaleString("fr-FR")} ${cur}`;
  const subject = `Commande ${a.orderNumber} reçue — ${a.shopName}`;
  const text = `Bonjour ${a.customerName},\n\nMerci pour votre commande ${a.orderNumber} chez ${a.shopName}.\nMontant à payer à la livraison : ${total}.\n\nNotre équipe vous contactera très bientôt pour confirmer la livraison.\n\n${a.shopName}`;
  const html = `<div style="font-family:Arial,sans-serif;background:#FAF8F5;padding:28px;border-radius:16px;max-width:520px;margin:auto">
<h1 style="font-size:20px;color:#111;margin:0 0 8px">Merci pour votre commande !</h1>
<p style="color:#555;font-size:14px;line-height:1.5">Bonjour ${esc(a.customerName)},</p>
<p style="color:#555;font-size:14px;line-height:1.5">Votre commande <b>${esc(a.orderNumber)}</b> chez <b>${esc(a.shopName)}</b> est bien enregistrée.</p>
<div style="background:#fff;border:1px solid #E6E0D4;border-radius:12px;padding:16px;margin:18px 0;text-align:center">
<div style="font-size:12px;color:#888">Montant à payer à la livraison</div><div style="font-size:24px;font-weight:800;color:#111">${esc(total)}</div></div>
<p style="color:#555;font-size:14px;line-height:1.5">Notre équipe vous contactera très bientôt pour confirmer la livraison.</p>
<p style="color:#999;font-size:11px;margin-top:20px">${esc(a.shopName)}</p></div>`;
  return { subject, html, text };
}
