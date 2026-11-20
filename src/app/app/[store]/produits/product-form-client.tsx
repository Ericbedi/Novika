"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Clock,
  Flame,
  AlertCircle,
  Save,
  CheckCircle2,
  Search,
  Eye,
  Globe,
  Tag,
  Truck,
  HelpCircle,
  BarChart3,
  Video,
  GripVertical,
  CheckSquare,
  Square,
  Receipt as ReceiptIcon,
  Wand2,
  Lock,
  ArrowUp,
  ArrowDown,
  Star,
  RefreshCw,
  FileWarning,
  ShieldCheck,
  Pencil,
  ExternalLink,
} from "lucide-react";
import {
  Product,
  ProductVariant,
  QuantityOffer,
  ProductStatus,
  ProductMediaItem,
  OutOfStockProductOverride,
} from "@/server/data/types";
import {
  MAX_PRODUCT_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  validateProductImageFile,
  stripExifAndProcessImage,
  parseVideoUrl,
} from "@/lib/image-utils";
import { ProductImage, NeutralProductPlaceholder } from "@/components/ui/ProductImage";
import { ProductReceiptContent } from "@/server/data/receipt-types";
import { DEFAULT_RECEIPT_CONTENT } from "@/lib/receipts-engine";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { MOCK_SUPPLIERS } from "@/mock-data/suppliers";
import { MOCK_COLLECTIONS } from "@/mock-data/collections";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/layout/app-shell";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";
import { canTrashProduct } from "@/config/permissions";
import { softDeleteProduct } from "@/lib/products-store";

interface ProductFormClientProps {
  storeSlug: string;
  initialProduct?: Product | null;
  isEditing?: boolean;
}

