import React from "react";
import { AiProductGeneratorClient } from "./ai-product-generator-client";

export const metadata = {
  title: "Générateur de fiche produit avec l'IA | Kelio",
  description: "Générateur automatique de fiches produits e-commerce COD propulsé par Gemini",
};

export default async function NewAiProductPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <AiProductGeneratorClient storeSlug={store} />;
}
