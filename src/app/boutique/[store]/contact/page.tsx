import React from "react";
import { Metadata } from "next";
import { formatStoreSlugToName } from "@/lib/storefront-resolver";
import { resolveStorefrontDataAsync } from "@/lib/storefront-resolver-server";
import { ContactClient } from "./contact-client";

interface ContactPageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { store: storeSlug } = await params;
  const resolved = await resolveStorefrontDataAsync(storeSlug);
  const storeName = resolved.store.name || formatStoreSlugToName(storeSlug);

  return {
    title: `Contact & Délais de livraison — ${storeName}`,
    description: `Contactez le service client de ${storeName}. Livraison express et paiement en espèces à la livraison.`,
    openGraph: {
      title: `Contact & Délais de livraison — ${storeName}`,
      description: `Contactez le service client de ${storeName}. Livraison express et paiement en espèces à la livraison.`,
    },
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { store: storeSlug } = await params;
  const initialResolved = await resolveStorefrontDataAsync(storeSlug);

  return (
    <ContactClient
      storeSlug={storeSlug}
      initialResolved={initialResolved}
    />
  );
}
