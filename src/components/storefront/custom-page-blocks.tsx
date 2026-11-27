"use client";

import React from "react";
import Link from "next/link";
import { sanitizePageBlocks, type PageBlock } from "@/lib/page-sections";
import { useStudioDraft } from "@/lib/studio-bridge";

function Block({ b, storeSlug }: { b: PageBlock; storeSlug: string }) {
  const align = b.align === "center" ? "text-center mx-auto" : "text-left";
  if (b.type === "heading") return <h2 className={`text-xl sm:text-3xl font-black text-[#111111] tracking-tight ${align}`}>{b.text}</h2>;
  if (b.type === "text")
    return (
      <div className={`space-y-3 text-sm sm:text-base text-[#444440] leading-relaxed ${align}`}>
        {(b.text || "").split(/\n{2,}/).map((t, i) => (
          <p key={i} className="whitespace-pre-line">{t}</p>
        ))}
      </div>
    );
  if (b.type === "image")
    return b.imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={b.imageUrl} alt={b.alt || ""} className={`w-full max-h-[520px] object-cover rounded-3xl ${b.align === "center" ? "mx-auto" : ""}`} loading="lazy" />
    ) : null;
  return b.text ? (
    <div className={b.align === "center" ? "text-center" : ""}>
      <Link
        href={b.url || `/boutique/${storeSlug}/catalogue`}
        className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full bg-[#111111] text-white text-sm font-bold hover:opacity-90"
      >
        {b.text}
      </Link>
    </div>
  ) : null;
}

export function CustomPageBlocks({ blocks, storeSlug }: { blocks: unknown; storeSlug: string }) {
  const studio = useStudioDraft();
  const list = studio.draft.pageSections ? sanitizePageBlocks(studio.draft.pageSections) : sanitizePageBlocks(blocks);
  return (
    <div className="space-y-6">
      {list.map((b) => (
        <Block key={b.id} b={b} storeSlug={storeSlug} />
      ))}
    </div>
  );
}
