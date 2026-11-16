"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Flame } from "lucide-react";
import { TopProduct } from "@/server/data/types";
import { Money } from "@/components/app/money";
import { ProductThumb } from "@/components/app/bits";
import { cn } from "@/lib/utils";

interface TopProductsCardProps {
  products: TopProduct[];
  storeSlug: string;
  className?: string;
}

export function TopProductsCard({
  products,
  storeSlug,
  className,
}: TopProductsCardProps) {
  const maxRevenue = Math.max(...products.map((p) => p.revenue), 1);

  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-[0_2px_12px_rgba(17,17,17,0.03)] flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#111111]">
              Meilleurs produits
            </h3>
            <span className="flex items-center gap-1 rounded-full bg-[#F3EFE6] px-2 py-0.5 text-[10px] font-bold text-[#111111] border border-black/[0.08]">
              <Flame className="h-3 w-3 text-emerald-600" />
              Top Ventes COD
            </span>
          </div>
          <p className="text-xs text-[#666660]">
            Par volume de commandes et chiffre d'affaires
          </p>
        </div>
        <Link
          href={`/app/${storeSlug}/produits`}
          className="text-xs font-bold text-[#111111] hover:underline inline-flex items-center gap-0.5"
        >
          Voir tout <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Liste des produits */}
      <div className="mt-4 divide-y divide-black/[0.06]">
        {products.map((product, index) => {
          const percentage = Math.round((product.revenue / maxRevenue) * 100);

          return (
            <div
              key={product.id}
              className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 text-center text-xs font-black text-[#111111] group-hover:scale-105 transition-transform">
                  #{index + 1}
                </span>

                <ProductThumb
                  src={product.image}
                  alt={product.name}
                  size={42}
                  className="rounded-xl border-black/[0.08] bg-white group-hover:border-black/20 transition-colors"
                />

                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#111111] truncate group-hover:underline transition-colors">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#666660] mt-0.5">
                    <span>{product.category}</span>
                    <span>·</span>
                    <span className="font-semibold text-[#111111]">
                      {product.unitsSold} vendus
                    </span>
                    <span>·</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded font-medium text-[10px]",
                        product.stock <= 15
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-black/[0.04] text-[#666660]"
                      )}
                    >
                      Stock : {product.stock}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chiffre d'affaires & barre */}
              <div className="text-right shrink-0">
                <div className="text-xs font-black text-[#111111]">
                  <Money value={product.revenue} />
                </div>
                <div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-black/[0.06] ml-auto">
                  <div
                    style={{ width: `${percentage}%` }}
                    className="h-full rounded-full bg-[#111111]"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
