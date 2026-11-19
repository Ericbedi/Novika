"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Users,
  ShieldCheck,
  Save,
  Copy,
  Info,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DayOfWeek, DaySchedule, TeamSchedule, ScheduleScope } from "@/server/data/schedule-types";
import {
  getShopSchedules,
  saveShopSchedule,
  resetShopSchedule,
  getTeamDutyOverview,
  DEFAULT_DAY_SCHEDULES,
} from "@/mock-data/schedules";
import { MOCK_TEAM } from "@/mock-data/team";
import { canManageTeamSchedules, canActivateSunday } from "@/config/permissions";
import { UserRole } from "@/server/data/types";

interface SchedulesClientProps {
  storeSlug: string;
}

export function SchedulesClient({ storeSlug }: SchedulesClientProps) {
  // Rôle simulé de l'utilisateur actif pour les tests de permissions (par défaut owner)
  const [currentRole, setCurrentRole] = useState<UserRole>("owner");
  const [activeScope, setActiveScope] = useState<ScheduleScope>("shop");
  const [selectedRole, setSelectedRole] = useState<"closer" | "rider" | "agency">("closer");
  const [selectedMemberId, setSelectedMemberId] = useState<string>(MOCK_TEAM[0]?.id || "");

  // Horaires en cours d'édition
  const [days, setDays] = useState<DaySchedule[]>(JSON.parse(JSON.stringify(DEFAULT_DAY_SCHEDULES)));
  const [timezone, setTimezone] = useState("Africa/Lome");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isOwner = canManageTeamSchedules(currentRole);
  const sundayAllowed = canActivateSunday(currentRole);

  // Charger les données selon la portée choisie
  useEffect(() => {
    const schedules = getShopSchedules(storeSlug);
    let targetSched: TeamSchedule | undefined;

    if (activeScope === "shop") {
      targetSched = schedules.find((s) => s.scope === "shop");
    } else if (activeScope === "role") {
      targetSched = schedules.find((s) => s.scope === "role" && s.role === selectedRole);
    } else if (activeScope === "member") {
      targetSched = schedules.find((s) => s.scope === "member" && s.memberId === selectedMemberId);
    }

    if (targetSched) {
      setDays(JSON.parse(JSON.stringify(targetSched.days)));
      setTimezone(targetSched.timezone || (storeSlug.includes("abidjan") ? "Africa/Abidjan" : "Africa/Lome"));
    } else {
      // Hériter du niveau boutique
      const shopSched = schedules.find((s) => s.scope === "shop");
      setDays(JSON.parse(JSON.stringify(shopSched?.days || DEFAULT_DAY_SCHEDULES)));
    }
  }, [storeSlug, activeScope, selectedRole, selectedMemberId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleDay = (dayOfWeek: DayOfWeek) => {
    if (!isOwner) {
      showToast("Accès refusé : Seul le propriétaire peut modifier les horaires.");
      return;
    }
    if (dayOfWeek === 7 && !sundayAllowed) {
      showToast("Seul l'Admin propriétaire (owner) peut activer le dimanche.");
      return;
    }

    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isWorking: !d.isWorking } : d))
    );
  };

  const handleTimeChange = (dayOfWeek: DayOfWeek, field: "startTime" | "endTime", value: string) => {
    if (!isOwner) return;
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
  };

  const handleApplyToAllWorkingDays = () => {
    if (!isOwner) return;
    const monday = days.find((d) => d.dayOfWeek === 1);
    if (!monday) return;

    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === 7 && !d.isWorking
          ? d // Laisser le dimanche intact s'il est désactivé
          : { ...d, startTime: monday.startTime, endTime: monday.endTime }
      )
    );
    showToast(`Horaires de lundi (${monday.startTime} - ${monday.endTime}) appliqués à tous les jours ouvrés.`);
  };

  const handleResetToFactoryDefaults = () => {
    if (!isOwner) {
      showToast("Seul le propriétaire peut réinitialiser les horaires.");
      return;
    }
    const reset = resetShopSchedule(
      storeSlug,
      activeScope,
      activeScope === "role" ? selectedRole : activeScope === "member" ? selectedMemberId : undefined
    );
    setDays(JSON.parse(JSON.stringify(reset.days)));
    showToast("Horaires réinitialisés aux valeurs Novika par défaut : 07:00 → 18:00 (lun–sam, dimanche désactivé).");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      showToast("Modification refusée : droit insuffisant.");
      return;
    }

    const payload: TeamSchedule = {
      id: `sched_${storeSlug}_${activeScope}_${Date.now()}`,
      shopId: storeSlug,
      scope: activeScope,
      role: activeScope === "role" ? selectedRole : undefined,
      memberId: activeScope === "member" ? selectedMemberId : undefined,
      days,
      timezone,
      updatedBy: "Promises Bedi (Propriétaire)",
      updatedAt: new Date().toISOString(),
    };

    saveShopSchedule(payload);
    showToast("Horaires d'équipe enregistrés avec succès !");
  };

  const dutyOverview = getTeamDutyOverview(storeSlug);

  return (
    <div className="space-y-6">
      {/* Toast de confirmation */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold shadow-lg animate-in fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête et sélecteur de rôle de test */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#888880] mb-1">
            <Link href={`/app/${storeSlug}/reglages`} className="hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              <span>Paramètres</span>
            </Link>
            <span>›</span>
            <span>Équipe</span>
            <span>›</span>
            <span className="text-[#111111] font-bold">Horaires de travail</span>
          </div>
          <h1 className="text-xl font-black text-[#111111] tracking-tight">
            Horaires de travail de l'équipe
          </h1>
          <p className="text-xs text-[#666660]">
            Régule l'assignation automatique, la sourdine des alertes hors service et le suivi des équipes.
          </p>
        </div>

        {/* Sélecteur de rôle connecté pour tester la matrice d'autorisation */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-black/[0.08] shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-[#888880] px-1">Rôle simulé :</span>
          <select
            id="simulated-role-selector"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="text-xs font-bold text-[#111111] bg-transparent border-none focus:outline-hidden cursor-pointer"
          >
            <option value="owner">Admin (Complet)</option>
            <option value="closer">Closeur (Lecture seule)</option>
            <option value="rider">Livreur (Lecture seule)</option>
            <option value="agency">Agence de livraison (Lecture seule)</option>
          </select>
        </div>
      </div>

      {/* Bannière de disponibilité en temps réel */}
      <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E] shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#111111]">
                Équipe en service : {dutyOverview.onDuty} / {dutyOverview.total} membres
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/10 text-[#16A34A]">
                En direct
              </span>
            </div>
            <p className="text-[11px] text-[#666660] mt-0.5">
              Fuseau horaire de référence : <span className="font-semibold text-[#111111]">{timezone} (GMT+0)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#888880]">
            Règle Novika : 07:00 → 18:00 (lun–sam, dimanche off)
          </span>
        </div>
      </div>

      {/* Sélecteur de portée (Scope) : Boutique / Rôle / Membre */}
      <div className="flex border-b border-black/[0.08] gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveScope("shop")}
          id="scope-btn-shop"
          className={cn(
            "pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeScope === "shop"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#888880] hover:text-[#111111]"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Toute la boutique (Par défaut)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScope("role")}
          id="scope-btn-role"
          className={cn(
            "pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeScope === "role"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#888880] hover:text-[#111111]"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Par rôle spécifique</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScope("member")}
          id="scope-btn-member"
          className={cn(
            "pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeScope === "member"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#888880] hover:text-[#111111]"
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Par membre (Surcharge individuelle)</span>
        </button>
      </div>

      {/* Sous-sélecteurs si portée rôle ou membre */}
      {activeScope === "role" && (
        <div className="p-3 bg-white rounded-xl border border-black/[0.08] flex items-center gap-3 text-xs">
          <span className="font-bold text-[#888880]">Choisir le rôle à surcharger :</span>
          <div className="flex gap-2">
            {[
              { id: "closer", label: "Closeuses" },
              { id: "rider", label: "Livreurs" },
              { id: "agency", label: "Agences partenaires" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                  selectedRole === r.id
                    ? "bg-[#111111] text-[#FAF8F5]"
                    : "bg-black/[0.04] text-[#666660] hover:bg-black/[0.08]"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeScope === "member" && (
        <div className="p-3 bg-white rounded-xl border border-black/[0.08] flex items-center gap-3 text-xs">
          <span className="font-bold text-[#888880]">Choisir le collaborateur :</span>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="p-1.5 rounded-lg border border-black/[0.1] bg-[#FAF8F5] text-xs font-bold text-[#111111]"
          >
            {MOCK_TEAM.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role}) — {(m as any).city || "Lomé"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tableau des 7 jours */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5]">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#888880]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Planning hebdomadaire (7 jours)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="apply-to-all-working-days-btn"
                onClick={handleApplyToAllWorkingDays}
                disabled={!isOwner}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-black/[0.08] text-xs font-bold text-[#111111] hover:bg-black/[0.04] disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Appliquer à tous les jours</span>
              </button>

              <button
                type="button"
                id="reset-schedules-defaults-btn"
                onClick={handleResetToFactoryDefaults}
                disabled={!isOwner}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-black/[0.08] text-xs font-bold text-[#C2410C] hover:bg-[#C2410C]/5 disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Rétablir (07:00–18:00, lun–sam)</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {days.map((day) => {
              const isSunday = day.dayOfWeek === 7;
              const isLockedSunday = isSunday && !sundayAllowed;

              return (
                <div
                  key={day.dayOfWeek}
                  className={cn(
                    "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors",
                    day.isWorking ? "bg-white" : "bg-[#F9F9F8]",
                    isSunday ? "border-l-4 border-l-[#C2410C]/40" : ""
                  )}
                >
                  <div className="flex items-center gap-3 sm:w-48">
                    <input
                      type="checkbox"
                      id={`day-toggle-${day.dayOfWeek}`}
                      checked={day.isWorking}
                      onChange={() => handleToggleDay(day.dayOfWeek)}
                      disabled={!isOwner || isLockedSunday}
                      className="h-4 w-4 accent-[#111111] cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div>
                      <span className="font-bold text-sm text-[#111111] block">{day.dayName}</span>
                      <span className="text-[10px] text-[#888880]">
                        {day.isWorking ? (
                          <span className="text-[#16A34A] font-semibold">Jour ouvré</span>
                        ) : (
                          "Repos / Désactivé"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Message spécial si dimanche */}
                  {isSunday && (
                    <div className="flex-1 text-[11px] text-[#888880] flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-1.5 rounded-lg border border-black/[0.04]">
                      <Info className="h-3.5 w-3.5 text-[#C2410C] shrink-0" />
                      <span>
                        {isLockedSunday
                          ? "Dimanche désactivé par défaut. Seul l'Admin propriétaire peut l'activer."
                          : "Dimanche exceptionnel activable uniquement par l'Admin propriétaire."}
                      </span>
                    </div>
                  )}

                  {/* Sélecteurs horaires */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#888880]">De</span>
                      <input
                        type="time"
                        id={`time-start-${day.dayOfWeek}`}
                        value={day.startTime}
                        onChange={(e) => handleTimeChange(day.dayOfWeek, "startTime", e.target.value)}
                        disabled={!day.isWorking || !isOwner}
                        className="p-1.5 rounded-lg border border-black/[0.1] bg-white text-xs font-bold text-[#111111] disabled:opacity-40"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#888880]">à</span>
                      <input
                        type="time"
                        id={`time-end-${day.dayOfWeek}`}
                        value={day.endTime}
                        onChange={(e) => handleTimeChange(day.dayOfWeek, "endTime", e.target.value)}
                        disabled={!day.isWorking || !isOwner}
                        className="p-1.5 rounded-lg border border-black/[0.1] bg-white text-xs font-bold text-[#111111] disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-between items-center pt-2">
          <p className="text-[11px] text-[#888880]">
            Toutes les modifications sont immédiatement appliquées aux notifications sonores et à la distribution des colis.
          </p>

          <button
            type="submit"
            id="save-schedules-btn"
            disabled={!isOwner}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            <span>Enregistrer le planning</span>
          </button>
        </div>
      </form>

      {/* Liste des membres et statut de service en direct */}
      <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
            Statut de service des membres en temps réel
          </h3>
          <span className="text-xs text-[#888880]">
            Calculé selon le fuseau horaire {timezone}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {dutyOverview.members.map((m) => (
            <div
              key={m.memberId}
              className="p-3 rounded-xl border border-black/[0.06] bg-[#FAF8F5] flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-[#111111] block">{m.memberName}</span>
                <span className="text-[10px] text-[#888880] capitalize">{m.role}</span>
              </div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  m.dutyStatus === "on_duty"
                    ? "bg-[#22C55E]/10 text-[#16A34A] border-[#22C55E]/20"
                    : "bg-black/[0.05] text-[#888880] border-black/[0.08]"
                )}
              >
                {m.statusLabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
