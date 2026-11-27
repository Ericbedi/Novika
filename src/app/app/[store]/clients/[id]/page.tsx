import React from "react";
import { CustomerDetailLoader } from "./customer-detail-loader";

export default async function CustomerDetailPage({ params }: { params: Promise<{ store: string; id: string }> }) {
  const { store, id } = await params;
  return <CustomerDetailLoader storeSlug={store} customerId={id} />;
}
