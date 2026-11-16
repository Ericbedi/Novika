import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, LucideIcon, Sparkles } from "lucide-react";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";

interface PlaceholderPageProps {
  title: string;
  description: string;
  section: string;
  icon?: LucideIcon;
  backHref?: string;
  promptStep?: "5.B" | "5.C";
}

export function PlaceholderPage({
  title,
  description,
  section,
  icon: Icon = Clock,
  backHref,
  promptStep = "5.B",
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={title}
        description={description}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles className="h-3 w-3 text-blue-500" />
            Étape {promptStep}
          </span>
        }
        actions={
          backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour
            </Link>
          )
        }
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <EmptyState
          icon={Icon}
          title={`Section ${title}`}
          description={`Cette page (${section}) sera complétée à l'étape ${promptStep} du plan dès validation du Dashboard et de la Sidebar.`}
          action={
            <div className="flex items-center gap-3">
              <Link
                href="/app/lome-glow"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
              >
                Retour au Dashboard
              </Link>
            </div>
          }
        />
      </div>
    </div>
  );
}
