"use client";

import { use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCanonicalDetailPage from "../../produits/[id]/page";

/**
 * Route historique singulière (/boutique/[store]/produit/[id]).
 * Redirige en 301 / replace vers la route canonique plurielle (/boutique/[store]/produits/[id])
 * tout en assurant un rendu transparent sans interruption.
 */
export default function LegacySingularProductPage({
  params,
}: {
  params: Promise<{ store: string; id: string }>;
}) {
  const { store, id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams?.toString() ? `?${searchParams.toString()}` : "";
    router.replace(`/boutique/${store}/produits/${id}${qs}`);
  }, [store, id, router, searchParams]);

  return <ProductCanonicalDetailPage params={params} />;
}
