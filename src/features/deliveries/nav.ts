import { getTranslations } from "next-intl/server";

/** Onglets de la section Livraisons (les livreurs et zones sont réservés à la gestion). */
export async function deliveriesNav(slug: string, canManage: boolean) {
  const t = await getTranslations("deliveries");
  const base = `/app/${slug}/livraisons`;
  return [
    { key: "board", href: base, label: t("tabs.board") },
    ...(canManage
      ? [
          { key: "couriers", href: `${base}/livreurs`, label: t("tabs.couriers") },
          { key: "zones", href: `${base}/zones`, label: t("tabs.zones") },
        ]
      : []),
  ];
}
