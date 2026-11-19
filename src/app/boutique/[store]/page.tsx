import React from "react";
import { Metadata } from "next";
import { resolveStorefrontData, formatStoreSlugToName } from "@/lib/storefront-resolver";
import { StorefrontHomeClient } from "./storefront-home-client";

interface BoutiquePageProps {
  params: Promise<{ store: string }>;
  searchParams: Promise<{ preview_token?: string }>;
}

export async function generateMetadata({ params }: BoutiquePageProps): Promise<Metadata> {
  const { store: storeSlug } = await params;
  const resolved = resolveStorefrontData(storeSlug);
  const storeName = resolved.store.name || formatStoreSlugToName(storeSlug);

  return {
    title: `${storeName} — Boutique Officielle Paiement à la Livraison`,
    description: `Commandez en ligne sur ${storeName} et payez en espèces à la livraison directement chez vous.`,
    openGraph: {
      title: `${storeName} — Vente en ligne COD`,
      description: `Commandez et payez à la livraison en espèces sur ${storeName}.`,
    },
  };
}

export default async function BoutiqueHomePage({ params }: BoutiquePageProps) {
  const { store: storeSlug } = await params;
  const initialResolved = resolveStorefrontData(storeSlug);

  return (
    <StorefrontHomeClient
      storeSlug={storeSlug}
      initialResolved={initialResolved}
    />
  );
}
