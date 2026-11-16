"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Sliders,
  Users,
  Ticket,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Plus,
  ArrowRight,
  RefreshCw,
  LogOut,
  Key,
  ShieldCheck,
  Building2,
  Clock,
  History,
} from "lucide-react";
import {
  MOCK_FEATURE_FLAGS,
  MOCK_KILL_SWITCHES,
  MOCK_BETA_INVITATIONS,
  MOCK_WAITLIST_ENTRIES,
  MOCK_AUDIT_LOGS,
  MOCK_SUPPORT_GRANTS,
} from "@/mock-data/beta-data";
import {
  PlatformFeatureFlag,
  EmergencyKillSwitches,
  BetaInvitation,
  BetaWaitlistEntry,
  PlatformAuditLogEntry,
} from "@/server/data/beta-types";
import { recordPlatformAuditEvent } from "@/lib/beta-security";
import { BetaManagementHub } from "@/components/admin/beta-management-hub";

export function PlatformAdminClient() {
  // Simulation de vérification 2FA pour l'accès super-admin
  const [is2FaVerified, setIs2FaVerified] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState<string | null>(null);

  // Données de la plateforme
  const [activeTab, setActiveTab] = useState<
    "flags" | "killswitches" | "invitations" | "waitlist" | "audit" | "beta_hub"
  >("beta_hub");

  const [flags, setFlags] = useState<PlatformFeatureFlag[]>(MOCK_FEATURE_FLAGS);
  const [killSwitches, setKillSwitches] = useState<EmergencyKillSwitches>(MOCK_KILL_SWITCHES);
  const [invitations, setInvitations] = useState<BetaInvitation[]>(MOCK_BETA_INVITATIONS);
  const [waitlist, setWaitlist] = useState<BetaWaitlistEntry[]>(MOCK_WAITLIST_ENTRIES);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditLogEntry[]>(MOCK_AUDIT_LOGS);

  // Formulaire nouvelle invitation
  const [newCode, setNewCode] = useState("");
  const [newOrgName, setNewOrgName] = useState("");
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [newDaysValid, setNewDaysValid] = useState(30);

  // Messages de retour
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleVerify2Fa = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim() === "123456" || totpCode.trim().length === 6) {
      setIs2FaVerified(true);
      setTotpError(null);
      recordPlatformAuditEvent(
        "superadmin@afribuilder.com",
        "superadmin_login_2fa_success",
        "platform_admin",
        { timestamp: new Date().toISOString() }
      );
    } else {
      setTotpError("Code à 6 chiffres incorrect. (Entrez 123456 pour la démo)");
    }
  };

  const handleToggleFlag = (flagId: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.id === flagId) {
          const nextState = !f.isEnabledGlobally;
          recordPlatformAuditEvent(
            "superadmin@afribuilder.com",
            "feature_flag_toggle",
            `feature_flags/${f.key}`,
            { flagKey: f.key, newState: nextState }
          );
          setAuditLogs([...MOCK_AUDIT_LOGS]);
          return { ...f, isEnabledGlobally: nextState, updatedAt: new Date().toISOString() };
        }
        return f;
      })
    );
    setActionSuccess("Interrupteur de fonctionnalité mis à jour et consigné dans l'audit.");
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleToggleKillSwitch = (key: "maintenanceMode" | "blockSignups" | "blockOrders") => {
    const nextVal = !killSwitches[key];
    const updated = {
      ...killSwitches,
      [key]: nextVal,
      lastUpdated: new Date().toISOString(),
    };
    setKillSwitches(updated);
    recordPlatformAuditEvent(
      "superadmin@afribuilder.com",
      "emergency_kill_switch_toggle",
      `kill_switches/${key}`,
      { switch: key, active: nextVal }
    );
    setAuditLogs([...MOCK_AUDIT_LOGS]);
    setActionSuccess(`Coupe-circuit ${key} ${nextVal ? "ACTIVÉ" : "DÉSACTIVÉ"}.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleCreateInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + newDaysValid);

    const created: BetaInvitation = {
      id: "inv-" + Date.now(),
      code: newCode.trim().toUpperCase(),
      organizationName: newOrgName.trim() || undefined,
      maxUses: Number(newMaxUses) || 1,
      timesUsed: 0,
      expiresAt: expiresDate.toISOString(),
      isActive: true,
      createdBy: "superadmin@afribuilder.com",
      createdAt: new Date().toISOString(),
    };

    setInvitations([created, ...invitations]);
    recordPlatformAuditEvent(
      "superadmin@afribuilder.com",
      "invitation_created",
      `beta_invitations/${created.code}`,
      { code: created.code, maxUses: created.maxUses }
    );
    setAuditLogs([...MOCK_AUDIT_LOGS]);
    setNewCode("");
    setNewOrgName("");
    setActionSuccess(`Code ${created.code} créé avec succès.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleInviteWaitlistUser = (entry: BetaWaitlistEntry) => {
    setWaitlist((prev) =>
      prev.map((w) => (w.id === entry.id ? { ...w, status: "invited" } : w))
    );
    // Génération automatique d'un code d'invitation dédié
    const autoCode = `BETA-${entry.country}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + 14);

    const created: BetaInvitation = {
      id: "inv-" + Date.now(),
      code: autoCode,
      organizationName: entry.fullName,
      recipientEmail: entry.email,
      maxUses: 1,
      timesUsed: 0,
      expiresAt: expiresDate.toISOString(),
      isActive: true,
      createdBy: "superadmin@afribuilder.com",
      createdAt: new Date().toISOString(),
    };
    setInvitations([created, ...invitations]);
    recordPlatformAuditEvent(
      "superadmin@afribuilder.com",
      "waitlist_invited",
      `beta_waitlist/${entry.id}`,
      { email: entry.email, generatedCode: autoCode }
    );
    setAuditLogs([...MOCK_AUDIT_LOGS]);
    setActionSuccess(`Invitation envoyée à ${entry.fullName} (Code : ${autoCode}).`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Écran d'authentification 2FA Super-Admin
  if (!is2FaVerified) {
    return (
      <div className="min-h-screen bg-[#111111] text-[#FAF8F5] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-[#1C1C1E] border border-white/10 p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#C2410C]/20 text-[#C2410C] flex items-center justify-center font-black">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">AfriBuilder Platform Admin</h1>
              <p className="text-xs text-[#888880]">Authentification Super-Admin requise</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-xs text-[#AAAAAA] flex items-start gap-2.5">
            <Key className="h-4 w-4 text-[#C2410C] shrink-0 mt-0.5" />
            <span>
              Espace réservé aux administrateurs de l'infrastructure AfriBuilder. Veuillez saisir votre code à usage unique (TOTP) à 6 chiffres.
            </span>
          </div>

          <form onSubmit={handleVerify2Fa} className="space-y-4">
            {totpError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{totpError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#AAAAAA] uppercase tracking-wider mb-1.5">
                Code Authenticator (6 chiffres)
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Ex: 123456"
                className="w-full px-4 py-3 text-center tracking-[0.4em] font-mono text-xl rounded-2xl border border-white/10 bg-black/50 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:border-[#C2410C]"
              />
              <p className="text-[10px] text-[#888880] mt-1 text-center">
                (Code de démonstration sécurisé : 123456)
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs transition-colors shadow-lg cursor-pointer"
            >
              Vérifier et Déverrouiller
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/app/lome-glow"
              className="text-xs text-[#888880] hover:text-white transition-colors"
            >
              ← Retour au tableau de bord boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111111] pb-16">
      {/* Barre supérieure Super-Admin */}
      <header className="sticky top-0 z-40 bg-[#111111] text-[#FAF8F5] px-6 py-4 flex items-center justify-between border-b border-black">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[#C2410C] text-white flex items-center justify-center font-black text-sm">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight">AfriBuilder Platform Admin</span>
              <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800">
                Super Admin
              </span>
            </div>
            <span className="text-[10px] text-[#888880]">
              Connecté : superadmin@afribuilder.com (2FA Actif)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/lome-glow"
            className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
          >
            Vue Boutique
          </Link>
          <button
            type="button"
            onClick={() => setIs2FaVerified(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Verrouiller</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Bannière de confirmation */}
        {actionSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Navigation Onglets */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/[0.04] border border-black/[0.06] w-fit">
          <button
            type="button"
            id="tab-btn-beta-hub"
            onClick={() => setActiveTab("beta_hub")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "beta_hub"
                ? "bg-[#C2410C] text-white shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Bêta-testeurs & Approbations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("flags")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "flags"
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Interrupteurs de Fonctions ({flags.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("killswitches")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "killswitches"
                ? "bg-rose-700 text-white shadow-xs"
                : "text-rose-800 hover:text-rose-950"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Coupe-Circuits d'Urgence</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invitations")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "invitations"
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            <Ticket className="h-3.5 w-3.5" />
            <span>Invitations Bêta ({invitations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("waitlist")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "waitlist"
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Liste d'Attente ({waitlist.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Journal d'Audit ({auditLogs.length})</span>
          </button>
        </div>

        {/* 0. ONGLET BÊTA HUB (GESTION APPROBATION STRICTE) */}
        {activeTab === "beta_hub" && (
          <BetaManagementHub />
        )}

        {/* 1. ONGLET FEATURE FLAGS */}
        {activeTab === "flags" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-[#111111]">
                  Gestion des Déploiements & Interrupteurs (Server-Side Feature Flags)
                </h2>
                <p className="text-xs text-[#666660]">
                  Les modifications sont appliquées instantanément côté serveur sans redéploiement d'application.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2410C] bg-orange-50 px-2 py-0.5 rounded-full">
                        {flag.category}
                      </span>
                      <span className="font-mono text-[10px] text-[#888880]">
                        {flag.key}
                      </span>
                    </div>
                    <h3 className="text-xs font-black text-[#111111] leading-tight">
                      {flag.name}
                    </h3>
                    <p className="text-xs text-[#666660] leading-relaxed">
                      {flag.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
                    <div className="text-[11px] text-[#666660]">
                      Statut :{" "}
                      <strong
                        className={
                          flag.isEnabledGlobally ? "text-emerald-700" : "text-[#888880]"
                        }
                      >
                        {flag.isEnabledGlobally ? "Activé Globalement (100%)" : "Inactif Globalement"}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFlag(flag.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        flag.isEnabledGlobally
                          ? "bg-emerald-700 text-white hover:bg-emerald-800"
                          : "bg-black/10 text-[#333333] hover:bg-black/20"
                      }`}
                    >
                      {flag.isEnabledGlobally ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. ONGLET COUPE-CIRCUITS D'URGENCE (KILL SWITCHES) */}
        {activeTab === "killswitches" && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-rose-700" />
                <h2 className="text-sm font-black">Interrupteurs d'Urgence Immédiate (Kill Switches)</h2>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">
                Utilisez ces commandes pour isoler un incident de sécurité ou protéger la plateforme en cas de défaillance majeure de passerelle de paiement ou attaque DDoS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Mode Maintenance */}
              <div className="p-6 rounded-3xl bg-white border border-black/[0.08] space-y-4 shadow-sm">
                <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#111111]">Mode Maintenance Globale</h3>
                  <p className="text-xs text-[#666660] mt-1 leading-relaxed">
                    Affiche une page de maintenance sur l'ensemble des vitrines et bloque les connexions vendeurs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleKillSwitch("maintenanceMode")}
                  className={`w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    killSwitches.maintenanceMode
                      ? "bg-rose-700 text-white animate-pulse"
                      : "bg-black/10 text-[#111111] hover:bg-black/15"
                  }`}
                >
                  {killSwitches.maintenanceMode ? "MAINTENANCE ACTIVE (DÉSACTIVER)" : "Activer la Maintenance"}
                </button>
              </div>

              {/* Blocage des Inscriptions */}
              <div className="p-6 rounded-3xl bg-white border border-black/[0.08] space-y-4 shadow-sm">
                <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#111111]">Bloquer les Inscriptions</h3>
                  <p className="text-xs text-[#666660] mt-1 leading-relaxed">
                    Refuse toute nouvelle inscription de boutique, y compris avec un code d'invitation valide.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleKillSwitch("blockSignups")}
                  className={`w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    killSwitches.blockSignups
                      ? "bg-amber-600 text-white"
                      : "bg-black/10 text-[#111111] hover:bg-black/15"
                  }`}
                >
                  {killSwitches.blockSignups ? "INSCRIPTIONS BLOQUÉES (DÉBLOQUER)" : "Bloquer les Inscriptions"}
                </button>
              </div>

              {/* Blocage des Commandes */}
              <div className="p-6 rounded-3xl bg-white border border-black/[0.08] space-y-4 shadow-sm">
                <div className="h-10 w-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#111111]">Suspendre les Commandes</h3>
                  <p className="text-xs text-[#666660] mt-1 leading-relaxed">
                    Désactive temporairement le formulaire de commande sur toutes les boutiques de la plateforme.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleKillSwitch("blockOrders")}
                  className={`w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    killSwitches.blockOrders
                      ? "bg-red-700 text-white"
                      : "bg-black/10 text-[#111111] hover:bg-black/15"
                  }`}
                >
                  {killSwitches.blockOrders ? "COMMANDES SUSPENDUES (RÉACTIVER)" : "Suspendre les Commandes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. ONGLET INVITATIONS BÊTA */}
        {activeTab === "invitations" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-black/[0.08] space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-[#111111] uppercase tracking-wider pb-2 border-b border-black/[0.06]">
                Générer un Code d'Invitation Bêta
              </h3>
              <form onSubmit={handleCreateInvitation} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Code d'accès <span className="text-[#C2410C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="Ex: VIP-DAKAR-2026"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Bénéficiaire / Organisation (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Ex: Dakar Prestige Cosmétiques"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Nombre d'utilisations max
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={newMaxUses}
                      onChange={(e) => setNewMaxUses(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Validité (Jours)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={newDaysValid}
                      onChange={(e) => setNewDaysValid(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#C2410C] text-white text-xs font-bold hover:bg-[#9A3412] transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Créer le code d'invitation</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-black/[0.08] space-y-3 shadow-sm">
              <h3 className="text-xs font-black text-[#111111] uppercase tracking-wider pb-2 border-b border-black/[0.06]">
                Codes d'Invitation Actifs ({invitations.length})
              </h3>

              <div className="space-y-2">
                {invitations.map((inv) => {
                  const isExpired = new Date(inv.expiresAt).getTime() < Date.now();
                  const isFull = inv.timesUsed >= inv.maxUses;
                  const isValid = inv.isActive && !isExpired && !isFull;

                  return (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl border border-black/[0.08] flex items-center justify-between gap-3 text-xs bg-[#FAF8F5]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-sm text-[#111111]">
                            {inv.code}
                          </code>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                              isValid
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-black/[0.06] text-[#888880]"
                            }`}
                          >
                            {isValid ? "Valide" : isExpired ? "Expiré" : "Épuisé"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#666660] mt-0.5">
                          {inv.organizationName || "Tout vendeur"} · Utilisé {inv.timesUsed}/{inv.maxUses} fois
                        </p>
                      </div>

                      <div className="text-right text-[10px] text-[#888880]">
                        Expire le : {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. ONGLET LISTE D'ATTENTE */}
        {activeTab === "waitlist" && (
          <div className="p-5 rounded-2xl bg-white border border-black/[0.08] space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
              <h3 className="text-xs font-black text-[#111111] uppercase tracking-wider">
                Candidats inscrits sur liste d'attente ({waitlist.length})
              </h3>
              <span className="text-xs text-[#666660]">
                {waitlist.filter((w) => w.status === "pending").length} en attente d'invitation
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/[0.08] text-[10px] uppercase font-bold text-[#888880]">
                    <th className="py-2.5">Nom & Contact</th>
                    <th>Pays</th>
                    <th>Secteur</th>
                    <th>Volume estimé</th>
                    <th>Date d'inscription</th>
                    <th>Statut</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {waitlist.map((entry) => (
                    <tr key={entry.id} className="hover:bg-black/[0.02]">
                      <td className="py-3">
                        <span className="font-bold text-[#111111] block">{entry.fullName}</span>
                        <span className="text-[11px] text-[#666660] font-mono">{entry.phone} · {entry.email}</span>
                      </td>
                      <td>
                        <span className="font-bold">{entry.country}</span>
                      </td>
                      <td className="capitalize">{entry.businessType}</td>
                      <td>{entry.monthlyOrdersEstimated} cmd/mois</td>
                      <td className="text-[11px] text-[#888880]">
                        {new Date(entry.appliedAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            entry.status === "invited"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {entry.status === "invited" ? "Invité" : "En attente"}
                        </span>
                      </td>
                      <td className="text-right">
                        {entry.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleInviteWaitlistUser(entry)}
                            className="px-3 py-1.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                          >
                            Inviter & Générer Code
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. ONGLET JOURNAL D'AUDIT */}
        {activeTab === "audit" && (
          <div className="p-5 rounded-2xl bg-white border border-black/[0.08] space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
              <h3 className="text-xs font-black text-[#111111] uppercase tracking-wider">
                Journal d'Audit Immuable de la Plateforme (Sans PII)
              </h3>
              <span className="text-xs text-[#666660]">
                {auditLogs.length} événements enregistrés
              </span>
            </div>

            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-black/[0.08] flex items-start justify-between gap-3 text-xs bg-[#FAF8F5]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#111111]">
                        {log.action}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/[0.06] text-[#666660]">
                        {log.targetResource}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666660]">
                      Opérateur : <strong>{log.actorEmail}</strong>
                    </p>
                    <pre className="text-[10px] text-[#555550] bg-white p-2 rounded border border-black/[0.06] font-mono overflow-x-auto">
                      {JSON.stringify(log.details)}
                    </pre>
                  </div>

                  <span className="text-[10px] text-[#888880] shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
