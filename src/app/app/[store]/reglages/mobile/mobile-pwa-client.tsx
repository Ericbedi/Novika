"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
  Database,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Download,
  Layers,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  getOfflineQueue,
  enqueueOfflineAction,
  syncOfflineQueueWithServer,
} from "@/lib/offline-sync";
import { OfflineAction } from "@/server/data/vague1-types";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { cn } from "@/lib/utils";

interface MobilePwaClientProps {
  storeSlug: string;
}

export function MobilePwaClient({ storeSlug }: MobilePwaClientProps) {
  const [isLowDataMode, setIsLowDataMode] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    setOfflineQueue(getOfflineQueue());
    const storedLowData = window.localStorage.getItem("afribuilder_low_data_mode") === "true";
    setIsLowDataMode(storedLowData);
  }, []);

  const toggleLowDataMode = (enabled: boolean) => {
    setIsLowDataMode(enabled);
    window.localStorage.setItem("afribuilder_low_data_mode", String(enabled));
  };

  const handleSimulateOfflineDelivery = () => {
    const action = enqueueOfflineAction({
      storeId: storeSlug,
      userId: "usr_rider_01",
      actionType: "mark_delivered",
      payload: {
        orderId: "ord_demo_offline",
        orderNumber: "CMD-OFFLINE-001",
        proofType: "code",
        codeEntered: "4821",
        amountCollected: 26900,
      },
    });

    setOfflineQueue(getOfflineQueue());
    setSyncFeedback(`Action locale #${action.id.slice(-4)} ajoutée en file d'attente (horodatage client conservé).`);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    // Simulation de réconciliation avec le serveur
    const result = await syncOfflineQueueWithServer(
      MOCK_ORDERS.map((o) => ({ id: o.id, status: o.status, updatedAt: o.updatedAt }))
    );

    setIsSyncing(false);
    setOfflineQueue(getOfflineQueue());

    if (result.syncedCount > 0) {
      setSyncFeedback(
        `✓ ${result.syncedCount} action(s) synchronisée(s) avec succès avec le serveur ! Conflits ignorés : ${result.conflictCount}.`
      );
    } else if (result.conflictCount > 0) {
      setSyncFeedback(
        `Aucune action rejouée : ${result.conflictCount} action(s) déjà traitée(s) côté serveur (protection anti-rejeu).`
      );
    } else {
      setSyncFeedback("File d'attente vide. Toutes les données sont à jour.");
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <ScrollReveal delay={0}>
        <PageHeader
          title="Application Mobile & Hors-Ligne (PWA)"
          description="Gérez le mode données réduites, la tolérance aux coupures de réseau et les notifications push."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
              PWA Prête & Compatible
            </span>
          }
        />
      </ScrollReveal>

      {syncFeedback && (
        <div className="p-4 rounded-2xl bg-[#1F3A26] text-[#FAF8F5] text-xs font-semibold flex items-center justify-between gap-3 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-[11px] text-[#FAF8F5]/70 hover:text-white"
          >
            Fermer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARTE 1 : Mode données réduites (Low-data mode) */}
        <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Zap className="h-5 w-5" />
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isLowDataMode}
                onChange={(e) => toggleLowDataMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div>
            <h3 className="text-base font-black text-[#111111]">Mode données réduites (3G / Data éco)</h3>
            <p className="text-xs text-[#666660] mt-1 leading-relaxed">
              Idéal pour les closeuses et livreurs avec des forfaits mobiles limités. Charge des images compressées légères et supprime les animations lourdes.
            </p>
          </div>

          <div className="pt-2 border-t border-black/[0.06] text-xs space-y-1.5 text-[#555550]">
            <p className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Réduction de 70% de la consommation de bande passante
            </p>
            <p className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Rendu rapide des cartes commandes même en zone rurale
            </p>
          </div>
        </div>

        {/* CARTE 2 : Notifications Push */}
        <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              <Bell className="h-5 w-5" />
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPushEnabled}
                onChange={(e) => setIsPushEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div>
            <h3 className="text-base font-black text-[#111111]">Notifications Push Instantanées</h3>
            <p className="text-xs text-[#666660] mt-1 leading-relaxed">
              Avertit immédiatement l&apos;équipe sur mobile lors d&apos;une nouvelle commande reçue, d&apos;une commande assignée ou d&apos;une relance nécessaire.
            </p>
          </div>

          <div className="pt-2 border-t border-black/[0.06] text-xs space-y-1.5 text-[#555550]">
            <p className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Alertes sonores personnalisées pour les livreurs
            </p>
            <p className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Service Worker actif et enregistré en tâche de fond
            </p>
          </div>
        </div>
      </div>

      {/* CARTE 3 : File de synchronisation hors-ligne (Tolérance aux coupures K4) */}
      <div className="rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#1F3A26] text-[#FAF8F5] flex items-center justify-center font-bold">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#111111]">
                Tolérance aux coupures & File hors-ligne (K4)
              </h3>
              <p className="text-xs text-[#666660]">
                Les actions du livreur en zone sans réseau sont conservées localement et synchronisées au retour du signal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateOfflineDelivery}
              className="px-3 py-2 rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-xs font-bold text-[#111111] hover:bg-[#162B1C] hover:text-[#FAF8F5] transition-all cursor-pointer shadow-2xs"
            >
              + Simuler livraison hors-ligne
            </button>
            <button
              type="button"
              disabled={isSyncing || offlineQueue.length === 0}
              onClick={handleSyncNow}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer",
                offlineQueue.length > 0
                  ? "bg-[#1F3A26] text-[#FAF8F5] hover:bg-[#162B1C]"
                  : "bg-black/10 text-[#888880] cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
              <span>Synchroniser ({offlineQueue.length})</span>
            </button>
          </div>
        </div>

        {/* Liste des actions en attente */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#666660]">
              Actions locales en file d&apos;attente ({offlineQueue.length})
            </span>
            <span className="text-[10px] text-[#888880] flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Résolution de conflits côté serveur & idempotence
            </span>
          </div>

          {offlineQueue.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-[#111111]">Toutes les actions sont synchronisées</p>
              <p className="text-[11px] text-[#666660]">
                Aucune commande ou action de livraison en attente dans le stockage local.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.06] border border-black/[0.08] rounded-2xl overflow-hidden bg-white">
              {offlineQueue.map((act) => (
                <div key={act.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111111]">
                        {act.actionType === "mark_delivered" ? "Déclaration de livraison" : act.actionType}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900">
                        En attente réseau
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666660] font-mono">
                      Commande #{act.payload.orderNumber} • Code OTP : {act.payload.codeEntered} • Encaissé : {act.payload.amountCollected} XOF
                    </p>
                    <p className="text-[10px] text-[#888880]">
                      Horodatage client : {new Date(act.clientTimestamp).toLocaleTimeString("fr-FR")} • Clé d&apos;idempotence : {act.idempotencyKey.slice(0, 24)}...
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-emerald-700 font-bold">Prêt pour rejeu</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
