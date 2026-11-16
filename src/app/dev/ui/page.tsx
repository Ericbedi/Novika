import { Inbox, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CountryChip, InitialsAvatar, Panel, ProductThumb } from "@/components/app/bits";
import { EmptyState } from "@/components/app/empty-state";
import { KpiCard } from "@/components/app/kpi-card";
import { Money } from "@/components/app/money";
import { PhoneActions } from "@/components/app/phone-actions";
import { StatusBadge } from "@/components/app/status-badge";
import { MeterList } from "@/components/charts/meter-list";
import { Button } from "@/components/ui/button";
import { ORDER_STATUSES } from "@/server/data/types";

export const metadata = { title: "Composants" };

/** Catalogue des composants (revue visuelle de la phase 1). */
export default async function DevUiPage() {
  const t = await getTranslations("devUi");
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <Panel title="Statuts de commande">
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Panel>
      <Panel title="Boutons">
        <div className="flex flex-wrap gap-2">
          <Button>Principal</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="outline">Contour</Button>
          <Button variant="ghost">Discret</Button>
          <Button variant="destructive">Danger</Button>
          <Button size="lg">Grand (44 px)</Button>
        </div>
      </Panel>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <KpiCard label="Résultat net" icon={Wallet} value={<Money value={116802} />} hint="Encaissé − coûts − pub − dépenses" delta={{ value: 12.4, upIsGood: true, label: "vs période précédente" }} trend={[3, 5, 4, 7, 6, 9, 8]} />
        <KpiCard label="Coût par achat réel" value={<Money value={7823} />} delta={{ value: 22.1, upIsGood: false, label: "vs période précédente" }} />
      </div>
      <Panel title="Liste à barres (meter list)">
        <MeterList rows={[{ key: "a", label: "Sérum éclat", value: 164100, display: <Money value={164100} /> }, { key: "b", label: "Huile capillaire", value: 53000, display: <Money value={53000} /> }]} />
      </Panel>
      <Panel title="Contact et identité">
        <div className="flex flex-wrap items-center gap-4">
          <PhoneActions phoneE164="+22890123456" name="Ama Mensah" />
          <PhoneActions phoneE164="+22890123456" name="Ama Mensah" size="lg" />
          <CountryChip code="CI" />
          <InitialsAvatar name="Awa Koné" />
          <ProductThumb src="/demo/p_serum.svg" alt="" size={48} />
        </div>
      </Panel>
      <Panel title="État vide">
        <EmptyState icon={Inbox} title="Aucune commande ici" description="Partagez le lien de votre page produit." action={<Button>Action</Button>} />
      </Panel>
    </main>
  );
}
