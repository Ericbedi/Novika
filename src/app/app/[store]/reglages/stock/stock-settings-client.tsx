"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  Eye,
  EyeOff,
  Clock,
  PhoneCall,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  History,
  Lock,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { useApp } from "@/components/layout/app-shell";
import { canManageStockSettings } from "@/config/permissions";
import {
  getStockSettings,
  updateStockSettings,
  getStockAuditLogs,
  StockAuditLog,
} from "@/lib/stock-settings-store";
import {
  OutOfStockVisibilityOption,
  StockReservationTimingOption,
  StoreStockSettings,
} from "@/server/data/types";
import { cn } from "@/lib/utils";

interface StockSettingsClientProps {
  storeSlug: string;
}

export function StockSettingsClient({ storeSlug }: StockSettingsClientProps) {
  const { activeRole, activeStore } = useApp();
  const isAuthorized = canManageStockSettings(activeRole);

  const [settings, setSettings] = useState<StoreStockSettings>(() =>
    getStockSettings(storeSlug)
  );

  const [outOfStockVisibility, setOutOfStockVisibility] =
    useState<OutOfStockVisibilityOption>(settings.outOfStockVisibility);
  const [reservationTiming, setReservationTiming] =
    useState<StockReservationTimingOption>(settings.reservationTiming);
  const [reservationTimeoutHours, setReservationTimeoutHours] = useState<number>(
    settings.reservationTimeoutHours || 48
  );

  const [auditLogs, setAuditLogs] = useState<StockAuditLog[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loaded = getStockSettings(storeSlug);
    setSettings(loaded);
    setOutOfStockVisibility(loaded.outOfStockVisibility);
    setReservationTiming(loaded.reservationTiming);
    setReservationTimeoutHours(loaded.reservationTimeoutHours || 48);
    setAuditLogs(getStockAuditLogs(storeSlug));
  }, [storeSlug]);

  useEffect(() => {
    const changed =
      outOfStockVisibility !== settings.outOfStockVisibility ||
      reservationTiming !== settings.reservationTiming ||
      reservationTimeoutHours !== settings.reservationTimeoutHours;
    setHasChanges(changed);
  }, [outOfStockVisibility, reservationTiming, reservationTimeoutHours, settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenConfirm = () => {
    if (!isAuthorized) {
      alert("Action non autorisée. Seuls les administrateurs et propriétaires peuvent modifier ces réglages.");
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = () => {
    const result = updateStockSettings(
      storeSlug,
      {
        outOfStockVisibility,
        reservationTiming,
        reservationTimeoutHours: Number(reservationTimeoutHours) || 48,
      },
      {
        role: activeRole,
        name: activeRole === "owner" ? "Directeur Propriétaire" : "Administrateur",
      }
    );

    if (result.success) {
      setSettings(result.settings);
      setAuditLogs(getStockAuditLogs(storeSlug));
      setIsConfirmModalOpen(false);
      setHasChanges(false);
      showToast("Réglages de stock enregistrés avec succès !");
    } else {
      alert(result.error || "Erreur lors de l'enregistrement des réglages.");
      setIsConfirmModalOpen(false);
    }
  };

  const handleResetToDefaults = () => {
    setOutOfStockVisibility("show_badge");
    setReservationTiming("on_order_received");
    setReservationTimeoutHours(48);
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-4 shadow-2xs">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-black uppercase tracking-wider text-rose-900">
              Accès restreint aux administrateurs
            </h2>
            <p className="text-xs text-rose-800 leading-relaxed">
              Votre rôle actuel ({activeRole}) ne vous autorise pas à modifier la politique de gestion et de réservation des stocks.
              Seuls le Propriétaire de la boutique et les Administrateurs généraux peuvent configurer ces paramètres.
            </p>
          </div>
        </div>
        <Link
          href={`/app/${storeSlug}/reglages`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-black/[0.08] text-xs font-bold text-[#111111] hover:bg-[#FAF8F5]"
        >
          Retour aux réglages généraux
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Toast de confirmation */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#1F3A26] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fil d'ariane & En-tête */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[#666660]">
          <Link href={`/app/${storeSlug}/reglages`} className="hover:underline">
            Réglages
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="font-bold text-[#111111]">Gestion du stock</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight flex items-center gap-2.5">
              <Boxes className="w-6 h-6 text-[#C2410C]" />
              <span>Réglages de stock & réservations</span>
            </h1>
            <p className="text-xs text-[#666660] mt-1">
              Configurez la visibilité des produits épuisés sur la vitrine et le moment exact où le stock est réservé par vos commandes COD.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-3.5 py-2 rounded-xl border border-black/[0.1] bg-white text-xs font-bold text-[#666660] hover:bg-black/[0.04] transition-colors"
              >
                Réinitialiser
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenConfirm}
              data-testid="btn-save-stock-settings"
              disabled={!hasChanges}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer",
                hasChanges
                  ? "bg-[#C2410C] hover:bg-[#a83609] text-white active:scale-95"
                  : "bg-black/[0.08] text-[#888880] cursor-not-allowed"
              )}
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les réglages</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bannière d'information métier */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5 leading-relaxed">
          <p className="font-bold text-amber-900">
            Impact sur les nouvelles commandes uniquement
          </p>
          <p className="text-amber-800">
            Toute modification s'applique immédiatement aux futures commandes. Les commandes déjà passées et les réservations en cours restent inchangées.
          </p>
        </div>
      </div>

      {/* Grille des 2 Réglages Majeurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* =========================================================================
            RÉGLAGE 1 : PRODUITS EN RUPTURE SUR LA VITRINE
        ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-2xs space-y-2" data-testid="always-orderable-notice">
          <h2 className="text-base font-black text-emerald-950">Les clients peuvent toujours commander</h2>
          <p className="text-xs text-emerald-900 leading-relaxed">
            Même quand le stock est à 0, la fiche produit reste visible avec toutes ses images et le formulaire de commande reste actif.
            Le stock que vous saisissez sert à votre suivi : il baisse à la livraison et remonte en cas de retour.
          </p>
        </div>

        {/* =========================================================================
            RÉGLAGE 2 : MOMENT OÙ LE STOCK EST RÉSERVÉ
        ========================================================================= */}
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-2xs space-y-5">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#C2410C] bg-orange-50 px-2 py-0.5 rounded-md">
              Réglage 2 · Logistique COD
            </span>
            <h2 className="text-base font-black text-[#111111]">
              Moment où le stock est réservé
            </h2>
            <p className="text-xs text-[#666660]">
              Définissez l'étape exacte où une unité de stock est réservée pour un client.
            </p>
          </div>

          <div className="space-y-3">
            {/* Option A : À la réception de la commande */}
            <div
              onClick={() => setReservationTiming("on_order_received")}
              data-testid="option-timing-order-received"
              className={cn(
                "p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2",
                reservationTiming === "on_order_received"
                  ? "border-[#C2410C] bg-[#FFFBF7] shadow-xs"
                  : "border-black/[0.08] bg-[#FAF8F5] hover:border-black/20"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      reservationTiming === "on_order_received"
                        ? "border-[#C2410C]"
                        : "border-gray-300"
                    )}
                  >
                    {reservationTiming === "on_order_received" && (
                      <div className="w-2 h-2 rounded-full bg-[#C2410C]" />
                    )}
                  </div>
                  <span className="text-xs font-black text-[#111111] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>Option A : À la réception de la commande</span>
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Par défaut
                </span>
              </div>

              <p className="text-[11px] text-[#555550] pl-6 leading-relaxed">
                La quantité est réservée immédiatement dès que le client valide le formulaire. Verrouillage atomique en base. Libération automatique si la commande est rejetée, annulée, perdue ou non confirmée avant expiration.
              </p>

              {/* Avantages & Risques honnêtes */}
              <div className="mt-2 pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100">
                  <strong className="block text-emerald-950 mb-0.5">Avantage :</strong>
                  Garantie absolue zéro survente : deux clients simultanés sur la dernière pièce, un seul passe.
                </div>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-100">
                  <strong className="block text-amber-950 mb-0.5">Risque :</strong>
                  De fausses commandes ou clients fantômes bloquent temporairement du stock jusqu'à expiration.
                </div>
              </div>

              {/* Réglage du délai d'expiration */}
              <div className="mt-3 pl-6 pt-3 border-t border-black/[0.06] flex items-center justify-between gap-4">
                <div className="text-[11px]">
                  <span className="font-bold text-[#111111] block">
                    Durée maximale de réservation :
                  </span>
                  <span className="text-[#666660]">
                    Délai accordé à la closeuse pour confirmer avant libération du stock.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={reservationTimeoutHours}
                    onChange={(e) => setReservationTimeoutHours(Math.max(1, Math.min(168, Number(e.target.value))))}
                    className="w-16 px-2.5 py-1 text-xs font-black rounded-lg border border-black/[0.1] bg-white text-center focus:outline-none"
                  />
                  <span className="text-xs font-bold text-[#666660]">heures</span>
                </div>
              </div>
            </div>

            {/* Option B : À la confirmation par la closeuse */}
            <div
              onClick={() => setReservationTiming("on_closer_confirmation")}
              data-testid="option-timing-closer-confirmation"
              className={cn(
                "p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2",
                reservationTiming === "on_closer_confirmation"
                  ? "border-[#C2410C] bg-[#FFFBF7] shadow-xs"
                  : "border-black/[0.08] bg-[#FAF8F5] hover:border-black/20"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      reservationTiming === "on_closer_confirmation"
                        ? "border-[#C2410C]"
                        : "border-gray-300"
                    )}
                  >
                    {reservationTiming === "on_closer_confirmation" && (
                      <div className="w-2 h-2 rounded-full bg-[#C2410C]" />
                    )}
                  </div>
                  <span className="text-xs font-black text-[#111111] flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                    <span>Option B : À la confirmation par la closeuse</span>
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#555550] pl-6 leading-relaxed">
                À la réception, la commande est enregistrée sans réserver de stock. La réservation ferme s'effectue au moment où la closeuse valide l'appel téléphonique. Le stock public = stock en main moins commandes confirmées.
              </p>

              {/* Avantages & Risques honnêtes */}
              <div className="mt-2 pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100">
                  <strong className="block text-emerald-950 mb-0.5">Avantage :</strong>
                  Aucun stock gaspillé sur de fausses commandes ou des numéros injoignables.
                </div>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-100">
                  <strong className="block text-amber-950 mb-0.5">Risque :</strong>
                  Si deux commandes concurrentes sont traitées, la confirmation est refusée et bascule en « En attente de stock ».
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          APERÇU DYNAMIQUE EN TEMPS RÉEL (CLIENT & LOGISTIQUE)
      ========================================================================= */}
      <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C2410C]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#111111]">
            Aperçu dynamique de votre politique actuelle
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ce que voit le client */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-2">
            <span className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
              Expérience client vitrine
            </span>
            <div className="space-y-1.5">
              {outOfStockVisibility === "show_badge" ? (
                <>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 text-[11px] font-black border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Rupture de stock</span>
                  </div>
                  <p className="text-xs text-[#333330] leading-relaxed">
                    Le produit reste navigable partout. Les boutons "Ajouter au panier" et "Acheter maintenant" sont bloqués et désactivés avec le macaron rupture.
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-black border border-amber-200">
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Produit masqué du catalogue</span>
                  </div>
                  <p className="text-xs text-[#333330] leading-relaxed">
                    Invisible dans la recherche et les catégories. Les liens directs (ads, favoris) affichent l'écran doux « Produit indisponible pour le moment » avec d'autres suggestions et un bouton WhatsApp.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Ce qui se passe en logistique */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-2">
            <span className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
              Cycle de vie logistique
            </span>
            <div className="space-y-1.5">
              {reservationTiming === "on_order_received" ? (
                <>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-black border border-blue-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Réservation atomique immédiate ({reservationTimeoutHours}h)</span>
                  </div>
                  <p className="text-xs text-[#333330] leading-relaxed">
                    Le stock disponible diminue dès la soumission du formulaire. Si la commande n'est pas confirmée dans les {reservationTimeoutHours} heures, le stock est automatiquement réinjecté.
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 text-[11px] font-black border border-purple-200">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Réservation au téléphone</span>
                  </div>
                  <p className="text-xs text-[#333330] leading-relaxed">
                    La commande est reçue sans réservation. La closeuse verrouille le stock à la confirmation. Si rupture : la commande bascule en « En attente de stock » avec alerte sonore et WhatsApp prêt en 1 clic.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          JOURNAL D'AUDIT STRICT DES MODIFICATIONS
      ========================================================================= */}
      <div className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#666660]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#111111]">
              Journal d'audit des réglages de stock
            </h3>
          </div>
          <span className="text-[11px] text-[#888880] font-medium">
            {auditLogs.length} événement{auditLogs.length > 1 ? "s" : ""} enregistré{auditLogs.length > 1 ? "s" : ""}
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-[#888880] py-4 text-center italic">
            Aucune modification enregistrée pour le moment. Les changements futurs apparaîtront ici avec date, heure et auteur.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] text-[#888880] font-bold">
                  <th className="pb-2">Date & Heure</th>
                  <th className="pb-2">Auteur</th>
                  <th className="pb-2">Détails de l'action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {auditLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="text-[#333330]">
                    <td className="py-2.5 whitespace-nowrap text-[#666660] font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 font-bold whitespace-nowrap">
                      {log.performedBy}{" "}
                      {log.userRole && (
                        <span className="text-[10px] text-[#888880] font-normal">
                          ({log.userRole})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-[#555550]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALE DE CONFIRMATION AVANT ENREGISTREMENT (PROMPT 16-b)
      ========================================================================= */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-[#111111]">
                Confirmer la modification des réglages de stock
              </h3>
              <p className="text-xs text-[#555550] leading-relaxed">
                Vous modifiez la politique de stock pour la boutique{" "}
                <strong>{activeStore.name}</strong>. Les commandes déjà passées conservent leur réservation actuelle. Confirmer ?
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06] text-[11px] text-[#666660] space-y-1">
              <div>
                <strong>Visibilité :</strong>{" "}
                {outOfStockVisibility === "show_badge"
                  ? "Afficher avec mention Rupture (Option A)"
                  : "Masquer de la vitrine (Option B)"}
              </div>
              <div>
                <strong>Moment de réservation :</strong>{" "}
                {reservationTiming === "on_order_received"
                  ? `À la réception de la commande (Option A, expiration ${reservationTimeoutHours}h)`
                  : "À la confirmation par la closeuse (Option B)"}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-black/[0.1] bg-white text-xs font-bold text-[#666660] hover:bg-black/[0.04]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                data-testid="modal-confirm-save-stock-settings"
                className="px-5 py-2 rounded-xl bg-[#C2410C] hover:bg-[#a83609] text-white text-xs font-black shadow-xs cursor-pointer"
              >
                Confirmer et enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
