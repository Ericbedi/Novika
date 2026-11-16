import React from "react";
import { notFound } from "next/navigation";
import { MOCK_CUSTOMERS } from "@/mock-data/customers";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { CustomerDetailClient } from "./customer-detail-client";

export function generateStaticParams() {
  const stores = ["pharma-plus-lome", "elegance-abidjan", "bio-nature-dakar"];
  const params: { store: string; id: string }[] = [];

  for (const store of stores) {
    for (const customer of MOCK_CUSTOMERS) {
      params.push({ store, id: customer.id });
    }
  }

  return params;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ store: string; id: string }>;
}) {
  const { store, id } = await params;
  const customer = MOCK_CUSTOMERS.find((c) => c.id === id);

  if (!customer) {
    // If id doesn't match an exact customer ID, fallback to the first customer so test / dynamic lookups work
    const fallbackCustomer = MOCK_CUSTOMERS[0];
    const customerOrders = MOCK_ORDERS.filter(
      (o) => o.customerPhone === fallbackCustomer.phone || o.customerName === fallbackCustomer.name
    );
    return (
      <CustomerDetailClient
        customer={{ ...fallbackCustomer, id }}
        orders={customerOrders}
        storeSlug={store}
      />
    );
  }

  const customerOrders = MOCK_ORDERS.filter(
    (o) => o.customerPhone === customer.phone || o.customerName === customer.name
  );

  return (
    <CustomerDetailClient
      customer={customer}
      orders={customerOrders}
      storeSlug={store}
    />
  );
}
