import type { Order, OrderStatus } from "@/server/data/types";

export const ORDER_SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "snapchat", label: "Snapchat" },
  { value: "manual", label: "Manuel" },
  { value: "online_store", label: "Boutique en ligne" },
];

/** Transforme une commande renvoyée par /api/orders en commande de l'interface. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiOrder(o: any): Order {
  return {
    id: o.id || o.order_number,
    orderNumber: o.order_number || o.orderNumber,
    customerName: o.customer_name || o.customerName,
    customerPhone: o.customer_phone || o.customerPhone,
    city: o.city,
    district: o.district || "",
    country: o.country || "TG",
    currency: o.currency || "XOF",
    deliveryAddress: o.delivery_address || o.deliveryAddress,
    status: (o.status === "NOUVELLE" ? "pending" : o.status || "pending") as OrderStatus,
    statusReason: o.status_reason || null,
    subtotal: Number(o.subtotal) || Number(o.total_amount) || 0,
    shippingFee: Number(o.shipping_fee) || 0,
    totalAmount: Number(o.total_amount) || Number(o.subtotal) || 0,
    createdAt: o.created_at || new Date().toISOString(),
    updatedAt: o.updated_at || o.updatedAt || o.created_at || new Date().toISOString(),
    items: o.order_items || o.items || [],
    notes: o.notes || undefined,
    utm: o.source_channel
      ? { source: ORDER_SOURCE_OPTIONS.find((x) => x.value === o.source_channel)?.label || o.source_channel }
      : undefined,
  } as Order;
}

/** Enregistre un changement de statut en base. Renvoie null si OK, sinon le message d'erreur. */
export async function persistOrderStatus(
  storeSlug: string,
  orderNumber: string,
  status: string,
  note?: string
): Promise<string | null> {
  try {
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: storeSlug, orderNumber, status, note }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) return data?.error || "Le statut n'a pas pu être enregistré.";
    return null;
  } catch {
    return "Connexion impossible : le statut n'a pas été enregistré.";
  }
}
