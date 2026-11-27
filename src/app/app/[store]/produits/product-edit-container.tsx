"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, PackageX } from "lucide-react";
import { Product } from "@/server/data/types";
import { getProductByShopAndSlugOrId } from "@/lib/products-store";
import { ProductFormClient } from "./product-form-client";

interface ProductEditContainerProps {
  storeSlug: string;
  productId: string;
  initialServerProduct?: Product | null;
}

/**
 * Conteneur d'édition de produit avec isolation stricte (Prompt 17-J).
 * 
 * GARANTIES :
 * 1. Filtrage strict par shop_id ET product_id.
 * 2. Si introuvable : écran d'erreur clair « Produit introuvable », JAMAIS de repli vers un autre produit.
 * 3. Réhydratation client si le produit a été créé dans le navigateur (localStorage).
 * 4. Remontage complet React garanti grâce à key={`${storeSlug}-${product.id}`}.
 */
export function ProductEditContainer({
  storeSlug,
  productId,
  initialServerProduct,
}: ProductEditContainerProps) {
  const [product, setProduct] = useState<Product | null>(initialServerProduct || null);
  const [hasCheckedClient, setHasCheckedClient] = useState<boolean>(Boolean(initialServerProduct));

  useEffect(() => {
    // Si déjà résolu par le serveur et que l'ID correspond
    if (initialServerProduct && (initialServerProduct.id === productId || initialServerProduct.slug === productId)) {
      setProduct(initialServerProduct);
      setHasCheckedClient(true);
      return;
    }

    // Récupération stricte côté client (localStorage ou mémoire)
    if (typeof window !== "undefined") {
      const found = getProductByShopAndSlugOrId({
        shopSlug: storeSlug,
        slugOrId: productId,
        allowDraft: true,
        includeDeleted: true,
      });

      setProduct(found || null);
      setHasCheckedClient(true);
    }
  }, [storeSlug, productId, initialServerProduct]);

  // Si la vérification client n'a pas encore eu lieu et aucun produit serveur
  if (!hasCheckedClient && !initialServerProduct) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-stone-800 animate-spin" />
      </div>
    );
  }

  // PRODUIT INTROUVABLE : ZÉRO repli silencieux
  if (!product) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6" data-testid="product-not-found-view">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-xs">
          <PackageX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            Erreur 404 — Boutique {storeSlug}
          </span>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
            Produit introuvable
          </h1>
          <p className="text-sm text-[#7A7A7A] max-w-md mx-auto leading-relaxed">
            Le produit demandé avec l'identifiant <code className="font-mono text-xs bg-stone-100 text-[#111111] px-2 py-0.5 rounded-lg border border-stone-200">{productId}</code> n'existe pas ou n'appartient pas à la boutique active (<strong className="text-[#111111]">{storeSlug}</strong>).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left text-xs text-amber-900 max-w-lg mx-auto flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-amber-950">Règle de sécurité Kelio :</strong>
            Pour éviter toute corruption de commande ou écrasement accidentel, Kelio n'affiche jamais un autre produit par défaut.
          </div>
        </div>

        <div>
          <Link
            href={`/app/${storeSlug}/produits`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1F3A26] text-white text-xs font-bold hover:bg-[#162B1C] transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au catalogue des produits</span>
          </Link>
        </div>
      </div>
    );
  }

  // Formulaire d'édition avec clé unique forçant le remontage complet
  return (
    <ProductFormClient
      key={`${storeSlug}-${product.id}`}
      storeSlug={storeSlug}
      initialProduct={product}
      isEditing={true}
    />
  );
}
