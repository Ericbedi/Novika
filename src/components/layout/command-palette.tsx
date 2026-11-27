"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  User,
  Package,
  ArrowRight,
  X,
  CornerDownLeft,
  Calendar,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { MOCK_CUSTOMERS } from "@/mock-data/customers";
import { MOCK_PRODUCTS } from "@/mock-data/products";

interface SearchResultItem {
  id: string;
  category: "Commandes" | "Clients" | "Produits";
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  basePath: string;
}

export function CommandPalette({ isOpen, onClose, basePath }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automatique à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounce de 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setSelectedIndex(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Écoute des touches de navigation (Flèches, Entrée, Échap)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtrage des résultats groupés
  const q = debouncedQuery.toLowerCase();

  const matchedOrders: SearchResultItem[] = MOCK_ORDERS.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      (o.city && o.city.toLowerCase().includes(q))
  ).slice(0, 4).map((o) => ({
    id: o.id,
    category: "Commandes",
    title: `#${o.orderNumber} — ${o.customerName}`,
    subtitle: `${o.totalAmount.toLocaleString("fr-FR")} FCFA · ${o.city || "Lomé"}`,
    href: `${basePath}/commandes/${o.id}`,
    badge: o.status,
  }));

  const matchedCustomers: SearchResultItem[] = (MOCK_CUSTOMERS || []).filter(
    (c: any) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
  ).slice(0, 3).map((c: any) => ({
    id: c.id,
    category: "Clients",
    title: c.name,
    subtitle: `${c.phone || ""} · ${c.city || "Abidjan"}`,
    href: `${basePath}/commandes?customer=${encodeURIComponent(c.name)}`,
  }));

  const matchedProducts: SearchResultItem[] = MOCK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
  ).slice(0, 3).map((p) => ({
    id: p.id,
    category: "Produits",
    title: p.name,
    subtitle: `${(p.salePrice || 0).toLocaleString("fr-FR")} FCFA · ${p.category || "Beauté"}`,
    href: `${basePath}/produits/${p.id}`,
  }));

  const allResults = [...matchedOrders, ...matchedCustomers, ...matchedProducts];

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    router.push(item.href);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (allResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = allResults[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    }
  };

  const getCategoryIcon = (category: SearchResultItem["category"]) => {
    switch (category) {
      case "Commandes":
        return <ShoppingBag className="h-3.5 w-3.5 text-[#C2410C]" />;
      case "Clients":
        return <User className="h-3.5 w-3.5 text-blue-600" />;
      case "Produits":
        return <Package className="h-3.5 w-3.5 text-emerald-600" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Palette de recherche"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl bg-[#FAF8F5] border border-black/10 shadow-2xl overflow-hidden flex flex-col text-[#111111] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Champ de saisie supérieur */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.08] bg-white">
          <Search className="h-5 w-5 text-[#888880] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Rechercher une commande, un client, un colis..."
            className="w-full text-sm bg-transparent outline-none placeholder:text-[#888880] text-[#111111] font-medium"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-black/[0.06] text-[#888880] border border-black/[0.08]">
              Échap
            </kbd>
          )}
        </div>

        {/* Liste des résultats groupés */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
          {debouncedQuery && allResults.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#888880]">
              Aucun résultat pour « {debouncedQuery} »
            </div>
          ) : (
            <>
              {/* Groupe Commandes */}
              {matchedOrders.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888880] flex items-center gap-1.5">
                    <ShoppingBag className="h-3 w-3 text-[#C2410C]" />
                    <span>Commandes</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {matchedOrders.map((item) => {
                      const globalIdx = allResults.findIndex((r) => r.id === item.id);
                      const isHighlighted = globalIdx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer",
                            isHighlighted
                              ? "bg-[#1F3A26] text-[#FAF8F5]"
                              : "hover:bg-black/[0.04] text-[#222220]"
                          )}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-bold block truncate">{item.title}</span>
                            <span
                              className={cn(
                                "text-[11px] block truncate",
                                isHighlighted ? "text-white/70" : "text-[#666660]"
                              )}
                            >
                              {item.subtitle}
                            </span>
                          </div>
                          <CornerDownLeft
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity",
                              isHighlighted && "opacity-100"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Groupe Clients */}
              {matchedCustomers.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888880] flex items-center gap-1.5">
                    <User className="h-3 w-3 text-blue-600" />
                    <span>Clients</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {matchedCustomers.map((item) => {
                      const globalIdx = allResults.findIndex((r) => r.id === item.id);
                      const isHighlighted = globalIdx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer",
                            isHighlighted
                              ? "bg-[#1F3A26] text-[#FAF8F5]"
                              : "hover:bg-black/[0.04] text-[#222220]"
                          )}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-bold block truncate">{item.title}</span>
                            <span
                              className={cn(
                                "text-[11px] block truncate",
                                isHighlighted ? "text-white/70" : "text-[#666660]"
                              )}
                            >
                              {item.subtitle}
                            </span>
                          </div>
                          <CornerDownLeft
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity",
                              isHighlighted && "opacity-100"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Groupe Produits */}
              {matchedProducts.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888880] flex items-center gap-1.5">
                    <Package className="h-3 w-3 text-emerald-600" />
                    <span>Produits</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {matchedProducts.map((item) => {
                      const globalIdx = allResults.findIndex((r) => r.id === item.id);
                      const isHighlighted = globalIdx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer",
                            isHighlighted
                              ? "bg-[#1F3A26] text-[#FAF8F5]"
                              : "hover:bg-black/[0.04] text-[#222220]"
                          )}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-bold block truncate">{item.title}</span>
                            <span
                              className={cn(
                                "text-[11px] block truncate",
                                isHighlighted ? "text-white/70" : "text-[#666660]"
                              )}
                            >
                              {item.subtitle}
                            </span>
                          </div>
                          <CornerDownLeft
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity",
                              isHighlighted && "opacity-100"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pied de navigation clavier */}
        <div className="px-4 py-2 border-t border-black/[0.08] bg-white/70 flex items-center justify-between text-[11px] text-[#666660]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded font-mono bg-black/[0.06] text-[#111111]">↑</kbd>{" "}
              <kbd className="px-1.5 py-0.5 rounded font-mono bg-black/[0.06] text-[#111111]">↓</kbd> Naviguer
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded font-mono bg-black/[0.06] text-[#111111]">Entrée</kbd> Ouvrir
            </span>
          </div>
          <span className="text-[10px] text-[#888880]">Confidentialité garantie</span>
        </div>
      </div>
    </div>
  );
}
