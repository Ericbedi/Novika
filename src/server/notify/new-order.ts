/**
 * Alerte « nouvelle commande » envoyée au propriétaire de la boutique.
 * Canaux (chacun actif seulement si ses variables sont configurées) :
 *  - Telegram : TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 *  - E-mail (Resend) : RESEND_API_KEY (+ EMAIL_FROM), envoyé à l'e-mail du propriétaire
 * Ne bloque jamais la commande : toute erreur est ignorée.
 */
export interface NewOrderAlert {
  shopName: string;
  ownerEmail?: string | null;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  city: string;
  total: number;
  currency?: string;
  productLabel?: string;
  quantity?: number;
}

function line(a: NewOrderAlert): string {
  return `${a.customerName} · ${a.customerPhone} · ${a.city}\n${a.productLabel ? a.productLabel + " ×" + (a.quantity || 1) + "\n" : ""}Total : ${a.total} ${a.currency || "FCFA"}`;
}

async function withTimeout<T>(p: Promise<T>, ms = 4000): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((r) => setTimeout(() => r(undefined), ms))]);
}

export async function notifyNewOrder(a: NewOrderAlert): Promise<void> {
  const jobs: Promise<unknown>[] = [];

  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: tgChat, text: `🛒 Nouvelle commande ${a.orderNumber} — ${a.shopName}\n${line(a)}` }),
      }).catch(() => undefined)
    );
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey && a.ownerEmail) {
    jobs.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Kelio <onboarding@resend.dev>",
          to: [a.ownerEmail],
          subject: `Nouvelle commande ${a.orderNumber} — ${a.total} ${a.currency || "FCFA"}`,
          text: `Nouvelle commande sur ${a.shopName}\n\n${line(a)}`,
        }),
      }).catch(() => undefined)
    );
  }

  if (jobs.length) await withTimeout(Promise.allSettled(jobs));
}
