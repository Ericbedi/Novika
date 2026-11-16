import { Skeleton } from "@/components/ui/skeleton";

/** Squelette de liste : en-tête, onglets, filtres, lignes. */
export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-9 w-full max-w-3xl rounded-full" />
      <div className="rounded-xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06]">
        <Skeleton className="h-10 w-full" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Squelette de fiche : titre, bandeau d'actions, deux colonnes. */
export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Prompt 05-Q : Squelette instantané du Tableau de bord (< 100 ms) */
export function DashboardSkeleton() {
  return (
    <div id="skeleton-dashboard" className="space-y-6 animate-pulse" aria-busy="true">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>

      {/* Hero Command Center / Live Globe & 5 KPI cards */}
      <div className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Graphiques et listes récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-72 lg:col-span-2 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    </div>
  );
}

/** Prompt 05-Q : Squelette instantané des Réglages (8 cases) */
export function SettingsSkeleton() {
  return (
    <div id="skeleton-settings" className="space-y-6 animate-pulse" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      {/* Grille exacte de 8 cases de réglages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-24 sm:h-28 rounded-2xl" />
        ))}
      </div>

      {/* Formulaire actif */}
      <div className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-sm space-y-4">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Prompt 05-Q : Squelette instantané de l'Éditeur de Vitrine */
export function StorefrontEditorSkeleton() {
  return (
    <div id="skeleton-storefront-editor" className="space-y-6 animate-pulse" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-60 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Onglets des 6 sections */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-xl shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
        <div className="lg:col-span-5 flex justify-center">
          <Skeleton className="h-[600px] w-[320px] rounded-[48px]" />
        </div>
      </div>
    </div>
  );
}

/** Prompt 05-Q : Squelette instantané Performance Produit & Scaling */
export function ScalingSkeleton() {
  return (
    <div id="skeleton-scaling" className="space-y-6 animate-pulse" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}

/** Prompt 05-Q : Squelette instantané Entonnoir de Conversion */
export function FunnelSkeleton() {
  return (
    <div id="skeleton-funnel" className="space-y-6 animate-pulse" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <Skeleton className="h-4 w-80 rounded-lg" />
      </div>
      <Skeleton className="h-44 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

