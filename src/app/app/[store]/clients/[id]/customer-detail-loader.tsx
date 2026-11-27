"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { mapApiOrder } from "@/lib/orders-api";
import type { Customer, Order } from "@/server/data/types";
import { CustomerDetailClient } from "./customer-detail-client";

export function CustomerDetailLoader({ storeSlug, customerId }: { storeSlug: string; customerId: string }) {
  const [state, setState] = useState<{ customer: Customer; orders: Order[] } | "missing" | null>(null);

  useEffect(() => {
    const q = encodeURIComponent(storeSlug);
    Promise.all([fetch(`/api/customers?store=${q}`).then((r) => r.json()), fetch(`/api/orders?store=${q}`).then((r) => r.json())])
      .then(([c, o]) => {
        const customer = (c?.customers as Customer[] | undefined)?.find((x) => x.id === customerId);
        if (!customer) return setState("missing");
        const orders = ((o?.orders as unknown[]) || []).map(mapApiOrder).filter((x) => x.customerPhone === customer.phone);
        setState({ customer, orders });
      })
      .catch(() => setState("missing"));
  }, [storeSlug, customerId]);

  if (state === null) return <div className="py-16 text-center text-sm text-[#7A7A7A] flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>;
  if (state === "missing")
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3 text-sm text-[#666660]">
        <p>Client introuvable.</p>
        <Link href={`/app/${storeSlug}/clients`} className="underline font-bold">Retour aux clients</Link>
      </div>
    );
  return <CustomerDetailClient customer={state.customer} orders={state.orders} storeSlug={storeSlug} />;
}
