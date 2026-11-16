"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Globe2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Sparkles,
  Info,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import {
  ALL_54_AFRICAN_COUNTRIES,
  AfricanCountryConfig,
  getSortedAfricanCountries,
  searchAfricanCountries,
} from "@/config/countries";
import { CountryFlag } from "@/components/ui/country-flag";
import { UserRole } from "@/server/data/types";
import { canManageShopCountries } from "@/config/permissions";
import { cn } from "@/lib/utils";

interface CountriesClientProps {
  storeSlug: string;
}

export function CountriesClient({ storeSlug }: CountriesClientProps) {
  // Rôle simulant l'utilisateur connecté (par défaut "owner" pour l'admin propriétaire)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("owner");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Initialement activés pour lome-lux : TG, CI, BJ, SN, BF, ML, CM
  const [enabledCountryCodes, setEnabledCountryCodes] = useState<Set<string>>(
    new Set(["TG", "CI", "BJ", "SN", "BF", "ML", "CM"])
  );

  // Pays suggéré (ex: Togo pour boutique Lomé Lux)
  const suggestedCountryCode = "TG";
  const suggestedCountry = useMemo(() => {
    return ALL_54_AFRICAN_COUNTRIES.find((c) => c.code === suggestedCountryCode);
  }, []);

  // Liste complète des 54 pays triés par ordre alphabétique français avec Intl.Collator('fr', { sensitivity: 'base' })
  const allSortedCountries = useMemo(() => {
    return getSortedAfricanCountries();
  }, []);

  // Liste filtrée par le champ de recherche (insensible aux accents et à la casse)
  const filteredCountries = useMemo(() => {
    return searchAfricanCountries(searchQuery, allSortedCountries);
  }, [searchQuery, allSortedCountries]);

  const isOwner = canManageShopCountries(currentUserRole);

  const handleToggleCountry = (country: AfricanCountryConfig) => {
    if (!country.platformEligible) {
      setFeedbackMessage({
        type: "info",
        text: `${country.name} n'est pas encore disponible sur la plateforme Novika (Bientôt disponible).`,
      });
      return;
    }

    if (!isOwner) {
      setFeedbackMessage({
        type: "error",
        text: "Accès refusé : Seul l'administrateur propriétaire (owner) peut modifier les pays éligibles.",
      });
      return;
    }

    const isCurrentlyEnabled = enabledCountryCodes.has(country.code);

    // Règle absolue Prompt 05-P : Au moins un pays doit rester activé
    if (isCurrentlyEnabled && enabledCountryCodes.size <= 1) {
      setFeedbackMessage({
        type: "error",
        text: "Action impossible : Au moins un pays doit rester activé (impossible de tout désactiver).",
      });
      return;
    }

    startTransition(async () => {
      const nextSet = new Set(enabledCountryCodes);
      if (isCurrentlyEnabled) {
        nextSet.delete(country.code);
      } else {
        nextSet.add(country.code);
      }
      setEnabledCountryCodes(nextSet);

      // Appel API en arrière-plan
      try {
        await fetch("/api/shop/countries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: storeSlug,
            countryCode: country.code,
            enabled: !isCurrentlyEnabled,
            userRole: currentUserRole,
          }),
        });
      } catch {
        // En mode démo local
      }

      setFeedbackMessage({
        type: "success",
        text: isCurrentlyEnabled
          ? `${country.name} a été désactivé pour la boutique.`
          : `${country.name} est désormais activé pour les commandes et livraisons.`,
      });
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* En-tête avec fil d'Ariane */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <Link
              href={`/app/${storeSlug}/reglages`}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Paramètres
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Pays & Zones de vente</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Globe2 className="w-6 h-6 text-primary" />
            Éligibilité des pays
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez les pays africains dans lesquels votre boutique accepte les commandes et effectue des livraisons.
          </p>
        </div>

        {/* Simulateur de rôle pour vérification de la matrice de permissions */}
        <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border border-border/50 shrink-0 self-start sm:self-auto text-xs">
          <span className="text-muted-foreground font-medium pl-1">Rôle test :</span>
          <select
            value={currentUserRole}
            onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
            className="bg-background border border-border rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Changer le rôle de test"
          >
            <option value="owner">Admin Propriétaire (Écriture)</option>
            <option value="admin">Co-admin (Lecture seule)</option>
            <option value="manager">Manager (Lecture seule)</option>
            <option value="closer">Closeuse (Lecture seule)</option>
            <option value="rider">Livreur (Lecture seule)</option>
          </select>
        </div>
      </div>

      {/* Message de notification / Toast inline */}
      {feedbackMessage && (
        <div
          role="alert"
          className={cn(
            "p-3.5 rounded-xl border text-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200",
            feedbackMessage.type === "success" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300",
            feedbackMessage.type === "error" && "bg-destructive/10 border-destructive/30 text-destructive dark:text-red-400",
            feedbackMessage.type === "info" && "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300"
          )}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
            {feedbackMessage.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0 text-destructive" />}
            {feedbackMessage.type === "info" && <Info className="w-4 h-4 shrink-0 text-blue-600" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs hover:opacity-75 p-1"
            aria-label="Fermer le message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bannière de restriction si non-propriétaire */}
      {!isOwner && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Accès restreint :</strong> Seul le rôle <strong>Admin Propriétaire (Owner)</strong> peut activer ou désactiver les pays de livraison. Votre rôle actuel est en lecture seule.
          </span>
        </div>
      )}

      {/* Bloc Suggéré (Prompt 05-P #2 : Pays actuel en haut sur une seule ligne) */}
      {suggestedCountry && !searchQuery && (
        <div className="bg-card rounded-2xl border border-primary/20 p-4 shadow-sm relative overflow-hidden bg-gradient-to-r from-primary/5 via-card to-card">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3 h-3" />
                Pays suggéré (Siège de la boutique)
              </span>
              <div className="flex items-center gap-2.5">
                <CountryFlag code={suggestedCountry.code} name={suggestedCountry.name} width={28} height={18} />
                <span className="font-bold text-foreground text-base">{suggestedCountry.name}</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                  {suggestedCountry.currency}
                </span>
                <span className="text-xs text-muted-foreground">{suggestedCountry.dialCode}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">
                {enabledCountryCodes.has(suggestedCountry.code) ? "Activé pour les clients" : "Désactivé"}
              </span>
              <button
                type="button"
                disabled={!isOwner}
                onClick={() => handleToggleCountry(suggestedCountry)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  enabledCountryCodes.has(suggestedCountry.code) ? "bg-primary" : "bg-muted-foreground/30",
                  !isOwner && "opacity-50 cursor-not-allowed"
                )}
                aria-label={`Basculer ${suggestedCountry.name}`}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    enabledCountryCodes.has(suggestedCountry.code) ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre de contrôle : Recherche et Compteur */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher parmi les 54 pays d'Afrique (ex: Côte d'Ivoire, Égypte, XOF, +225)..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/30 border border-border/60 rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            aria-label="Recherche de pays"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 text-xs font-medium text-muted-foreground shrink-0 self-end sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            <strong className="text-foreground">{enabledCountryCodes.size}</strong> pays activé{enabledCountryCodes.size > 1 ? "s" : ""} sur 54
          </span>
        </div>
      </div>

      {/* Grille responsive : 3 colonnes bureau, 2 colonnes tablette, 1 colonne mobile (Prompt 05-P #2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCountries.map((country) => {
          const isEnabled = enabledCountryCodes.has(country.code);
          const isPlatformDisabled = !country.platformEligible;

          return (
            <div
              key={country.code}
              className={cn(
                "p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3",
                isEnabled
                  ? "bg-card border-border/80 shadow-xs hover:border-primary/40"
                  : "bg-muted/20 border-border/40 opacity-75 hover:opacity-100",
                isPlatformDisabled && "opacity-50 bg-muted/40 border-dashed"
              )}
            >
              {/* Infos pays : Drapeau SVG, Nom FR, Devise, Indicatif */}
              <div className="flex items-center gap-3 min-w-0">
                <CountryFlag
                  code={country.code}
                  name={country.name}
                  width={24}
                  height={16}
                  className="shrink-0"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground truncate" title={country.name}>
                      {country.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {/* Devise en petite étiquette sans sous-section (Prompt 05-P #2) */}
                    <span className="font-mono font-semibold px-1.5 py-0.2 rounded bg-muted text-[11px] text-foreground/80 border border-border/40">
                      {country.currency}
                    </span>
                    <span>{country.dialCode}</span>
                    <span className="text-[10px] text-muted-foreground/70 uppercase">({country.code})</span>
                  </div>
                </div>
              </div>

              {/* Action : Bascule ou Bientôt disponible */}
              <div className="shrink-0 flex items-center gap-2">
                {isPlatformDisabled ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                    Bientôt disponible
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!isOwner}
                    onClick={() => handleToggleCountry(country)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-primary",
                      isEnabled ? "bg-primary" : "bg-muted-foreground/30",
                      !isOwner && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label={`Activer ou désactiver ${country.name}`}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isEnabled ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCountries.length === 0 && (
        <div className="p-8 text-center bg-card rounded-2xl border border-border/60">
          <Globe2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-foreground">Aucun pays ne correspond à votre recherche</p>
          <p className="text-xs text-muted-foreground mt-1">
            Essayez de rechercher par nom français (avec ou sans accent), par code ISO ou par indicatif.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-3 text-xs font-semibold text-primary hover:underline"
          >
            Réinitialiser la recherche
          </button>
        </div>
      )}
    </div>
  );
}
