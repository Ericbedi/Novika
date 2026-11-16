"use client";

import React, { useState } from "react";
import { MessageSquarePlus, X, Send, AlertTriangle, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/server/data/types";

interface BetaFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  userRole: UserRole;
}

export function BetaFeedbackModal({
  isOpen,
  onClose,
  currentPage,
  userRole,
}: BetaFeedbackModalProps) {
  const [category, setCategory] = useState<"bug" | "suggestion" | "satisfaction" | "autre">("suggestion");
  const [message, setMessage] = useState("");
  const [satisfactionRating, setSatisfactionRating] = useState<number>(5);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setHasSubmitted(true);
      setTimeout(() => {
        setHasSubmitted(false);
        setMessage("");
        onClose();
      }, 1600);
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F5] border border-black/[0.1] shadow-2xl overflow-hidden p-6 text-[#111111] space-y-5">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-[#C2410C]/10 text-[#C2410C] flex items-center justify-center font-bold">
              <MessageSquarePlus className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#111111]">Avis & Signalement Bêta</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#C2410C] text-white uppercase tracking-wider">
                  Bêta
                </span>
              </div>
              <p className="text-[11px] text-[#666660]">Vos retours construisent le standard e-commerce COD ouest-africain</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-xl text-[#888880] hover:text-[#111111] hover:bg-black/[0.05] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {hasSubmitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-[#111111]">Merci pour votre retour précieux !</p>
            <p className="text-xs text-[#666660]">L&apos;équipe produit AfriBuilder analyse votre signalement sans délai.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Choix de la catégorie */}
            <div>
              <label className="block text-[11px] font-bold text-[#666660] uppercase tracking-wider mb-1.5">
                Type de retour
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {(
                  [
                    { id: "suggestion", label: "Suggestion" },
                    { id: "bug", label: "Bug / Problème" },
                    { id: "satisfaction", label: "Satisfaction" },
                    { id: "autre", label: "Autre" },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "py-2 px-2 rounded-xl font-bold transition-all border text-center cursor-pointer",
                      category === c.id
                        ? "bg-[#111111] text-[#FAF8F5] border-[#111111] shadow-2xs"
                        : "bg-white text-[#555550] border-black/[0.08] hover:border-black/20"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note satisfaction rapide */}
            {category === "satisfaction" && (
              <div>
                <label className="block text-[11px] font-bold text-[#666660] uppercase tracking-wider mb-1.5">
                  Votre note globale sur la fluidité (1 à 5 étoiles)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSatisfactionRating(star)}
                      className={cn(
                        "h-9 w-9 rounded-xl font-black text-sm border transition-all cursor-pointer",
                        satisfactionRating >= star
                          ? "bg-amber-400 text-amber-950 border-amber-500 shadow-2xs"
                          : "bg-white text-[#888880] border-black/[0.08]"
                      )}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#666660] ml-2">
                    {satisfactionRating}/5
                  </span>
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-[11px] font-bold text-[#666660] uppercase tracking-wider mb-1">
                Description de votre observation
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Expliquez ce qui s'est passé ou ce qui faciliterait votre travail quotidien..."
                className="w-full p-3 rounded-2xl border border-black/[0.1] bg-white text-xs text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/20 focus:border-[#C2410C] resize-none"
              />
            </div>

            {/* Avertissement de sécurité & Confidentialité RGPD */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Confidentialité garantie :</span> Ne partagez aucun mot de passe ni donnée confidentielle de vos clients.
              </div>
            </div>

            {/* Métadonnées anonymisées transmises */}
            <div className="p-2.5 rounded-xl bg-black/[0.03] border border-black/[0.06] text-[10px] text-[#888880] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Contexte technique automatique (anonymisé) :
              </span>
              <span className="font-mono text-[9px] text-[#555550]">
                Page: {currentPage.slice(0, 24)}... · Rôle: {userRole} · V2.4-beta
              </span>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#666660] hover:text-[#111111] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C2410C] text-white text-xs font-black hover:bg-[#9A3412] transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Envoyer mon avis</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