export function ProductFormClient({
  storeSlug,
  initialProduct,
  isEditing = false,
}: ProductFormClientProps) {
  const router = useRouter();
  const { activeRole } = useApp();
  const isCloser = activeRole === "closer";

  // Form states
  const [name, setName] = useState(initialProduct?.name || "");
  const [description, setDescription] = useState(
    initialProduct?.description || ""
  );
  const [category, setCategory] = useState(initialProduct?.category || "Santé & Nutrition");
  const [productType, setProductType] = useState(initialProduct?.productType || "Standard");
  const [collection, setCollection] = useState(initialProduct?.collection || "Général");
  const [supplierId, setSupplierId] = useState(initialProduct?.supplierId || "sup_01");
  const [tagsInput, setTagsInput] = useState(initialProduct?.tags ? initialProduct.tags.join(", ") : "");
  const [template, setTemplate] = useState(initialProduct?.template || "Par défaut");

  // Media (Prompt 15)
  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>(() => {
    if (initialProduct?.mediaItems && initialProduct.mediaItems.length > 0) {
      return initialProduct.mediaItems;
    }
    if (initialProduct?.images && initialProduct.images.length > 0) {
      return initialProduct.images.map((img, idx) => ({
        id: `img-${idx}-${Date.now()}`,
        url: img,
        alt: `${initialProduct.title || initialProduct.name || "Produit"} - Vue ${idx + 1}`,
        isPrimary: idx === 0,
      }));
    }
    return [];
  });

  const [mediaList, setMediaList] = useState<string[]>(
    initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images
      : []
  );

  const [videoUrl, setVideoUrl] = useState<string>(initialProduct?.videoUrl || "");
  const [showVideoInput, setShowVideoInput] = useState<boolean>(Boolean(initialProduct?.videoUrl));
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [editingAltItem, setEditingAltItem] = useState<{ id: string; alt: string } | null>(null);
  const [uploadQueue, setUploadQueue] = useState<
    Array<{
      id: string;
      fileName: string;
      progress: number;
      error?: string;
      file?: File;
    }>
  >([]);
  const [draggedMediaIndex, setDraggedMediaIndex] = useState<number | null>(null);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);
  const [confirmedImageRights, setConfirmedImageRights] = useState<boolean>(true);
  const [mediaErrorMessage, setMediaErrorMessage] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const replaceFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageFiles = async (files: FileList | File[]) => {
    setMediaErrorMessage(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const availableSlots = MAX_PRODUCT_IMAGES - mediaItems.length;
    if (availableSlots <= 0) {
      setMediaErrorMessage(`Limite maximale atteinte (${MAX_PRODUCT_IMAGES} images max).`);
      return;
    }

    const filesToProcess = fileArray.slice(0, availableSlots);
    if (fileArray.length > availableSlots) {
      setMediaErrorMessage(
        `Seuls les ${availableSlots} premiers fichiers ont été acceptés (maximum 20 images).`
      );
    }

    // Ajouter à la queue d'upload avec progression
    const newQueueItems = filesToProcess.map((f, i) => ({
      id: `queue-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      fileName: f.name,
      progress: 20,
      file: f,
    }));
    setUploadQueue((prev) => [...prev, ...newQueueItems]);

    for (const qItem of newQueueItems) {
      const file = qItem.file!;
      const validation = validateProductImageFile(file);

      if (!validation.valid) {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === qItem.id
              ? { ...item, progress: 100, error: validation.error || "Fichier invalide" }
              : item
          )
        );
        continue;
      }

      setUploadQueue((prev) =>
        prev.map((item) => (item.id === qItem.id ? { ...item, progress: 65 } : item))
      );

      try {
        const cleanDataUrl = await stripExifAndProcessImage(file);

        setUploadQueue((prev) => prev.filter((item) => item.id !== qItem.id));

        setMediaItems((prev) => {
          const nextIndex = prev.length;
          const updated: ProductMediaItem[] = [
            ...prev,
            {
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              url: cleanDataUrl,
              alt: `${name.trim() || "Produit"} - Vue ${nextIndex + 1}`,
              isPrimary: prev.length === 0,
            },
          ];
          setMediaList(updated.map((m) => m.url));
          return updated;
        });
      } catch (err: any) {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === qItem.id
              ? { ...item, progress: 100, error: err?.message || "Erreur de traitement" }
              : item
          )
        );
      }
    }
  };

  const handleRetryUpload = async (queueId: string) => {
    const queueItem = uploadQueue.find((q) => q.id === queueId);
    if (!queueItem || !queueItem.file) return;

    setUploadQueue((prev) =>
      prev.map((item) => (item.id === queueId ? { ...item, progress: 40, error: undefined } : item))
    );

    try {
      const cleanDataUrl = await stripExifAndProcessImage(queueItem.file);
      setUploadQueue((prev) => prev.filter((item) => item.id !== queueId));
      setMediaItems((prev) => {
        const updated: ProductMediaItem[] = [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: cleanDataUrl,
            alt: `${name.trim() || "Produit"} - Vue ${prev.length + 1}`,
            isPrimary: prev.length === 0,
          },
        ];
        setMediaList(updated.map((m) => m.url));
        return updated;
      });
    } catch (err: any) {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === queueId
            ? { ...item, progress: 100, error: err?.message || "Échec du nouvel essai" }
            : item
        )
      );
    }
  };

  const handleRemoveQueueItem = (queueId: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== queueId));
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || replaceTargetIndex === null) return;
    const file = e.target.files[0];
    const validation = validateProductImageFile(file);
    if (!validation.valid) {
      setMediaErrorMessage(validation.error || "Fichier invalide");
      return;
    }

    try {
      const cleanDataUrl = await stripExifAndProcessImage(file);
      setMediaItems((prev) => {
        const next = [...prev];
        if (next[replaceTargetIndex]) {
          next[replaceTargetIndex] = {
            ...next[replaceTargetIndex],
            url: cleanDataUrl,
          };
        }
        setMediaList(next.map((m) => m.url));
        return next;
      });
    } catch {
      setMediaErrorMessage("Erreur lors du remplacement de l'image.");
    } finally {
      setReplaceTargetIndex(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  };

  const setAsPrimary = (index: number) => {
    if (index === 0 || index >= mediaItems.length) return;
    setMediaItems((prev) => {
      const item = prev[index];
      const without = prev.filter((_, i) => i !== index);
      const next = [{ ...item, isPrimary: true }, ...without.map((m) => ({ ...m, isPrimary: false }))];
      setMediaList(next.map((m) => m.url));
      return next;
    });
  };

  const moveMedia = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= mediaItems.length || toIndex >= mediaItems.length) return;
    setMediaItems((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      const reindexed = copy.map((m, idx) => ({ ...m, isPrimary: idx === 0 }));
      setMediaList(reindexed.map((m) => m.url));
      return reindexed;
    });
  };

  const deleteMedia = (index: number) => {
    setMediaItems((prev) => {
      const next = prev.filter((_, i) => i !== index).map((m, idx) => ({ ...m, isPrimary: idx === 0 }));
      setMediaList(next.map((m) => m.url));
      return next;
    });
  };

  const deleteSelectedMedia = () => {
    if (selectedMediaIds.length === 0) return;
    setMediaItems((prev) => {
      const next = prev.filter((m) => !selectedMediaIds.includes(m.id)).map((m, idx) => ({ ...m, isPrimary: idx === 0 }));
      setMediaList(next.map((m) => m.url));
      return next;
    });
    setSelectedMediaIds([]);
  };

  const toggleSelectMedia = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllMedia = () => {
    if (selectedMediaIds.length === mediaItems.length) {
      setSelectedMediaIds([]);
    } else {
      setSelectedMediaIds(mediaItems.map((m) => m.id));
    }
  };

  const updateMediaVariant = (index: number, variantId: string) => {
    setMediaItems((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], variantId: variantId || undefined };
      }
      return next;
    });
  };

  const saveAltText = (id: string, newAlt: string) => {
    setMediaItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, alt: newAlt } : m))
    );
    setEditingAltItem(null);
  };

  // Pricing
  const [salePrice, setSalePrice] = useState<number>(initialProduct?.salePrice || 0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(
    initialProduct?.compareAtPrice
  );
  const [costPrice, setCostPrice] = useState<number>(initialProduct?.costPrice || 0);
  const [chargeTax, setChargeTax] = useState<boolean>(initialProduct?.chargeTax ?? false);

  // Inventory tracking
  const [trackStock, setTrackStock] = useState<boolean>(initialProduct?.trackStock ?? true);
  const [sku, setSku] = useState(initialProduct?.sku || "");
  const [barcode, setBarcode] = useState(initialProduct?.barcode || "");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(
    initialProduct?.lowStockThreshold ?? 10
  );
  const [outOfStockVisibilityOverride, setOutOfStockVisibilityOverride] =
    useState<OutOfStockProductOverride>(
      initialProduct?.outOfStockVisibilityOverride || "store_default"
    );

  // Physical product & shipping
  const [isPhysical, setIsPhysical] = useState<boolean>(initialProduct?.isPhysical ?? true);
  const [weightKg, setWeightKg] = useState<number>(initialProduct?.weightKg || 0.2);

  // Variants
  const [hasVariants, setHasVariants] = useState<boolean>(
    (initialProduct?.variants && initialProduct.variants.length > 1) ?? false
  );
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialProduct?.variants && initialProduct.variants.length > 0
      ? initialProduct.variants
      : []
  );

  // Quantity offers (COD packs)
  const [quantityOffers, setQuantityOffers] = useState<QuantityOffer[]>(
    initialProduct?.quantityOffers && initialProduct.quantityOffers.length > 0
      ? initialProduct.quantityOffers
      : []
  );

  // Status & Publishing
  const [productStatus, setProductStatus] = useState<ProductStatus>(
    initialProduct?.productStatus || (initialProduct?.stock && initialProduct.stock > 0 ? "active" : "draft")
  );
  const [hiddenFromCatalog, setHiddenFromCatalog] = useState<boolean>(
    initialProduct?.hiddenFromCatalog ?? false
  );
  const [publishedChannels, setPublishedChannels] = useState<string[]>(
    initialProduct?.publishedChannels || ["Boutique en ligne", "WhatsApp Catalogue", "TikTok Ads"]
  );

  // SEO Preview
  const [seoTitle, setSeoTitle] = useState(
    initialProduct?.seo?.title || (name ? `${name} - Meilleur Prix en Afrique` : "Acheter en ligne")
  );
  const [seoDescription, setSeoDescription] = useState(
    initialProduct?.seo?.description ||
      "Commandez au meilleur prix avec livraison express et paiement sécurisé à la réception partout en Afrique de l'Ouest."
  );
  const [seoSlug, setSeoSlug] = useState(
    initialProduct?.seo?.slug || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "produit-cod")
  );

  // Sales summary (from initial or realistic mock)
  const salesSummary = initialProduct?.salesSummary || {
    unitsSold: 284,
    unitsDelivered: 236,
    deliveryRate: 83.1,
    netSales: 5876400,
  };

  // Unsaved changes detection
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronisation avec les données enregistrées dans le store local si produit personnalisé
  useEffect(() => {
    if (typeof window !== "undefined" && isEditing && initialProduct?.id) {
      try {
        const saved = localStorage.getItem(`novika_store_products_${storeSlug}`);
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            const found = list.find((p) => p && (p.id === initialProduct.id || p.slug === initialProduct.id));
            if (found) {
              if (found.name || found.title) setName(found.name || found.title);
              if (found.description !== undefined) setDescription(found.description);
              if (found.category) setCategory(found.category);
              if (found.productType || found.type) setProductType(found.productType || found.type);
              if (found.collection) setCollection(found.collection);
              if (found.supplierId) setSupplierId(found.supplierId);
              if (found.images && Array.isArray(found.images) && found.images.length > 0) setMediaList(found.images);
              if (found.salePrice !== undefined) setSalePrice(found.salePrice);
              if (found.compareAtPrice !== undefined) setCompareAtPrice(found.compareAtPrice);
              if (found.costPrice !== undefined) setCostPrice(found.costPrice);
              if (found.sku !== undefined) setSku(found.sku);
              if (found.barcode !== undefined) setBarcode(found.barcode);
              if (found.variants && Array.isArray(found.variants) && found.variants.length > 0) {
                setVariants(found.variants);
                setHasVariants(found.variants.length > 1);
              }
              if (found.productStatus) setProductStatus(found.productStatus);
              if (found.hiddenFromCatalog !== undefined) setHiddenFromCatalog(Boolean(found.hiddenFromCatalog));
            }
          }
        }
      } catch {}
    }
  }, [storeSlug, isEditing, initialProduct?.id]);

  // Onglets du formulaire : Général vs Contenu du reçu
  const [activeFormTab, setActiveFormTab] = useState<"general" | "receipt">("general");
  const [receiptLanguage, setReceiptLanguage] = useState<string>("fr");
  const [receiptContent, setReceiptContent] = useState<ProductReceiptContent>(
    initialProduct?.receiptContent || {
      ...DEFAULT_RECEIPT_CONTENT,
      shortWhatsAppLine: "Pensez à bien refermer l'emballage après chaque usage.",
    }
  );

  // Vérification de la catégorie pour avertissement santé
  const isHealthCategory = useMemo(() => {
    const c = `${category} ${productType}`.toLowerCase();
    return (
      c.includes("santé") ||
      c.includes("nutrition") ||
      c.includes("complément") ||
      c.includes("minceur") ||
      c.includes("détox") ||
      c.includes("soin")
    );
  }, [category, productType]);

  // Génération de brouillon IA pour le contenu du reçu
  const handleGenerateAiReceiptDraft = () => {
    setReceiptContent((prev) => ({
      ...prev,
      usageInstructions: `Prendre 1 dose chaque matin avec un grand verre d'eau. Respecter la posologie indiquée sur la boîte.`,
      precautions: isHealthCategory
        ? `Complément alimentaire naturel. Ne remplace pas une alimentation équilibrée. Tenir hors de portée des jeunes enfants. En cas de traitement en cours, demander l'avis d'un professionnel.`
        : `Usage externe uniquement. Conserver dans un endroit sec à l'abri de la lumière.`,
      warranty: `Garantie d'authenticité et de conformité fabricant 14 jours.`,
      returnTerms: `Échange gratuit sous 48h ouvrées si le sceau de sécurité est intact et le colis retourné au livreur.`,
      careAdvice: `À conserver dans son emballage d'origine fermé, à température ambiante (< 28°C).`,
      thankYouNote: `Merci chaleureusement pour votre commande sur notre boutique ! Nous mettons tout en œuvre pour vous offrir des produits authentiques et un service de livraison irréprochable.`,
      shortWhatsAppLine: `Bien agiter avant emploi et conserver à l'abri de la chaleur.`,
      includeReviewLink: true,
    }));
    setIsDirty(true);
    setToastMessage("Brouillon IA généré et validé sans allégation médicale !");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Monitor modifications
  useEffect(() => {
    setIsDirty(true);
  }, [
    name,
    description,
    category,
    productType,
    collection,
    supplierId,
    tagsInput,
    template,
    salePrice,
    compareAtPrice,
    costPrice,
    chargeTax,
    trackStock,
    sku,
    barcode,
    lowStockThreshold,
    isPhysical,
    weightKg,
    variants,
    quantityOffers,
    productStatus,
    publishedChannels,
    seoTitle,
    seoDescription,
    seoSlug,
  ]);

  // Reset dirty flag on initial mount
  useEffect(() => {
    setIsDirty(false);
  }, []);

  // Calculated live margins
  const marginFcfa = salePrice - costPrice;
  const marginPct = salePrice > 0 ? ((marginFcfa / salePrice) * 100).toFixed(1) : "0.0";

  // Handlers for variants
  const handleAddVariant = () => {
    const nextIdx = variants.length + 1;
    setVariants((prev) => [
      ...prev,
      {
        id: `var_${Date.now()}`,
        name: `Option #${nextIdx}`,
        price: salePrice,
        costPrice: costPrice,
        stock: 20,
        sku: `${sku || "VAR"}-${nextIdx}`,
        barcode: "",
      },
    ]);
  };

  const handleUpdateVariant = (id: string, field: keyof ProductVariant, val: any) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: val } : v))
    );
  };

  const handleDeleteVariant = (id: string) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  // Handlers for quantity offers
  const handleAddOffer = () => {
    const nextQty = quantityOffers.length + 1;
    setQuantityOffers((prev) => [
      ...prev,
      {
        id: `qo_${Date.now()}`,
        quantity: nextQty,
        unitPrice: Math.round(salePrice * 0.9),
        totalPrice: Math.round(salePrice * 0.9 * nextQty),
        badgeText: `Pack ${nextQty}`,
      },
    ]);
  };

  const handleUpdateOffer = (id: string, field: keyof QuantityOffer, val: any) => {
    setQuantityOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: val } : o))
    );
  };

  const handleDeleteOffer = (id: string) => {
    setQuantityOffers((prev) => prev.filter((o) => o.id !== id));
  };

  // Toggle channel
  const toggleChannel = (channel: string) => {
    setPublishedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  // Save handler
  const handleSave = () => {
    if (!confirmedImageRights) {
      alert("Veuillez confirmer que vous avez les droits d'utilisation sur les visuels avant d'enregistrer.");
      return;
    }

    const newId = initialProduct?.id || `prod_${Date.now()}`;
    const productSlug = seoSlug || (name.trim() || "produit").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const numSalePrice = Number(salePrice) || 0;
    const numCostPrice = Number(costPrice) || 0;
    const numCompare = compareAtPrice ? Number(compareAtPrice) : undefined;
    const numStock = variants.length > 0 ? variants.reduce((s, v) => s + (v.stock || 0), 0) : 10;
    const numLowStock = Number(lowStockThreshold) || 10;

    const currentImages =
      mediaItems.length > 0
        ? mediaItems.map((m) => m.url)
        : mediaList.length > 0
        ? mediaList
        : ["/products/mushroom-coffee.png"];

    const savedProduct: Product = {
      id: newId,
      name: name.trim() || "Nouveau produit",
      title: name.trim() || "Nouveau produit",
      slug: productSlug,
      description,
      category,
      collection,
      productType,
      images: currentImages,
      mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
      videoUrl: videoUrl.trim() || undefined,
      salePrice: numSalePrice,
      price: numSalePrice,
      compareAtPrice: numCompare,
      costPrice: numCostPrice,
      marginAmount: numSalePrice - numCostPrice,
      marginPercent: numSalePrice > 0 ? Math.round(((numSalePrice - numCostPrice) / numSalePrice) * 100) : 0,
      chargeTax,
      trackStock,
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode,
      lowStockThreshold: numLowStock,
      isPhysical,
      weightKg,
      stock: numStock,
      availableStock: numStock,
      physicalStock: numStock,
      reservedStock: 0,
      status: productStatus,
      productStatus,
      hiddenFromCatalog,
      outOfStockVisibilityOverride,
      stockStatus: numStock === 0 ? "out_of_stock" : numStock <= numLowStock ? "low_stock" : "in_stock",
      supplierId,
      variants,
      quantityOffers,
      badgesConfig: initialProduct?.badgesConfig || {
        hasCountdown: false,
        countdownMinutes: 60,
        hasComparePrice: false,
        hasLowStockWarning: false,
        lowStockThreshold: 10,
        hasQuantityPacks: false,
      },
      receiptContent,
      salesVelocity: initialProduct?.salesVelocity || 0,
      daysOfStock: numStock > 0 ? 30 : 0,
      abcClass: "A",
      publishedChannels,
      seo: {
        title: seoTitle,
        description: seoDescription,
        slug: productSlug,
      },
      createdAt: initialProduct?.createdAt || new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      const storageKey = `novika_store_products_${storeSlug}`;
      const saved = localStorage.getItem(storageKey);
      let list: Product[] = [];
      if (saved) {
        try {
          list = JSON.parse(saved);
        } catch {}
      }
      if (isEditing) {
        list = list.map((p) => (p.id === newId ? savedProduct : p));
      } else {
        list = [savedProduct, ...list];
      }
      localStorage.setItem(storageKey, JSON.stringify(list));
    }

    setIsDirty(false);
    setToastMessage("Fiche produit enregistrée avec succès ! Redirection...");
    setTimeout(() => {
      router.push(`/app/${storeSlug}/produits`);
    }, 800);
  };

  const handleDeleteProduct = () => {
    if (!initialProduct) return;
    if (!canTrashProduct(activeRole)) {
      alert("Action non autorisée pour votre rôle.");
      return;
    }
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir déplacer « ${name || "ce produit"} » dans la corbeille ? Il sera immédiatement masqué de votre vitrine.`
    );
    if (!confirmed) return;

    softDeleteProduct(storeSlug, initialProduct.id, activeRole);
    router.push(`/app/${storeSlug}/produits`);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Navigation 5 Onglets */}
      <ProductsNavTabs storeSlug={storeSlug} />

      {/* Barre supérieure : Retour & Titre */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/app/${storeSlug}/produits`}
            className="p-2 rounded-xl bg-white border border-[#E6E0D4] hover:bg-[#F3EFE6] transition-colors text-[#111111]"
            title="Retour à la liste"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
                {isEditing ? "Édition Produit" : "Nouveau Produit"}
              </span>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                  productStatus === "active"
                    ? "bg-emerald-100 text-emerald-800"
                    : productStatus === "draft"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-stone-200 text-stone-700"
                )}
              >
                {productStatus === "active" ? "Actif" : productStatus === "draft" ? "Brouillon" : "Archivé"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              {name || "Nouveau produit"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Bouton Voir sur la boutique avec Icône d'œil */}
          <div className="relative">
            <a
              id="btn-product-view-public"
              href={
                productStatus === "active"
                  ? `/boutique/${storeSlug}/produit/${initialProduct?.id || "prod_01"}`
                  : `/boutique/${storeSlug}/apercu/produit/${initialProduct?.id || "prod_01"}`
              }
              target="_blank"
              rel="noopener noreferrer"
              title={
                isDirty
                  ? "Enregistrez pour voir les changements"
                  : productStatus === "active"
                  ? "Voir sur la boutique"
                  : "Brouillon : l'aperçu est privé"
              }
              aria-label={`Voir ${name || "le produit"} sur la boutique (s'ouvre dans un nouvel onglet)`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/[0.1] bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.04] transition-all shadow-2xs min-h-[36px]"
            >
              <Eye className="w-4 h-4 text-[#666660]" />
              <span>Voir sur la boutique</span>
            </a>
            {isDirty && (
              <span
                id="badge-unsaved-warning"
                className="absolute -bottom-5 right-0 text-[10px] text-amber-800 font-bold whitespace-nowrap bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shadow-2xs"
              >
                Enregistrez pour voir les changements
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer min-h-[36px]"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>

      {/* Toast de confirmation */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SÉLECTEUR D'ONGLETS : FICHE PRODUIT vs CONTENU DU REÇU */}
      <div className="flex items-center gap-2 border-b border-black/[0.08] pb-1 pt-2">
        <button
          type="button"
          id="tab-btn-product-general"
          onClick={() => setActiveFormTab("general")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeFormTab === "general"
              ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
              : "text-[#666660] hover:text-[#111111] hover:bg-black/[0.03]"
          )}
        >
          <Package className="w-4 h-4" />
          <span>Fiche Produit (Général & Tarifs)</span>
        </button>

        <button
          type="button"
          id="tab-product-receipt-content"
          onClick={() => setActiveFormTab("receipt")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative",
            activeFormTab === "receipt"
              ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
              : "text-[#666660] hover:text-[#111111] hover:bg-black/[0.03]"
          )}
        >
          <ReceiptIcon className="w-4 h-4" />
          <span>Contenu du reçu</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
            Nouveau
          </span>
        </button>
      </div>

      {/* ONGLET 1 : FICHE PRODUIT STANDARD (DISPOSITION 2 COLONNES STYLE SHOPIFY) */}
      {activeFormTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ======================================================== */}
        {/* COLONNE PRINCIPALE (2 Tiers) */}
        {/* ======================================================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bloc 1 : Titre et Description */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Titre du produit <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!isEditing) {
                    setSeoTitle(`${e.target.value} - Meilleur Prix`);
                    setSeoSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }
                }}
                placeholder="Ex: Café Bio Champignon Vitality (Pack 2 boîtes)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-sm font-semibold text-[#111111] placeholder:text-[#999990] focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Description (Éditeur riche)
              </label>
              <div className="border border-black/[0.08] rounded-xl overflow-hidden bg-white">
                <div className="flex items-center gap-1 p-2 border-b border-black/[0.06] bg-[#F5F2EA] text-xs font-bold text-[#666660]">
                  <button type="button" className="px-2 py-1 rounded hover:bg-black/5 font-bold">B</button>
                  <button type="button" className="px-2 py-1 rounded hover:bg-black/5 italic">I</button>
                  <button type="button" className="px-2 py-1 rounded hover:bg-black/5 underline">U</button>
                  <span className="w-px h-4 bg-black/10 mx-1" />
                  <button type="button" className="px-2 py-1 rounded hover:bg-black/5">• Liste</button>
                  <button type="button" className="px-2 py-1 rounded hover:bg-black/5">1. Num</button>
                  <span className="w-px h-4 bg-black/10 mx-1" />
                  <button type="button" className="px-2 py-1 rounded hover:bg-black/5">🔗 Lien</button>
                  <button type="button" className="px-2 py-1 rounded hover:bg-black/5">📷 Média</button>
                </div>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 text-xs text-[#111111] focus:outline-none resize-y placeholder:text-[#999990]"
                  placeholder="Décrivez les bénéfices clés, ingrédients, mode d'utilisation et réassurance COD..."
                />
              </div>
            </div>
          </div>

          {/* Bloc 2 : Médias (Images & Vidéos) - Prompt 15 */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleImageFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={replaceFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={handleReplaceFileChange}
            />

            {/* En-tête Médias & Compteur */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#111111]">Médias du produit</h3>
                  <span
                    data-testid="media-counter"
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide",
                      mediaItems.length >= MAX_PRODUCT_IMAGES
                        ? "bg-amber-600 text-white"
                        : "bg-[#111111] text-white"
                    )}
                  >
                    {mediaItems.length} / {MAX_PRODUCT_IMAGES} images
                  </span>
                </div>
                <p className="text-xs text-[#666660] mt-0.5">
                  Glissez-déposez jusqu'à {MAX_PRODUCT_IMAGES} visuels (JPG, PNG, WebP, max 5 Mo). La première image est l'image principale.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVideoInput(!showVideoInput)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer",
                    showVideoInput || videoUrl
                      ? "border-[#111111] bg-[#111111] text-white"
                      : "border-black/[0.08] bg-white text-[#111111] hover:bg-black/[0.03]"
                  )}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{showVideoInput || videoUrl ? "Vidéo active" : "Ajouter vidéo"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url = prompt("Entrez l'URL de l'image (ex: https://.../image.webp) :");
                    if (url && url.trim()) {
                      if (mediaItems.length >= MAX_PRODUCT_IMAGES) {
                        alert(`Limite de ${MAX_PRODUCT_IMAGES} images atteinte.`);
                        return;
                      }
                      setMediaItems((prev) => {
                        const updated: ProductMediaItem[] = [
                          ...prev,
                          {
                            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                            url: url.trim(),
                            alt: `${name.trim() || "Produit"} - Vue ${prev.length + 1}`,
                            isPrimary: prev.length === 0,
                          },
                        ];
                        setMediaList(updated.map((m) => m.url));
                        return updated;
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.03] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter URL</span>
                </button>
              </div>
            </div>

            {/* Avertissement réglementaire & conformité publicitaire (Non bloquant) */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Recommandation conformité & plateformes publicitaires :</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Vérifiez que vos visuels respectent les règles des plateformes publicitaires et la loi (allégations de santé, avant/après non trompeurs, droits d'auteur).
                </p>
              </div>
            </div>

            {/* Message d'erreur média ponctuel */}
            {mediaErrorMessage && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{mediaErrorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaErrorMessage(null)}
                  className="text-rose-600 hover:text-rose-900 font-bold ml-2"
                >
                  Fermer
                </button>
              </div>
            )}

            {/* Barre d'action groupée (si sélection multiple) */}
            {selectedMediaIds.length > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111111] text-white text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAllMedia}
                    className="hover:underline font-bold"
                  >
                    {selectedMediaIds.length === mediaItems.length
                      ? "Tout désélectionner"
                      : "Tout sélectionner"}
                  </button>
                  <span className="opacity-40">|</span>
                  <span className="font-medium">
                    {selectedMediaIds.length} image(s) sélectionnée(s)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={deleteSelectedMedia}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer la sélection</span>
                </button>
              </div>
            )}

            {/* Queue d'upload avec progression & statut d'erreur */}
            {uploadQueue.length > 0 && (
              <div className="space-y-2">
                {uploadQueue.map((q) => (
                  <div
                    key={q.id}
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs",
                      q.error
                        ? "bg-rose-50/70 border-rose-200 text-rose-900"
                        : "bg-white border-black/[0.08] text-[#111111]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold truncate max-w-xs">{q.fileName}</span>
                        <span className="font-mono text-[10px] text-[#666660]">
                          {q.error ? "Échec" : `${q.progress}%`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            q.error ? "bg-rose-500" : "bg-[#111111]"
                          )}
                          style={{ width: `${q.progress}%` }}
                        />
                      </div>
                      {q.error && (
                        <p className="text-[11px] text-rose-600 mt-1">{q.error}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {q.error && (
                        <button
                          type="button"
                          onClick={() => handleRetryUpload(q.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Réessayer</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveQueueItem(q.id)}
                        className="p-1 rounded-lg text-[#666660] hover:text-rose-600"
                        title="Annuler"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grille des médias (Glisser-déposer desktop, boutons monter/descendre mobile, remplacement, variantes) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {mediaItems.map((med, idx) => {
                const isSelected = selectedMediaIds.includes(med.id);
                const isPrimary = idx === 0;

                return (
                  <div
                    key={med.id}
                    draggable
                    onDragStart={() => setDraggedMediaIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedMediaIndex !== null && draggedMediaIndex !== idx) {
                        moveMedia(draggedMediaIndex, idx);
                        setDraggedMediaIndex(null);
                      }
                    }}
                    className={cn(
                      "group relative rounded-2xl border bg-white flex flex-col justify-between overflow-hidden transition-all shadow-2xs select-none",
                      isSelected
                        ? "border-[#111111] ring-2 ring-[#111111]"
                        : "border-black/[0.08] hover:border-black/20",
                      draggedMediaIndex === idx && "opacity-40"
                    )}
                  >
                    {/* Zone Visuel Image */}
                    <div className="relative aspect-square w-full bg-[#EFECE6] overflow-hidden">
                      <ProductImage
                        src={med.url}
                        alt={med.alt || `${name} - Image ${idx + 1}`}
                        fill
                        fallbackLabel={`#${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Checkbox sélection */}
                      <button
                        type="button"
                        onClick={() => toggleSelectMedia(med.id)}
                        className="absolute top-2 left-2 z-10 p-1 rounded-lg bg-white/90 backdrop-blur-xs text-[#111111] shadow-xs cursor-pointer hover:bg-white"
                        title={isSelected ? "Désélectionner" : "Sélectionner"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#111111]" />
                        ) : (
                          <Square className="w-4 h-4 text-black/40" />
                        )}
                      </button>

                      {/* Badge Image Principale */}
                      {isPrimary && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-[#111111] text-white text-[9px] font-bold shadow-xs z-10">
                          Principale
                        </span>
                      )}

                      {/* Bouton rapide "Définir principale" si non-principale */}
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => setAsPrimary(idx)}
                          className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-white/90 hover:bg-[#111111] hover:text-white text-[9px] font-bold text-[#111111] shadow-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                          title="Définir comme image principale"
                        >
                          ★ Définir principale
                        </button>
                      )}

                      {/* Poignée de drag & drop au centre au hover */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="px-2 py-1 rounded-md bg-black/70 text-white text-[10px] font-semibold flex items-center gap-1">
                          <GripVertical className="w-3 h-3" />
                          Glisser pour réordonner
                        </span>
                      </div>
                    </div>

                    {/* Barre de contrôles sous l'image : Monter, Descendre, Remplacer, Alt, Supprimer */}
                    <div className="p-2 space-y-2 bg-[#FAF8F5] border-t border-black/[0.06]">
                      <div className="flex items-center justify-between text-xs">
                        {/* Boutons Monter / Descendre (accessibles mobile & desktop) */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveMedia(idx, idx - 1)}
                            className="p-1 rounded-md border border-black/[0.08] bg-white hover:bg-black/[0.04] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Monter d'un rang"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === mediaItems.length - 1}
                            onClick={() => moveMedia(idx, idx + 1)}
                            className="p-1 rounded-md border border-black/[0.08] bg-white hover:bg-black/[0.04] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Descendre d'un rang"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remplacer, Alt, Supprimer */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setReplaceTargetIndex(idx);
                              replaceFileInputRef.current?.click();
                            }}
                            className="p-1 rounded-md border border-black/[0.08] bg-white hover:bg-black/[0.04] text-[#111111] transition-colors"
                            title="Remplacer cette image"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAltItem({ id: med.id, alt: med.alt || "" })}
                            className="p-1 rounded-md border border-black/[0.08] bg-white hover:bg-black/[0.04] text-[#111111] transition-colors"
                            title="Modifier le texte alternatif (SEO/Accessibilité)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMedia(idx)}
                            className="p-1 rounded-md border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Supprimer cette image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Association optionnelle avec une variante */}
                      {variants.length > 0 && (
                        <div className="pt-1 border-t border-black/[0.04]">
                          <select
                            value={med.variantId || ""}
                            onChange={(e) => updateMediaVariant(idx, e.target.value)}
                            className="w-full text-[10px] font-medium py-1 px-1.5 rounded-lg border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                          >
                            <option value="">Toutes les variantes</option>
                            {variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                Liée à : {v.title || v.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Zone de dépôt (Dropzone d'upload) */}
              {mediaItems.length < MAX_PRODUCT_IMAGES && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files) {
                      handleImageFiles(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-black/[0.15] hover:border-[#111111] bg-white/60 hover:bg-white aspect-square flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-black/[0.04] group-hover:bg-[#111111] group-hover:text-white flex items-center justify-center transition-colors mb-2 text-[#888880]">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#111111]">
                    Glisser des photos
                  </span>
                  <span className="text-[10px] text-[#666660] mt-0.5">
                    ou parcourir
                  </span>
                  <span className="text-[9px] text-[#888880] mt-1 font-mono">
                    JPG, PNG, WebP · 5 Mo max
                  </span>
                </div>
              )}
            </div>

            {/* Slide Vidéo optionnel (YouTube, Vimeo, MP4 direct) */}
            {(showVideoInput || videoUrl) && (
              <div className="p-4 rounded-xl border border-black/[0.08] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#111111]" />
                    <label className="text-xs font-bold text-[#111111]">
                      Vidéo de démonstration du produit (slide dans la galerie)
                    </label>
                  </div>
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setVideoUrl("");
                        setShowVideoInput(false);
                      }}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Supprimer la vidéo
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..., Vimeo, ou lien direct .mp4"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>

                {videoUrl && (
                  <div className="text-[11px] flex items-center gap-2 text-[#666660]">
                    {(() => {
                      const parsed = parseVideoUrl(videoUrl);
                      if (parsed.type === "youtube") {
                        return (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Format YouTube valide
                          </span>
                        );
                      }
                      if (parsed.type === "vimeo") {
                        return (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Format Vimeo valide
                          </span>
                        );
                      }
                      if (parsed.type === "mp4") {
                        return (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Format vidéo direct valide
                          </span>
                        );
                      }
                      return (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          Lien vidéo non reconnu (fournissez un lien YouTube, Vimeo ou .mp4)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Modal édition Texte Alternatif (SEO/Accessibilité) */}
            {editingAltItem && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-black/[0.08] space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#111111]">
                      Texte alternatif de l'image (alt)
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingAltItem(null)}
                      className="text-[#666660] hover:text-[#111111]"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-[#666660]">
                    Décrivez ce que montre l'image pour le référencement naturel (SEO) et les lecteurs d'écran.
                  </p>
                  <input
                    type="text"
                    value={editingAltItem.alt}
                    onChange={(e) =>
                      setEditingAltItem((prev) => (prev ? { ...prev, alt: e.target.value } : null))
                    }
                    placeholder="Ex: Montre connectée noire vue de face avec écran allumé"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-black/[0.12] focus:outline-none focus:border-[#111111]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingAltItem(null)}
                      className="px-3 py-1.5 rounded-xl border border-black/[0.08] text-xs font-bold text-[#666660] hover:bg-black/[0.03]"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => saveAltText(editingAltItem.id, editingAltItem.alt)}
                      className="px-4 py-1.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black/80"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Case de confirmation obligatoire des droits d'images */}
            <div className="pt-2 border-t border-black/[0.06]">
              <label className="flex items-start gap-2.5 text-xs text-[#111111] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmedImageRights}
                  onChange={(e) => setConfirmedImageRights(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-black/20 text-[#111111] focus:ring-[#111111] cursor-pointer"
                />
                <span className="font-medium text-[#444440] leading-snug">
                  Je confirme avoir le droit d'utiliser ces images et vidéos pour la vente de ce produit.
                </span>
              </label>
            </div>
          </div>

          {/* Bloc 3 : Tarification & Calculateur de marge */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#111111]">Tarification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Prix de vente <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#888880]">
                    FCFA
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Prix avant réduction
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={compareAtPrice || ""}
                    onChange={(e) => setCompareAtPrice(Number(e.target.value) || undefined)}
                    placeholder="Prix barré"
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#888880]">
                    FCFA
                  </span>
                </div>
              </div>

              {!isCloser && (
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Coût par article (PUMP)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none focus:border-[#111111]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#888880]">
                      FCFA
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Marge calculée en direct */}
            {!isCloser && (
              <div className="rounded-xl border border-black/[0.06] bg-emerald-50/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-emerald-900 block">
                    Marge brute estimée par article :
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Les clients ne voient pas ce coût. Il alimente le module Finances COD.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-950">
                      +{formatFcfa(marginFcfa)}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-800">
                      Marge : {marginPct}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Facturer la taxe */}
            <div className="pt-2 border-t border-black/[0.06]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chargeTax}
                  onChange={(e) => setChargeTax(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#111111]">
                  Facturer la taxe sur ce produit (TVA zone UEMOA)
                </span>
              </label>
            </div>
          </div>

          {/* Bloc 4 : Inventaire et Suivi du stock */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#111111]">Inventaire & Stock</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackStock}
                  onChange={(e) => setTrackStock(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#111111]">
                  Suivre la quantité en stock pour ce produit
                </span>
              </label>

              {trackStock && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      SKU (Unité de gestion)
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Ex: CF-MUSH-02"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Code-barres (ISBN, UPC, GTIN)
                    </label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Ex: 693847291024"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Seuil de stock bas
                    </label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Surcharge visibilité rupture (Prompt 16-b) */}
              <div className="pt-3 border-t border-black/[0.06]">
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Comportement en cas de rupture sur la vitrine (Surcharge produit)
                </label>
                <select
                  value={outOfStockVisibilityOverride}
                  onChange={(e) =>
                    setOutOfStockVisibilityOverride(e.target.value as OutOfStockProductOverride)
                  }
                  data-testid="select-out-of-stock-override"
                  className="w-full sm:w-2/3 px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                >
                  <option value="store_default">
                    Suivre le réglage de la boutique (Par défaut)
                  </option>
                  <option value="always_show">
                    Toujours afficher (avec mention Rupture)
                  </option>
                  <option value="always_hide">
                    Toujours masquer de la vitrine en cas de rupture
                  </option>
                </select>
                <p className="text-[10px] text-[#888880] mt-1">
                  Permet de déroger exceptionnellement à la règle générale de la boutique pour cet article.
                </p>
              </div>
            </div>
          </div>

          {/* Bloc 5 : Expédition & Produit Physique */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#111111]">Expédition</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPhysical}
                  onChange={(e) => setIsPhysical(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#111111]">
                  C'est un produit physique (nécessite une livraison coursier/relais)
                </span>
              </label>

              {isPhysical && (
                <div className="w-full sm:w-1/2 pt-1">
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Poids de l'article (utilisé pour les tarifs d'expédition)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#888880]">
                      kg
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bloc 6 : Variantes (Options, Tailles, Combinaisons) */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Variantes</h3>
                <p className="text-xs text-[#666660]">
                  Gérez les options (ex: taille, couleur, formule) avec prix, stock et SKU par variante.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.03]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une variante</span>
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-black/[0.06] bg-white p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleUpdateVariant(v.id, "name", e.target.value)}
                      placeholder="Nom de la variante"
                      className="font-bold text-xs text-[#111111] px-2.5 py-1.5 rounded-lg border border-black/[0.08] bg-[#FAF8F5] flex-1"
                    />
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(v.id)}
                        className="text-rose-600 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#888880] font-bold block mb-0.5">Prix (FCFA)</span>
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => handleUpdateVariant(v.id, "price", Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg border border-black/[0.08] text-xs font-semibold"
                      />
                    </div>
                    {!isCloser && (
                      <div>
                        <span className="text-[10px] text-[#888880] font-bold block mb-0.5">Coût (FCFA)</span>
                        <input
                          type="number"
                          value={v.costPrice}
                          onChange={(e) => handleUpdateVariant(v.id, "costPrice", Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-black/[0.08] text-xs font-semibold"
                        />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-[#888880] font-bold block mb-0.5">Stock dispo</span>
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) => handleUpdateVariant(v.id, "stock", Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg border border-black/[0.08] text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#888880] font-bold block mb-0.5">SKU</span>
                      <input
                        type="text"
                        value={v.sku || ""}
                        onChange={(e) => handleUpdateVariant(v.id, "sku", e.target.value)}
                        placeholder="SKU-VAR"
                        className="w-full px-2 py-1.5 rounded-lg border border-black/[0.08] text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloc 7 : Offres de Quantité COD (Packs) */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Offres de Quantité COD</h3>
                <p className="text-xs text-[#666660]">
                  Multi-packs avec réductions pour doper le panier moyen sur vos formulaires de commande rapide.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddOffer}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.03]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une offre</span>
              </button>
            </div>

            <div className="space-y-3">
              {quantityOffers.map((qo) => (
                <div
                  key={qo.id}
                  className="rounded-xl border border-black/[0.06] bg-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-lg bg-[#111111] text-white flex items-center justify-center font-black">
                      {qo.quantity}x
                    </span>
                    <div>
                      <input
                        type="text"
                        value={qo.badgeText || ""}
                        onChange={(e) => handleUpdateOffer(qo.id, "badgeText", e.target.value)}
                        placeholder="Badge (ex: Populaire)"
                        className="px-2 py-1 rounded border border-black/[0.08] text-xs font-bold text-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] text-[#888880] block">Prix Total</span>
                      <input
                        type="number"
                        value={qo.totalPrice}
                        onChange={(e) => handleUpdateOffer(qo.id, "totalPrice", Number(e.target.value))}
                        className="w-28 px-2 py-1 rounded border border-black/[0.08] text-xs font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(qo.id)}
                      className="text-rose-600 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloc 8 : Aperçu Moteur de Recherche (SEO Google) */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#111111]">Aperçu Moteur de Recherche (SEO)</h3>
            <div className="rounded-xl border border-black/[0.08] bg-white p-4 space-y-1">
              <span className="text-xs text-[#1a0dab] font-medium hover:underline cursor-pointer block truncate font-sans">
                {seoTitle || "Titre du produit"}
              </span>
              <span className="text-[11px] text-[#006621] block font-sans">
                https://afribuilder.store/products/{seoSlug || "mon-produit"}
              </span>
              <p className="text-xs text-[#545454] line-clamp-2 font-sans pt-1">
                {seoDescription || "Aucune description SEO définie."}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Titre de la page</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Méta-description</label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-[#111111] rounded-xl border border-black/[0.08] bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">URL simplifiée (Slug)</label>
                <input
                  type="text"
                  value={seoSlug}
                  onChange={(e) => setSeoSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLONNE LATÉRALE (1 Tiers) */}
        {/* ======================================================== */}
        <div className="space-y-6">
          {/* Bloc Statut */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#111111]">Statut du produit</h3>
            <select
              value={productStatus}
              onChange={(e) => setProductStatus(e.target.value as ProductStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] focus:outline-none"
            >
              <option value="active">Actif (En ligne)</option>
              <option value="draft">Brouillon (Non visible)</option>
              <option value="archived">Archivé</option>
            </select>
            <p className="text-[11px] text-[#666660]">
              Un produit actif est disponible à l'achat sur les canaux sélectionnés.
            </p>
          </div>

          {/* Option Discrétion / Anti-Espion : Masquer du catalogue public */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#C2410C]" />
                <h3 className="text-sm font-bold text-[#111111]">Visibilité catalogue</h3>
              </div>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                  hiddenFromCatalog
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                )}
              >
                {hiddenFromCatalog ? "Discret (Masqué)" : "Public"}
              </span>
            </div>
            <label className="flex items-start gap-2.5 text-xs font-semibold text-[#111111] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={hiddenFromCatalog}
                onChange={(e) => {
                  setHiddenFromCatalog(e.target.checked);
                  setIsDirty(true);
                }}
                className="mt-0.5 rounded border-gray-300 text-[#C2410C] focus:ring-[#C2410C] cursor-pointer"
              />
              <span className="leading-snug">
                Masquer ce produit du catalogue public de la vitrine
              </span>
            </label>
            <p className="text-[11px] text-[#666660] leading-relaxed">
              Le produit ne s&apos;affichera pas dans la liste des articles de la boutique ni dans les recherches. Il reste accessible et commandable uniquement par son lien direct (idéal pour les tunnels Facebook / TikTok Ads privés et la protection contre les espions concurrents).
            </p>
          </div>

          {/* Bloc Canaux de publication */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#111111]">Canaux de vente</h3>
            <div className="space-y-2">
              {["Boutique en ligne", "WhatsApp Catalogue", "TikTok Ads", "Facebook Shop"].map((ch) => {
                const checked = publishedChannels.includes(ch);
                return (
                  <label
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className="flex items-center gap-2.5 text-xs font-semibold text-[#111111] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                    <span>{ch}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bloc Résumé des ventes (Performance COD) */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111]">Performance COD</h3>
              <BarChart3 className="w-4 h-4 text-[#888880]" />
            </div>
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between text-[#666660]">
                <span>Unités commandées :</span>
                <span className="font-bold text-[#111111]">{salesSummary.unitsSold}</span>
              </div>
              <div className="flex justify-between text-[#666660]">
                <span>Unités livrées & payées :</span>
                <span className="font-bold text-emerald-700">{salesSummary.unitsDelivered}</span>
              </div>
              <div className="flex justify-between text-[#666660]">
                <span>Taux de livraison réel :</span>
                <span className="font-black text-emerald-800">{salesSummary.deliveryRate}%</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-black/[0.06] text-xs font-black text-[#111111]">
                <span>CA net encaissé :</span>
                <span>{formatFcfa(salesSummary.netSales)}</span>
              </div>
            </div>
          </div>

          {/* Bloc Organisation */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#111111]">Organisation</h3>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Catégorie de produit
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Beauté & Soins"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Type de produit
              </label>
              <input
                type="text"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                placeholder="Ex: Sérum cosmétique"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              />
            </div>

            {!isCloser && (
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Fournisseur principal
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                >
                  {MOCK_SUPPLIERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.country})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Collection associée
              </label>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              >
                {MOCK_COLLECTIONS.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Balises (Tags séparés par virgules)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="best-seller, promo, vitalité"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Modèle de page produit
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              >
                <option value="Par défaut">Modèle standard e-commerce</option>
                <option value="Landing COD Directe">Landing page 1-clic COD (Haute conversion)</option>
                <option value="Page Longue Storytelling">Page longue avec témoignages & avis</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ONGLET 2 : CONTENU DU REÇU DÉDIÉ (FIGÉ À LA LIVRAISON) */}
      {activeFormTab === "receipt" && (
        <div id="receipt-content-tab-pane" className="space-y-6">
          {/* Barre d'outils du reçu : Langue & Assistant IA */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <ReceiptIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#111111]">
                  Contenu spécifique du reçu de livraison
                </h2>
                <p className="text-xs text-[#666660]">
                  Textes d'accompagnement injectés dans le reçu et le message WhatsApp après livraison.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Sélecteur de langue */}
              <div className="flex items-center rounded-xl border border-black/10 bg-[#FAF8F5] p-1">
                {(
                  [
                    { code: "fr", label: "Français" },
                    { code: "en", label: "English" },
                    { code: "ar", label: "العربية" },
                  ] as const
                ).map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setReceiptLanguage(lang.code)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
                      receiptLanguage === lang.code
                        ? "bg-[#111111] text-[#FAF8F5]"
                        : "text-[#666660] hover:text-[#111111]"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              {/* Bouton Brouillon IA */}
              <button
                type="button"
                id="btn-ai-generate-receipt"
                onClick={handleGenerateAiReceiptDraft}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Générer avec l'IA</span>
              </button>
            </div>
          </div>

          {/* Avertissement Catégorie Santé / Bien-être obligatoire */}
          {isHealthCategory && (
            <div
              id="health-warning-banner"
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  Avertissement Réglementaire (Produit de Santé / Nutrition / Bien-être)
                </p>
                <p className="text-amber-800">
                  Aucune allégation médicale, promesse de guérison ni résultat garanti n'est autorisée
                  dans les textes de vos reçus. Respectez scrupuleusement la réglementation sanitaire locale.
                </p>
              </div>
            </div>
          )}

          {/* Bannière de réassurance : Instantané figé */}
          <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-black/[0.08] text-xs text-[#666660] flex items-center gap-3">
            <Lock className="w-4 h-4 text-[#888880] shrink-0" />
            <p>
              <strong>Copie figée dans l'instantané :</strong> Les textes ci-dessous sont enregistrés de
              manière immuable dans chaque reçu émis lors du passage à « Livrée ». Modifier ce produit plus
              tard ne modifiera jamais les reçus clients déjà créés.
            </p>
          </div>

          {/* Formulaire des champs du reçu */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne 1 : Conseils et Précautions */}
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-3">
                <label className="block text-xs font-bold text-[#111111]">
                  Conseils d'utilisation
                </label>
                <p className="text-[11px] text-[#666660]">
                  Recommandations posologiques ou guide étape par étape (texte brut, pas de HTML).
                </p>
                <textarea
                  id="receipt-usage-input"
                  rows={4}
                  value={receiptContent.usageInstructions}
                  onChange={(e) => {
                    setReceiptContent((prev) => ({ ...prev, usageInstructions: e.target.value }));
                    setIsDirty(true);
                  }}
                  className="w-full p-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="Ex: Appliquer matin et soir sur peau propre..."
                />
              </div>

              <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-3">
                <label className="block text-xs font-bold text-[#111111]">
                  Précautions d'emploi & Composition
                </label>
                <p className="text-[11px] text-[#666660]">
                  Contre-indications, allergènes ou précautions de conservation.
                </p>
                <textarea
                  id="receipt-precautions-input"
                  rows={4}
                  value={receiptContent.precautions}
                  onChange={(e) => {
                    setReceiptContent((prev) => ({ ...prev, precautions: e.target.value }));
                    setIsDirty(true);
                  }}
                  className="w-full p-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="Ex: Tenir hors de portée des enfants. Conserver dans un endroit sec."
                />
              </div>

              <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-3">
                <label className="block text-xs font-bold text-[#111111]">
                  Conseil d'entretien
                </label>
                <p className="text-[11px] text-[#666660]">
                  Pour vêtements, accessoires ou flacons réutilisables.
                </p>
                <textarea
                  id="receipt-care-input"
                  rows={3}
                  value={receiptContent.careAdvice}
                  onChange={(e) => {
                    setReceiptContent((prev) => ({ ...prev, careAdvice: e.target.value }));
                    setIsDirty(true);
                  }}
                  className="w-full p-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="Ex: Lavage à 30°C ou bien refermer le bouchon après usage."
                />
              </div>
            </div>

            {/* Colonne 2 : Garanties, Retours, WhatsApp et Avis */}
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-3">
                <label className="block text-xs font-bold text-[#111111]">
                  Garantie spécifique au produit
                </label>
                <p className="text-[11px] text-[#666660]">
                  Laisse vide pour appliquer la garantie par défaut de la boutique.
                </p>
                <input
                  type="text"
                  id="receipt-warranty-input"
                  value={receiptContent.warranty}
                  onChange={(e) => {
                    setReceiptContent((prev) => ({ ...prev, warranty: e.target.value }));
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="Ex: Garantie 14 jours satisfaite ou remboursée"
                />
              </div>

              <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-3">
                <label className="block text-xs font-bold text-[#111111]">
                  Conditions de retour ou d'échange spécifiques
                </label>
                <textarea
                  id="receipt-returns-input"
                  rows={3}
                  value={receiptContent.returnTerms}
                  onChange={(e) => {
                    setReceiptContent((prev) => ({ ...prev, returnTerms: e.target.value }));
                    setIsDirty(true);
                  }}
                  className="w-full p-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="Ex: Retour accepté sous 48h si emballage non ouvert."
                />
              </div>

              <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-3">
                <label className="block text-xs font-bold text-[#111111]">
                  Remerciement personnalisé
                </label>
                <textarea
                  id="receipt-thankyou-input"
                  rows={3}
                  value={receiptContent.thankYouNote}
                  onChange={(e) => {
                    setReceiptContent((prev) => ({ ...prev, thankYouNote: e.target.value }));
                    setIsDirty(true);
                  }}
                  className="w-full p-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="Ex: Merci pour votre confiance ! Notre équipe reste à votre écoute."
                />
              </div>

              {/* Ligne WhatsApp courte (140 car max) */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#111111]">
                    Ligne WhatsApp courte (Facultatif)
                  </label>
                  <span
                    id="receipt-wa-char-counter"
                    className={cn(
                      "text-[10px] font-bold font-mono px-2 py-0.5 rounded",
                      (receiptContent.shortWhatsAppLine?.length || 0) > 140
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    )}
                  >
                    {receiptContent.shortWhatsAppLine?.length || 0} / 140
                  </span>
                </div>
                <p className="text-[11px] text-[#666660]">
                  Insérée dans le message WhatsApp sous le nom du produit. Max 140 caractères.
                </p>
                <input
                  type="text"
                  id="receipt-short-whatsapp-input"
                  maxLength={140}
                  value={receiptContent.shortWhatsAppLine || ""}
                  onChange={(e) => {
                    setReceiptContent((prev) => ({ ...prev, shortWhatsAppLine: e.target.value }));
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="Ex: 1 tasse le matin suffit pour une énergie stable toute la journée !"
                />
              </div>

              {/* Case : Inclure un lien pour donner son avis */}
              <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-[#111111]">
                  <input
                    type="checkbox"
                    id="receipt-include-review-input"
                    checked={receiptContent.includeReviewLink}
                    onChange={(e) => {
                      setReceiptContent((prev) => ({
                        ...prev,
                        includeReviewLink: e.target.checked,
                      }));
                      setIsDirty(true);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Inclure un lien pour donner son avis sur le produit dans le reçu</span>
                </label>
                <p className="text-[11px] text-[#666660] ml-7 mt-0.5">
                  Génère un bouton direct vers le formulaire d'évaluation lié à la commande livrée.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ZONE DANGEREUSE : SUPPRESSION DU PRODUIT (Prompt 14-B) */}
      {/* ======================================================== */}
      {initialProduct && canTrashProduct(activeRole) && (
        <div
          id="danger-zone-delete"
          className="rounded-[24px] border border-rose-200 bg-rose-50/70 p-6 shadow-2xs space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-950">Zone dangereuse</h3>
              <p className="text-xs text-rose-800/90 mt-0.5 leading-relaxed">
                Déplacer ce produit dans la corbeille. Il sera immédiatement masqué de votre vitrine en ligne, du catalogue et des recherches publiques. Il restera conservé 30 jours avant purge définitive.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-rose-900">
              Vous pourrez restaurer ce produit à tout moment depuis l'onglet « Corbeille » de la liste des produits.
            </span>
            <button
              type="button"
              id="btn-delete-product"
              onClick={handleDeleteProduct}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer ce produit</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BARRE COLLANTE DU BAS : MODIFICATIONS NON ENREGISTRÉES */}
      {/* ======================================================== */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111111]/95 backdrop-blur-md text-white border-t border-black/20 px-6 py-3.5 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold">Modifications non enregistrées</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsDirty(false);
                router.refresh();
              }}
              className="px-3.5 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-1.5 rounded-xl bg-white text-[#111111] hover:bg-[#F3EFE6] text-xs font-black transition-all shadow-sm"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
