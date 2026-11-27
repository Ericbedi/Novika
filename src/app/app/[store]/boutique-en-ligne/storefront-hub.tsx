"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, FilePlus2, FileText, LayoutTemplate, Palette, Settings2, ShoppingBag } from "lucide-react";

interface PageRow {
  id: string;
  published: boolean;
}

export function StorefrontHub({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [pages, setPages] = useState<PageRow[] | null>(null);
  const base = `/app/${storeSlug}/boutique-en-ligne`;

  // Les anciens liens « ?tab=… » ouvrent directement l'éditeur sur le bon onglet
  useEffect(() => {
    if (tab) router.replace(`${base}/editeur?tab=${encodeURIComponent(tab)}`);
  }, [tab, base, router]);

  useEffect(() => {
    fetch(`/api/pages?store=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((d) => setPages(d?.success ? d.pages : []))
      .catch(() => setPages([]));
  }, [storeSlug]);

  const total = pages?.length ?? 0;
  const published = pages?.filter((p) => p.published).length ?? 0;

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#111111] tracking-tight">
          Boutique <span className="font-light italic text-[#666660]">· en ligne</span>
        </h1>
        <p className="text-xs text-[#666660] mt-1">Gérez le design et le contenu de votre vitrine</p>
      </div>

      <div className="rounded-[24px] bg-[#1f3a26] p-6 sm:p-8 text-white shadow-md flex items-center justify-between gap-4 overflow-hidden">
        <div className="space-y-4 min-w-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#c8f26b]">Personnalisez votre store</h2>
            <p className="text-xs sm:text-sm text-white/80 mt-1">Modifiez le design et le thème de votre page d&apos;accueil</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${base}/editeur`}
              className="min-h-[40px] px-4 rounded-xl bg-[#c8f26b] text-[#111111] text-xs font-bold inline-flex items-center gap-2 hover:brightness-95"
            >
              <LayoutTemplate className="h-4 w-4" />
              Ouvrir l&apos;éditeur
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`${base}/apparence`}
              className="min-h-[40px] px-4 rounded-xl border border-white/25 text-xs font-bold inline-flex items-center gap-2 hover:bg-white/10"
            >
              <Palette className="h-4 w-4" />
              Apparence
            </Link>
            <Link
              href={`${base}/pages?new=1`}
              className="min-h-[40px] px-4 rounded-xl border border-white/25 text-xs font-bold inline-flex items-center gap-2 hover:bg-white/10"
            >
              <FilePlus2 className="h-4 w-4" />
              Créer une page
            </Link>
            <a
              href={`/boutique/${storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-4 rounded-xl border border-white/25 text-xs font-bold inline-flex items-center gap-2 hover:bg-white/10"
            >
              <Eye className="h-4 w-4" />
              Prévisualiser
            </a>
          </div>
        </div>
        <div className="hidden sm:flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <LayoutTemplate className="h-10 w-10 text-[#c8f26b]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-[24px] border border-black/[0.08] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <FileText className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#111111]">Pages</h3>
            <p className="text-xs text-[#666660]">Gérez toutes les pages de votre store</p>
          </div>
          <dl className="text-[11px] font-mono uppercase tracking-wide text-[#666660] space-y-2">
            <div className="flex justify-between"><dt>Total pages</dt><dd className="font-bold text-[#111111]">{pages === null ? "…" : total}</dd></div>
            <div className="flex justify-between"><dt>Publiées</dt><dd className="font-bold text-[#111111]">{pages === null ? "…" : published}</dd></div>
          </dl>
          <Link href={`${base}/pages`} className="min-h-[40px] w-full px-3 rounded-xl border border-black/[0.1] text-xs font-bold inline-flex items-center gap-2 hover:bg-[#FAF8F5]">
            <FileText className="h-4 w-4" /> Gérer les pages
          </Link>
        </div>

        <div className="rounded-[24px] border border-black/[0.08] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#111111]">Formulaire de commande</h3>
            <p className="text-xs text-[#666660]">Personnalisez les champs et le bouton de commande</p>
          </div>
          <ul className="text-xs text-[#111111] space-y-2">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Collecter les informations client</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Personnaliser les champs</li>
          </ul>
          <Link href={`${base}/formulaire`} className="min-h-[40px] w-full px-3 rounded-xl border border-black/[0.1] text-xs font-bold inline-flex items-center gap-2 hover:bg-[#FAF8F5]">
            <Settings2 className="h-4 w-4" /> Personnaliser
          </Link>
        </div>
      </div>
    </div>
  );
}
