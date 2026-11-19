"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Store,
  Package,
  MapPin,
  Users,
  ShoppingCart,
  Truck,
  Wallet,
  Plus,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CreateStoreModal } from "@/components/app/create-store-modal";

const STEPS = [
  { id: 1, title: "Créer votre première boutique", desc: "Informations de base, nom, pays d'Afrique (54 pays) et devise", icon: Store },
  { id: 2, title: "Ajouter un premier produit", desc: "Prix, images, variantes et stock initial", icon: Package },
  { id: 3, title: "Configurer une zone de livraison", desc: "Détection par ville ou quartier, gratuité ou tarif fixe", icon: MapPin },
  { id: 4, title: "Inviter un membre d'équipe", desc: "Closeuse pour les appels ou livreur de confiance", icon: Users },
  { id: 5, title: "Passer une commande test", desc: "Tester votre propre formulaire comme un client", icon: ShoppingCart },
  { id: 6, title: "Traiter et livrer le test", desc: "Simulation d'appel, d'assignation et de preuve de livraison", icon: Truck },
  { id: 7, title: "Découvrir la caisse et vos objectifs", desc: "Suivi des espèces encaissées et du bénéfice net", icon: Wallet },
];

export default function DemarrerAssistantPage() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [firstStoreSlug, setFirstStoreSlug] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string>("Marchand");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const email = localStorage.getItem("novika_user_email") || "";
      const name = localStorage.getItem("novika_user_fullname") || (email ? email.split("@")[0] : "Marchand");
      setUserFullName(name);

      const savedStores = localStorage.getItem(`novika_user_stores_${email}`);
      if (savedStores) {
        try {
          const parsed = JSON.parse(savedStores);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFirstStoreSlug(parsed[0].slug);
            setCompletedSteps([1]);
            router.push(`/app/${parsed[0].slug}`);
            return;
          }
        } catch {}
      }

      // Si aucune boutique créée, ouvrir automatiquement le créateur de boutique
      setIsCreateStoreOpen(true);
    }
  }, []);

  const handleCreateStoreSuccess = async (newStoreData: {
    name: string;
    slug: string;
    country: string;
    currency: string;
    whatsapp?: string;
  }) => {
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("novika_user_email") || "owner@novika.com" : "owner@novika.com";

    const newStore = {
      id: `store_${newStoreData.country.toLowerCase()}_${Date.now()}`,
      name: newStoreData.name,
      slug: newStoreData.slug,
      country: newStoreData.country,
      currency: newStoreData.currency,
      whatsappNumber: newStoreData.whatsapp || "+22890000000",
      role: "owner",
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(`novika_user_stores_${userEmail}`, JSON.stringify([newStore]));
    }

    setFirstStoreSlug(newStore.slug);
    setCompletedSteps((prev) => [...prev, 1]);
    setIsCreateStoreOpen(false);

    try {
      await fetch("/api/stores/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStore,
          ownerEmail: userEmail,
        }),
      });
    } catch {}

    router.push(`/app/${newStore.slug}`);
  };

  const handleStepClick = (stepId: number) => {
    if (stepId === 1) {
      setIsCreateStoreOpen(true);
      return;
    }
    setCompletedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  const progressPercent = Math.round((completedSteps.length / STEPS.length) * 100);
  const targetDashboardUrl = firstStoreSlug ? `/app/${firstStoreSlug}` : "/app/lome-glow";

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] p-4 sm:p-8">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Logo variant="full" tone="light" size={32} />
          {firstStoreSlug && (
            <Link
              href={targetDashboardUrl}
              className="text-xs font-bold text-[#D35400] hover:underline flex items-center gap-1"
            >
              <span>Aller à mon tableau de bord</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-black/[0.06]">
            <div>
              <h1 className="text-2xl font-black text-[#0B1521] tracking-tight">
                Bienvenue {userFullName} !
              </h1>
              <p className="text-xs sm:text-sm text-[#666660]">
                Configurez votre propre boutique pour commencer à recevoir des commandes réelles.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-[#D35400] font-mono">{progressPercent}%</span>
              <p className="text-[10px] text-[#888880] uppercase tracking-wider font-bold">Progression</p>
            </div>
          </div>

          <div className="space-y-3">
            {STEPS.map((st) => {
              const isDone = completedSteps.includes(st.id);
              const IconComp = st.icon;
              return (
                <div
                  key={st.id}
                  onClick={() => handleStepClick(st.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isDone
                      ? "bg-emerald-50/50 border-emerald-200"
                      : st.id === 1 && !firstStoreSlug
                      ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20"
                      : "bg-[#FAF8F5] border-black/[0.06] hover:border-black/[0.15]"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isDone
                          ? "bg-emerald-600 text-white"
                          : st.id === 1 && !firstStoreSlug
                          ? "bg-[#C2410C] text-white"
                          : "bg-black/[0.06] text-[#666660]"
                      }`}
                    >
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isDone ? "text-emerald-950" : "text-[#111111]"}`}>
                        {st.id}. {st.title}
                      </p>
                      <p className="text-xs text-[#666660] truncate">{st.desc}</p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {st.id === 1 && !firstStoreSlug && (
                      <span className="text-xs font-bold text-[#C2410C] bg-white px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1 shadow-2xs">
                        <Plus className="h-3.5 w-3.5" />
                        <span>Créer</span>
                      </span>
                    )}
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-black/[0.2]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-black/[0.06] flex items-center justify-between">
            <span className="text-xs text-[#888880]">
              {completedSteps.length} sur {STEPS.length} étapes terminées
            </span>
            <button
              type="button"
              onClick={() => {
                if (!firstStoreSlug) {
                  setIsCreateStoreOpen(true);
                } else {
                  router.push(targetDashboardUrl);
                }
              }}
              id="finish-onboarding-btn"
              className="px-5 py-2.5 rounded-xl font-bold bg-[#0B1521] text-white hover:bg-black transition-colors flex items-center gap-2 text-sm cursor-pointer"
            >
              <span>{firstStoreSlug ? "Accéder à mon tableau de bord" : "Créer ma boutique maintenant"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal d'assistant de création de boutique (5 étapes, 54 pays d'Afrique) */}
      <CreateStoreModal
        isOpen={isCreateStoreOpen}
        onClose={() => setIsCreateStoreOpen(false)}
        onCreateStore={handleCreateStoreSuccess}
      />
    </div>
  );
}
