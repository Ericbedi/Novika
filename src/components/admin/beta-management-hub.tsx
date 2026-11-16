"use client";

import React, { useState } from "react";
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Mail,
  Send,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  Ban,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { betaStore } from "@/server/data/beta-store";
import {
  BetaCohort,
  AccessRequest,
  StrictBetaInvitation,
  BatchValidationItem,
} from "@/server/data/beta-types";

export function BetaManagementHub() {
  const [activeTab, setActiveTab] = useState<
    "requests" | "invitations" | "activated" | "rejected" | "batch"
  >("requests");

  const [cohorts, setCohorts] = useState<BetaCohort[]>(betaStore.getCohorts());
  const [requests, setRequests] = useState<AccessRequest[]>(betaStore.getRequests());
  const [invitations, setInvitations] = useState<StrictBetaInvitation[]>(betaStore.getInvitations());
  const [selectedCohortId, setSelectedCohortId] = useState<string>("cohort_1");

  // Lot d'adresses
  const [batchRawText, setBatchRawText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = (requestId: string) => {
    const res = betaStore.approveRequest(requestId, selectedCohortId);
    if (!res.success) {
      showToast(res.error || "Erreur lors de l'approbation.");
      return;
    }
    setRequests([...betaStore.getRequests()]);
    setInvitations([...betaStore.getInvitations()]);
    setCohorts([...betaStore.getCohorts()]);
    showToast("✓ Action exécutée avec succès. Invitation générée et envoyée par e-mail.");
  };

  const handleReject = (requestId: string) => {
    betaStore.rejectRequest(requestId);
    setRequests([...betaStore.getRequests()]);
    showToast("Demande rejetée.");
  };

  const handleResend = (invId: string) => {
    const res = betaStore.resendInvitation(invId);
    if (!res.success) {
      showToast(res.error || "Impossible de renvoyer.");
      return;
    }
    setInvitations([...betaStore.getInvitations()]);
    showToast("✓ Invitation renvoyée avec succès.");
  };

  const handleRevoke = (invId: string) => {
    betaStore.revokeInvitation(invId);
    setInvitations([...betaStore.getInvitations()]);
    showToast("Invitation révoquée.");
  };

  const handleExtend = (invId: string) => {
    betaStore.extendInvitation(invId, 7);
    setInvitations([...betaStore.getInvitations()]);
    showToast("Validité prolongée de 7 jours.");
  };

  const batchReport = betaStore.batchValidateEmails(batchRawText, selectedCohortId);

  const pendingRequests = requests.filter((r) => r.status === "verified_pending_approval");
  const activeInvitations = invitations.filter((i) => i.status === "delivered" || i.status === "sent");
  const activatedUsers = invitations.filter((i) => i.status === "activated");
  const rejectedOrBounced = [
    ...requests.filter((r) => r.status === "rejected"),
    ...invitations.filter((i) => i.status === "bounced" || i.status === "revoked" || i.status === "expired"),
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold shadow-lg animate-in fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Jauges de capacité des cohortes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cohorts.map((cohort) => {
          const pct = Math.round((cohort.currentCount / cohort.maxCapacity) * 100);
          const isFull = cohort.currentCount >= cohort.maxCapacity;

          return (
            <div
              key={cohort.id}
              className={cn(
                "p-4 rounded-2xl border transition-all",
                isFull
                  ? "bg-red-50/50 border-red-200"
                  : cohort.currentCount >= cohort.maxCapacity - 3
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-white border-black/[0.08] shadow-2xs"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-black text-xs text-[#111111]">{cohort.name}</h3>
                  <span className="text-[10px] text-[#888880]">
                    Plafond strict : {cohort.maxCapacity} vendeurs
                  </span>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                    isFull
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-[#22C55E]/10 text-[#16A34A] border-[#22C55E]/20"
                  )}
                >
                  {cohort.currentCount} / {cohort.maxCapacity} inscrits ({pct}%)
                </span>
              </div>

              {/* Jauge de progression */}
              <div className="h-2 w-full rounded-full bg-black/[0.04] overflow-hidden mb-2">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isFull ? "bg-red-600" : pct >= 90 ? "bg-amber-500" : "bg-[#22C55E]"
                  )}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#666660]">
                <span>
                  Places disponibles :{" "}
                  <strong className="text-[#111111]">{Math.max(0, cohort.maxCapacity - cohort.currentCount)}</strong>
                </span>
                <span>
                  {isFull
                    ? "⚠️ Cohorte pleine · Approbation bloquée"
                    : `Fin de cohorte : ${new Date(cohort.endDate).toLocaleDateString("fr-FR")}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Onglets principaux */}
      <div className="flex border-b border-black/[0.08] gap-2 text-xs font-bold overflow-x-auto pb-0.5">
        <button
          type="button"
          id="tab-beta-requests"
          onClick={() => setActiveTab("requests")}
          className={cn(
            "pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
            activeTab === "requests"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#888880] hover:text-[#111111]"
          )}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Demandes vérifiées ({pendingRequests.length})</span>
        </button>

        <button
          type="button"
          id="tab-beta-invitations"
          onClick={() => setActiveTab("invitations")}
          className={cn(
            "pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
            activeTab === "invitations"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#888880] hover:text-[#111111]"
          )}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Invitations actives ({activeInvitations.length})</span>
        </button>

        <button
          type="button"
          id="tab-beta-activated"
          onClick={() => setActiveTab("activated")}
          className={cn(
            "pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
            activeTab === "activated"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#888880] hover:text-[#111111]"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Vendeurs activés ({activatedUsers.length})</span>
        </button>

        <button
          type="button"
          id="tab-beta-rejected"
          onClick={() => setActiveTab("rejected")}
          className={cn(
            "pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
            activeTab === "rejected"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#888880] hover:text-[#111111]"
          )}
        >
          <Ban className="h-3.5 w-3.5" />
          <span>Rejetés & Rebonds ({rejectedOrBounced.length})</span>
        </button>

        <button
          type="button"
          id="tab-beta-batch"
          onClick={() => setActiveTab("batch")}
          className={cn(
            "pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
            activeTab === "batch"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#888880] hover:text-[#111111]"
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Envoi par lot (jusqu'à 50)</span>
        </button>
      </div>

      {/* 1. ONGLET DEMANDES VÉRIFIÉES */}
      {activeTab === "requests" && (
        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-black/[0.06] flex items-center justify-between bg-[#FAF8F5]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              File d'approbation (Adresses avec OTP confirmé)
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#888880]">Cohorte cible :</span>
              <select
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(e.target.value)}
                className="p-1 rounded-lg border border-black/[0.1] bg-white font-bold text-xs"
              >
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.maxCapacity - c.currentCount} places)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#888880]">
                Aucune demande en attente d'approbation.
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#111111]">{req.fullName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/10 text-[#16A34A]">
                        ✓ OTP boîte validé
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666660] mt-0.5">
                      {req.originalEmail} · {req.whatsapp} · Pays : {req.country}
                    </p>
                    <p className="text-[10px] text-[#888880] mt-0.5">
                      {req.productType} · Volume estimé : {req.monthlyOrdersEstimated} cdes/mois
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      className="px-3 py-1.5 rounded-lg border border-black/[0.1] text-xs font-bold text-[#888880] hover:text-[#DC2626] hover:bg-red-50 cursor-pointer"
                    >
                      Rejeter
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(req.id)}
                      className="px-4 py-1.5 rounded-lg bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
                      <span>Approuver & Inviter</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. ONGLET INVITATIONS ACTIVES */}
      {activeTab === "invitations" && (
        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-black/[0.06] bg-[#FAF8F5]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Invitations distribuées (En attente d'activation par l'invité)
            </span>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {activeInvitations.map((inv) => (
              <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[#111111]">
                      {inv.fullName || inv.originalEmail}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {inv.status === "delivered" ? "E-mail Livré" : "En cours d'envoi"}
                    </span>
                    <span className="text-[10px] text-[#888880]">
                      ({inv.resendCount}/3 renvois)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#666660] mt-0.5">
                    {inv.originalEmail} · Expire le {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                  </p>
                  <p className="text-[10px] text-[#888880] mt-0.5">
                    Jeton sécurisé : <code className="bg-black/[0.04] px-1.5 py-0.5 rounded">{inv.tokenHash}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtend(inv.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-black/[0.1] text-[11px] font-bold hover:bg-black/[0.04] cursor-pointer"
                  >
                    +7 jours
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResend(inv.id)}
                    disabled={inv.resendCount >= 3}
                    className="px-3 py-1.5 rounded-lg border border-black/[0.1] text-[11px] font-bold text-[#C2410C] hover:bg-[#C2410C]/5 disabled:opacity-40 cursor-pointer"
                  >
                    Renvoyer ({3 - inv.resendCount} restants)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevoke(inv.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-black/[0.1] text-[11px] font-bold text-[#DC2626] hover:bg-red-50 cursor-pointer"
                  >
                    Révoquer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ONGLET VENDEURS ACTIVÉS */}
      {activeTab === "activated" && (
        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-black/[0.06] bg-[#FAF8F5]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Vendeurs ayant finalisé leur inscription
            </span>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {activatedUsers.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-sm text-[#111111]">{inv.fullName}</span>
                  <p className="text-[11px] text-[#666660]">
                    {inv.originalEmail} · Activé le {new Date(inv.activatedAt || "").toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/10 text-[#16A34A] border border-[#22C55E]/20">
                  Compte Actif · Vendeur Bêta
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ONGLET REJETÉS & REBONDS */}
      {activeTab === "rejected" && (
        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-black/[0.06] bg-[#FAF8F5]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Rejets, Adresses introuvables & Expirations
            </span>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {rejectedOrBounced.map((item: any) => (
              <div key={item.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-sm text-[#111111]">
                    {item.fullName || item.originalEmail}
                  </span>
                  <p className="text-[11px] text-[#DC2626] mt-0.5">
                    {item.bounceReason || item.rejectedReason || "Demande refusée ou expirée"}
                  </p>
                  <p className="text-[10px] text-[#888880] mt-0.5">{item.originalEmail}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                  {item.status === "bounced" ? "Adresse introuvable" : "Rejeté / Inactif"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ONGLET ENVOI PAR LOT (JUSQU'À 50) */}
      {activeTab === "batch" && (
        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Envoi direct d'invitations par lot
            </h3>
            <p className="text-xs text-[#666660] mt-0.5">
              Collez jusqu'à 50 adresses (une par ligne). Pré-validation en direct (détection des jetables, doublons et fautes).
            </p>
          </div>

          <div>
            <textarea
              id="batch-emails-textarea"
              rows={5}
              value={batchRawText}
              onChange={(e) => setBatchRawText(e.target.value)}
              placeholder="vendeur1@gmail.com&#10;Koffi;koffi@yahoo.fr;TG&#10;Awa;awa@boutique.ci;CI"
              className="w-full p-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-mono focus:bg-white focus:outline-hidden focus:border-black"
            />
          </div>

          {/* Rapport de pré-validation en direct */}
          {batchRawText.trim().length > 0 && (
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-black/[0.08] space-y-3">
              <span className="text-xs font-bold text-[#111111] block">
                Rapport de pré-validation en direct
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-black/[0.06]">
                  <span className="text-[10px] text-[#888880] block">Adresses Valides</span>
                  <span className="font-black text-[#16A34A] text-sm">
                    {batchReport.summary.validCount}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-black/[0.06]">
                  <span className="text-[10px] text-[#888880] block">Doublons Rejetés</span>
                  <span className="font-black text-amber-600 text-sm">
                    {batchReport.summary.duplicateCount}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-black/[0.06]">
                  <span className="text-[10px] text-[#888880] block">E-mails Jetables Rejetés</span>
                  <span className="font-black text-[#DC2626] text-sm">
                    {batchReport.summary.disposableCount}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-black/[0.06]">
                  <span className="text-[10px] text-[#888880] block">Suggestions Typo</span>
                  <span className="font-black text-[#C2410C] text-sm">
                    {batchReport.summary.typoCount}
                  </span>
                </div>
              </div>

              {/* Détail ligne par ligne */}
              <div className="max-h-40 overflow-y-auto space-y-1 text-[11px] pt-1">
                {batchReport.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-2 rounded-lg border flex items-center justify-between",
                      item.isValid
                        ? "bg-white border-black/[0.06] text-[#111111]"
                        : "bg-red-50/50 border-red-200 text-red-900"
                    )}
                  >
                    <span>{item.email}</span>
                    {item.isValid ? (
                      <span className="text-[#16A34A] font-bold">✓ Prêt à envoyer</span>
                    ) : (
                      <span className="text-[#DC2626] font-medium">{item.error}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  id="confirm-batch-send-btn"
                  disabled={!batchReport.summary.canProceed}
                  onClick={() => {
                    showToast(`✓ ${batchReport.summary.validCount} invitations envoyées avec succès.`);
                    setBatchRawText("");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  Confirmer et envoyer {batchReport.summary.validCount} invitations
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
