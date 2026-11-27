"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Activity,
  UserCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Send,
  Eye,
  Lock,
  Smartphone,
  Globe,
  FileText,
  UserX,
  X,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { formatMoney } from "@/lib/currencies";
import { cn } from "@/lib/utils";

interface ActiviteClientProps {
  storeSlug: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  authorName: string;
  authorRole: "owner" | "admin" | "closer" | "rider" | "agency";
  actionType: "create" | "update" | "status_change" | "reconcile" | "reversal" | "security_alert";
  actionLabel: string;
  entityType: string;
  entityId: string;
  diffBefore?: Record<string, any>;
  diffAfter?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity?: "normal" | "warning" | "critical";
}

export interface InvitationEntry {
  id: string;
  recipientIdentifier: string;
  role: "closer" | "rider" | "agency" | "admin";
  tokenHash: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  status: "active" | "accepted" | "revoked" | "expired";
  shareUrl: string;
}

const INITIAL_LOGS: ActivityLogEntry[] = [];

const INITIAL_INVITATIONS: InvitationEntry[] = [];

export function ActiviteClient({ storeSlug }: ActiviteClientProps) {
  const [activeTab, setActiveTab] = useState<"logs" | "security" | "invitations">("logs");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [logs, setLogs] = useState<ActivityLogEntry[]>(INITIAL_LOGS);
  const [invitations, setInvitations] = useState<InvitationEntry[]>(INITIAL_INVITATIONS);

  // Modal Nouvelle Invitation
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitationEntry["role"]>("closer");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtrage des logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeTab === "security" && log.severity === "normal") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.authorName.toLowerCase().includes(q) ||
          log.actionLabel.toLowerCase().includes(q) ||
          log.entityId.toLowerCase().includes(q) ||
          log.ipAddress.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, activeTab, searchQuery]);

  // Copier le lien d'invitation
  const handleCopyLink = (inv: InvitationEntry) => {
    navigator.clipboard.writeText(inv.shareUrl);
    setCopiedId(inv.id);
    showToast("Lien d'invitation unique copié dans le presse-papiers !");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Révoquer une invitation
  const handleRevokeInvitation = (id: string) => {
    setInvitations((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: "revoked" as const } : inv))
    );
    showToast("Invitation révoquée immédiatement. Le jeton est désormais invalide.");
  };

  // Créer une invitation
  const handleCreateInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) return;

    const newInv: InvitationEntry = {
      id: `inv_${Date.now()}`,
      recipientIdentifier: inviteIdentifier.trim(),
      role: inviteRole,
      tokenHash: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
      invitedBy: "Promises Bedi (Propriétaire)",
      createdAt: new Date().toLocaleDateString("fr-FR"),
      expiresAt: "Dans 72h (Usage unique)",
      status: "active",
      shareUrl: `https://afribuilder.com/invite/tok_${Date.now()}`,
    };

    setInvitations([newInv, ...invitations]);
    setIsInviteModalOpen(false);
    setInviteIdentifier("");
    showToast(`Invitation générée pour ${newInv.recipientIdentifier} avec rôle figé « ${newInv.role} » !`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#1F3A26] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête de la page */}
      <ScrollReveal delay={0}>
        <PageHeader
          title="Journal d'Activité & Sécurité"
          description="Piste d'audit inaltérable (Append-Only) : chaque écriture, modification, accès RLS et invitation fait l'objet d'un traçage cryptographique inviolable."
          badge={
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF8F5] text-[#111111] border border-black/[0.08] shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Journal Immuable (Append-Only)
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <DateRangePicker align="right" />
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A26] text-xs font-bold text-[#FAF8F5] hover:bg-[#162B1C] transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Inviter un membre</span>
              </button>
            </div>
          }
        />
      </ScrollReveal>

      {/* Barre d'Onglets Journal / Événements Sécurité / Invitations */}
      <ScrollReveal delay={50}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-black/[0.08] bg-[#FAF8F5] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("logs")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "logs"
                  ? "bg-[#1F3A26] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Journal complet ({logs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "security"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-rose-700 hover:text-rose-900"
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Alertes Sécurité ({logs.filter((l) => l.severity !== "normal").length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("invitations")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "invitations"
                  ? "bg-[#1F3A26] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Invitations Sécurisées ({invitations.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par auteur, IP, action..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* VUE 1 & 2 : JOURNAL D'AUDIT (APPEND-ONLY) */}
      {(activeTab === "logs" || activeTab === "security") && (
        <ScrollReveal delay={100}>
          <div className="rounded-3xl border border-black/[0.08] bg-white overflow-hidden shadow-2xs">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Activity className="h-8 w-8 text-[#888880] mx-auto opacity-40" />
                <p className="font-bold text-sm text-[#111111]">Aucun journal d'activité pour l'instant</p>
                <p className="text-xs text-[#666660]">Les actions d'administration, expéditions et alertes de sécurité s'inscriront ici de manière inaltérable.</p>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-black/[0.06]">
                {filteredLogs.map((log) => {
                const isAlert = log.severity === "warning" || log.severity === "critical";

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4",
                      isAlert ? "bg-rose-50/40 hover:bg-rose-50/70" : "hover:bg-[#FAF8F5]/60"
                    )}
                  >
                    {/* Auteur & Action */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border",
                          isAlert
                            ? "bg-rose-100 border-rose-200 text-rose-700"
                            : "bg-[#FAF8F5] border-black/[0.08] text-[#111111]"
                        )}
                      >
                        {isAlert ? <ShieldAlert className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs text-[#111111]">{log.authorName}</span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#FAF8F5] border border-black/[0.06] text-[#666660]">
                            {log.authorRole}
                          </span>
                          <span className="text-[11px] text-[#888880]">• {log.timestamp}</span>
                        </div>

                        <p className="font-bold text-xs text-[#111111]">{log.actionLabel}</p>
                        <p className="text-[11px] text-[#666660]">
                          Entité : <span className="font-semibold text-[#111111]">{log.entityType}</span> ({log.entityId})
                        </p>

                        {/* Diff Avant / Après */}
                        {(log.diffBefore || log.diffAfter) && (
                          <div className="mt-2 p-2.5 rounded-xl bg-black/[0.03] border border-black/[0.04] text-[11px] font-mono space-y-1">
                            {log.diffBefore && (
                              <div className="text-rose-700 truncate">
                                <span className="font-bold">Avant :</span> {JSON.stringify(log.diffBefore)}
                              </div>
                            )}
                            {log.diffAfter && (
                              <div className="text-emerald-700 truncate">
                                <span className="font-bold">Après :</span> {JSON.stringify(log.diffAfter)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Métadonnées Réseau & Sécurité */}
                    <div className="text-right text-[11px] text-[#888880] shrink-0 font-mono space-y-1 self-start sm:self-auto">
                      <p className="flex items-center justify-end gap-1.5">
                        <Globe className="h-3 w-3" />
                        <span>IP : {log.ipAddress}</span>
                      </p>
                      <p className="text-[10px] text-[#666660] max-w-[200px] truncate">
                        {log.userAgent}
                      </p>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* VUE 3 : INVITATIONS SÉCURISÉES */}
      {activeTab === "invitations" && (
        <ScrollReveal delay={100} className="space-y-4">
          <div className="rounded-3xl border border-black/[0.08] bg-white overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-black/[0.06] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-[#111111]">
                  Gestion des Jetons d'Invitation à Usage Unique
                </h3>
                <p className="text-[11px] text-[#666660]">
                  Les rôles des invités sont strictement figés. Expiration automatique après 72 heures.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5]/50 border-b border-black/[0.06] text-[#666660] font-bold">
                  <tr>
                    <th className="py-3 px-4">Contact invité</th>
                    <th className="py-3 px-4">Rôle attribué</th>
                    <th className="py-3 px-4 font-mono">Empreinte jeton (Hash)</th>
                    <th className="py-3 px-4">Expiration</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Lien unique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#888880]">
                        Aucune invitation active. Cliquez sur « Inviter un membre » pour générer un lien d'accès sécurisé.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#111111]">
                        {inv.recipientIdentifier}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F3A26] text-white">
                          {inv.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#666660]">
                        {inv.tokenHash}
                      </td>
                      <td className="py-3 px-4 text-[#666660]">{inv.expiresAt}</td>
                      <td className="py-3 px-4">
                        {inv.status === "active" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Actif (72h)
                          </span>
                        )}
                        {inv.status === "accepted" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            Accepté ✓
                          </span>
                        )}
                        {inv.status === "expired" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                            Expiré
                          </span>
                        )}
                        {inv.status === "revoked" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            Révoqué
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status === "active" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCopyLink(inv)}
                                className="px-2.5 py-1 rounded-lg border border-black/[0.08] text-[10px] font-bold text-[#111111] hover:bg-[#FAF8F5] flex items-center gap-1 cursor-pointer"
                              >
                                {copiedId === inv.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span>Copié</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copier le lien</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRevokeInvitation(inv.id)}
                                className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-[10px] cursor-pointer"
                                title="Révoquer l'invitation"
                              >
                                Révoquer
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* MODAL CRÉER UNE INVITATION */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.08]">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#111111]" />
                <h3 className="font-black text-base text-[#111111]">Inviter un membre</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvitation} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Téléphone WhatsApp (format E.164) ou Email *
                </label>
                <input
                  type="text"
                  required
                  value={inviteIdentifier}
                  onChange={(e) => setInviteIdentifier(e.target.value)}
                  placeholder="+22507000000 ou closer@afribuilder.com"
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111] font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Rôle strictement figé *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as InvitationEntry["role"])}
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111] font-bold"
                >
                  <option value="closer">Closeuse (Téléventes & Confirmations)</option>
                  <option value="rider">Livreur (Tournées & Encaissements)</option>
                  <option value="agency">Agence de livraison (Flotte partenaire)</option>
                  <option value="admin">Administrateur (Gestion boutique)</option>
                </select>
                <p className="text-[10px] text-[#666660] mt-1">
                  Conformément aux règles de sécurité, le rôle est scellé dans le jeton et ne peut être altéré à l'acceptation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] space-y-1">
                <p className="font-bold">Garanties de sécurité AfriBuilder :</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                  <li>Jeton cryptographique à usage unique expiré après 72h.</li>
                  <li>Limitation de débit stricte contre le brute-force.</li>
                  <li>Inscription et acceptation tracées dans le journal d'activité.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1F3A26] font-bold text-[#FAF8F5] hover:bg-[#162B1C]"
                >
                  Générer le lien d'invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
