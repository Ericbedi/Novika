import React, { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProductsRemoteSync } from "@/components/products/products-remote-sync";
import { MOCK_STORES } from "@/mock-data/stores";

export function generateStaticParams() {
  return MOCK_STORES.map((s) => ({ store: s.slug }));
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Chargement de la boutique...</div>}>
      <AppShell initialStoreSlug={store}>
        <ProductsRemoteSync storeSlug={store} />
        {children}
      </AppShell>
    </Suspense>
  );
}
