import React from "react";
import { Metadata } from "next";
import { formatStoreSlugToName } from "@/lib/storefront-resolver";
import { resolveStorefrontDataAsync } from "@/lib/storefront-resolver-server";
import { CatalogueClient } from "./catalogue-client";

interface CataloguePageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({ params }: CataloguePageProps): Promise<Metadata> {
  const { store: storeSlug } = await params;
  const resolved = await resolveStorefrontDataAsync(storeSlug);
  const storeName = resolved.store.name || formatStoreSlugToName(storeSlug);

  return {
    title: `Catalogue complet — ${storeName}`,
    description: `Découvrez tous les produits disponibles chez ${storeName}. Paiement cash à la livraison.`,
    openGraph: {
      title: `Catalogue complet — ${storeName}`,
      description: `Découvrez tous les produits disponibles chez ${storeName}. Paiement cash à la livraison.`,
    },
  };
}

export default async function CataloguePage({ params }: CataloguePageProps) {
  const { store: storeSlug } = await params;
  const initialResolved = await resolveStorefrontDataAsync(storeSlug);

  return (
    <CatalogueClient
      storeSlug={storeSlug}
      initialResolved={initialResolved}
    />
  );
}
