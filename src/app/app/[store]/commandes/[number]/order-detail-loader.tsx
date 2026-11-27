"use client";

import React, { useEffect, useState } from "react";
import type { Order } from "@/server/data/types";
import { mapApiOrder } from "@/lib/orders-api";
import { OrderDetailClient } from "./order-detail-client";

/** Charge la vraie commande depuis la base avant d'afficher la fiche. */
export function OrderDetailLoader({ storeSlug, orderNumber }: { storeSlug: string; orderNumber: string }) {
  const [state, setState] = useState<"loading" | "missing" | Order>("loading");

  useEffect(() => {
    let alive = true;
    fetch(`/api/orders?store=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const found = Array.isArray(data?.orders)
          ? data.orders.map(mapApiOrder).find((o: Order) => o.orderNumber === orderNumber)
          : null;
        setState(found || "missing");
      })
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [storeSlug, orderNumber]);

  if (state === "loading") return <div className="p-8 text-sm text-[#7A7A7A]">Chargement de la commande…</div>;
  if (state === "missing")
    return <div className="p-8 text-sm text-[#7A7A7A]">Commande {orderNumber} introuvable.</div>;
  return <OrderDetailClient storeSlug={storeSlug} orderNumber={orderNumber} initialOrder={state} />;
}
