import { NextRequest, NextResponse } from "next/server";
import { getTrackingOrderByToken } from "@/server/data/tracking-store";
import { createClient } from "@/lib/supabase/server";
import { TrackingPublicOrder, TrackingStatus, TRACKING_STATUS_CONFIG, TRACKING_NORMAL_STATUSES } from "@/server/data/tracking-types";

// Cache basique en mémoire pour limitation de fréquence par IP (anti-énumération Prompt 05-T)
const RATE_LIMIT_MAP: Map<string, { count: number; resetAt: number }> = new Map();
const MAX_REQUESTS_PER_MINUTE = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(ip);

  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  entry.count++;
  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Contrôle anti-énumération par IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez patienter avant de réessayer." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-Robots-Tag": "noindex, nofollow",
        },
      }
    );
  }

  // 1. Recherche dans le cache mémoire local
  let order = getTrackingOrderByToken(token);

  // 2. Si non trouvé en mémoire, recherche dans Supabase
  if (!order) {
    try {
      const supabase = await createClient();
      const { data: tokenRecord } = await supabase
        .from("tracking_tokens")
        .select("order_id, store_id, expires_at, is_revoked")
        .eq("token_hash", token)
        .maybeSingle();

      if (tokenRecord && !tokenRecord.is_revoked) {
        const isExpired = new Date(tokenRecord.expires_at).getTime() < Date.now();
        if (!isExpired) {
          const { data: orderData } = await supabase
            .from("orders")
            .select(`
              id,
              order_number,
              customer_name,
              city,
              country,
              currency,
              status,
              created_at,
              updated_at,
              order_items (
                id,
                product_name,
                quantity,
                unit_price,
                total_price,
                image
              )
            `)
            .eq("id", tokenRecord.order_id)
            .maybeSingle();

          if (orderData) {
            const rawStatus = (orderData.status || "confirmed").toLowerCase();
            const validStatus: TrackingStatus = (rawStatus in TRACKING_STATUS_CONFIG)
              ? (rawStatus as TrackingStatus)
              : "confirmed";

            const normalIdx = TRACKING_NORMAL_STATUSES.indexOf(validStatus as any);
            const currentStepIdx = normalIdx >= 0 ? normalIdx : 1;
            const config = TRACKING_STATUS_CONFIG[validStatus];

            order = {
              token,
              orderNumber: orderData.order_number,
              customerFirstName: orderData.customer_name?.split(" ")[0] || "Client",
              status: validStatus,
              statusLabel: config?.label || "En cours",
              statusDescription: config?.description || "Commande enregistrée",
              currentStepIndex: currentStepIdx,
              city: orderData.city,
              country: orderData.country,
              shopName: "Kelio Store",
              shopWhatsapp: "+22890123456",
              shopLogo: "/icons/brand-logo.png",
              requiresProofCode: false,
              isExpired: false,
              expiresAt: tokenRecord.expires_at,
              createdAt: orderData.created_at,
              updatedAt: orderData.updated_at,
              timeline: TRACKING_NORMAL_STATUSES.map((stepKey, idx) => ({
                status: stepKey,
                label: TRACKING_STATUS_CONFIG[stepKey]?.shortLabel || stepKey,
                completed: idx <= currentStepIdx,
                current: idx === currentStepIdx,
                timestamp: idx <= currentStepIdx ? new Date(orderData.created_at).toLocaleDateString("fr-FR") : undefined,
                message: idx === currentStepIdx ? TRACKING_STATUS_CONFIG[stepKey]?.description : undefined,
              })),
              history: [
                {
                  id: `hist_${orderData.id}`,
                  status: validStatus,
                  label: config?.label || "Statut mis à jour",
                  date: new Date(orderData.updated_at).toLocaleDateString("fr-FR"),
                  time: new Date(orderData.updated_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                },
              ],
              items: (orderData.order_items || []).map((item) => ({
                id: item.id,
                name: item.product_name,
                quantity: item.quantity,
                image: item.image || "/products/wax-classic.jpg",
              })),
            };
          }
        }
      }
    } catch (e) {
      console.warn("[Tracking API] Supabase fallback error:", e);
    }
  }

  // RÈGLE ABSOLUE Prompt 05-T : Réponse neutre "Lien introuvable" sans révéler l'existence de la commande
  if (!order) {
    return NextResponse.json(
      {
        error: "Lien introuvable",
        message: "Ce lien de suivi est introuvable ou a expiré. Veuillez vérifier le lien reçu ou contacter la boutique.",
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "X-Robots-Tag": "noindex, nofollow",
        },
      }
    );
  }

  return NextResponse.json(order, {
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
