"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Users,
  Truck,
  ShieldCheck,
  Wallet,
  Target,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Layers,
  Clock,
  PhoneCall,
  Check,
  Globe,
  Lock,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { brandConfig } from "@/config/brand";
import { Logo } from "@/components/brand/logo";
import { ROUTES } from "@/config/routes";
import {
  landingContent,
  CountryItem,
  DifficultyItem,
  FeatureItem,
  StepItem,
  RoleItem,
  FaqItem,
} from "@/content/landing.fr";
import { Reveal } from "@/components/ui/reveal";
import { InteractiveOrderDemo } from "@/components/landing/order-demo";
import { AfricaDotsMap } from "@/components/landing/africa-dots-map";
import { HeroProductPreview } from "@/components/landing/hero-product-preview";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<"orders" | "deliveries" | "finances">("orders");
  const [marqueePaused, setMarqueePaused] = useState(false);
  const [globalAnimationsPaused, setGlobalAnimationsPaused] = useState(false);

  // Formulaire d'accès rapide
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [country, setCountry] = useState("TG");
  const [accessSubmitted, setAccessSubmitted] = useState(false);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone) return;
    setAccessSubmitted(true);
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-[#FAF8F5] text-[#111111] selection:bg-[#F26522]/20 selection:text-[#111111]",
        globalAnimationsPaused && "motion-reduce"
      )}
    >
      {/* 1. ANNOUNCEMENT BAR */}
      <div className="bg-[#0B1521] text-[#FAF8F5] text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F26522] text-[#0B1521] uppercase tracking-wider">
          {landingContent.announcement.badge}
        </span>
        <span className="truncate">{landingContent.announcement.text}</span>
      </div>

      {/* 2. STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-black/[0.06]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="full" tone="light" size={32} />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#555550]">
            <a href="#fonctionnalites" className="hover:text-[#111111] transition-colors">
              Fonctionnalités
            </a>
            <a href="#demo" className="hover:text-[#111111] transition-colors">
              Démonstration
            </a>
            <a href="#comment-ca-marche" className="hover:text-[#111111] transition-colors">
              Fonctionnement
            </a>
            <a href="#roles" className="hover:text-[#111111] transition-colors">
              Rôles
            </a>
            <a href="#tarifs" className="hover:text-[#111111] transition-colors">
              Bêta & Tarifs
            </a>
            <a href="#faq" className="hover:text-[#111111] transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.login}
              className="text-sm font-bold text-[#111111] hover:text-[#D35400] px-3 py-1.5 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/acces"
              id="header-cta-btn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#D35400] text-white hover:bg-[#B84700] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Demander mon accès</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (Prompt 05-L : 2 colonnes bureau, textes corrigés depuis landingContent, visuel produit) */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[1240px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Colonne gauche (Texte aligné à gauche sur bureau) */}
            <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F26522]/10 border border-[#F26522]/20 text-[#D35400] text-xs font-bold mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{landingContent.hero.badge}</span>
              </div>

              {/* Titre clampé pour tenir en 3 lignes max sur ordinateur */}
              <h1 className="text-3xl sm:text-4xl lg:text-[clamp(2.15rem,3.8vw,3.25rem)] font-black text-[#0B1521] tracking-tight leading-[1.14] mb-5">
                {landingContent.hero.title}
              </h1>

              <p className="text-base sm:text-lg text-[#555550] max-w-[620px] mb-6 font-medium leading-relaxed">
                {landingContent.hero.subtitle}
              </p>

              {/* 3 Pastilles de réassurance (Textes corrigés depuis landingContent.hero.pills) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-8">
                {landingContent.hero.pills.map((pill, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/[0.08] text-xs font-bold text-[#111111] shadow-2xs"
                  >
                    {pill.icon === "CheckCircle2" && <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />}
                    {pill.icon === "Truck" && <Truck className="h-3.5 w-3.5 text-[#C2410C]" />}
                    {pill.icon === "ShieldCheck" && <ShieldCheck className="h-3.5 w-3.5 text-[#2563EB]" />}
                    <span>{pill.text}</span>
                  </div>
                ))}
              </div>

              {/* Boutons d'action Hero sur une seule ligne sans retour à la ligne */}
              <div className="flex flex-row flex-wrap items-center justify-center lg:justify-start gap-3 mb-3 w-full sm:w-auto">
                <Link
                  href="/acces"
                  id="hero-cta-btn"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold bg-[#D35400] text-white hover:bg-[#B84700] shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
                >
                  <span>{landingContent.hero.ctaPrimary}</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                <a
                  href="#demo"
                  id="hero-see-how-it-works-btn"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm sm:text-base font-bold bg-white text-[#111111] border border-black/[0.1] hover:bg-black/[0.02] transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  <span>{landingContent.hero.ctaSecondary}</span>
                </a>
              </div>

              {/* Mention sous les boutons entièrement visible */}
              <p className="text-xs text-[#888880] font-medium leading-normal mt-1">
                {landingContent.hero.guarantee}
              </p>
            </div>

            {/* Colonne droite (Visuel produit interactif HTML/CSS/SVG) */}
            <div className="lg:col-span-5 w-full flex justify-center lg:justify-end pt-4 lg:pt-0">
              <HeroProductPreview />
            </div>
          </div>
        </div>
      </section>

      {/* 4. BANDEAU DE DEVISES & PAYS AVEC BOUTON PAUSE ACCESSIBLE */}
      <section className="py-6 bg-[#0B1521] text-white border-y border-black/[0.1]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-wider font-bold text-[#888880]">
              {landingContent.countriesBand.title}
            </p>
            <button
              type="button"
              id="toggle-marquee-pause-btn"
              onClick={() => setMarqueePaused(!marqueePaused)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-white transition-colors cursor-pointer"
            >
              {marqueePaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              <span>{marqueePaused ? "Défiler" : "Pause"}</span>
            </button>
          </div>

          <div
            className={cn(
              "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 transition-opacity",
              marqueePaused && "opacity-90"
            )}
          >
            {landingContent.countriesBand.countries.map((c: CountryItem) => (
              <div
                key={c.name}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center"
              >
                <span className="text-2xl mb-1">{c.flag}</span>
                <span className="text-xs font-bold text-white truncate w-full">{c.name}</span>
                <span className="text-[10px] text-[#4DB8B8] font-mono">{c.currency}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PROBLEM / SOLUTION SECTION */}
      <section className="py-20 px-4 sm:px-6 max-w-[1240px] mx-auto">
        <div className="text-center max-w-[800px] mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-black text-[#0B1521] tracking-tight mb-4">
            {landingContent.problemSolution.title}
          </h2>
          <p className="text-base text-[#666660] font-medium">
            {landingContent.problemSolution.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {landingContent.problemSolution.difficulties.map((diff: DifficultyItem, idx: number) => (
            <div key={idx} className="p-5 rounded-2xl bg-white border border-rose-100 shadow-xs h-full flex flex-col justify-between">
              <div>
                <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm mb-3">
                  ✕
                </div>
                <h3 className="text-base font-bold text-[#111111] mb-2">{diff.title}</h3>
                <p className="text-sm text-[#666660] leading-relaxed">{diff.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-[#0B1521] text-white flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="max-w-[700px]">
            <p className="text-rose-400 font-bold text-sm mb-1">{landingContent.problemSolution.consequence}</p>
            <h3 className="text-xl sm:text-2xl font-bold leading-snug">{landingContent.problemSolution.solution}</h3>
          </div>
          <Link
            href="/acces"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#D35400] text-white hover:bg-[#B84700] transition-colors shrink-0"
          >
            <span>Découvrir Novika</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 6. FEATURES SECTION */}
      <section id="fonctionnalites" className="py-20 px-4 sm:px-6 bg-white border-y border-black/[0.06]">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center max-w-[700px] mx-auto mb-14">
            <span className="text-xs font-bold text-[#D35400] uppercase tracking-wider">Fonctionnalités</span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0B1521] tracking-tight mt-1">
              {landingContent.features.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {landingContent.features.items.map((feat: FeatureItem, idx: number) => {
              const icons = [ShoppingCart, Users, Truck, ShieldCheck, Wallet, Target];
              const IconComp = icons[idx % icons.length];
              return (
                <div key={idx} className="p-6 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] hover:border-black/[0.15] transition-all h-full">
                  <div className="h-10 w-10 rounded-xl bg-[#0B1521] text-[#F26522] flex items-center justify-center mb-4">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0B1521] mb-2">{feat.title}</h3>
                  <p className="text-sm text-[#666660] leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS (4 STEPS) */}
      <section id="comment-ca-marche" className="py-20 px-4 sm:px-6 max-w-[1240px] mx-auto">
        <div className="text-center max-w-[700px] mx-auto mb-14">
          <span className="text-xs font-bold text-[#D35400] uppercase tracking-wider">Parcours</span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0B1521] tracking-tight mt-1">
            {landingContent.steps.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {landingContent.steps.list.map((st: StepItem, idx: number) => (
            <div key={idx} className="p-6 rounded-2xl bg-white border border-black/[0.08] h-full flex flex-col justify-between">
              <div>
                <span className="text-4xl font-black text-[#D35400]/20 font-mono block mb-2">{st.step}</span>
                <h3 className="text-base font-bold text-[#0B1521] mb-2">{st.title}</h3>
                <p className="text-sm text-[#666660] leading-relaxed">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. SECTION DÉMONSTRATION INTERACTIVE (Ancre #demo - Règle stricte : Placé après 'Comment ça marche') */}
      <InteractiveOrderDemo />

      {/* 9. CARTE DE L'AFRIQUE EN POINTS (Réseau logistique actif) */}
      <section className="py-16 px-4 sm:px-6 max-w-[1240px] mx-auto">
        <AfricaDotsMap />
      </section>

      {/* 10. INTERACTIVE PREVIEW TABS */}
      <section className="py-16 px-4 sm:px-6 bg-[#0B1521] text-white">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Aperçu en direct de l'outil</h2>
            <p className="text-sm text-[#888880]">Une interface soignée pour piloter l'ensemble de vos opérations</p>
            <div className="flex justify-center gap-2 mt-6">
              {(["orders", "deliveries", "finances"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    activeTab === tab
                      ? "bg-[#D35400] text-white shadow-sm"
                      : "bg-white/10 text-white/70 hover:bg-white/15"
                  )}
                >
                  {tab === "orders" ? "Commandes & Closing" : tab === "deliveries" ? "Flotte & Tournées" : "Caisse & Objectifs"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#070D14] p-4 sm:p-6 shadow-2xl">
            {activeTab === "orders" && (
              <div className="space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-[#4DB8B8]">Commandes à confirmer (42)</span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                    Taux de confirmation : 76%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">#CMD-2026-089 · Koffi Mensah</p>
                      <p className="text-[#888880]">Lomé (Agoè-Nyivé) · Montre Connectée Pro x2 · 35 000 FCFA</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-[#F26522]/20 text-[#F26522] font-bold text-[10px]">
                      Assignée à Awa (Closeuse)
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">#CMD-2026-088 · Aminata Diallo</p>
                      <p className="text-[#888880]">Abidjan (Cocody) · Robe Soie d'Orient · 22 500 FCFA</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      Confirmée · Prête pour livraison
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "deliveries" && (
              <div className="space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-[#4DB8B8]">Livreurs en course (8 actifs)</span>
                  <span className="text-[11px] text-[#888880]">Taux de remise réussie : 84%</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">Moussa Traoré (Livreur Zone 1)</p>
                      <p className="text-[#888880]">5 livraisons en cours · 3 terminées · 105 000 FCFA encaissés</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                      En tournée
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "finances" && (
              <div className="space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-[#4DB8B8]">Objectif mensuel de CA encaissé</span>
                  <span className="text-[11px] text-amber-400 font-bold">1 850 000 / 2 500 000 FCFA (74%)</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
                  <div style={{ width: "55%" }} className="bg-emerald-500" title="Encaissé réel" />
                  <div style={{ width: "19%" }} className="bg-amber-400" title="Livré en attente de remise" />
                  <div style={{ width: "12%" }} className="bg-blue-400" title="Programmé pondéré" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#888880] pt-1">
                  <span>Vert : Encaissé vérifié</span>
                  <span>Jaune : Livré (espèces en caisse livreur)</span>
                  <span>Bleu : Programmé</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 11. ROLES SECTION */}
      <section id="roles" className="py-20 px-4 sm:px-6 max-w-[1240px] mx-auto">
        <div className="text-center max-w-[700px] mx-auto mb-14">
          <span className="text-xs font-bold text-[#D35400] uppercase tracking-wider">Écosystème</span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0B1521] tracking-tight mt-1">
            {landingContent.roles.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {landingContent.roles.list.map((r: RoleItem, idx: number) => (
            <div key={idx} className="p-6 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
              <span className="inline-block px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-black/[0.06] text-[11px] font-black uppercase tracking-wider text-[#D35400] mb-3">
                {r.badge}
              </span>
              <h3 className="text-base font-bold text-[#0B1521] mb-2">{r.role}</h3>
              <p className="text-sm text-[#666660] leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 12. FAQ SECTION */}
      <section id="faq" className="py-20 px-4 sm:px-6 max-w-[800px] mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-[#D35400] uppercase tracking-wider">Réponses</span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0B1521] tracking-tight mt-1">
            Questions fréquentes
          </h2>
        </div>

        <div className="space-y-3">
          {landingContent.faq.items.map((item: FaqItem, idx: number) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-sm sm:text-base text-[#0B1521]">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-[#888880] shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180 text-[#D35400]"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-[#555550] leading-relaxed border-t border-black/[0.04] pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 13. COMPREHENSIVE FOOTER AVEC BOUTON D'ACCESSIBILITÉ GLOBAL */}
      <footer className="py-12 px-4 sm:px-6 bg-[#070D14] text-white/70 border-t border-white/10 text-xs">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo variant="full" tone="dark" size={28} />
            <span className="text-white/40">|</span>
            <span className="text-white/60">{landingContent.footer.tagline}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-white/60 font-medium">
            <Link href="/acces" className="hover:text-white transition-colors">
              Demande d'accès
            </Link>
            <Link href={ROUTES.login} className="hover:text-white transition-colors">
              Espace Vendeur
            </Link>
            <a href={`mailto:${brandConfig.contact.supportEmail}`} className="hover:text-white transition-colors">
              Support ({brandConfig.contact.supportEmail})
            </a>
            <button
              type="button"
              id="global-pause-animations-toggle"
              onClick={() => setGlobalAnimationsPaused(!globalAnimationsPaused)}
              className="text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              {globalAnimationsPaused ? "Activer les animations" : "Suspendre les animations"}
            </button>
          </div>

          <div className="text-white/40">
            {landingContent.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
