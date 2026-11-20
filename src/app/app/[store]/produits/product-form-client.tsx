"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  X,
  Upload,
  FolderTree,
  Radio,
  SlidersHorizontal,
  Calendar,
  Share2,
  Library,
  Copy,
  Archive,
  AlertTriangle,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Product,
  ProductVariant,
  QuantityOffer,
  ProductStatus,
  ProductMediaItem,
  OutOfStockProductOverride,
  ProductOption,
  ProductCustomField,
  ProductAuditEntry,
} from "@/server/data/types";
import {
  MAX_PRODUCT_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  validateProductImageFile,
  stripExifAndProcessImage,
} from "@/lib/image-utils";
import { ProductReceiptContent } from "@/server/data/receipt-types";
import { DEFAULT_RECEIPT_CONTENT } from "@/lib/receipts-engine";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { MOCK_SUPPLIERS } from "@/mock-data/suppliers";
import { MOCK_COLLECTIONS } from "@/mock-data/collections";
import { getProductPublicUrl } from "@/lib/storefront-urls";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/layout/app-shell";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";
import {
  canTrashProduct,
  canArchiveProduct,
  canViewProductFinancials,
  canManageProducts,
} from "@/config/permissions";
import { softDeleteProduct, getShopProductsRaw, saveShopProductsList } from "@/lib/products-store";
import { RichDescriptionEditor } from "@/components/products/rich-description-editor";
import { sanitizeProductDescription } from "@/lib/server-html-sanitizer";
import { DescriptionComparisonModal } from "@/components/products/description-comparison-modal";
import { metaPixelsStore, ShopPixel } from "@/lib/meta-pixels";

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
  const canViewFinancials = canViewProductFinancials(activeRole);
  const canManage = canManageProducts(activeRole);

  // Clé de brouillon isolée par boutique et produit (Prompt 17-J)
  const currentProductId = initialProduct?.id || "new";
  const DRAFT_KEY = `draft_${storeSlug}_${currentProductId}`;

  // ========================================================
  // ÉTATS DE LA COLONNE PRINCIPALE (Phases 17-B, 17-C, 17-D)
  // ========================================================

  // 1) Titre (obligatoire)
  const [name, setName] = useState(initialProduct?.name || initialProduct?.title || "");
  const [titleError, setTitleError] = useState<string | null>(null);

  // 2) Description (Éditeur riche & Nettoyage HTML strict)
  const [description, setDescription] = useState(initialProduct?.description || "");

  // 3) Supports multimédias (Galerie, images, vidéos, alt text, EXIF)
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

  const [videoUrl, setVideoUrl] = useState<string>(initialProduct?.videoUrl || "");
  const [showVideoInput, setShowVideoInput] = useState<boolean>(Boolean(initialProduct?.videoUrl));
  const [editingAltItem, setEditingAltItem] = useState<{ id: string; alt: string } | null>(null);
  const [mediaErrorMessage, setMediaErrorMessage] = useState<string | null>(null);
  const [isMediaLibraryModalOpen, setIsMediaLibraryModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4) Catégorie (sélecteur avec recherche)
  const [category, setCategory] = useState(initialProduct?.category || "Santé & Nutrition");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  const predefinedCategories = useMemo(() => {
    return [
      "Santé & Nutrition",
      "Beauté & Cosmétiques",
      "Soins du Visage",
      "Perte de Poids & Minceur",
      "Électronique & Gadgets",
      "Mode & Accessoires",
      "Maison & Cuisine",
      "Bébés & Enfants",
      "Sport & Fitness",
    ];
  }, []);

  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return predefinedCategories;
    return predefinedCategories.filter((c) =>
      c.toLowerCase().includes(categorySearchQuery.toLowerCase().trim())
    );
  }, [predefinedCategories, categorySearchQuery]);

  // 5) Aperçu sur les moteurs de recherche (SEO Google)
  const [seoTitle, setSeoTitle] = useState(
    initialProduct?.seo?.title ||
      (name ? `${name} - Meilleur Prix` : "Acheter en ligne au meilleur prix")
  );
  const [seoDescription, setSeoDescription] = useState(
    initialProduct?.seo?.description ||
      "Commandez au meilleur prix avec livraison express et paiement sécurisé à la réception."
  );
  const [seoSlug, setSeoSlug] = useState(
    initialProduct?.seo?.slug ||
      initialProduct?.slug ||
      (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "nouveau-produit")
  );
  const [isSeoCustomOpen, setIsSeoCustomOpen] = useState(false);

  // ========================================================
  // COMMERCE : PRIX, TAXE, MARGE (Phase 17-C, 1)
  // ========================================================
  const [salePrice, setSalePrice] = useState<number>(initialProduct?.salePrice || 0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(
    initialProduct?.compareAtPrice
  );
  const [unitPriceLabel, setUnitPriceLabel] = useState<string>(
    initialProduct?.unitPriceLabel || ""
  );
  const [chargeTax, setChargeTax] = useState<boolean>(initialProduct?.chargeTax ?? false);
  const [showExtraPricing, setShowExtraPricing] = useState<boolean>(
    Boolean(initialProduct?.compareAtPrice || initialProduct?.unitPriceLabel || initialProduct?.chargeTax)
  );

  const [costPrice, setCostPrice] = useState<number>(initialProduct?.costPrice || 0);

  // Validation du prix de comparaison
  const compareAtPriceError = useMemo(() => {
    if (compareAtPrice !== undefined && compareAtPrice > 0 && compareAtPrice <= salePrice) {
      return "Le prix de comparaison (avant réduction) doit être strictement supérieur au prix de vente.";
    }
    return null;
  }, [compareAtPrice, salePrice]);

  // ========================================================
  // COMMERCE : OFFRES PAR PRODUIT (Phase 17-C, 5)
  // ========================================================
  const [quantityOffers, setQuantityOffers] = useState<QuantityOffer[]>(() => {
    if (initialProduct?.quantityOffers && initialProduct.quantityOffers.length > 0) {
      return initialProduct.quantityOffers;
    }
    return [
      {
        id: "off-1",
        quantity: 1,
        unitPrice: initialProduct?.salePrice || 15000,
        totalPrice: initialProduct?.salePrice || 15000,
        badgeText: "Standard",
      },
      {
        id: "off-2",
        quantity: 2,
        unitPrice: Math.round(((initialProduct?.salePrice || 15000) * 0.85) / 100) * 100,
        totalPrice: Math.round(((initialProduct?.salePrice || 15000) * 0.85 * 2) / 100) * 100,
        badgeText: "Le plus populaire (-15%)",
      },
    ];
  });

  // ========================================================
  // COMMERCE : STOCK & INVENTAIRE (Phase 17-C, 2)
  // ========================================================
  const [trackStock, setTrackStock] = useState<boolean>(initialProduct?.trackStock ?? true);
  const [inventoryLocation, setInventoryLocation] = useState<string>(
    initialProduct?.inventoryLocation || "Emplacement de la boutique (Principal)"
  );
  const [physicalStock, setPhysicalStock] = useState<number>(
    initialProduct?.physicalStock ?? initialProduct?.stock ?? 15
  );
  const [reservedStock, setReservedStock] = useState<number>(
    initialProduct?.reservedStock ?? 0
  );
  const availableStock = Math.max(0, physicalStock - reservedStock);

  const [sku, setSku] = useState(initialProduct?.sku || "");
  const [barcode, setBarcode] = useState(initialProduct?.barcode || "");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(
    initialProduct?.lowStockThreshold ?? 10
  );
  const [continueSellingWhenOutOfStock, setContinueSellingWhenOutOfStock] = useState<boolean>(
    initialProduct?.continueSellingWhenOutOfStock ?? false
  );
  const [outOfStockVisibilityOverride, setOutOfStockVisibilityOverride] =
    useState<OutOfStockProductOverride>(
      initialProduct?.outOfStockVisibilityOverride || "store_default"
    );
  const [showStockDetails, setShowStockDetails] = useState(false);

  // ========================================================
  // COMMERCE : EXPÉDITION (Phase 17-C, 3)
  // ========================================================
  const [isPhysical, setIsPhysical] = useState<boolean>(initialProduct?.isPhysical ?? true);
  const [weightKg, setWeightKg] = useState<number>(initialProduct?.weightKg || 0.2);
  const [packageLengthCm, setPackageLengthCm] = useState<number>(
    initialProduct?.dimensions?.lengthCm || 15
  );
  const [packageWidthCm, setPackageWidthCm] = useState<number>(
    initialProduct?.dimensions?.widthCm || 10
  );
  const [packageHeightCm, setPackageHeightCm] = useState<number>(
    initialProduct?.dimensions?.heightCm || 5
  );
  const [showPackageDimensions, setShowPackageDimensions] = useState(false);

  // ========================================================
  // COMMERCE : VARIANTES (Phase 17-C, 4)
  // ========================================================
  const [hasVariants, setHasVariants] = useState<boolean>(() => {
    return Boolean(
      (initialProduct?.variants && initialProduct.variants.length > 0) ||
        (initialProduct?.productOptions && initialProduct.productOptions.length > 0)
    );
  });

  const [productOptions, setProductOptions] = useState<ProductOption[]>(() => {
    if (initialProduct?.productOptions && initialProduct.productOptions.length > 0) {
      return initialProduct.productOptions;
    }
    if (initialProduct?.variants && initialProduct.variants.length > 0) {
      return [
        {
          id: "opt-1",
          name: "Format",
          values: Array.from(new Set(initialProduct.variants.map((v) => v.name || v.title || "Standard"))),
        },
      ];
    }
    return [];
  });

  const [newOptionValueInputs, setNewOptionValueInputs] = useState<Record<string, string>>({});
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialProduct?.variants && initialProduct.variants.length > 0
      ? initialProduct.variants
      : []
  );

  // Modification groupée des variantes
  const [bulkPriceInput, setBulkPriceInput] = useState<number | "">("");
  const [bulkStockInput, setBulkStockInput] = useState<number | "">("");
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  // Générateur automatique de variantes cartésiennes quand options changent
  const generateVariantsFromOptions = (options: ProductOption[]) => {
    if (options.length === 0) {
      setVariants([]);
      return;
    }

    const validOptions = options.filter((o) => o.values.length > 0);
    if (validOptions.length === 0) {
      setVariants([]);
      return;
    }

    // Produit cartésien récursif
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]]
      );
    };

    const combinations = cartesian(validOptions.map((o) => o.values)).slice(0, 100);

    const generated: ProductVariant[] = combinations.map((comb, idx) => {
      const varName = comb.join(" / ");
      const existing = variants.find((v) => v.name === varName);
      return (
        existing || {
          id: `var-${Date.now()}-${idx}`,
          name: varName,
          title: varName,
          price: salePrice,
          costPrice: costPrice,
          stock: 10,
          sku: `${sku || "VAR"}-${comb.map((c) => c.substring(0, 3).toUpperCase()).join("-")}`,
          barcode: "",
          image: mediaItems[0]?.url || "",
          optionValues: validOptions.map((opt, optIdx) => ({
            optionName: opt.name,
            value: comb[optIdx],
          })),
        }
      );
    });

    setVariants(generated);
  };

  const handleAddOption = () => {
    if (productOptions.length >= 3) {
      alert("Vous pouvez ajouter un maximum de 3 options de variantes.");
      return;
    }
    const newOpt: ProductOption = {
      id: `opt-${Date.now()}`,
      name: productOptions.length === 0 ? "Taille" : productOptions.length === 1 ? "Couleur" : "Matière",
      values: [],
    };
    const next = [...productOptions, newOpt];
    setProductOptions(next);
  };

  const handleRemoveOption = (optId: string) => {
    if (confirm("Supprimer cette option et toutes ses variantes associées ?")) {
      const next = productOptions.filter((o) => o.id !== optId);
      setProductOptions(next);
      generateVariantsFromOptions(next);
    }
  };

  const handleAddOptionValue = (optId: string, val: string) => {
    const clean = val.trim();
    if (!clean) return;
    const next = productOptions.map((opt) => {
      if (opt.id === optId) {
        if (!opt.values.includes(clean)) {
          return { ...opt, values: [...opt.values, clean] };
        }
      }
      return opt;
    });
    setProductOptions(next);
    setNewOptionValueInputs((prev) => ({ ...prev, [optId]: "" }));
    generateVariantsFromOptions(next);
  };

  const handleRemoveOptionValue = (optId: string, valToRemove: string) => {
    const next = productOptions.map((opt) => {
      if (opt.id === optId) {
        return { ...opt, values: opt.values.filter((v) => v !== valToRemove) };
      }
      return opt;
    });
    setProductOptions(next);
    generateVariantsFromOptions(next);
  };

  const handleBulkApply = () => {
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        price: bulkPriceInput !== "" ? Number(bulkPriceInput) : v.price,
        stock: bulkStockInput !== "" ? Number(bulkStockInput) : v.stock,
      }))
    );
    setShowBulkEditModal(false);
    showToast("Modifications groupées appliquées aux variantes.");
  };

  // ========================================================
  // CHAMPS PERSONNALISÉS / METAFIELDS (Phase 17-D, 1)
  // ========================================================
  const [customFields, setCustomFields] = useState<ProductCustomField[]>(
    initialProduct?.customFields || []
  );
  const [showAddCustomFieldModal, setShowAddCustomFieldModal] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<
    "short_text" | "long_text" | "number" | "choice" | "boolean"
  >("short_text");

  const predefinedMetafieldTemplates = [
    { label: "Ingrédients & Composition", key: "ingredients", type: "long_text" as const },
    { label: "Mode d'emploi & Posologie", key: "usage_instructions", type: "long_text" as const },
    { label: "Précautions d'emploi", key: "precautions", type: "long_text" as const },
    { label: "Garantie & Authenticité", key: "warranty", type: "short_text" as const },
  ];

  const handleAddPredefinedTemplate = (tpl: (typeof predefinedMetafieldTemplates)[0]) => {
    if (customFields.some((f) => f.key === tpl.key)) {
      alert("Ce champ personnalisé est déjà présent sur la fiche.");
      return;
    }
    setCustomFields((prev) => [
      ...prev,
      {
        id: `cf-${Date.now()}`,
        key: tpl.key,
        label: tpl.label,
        type: tpl.type,
        value: "",
        isPinned: true,
      },
    ]);
  };

  const handleCreateCustomField = () => {
    const cleanLabel = newFieldLabel.trim();
    if (!cleanLabel) return;
    const cleanKey =
      newFieldKey.trim() || cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    setCustomFields((prev) => [
      ...prev,
      {
        id: `cf-${Date.now()}`,
        key: cleanKey,
        label: cleanLabel,
        type: newFieldType,
        value: "",
        isPinned: true,
      },
    ]);
    setNewFieldLabel("");
    setNewFieldKey("");
    setShowAddCustomFieldModal(false);
  };

  // ========================================================
  // ÉTATS DU PANNEAU LATÉRAL (Prompt 17 - Phase 17-B)
  // ========================================================
  const [productStatus, setProductStatus] = useState<ProductStatus | "scheduled">(
    (initialProduct?.productStatus as any) ||
      (initialProduct?.stock && initialProduct.stock > 0 ? "active" : "draft")
  );
  const [scheduledDate, setScheduledDate] = useState("");

  const [publishToStorefront, setPublishToStorefront] = useState<boolean>(
    initialProduct ? !initialProduct.hiddenFromCatalog : true
  );
  const [publishToMetaCatalog, setPublishToMetaCatalog] = useState<boolean>(true);

  const [productType, setProductType] = useState(
    initialProduct?.productType || initialProduct?.type || "Standard"
  );
  const [supplierId, setSupplierId] = useState(initialProduct?.supplierId || "sup_01");

  const [collectionsList, setCollectionsList] = useState<string[]>(() => {
    return MOCK_COLLECTIONS.map((c) => c.title);
  });
  const [selectedCollection, setSelectedCollection] = useState(
    initialProduct?.collection || "Général"
  );
  const [newCollectionInput, setNewCollectionInput] = useState("");
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);

  const [tags, setTags] = useState<string[]>(initialProduct?.tags || ["Promo", "Nouveauté"]);
  const [tagInput, setTagInput] = useState("");

  const [themeTemplate, setThemeTemplate] = useState(
    initialProduct?.template || "Modèle par défaut : Produit"
  );

  const [shopPixels, setShopPixels] = useState<ShopPixel[]>([]);
  const [selectedPixelIds, setSelectedPixelIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pixels = metaPixelsStore.getPixels(storeSlug);
      setShopPixels(pixels);
      const activeForProduct = pixels
        .filter((p) => p.isActive && (p.applyToAllProducts || (initialProduct && p.productIds.includes(initialProduct.id))))
        .map((p) => p.id);
      setSelectedPixelIds(activeForProduct);
    }
  }, [storeSlug, initialProduct]);

  // ========================================================
  // AUDIT & HISTORIQUE DES MODIFICATIONS (Phase 17-D, 3)
  // ========================================================
  const [auditTrail, setAuditTrail] = useState<ProductAuditEntry[]>(
    initialProduct?.auditTrail || [
      {
        id: "aud-01",
        action: isEditing ? "Mise à jour du produit" : "Création initiale de la fiche",
        performedBy: activeRole === "admin" ? "Admin" : activeRole === "closer" ? "Closeuse" : "Utilisateur",
        timestamp: new Date().toISOString(),
      },
    ]
  );
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  // Nombre de commandes liées à ce produit (Phase 17-D, 2)
  const productOrderCount = useMemo(() => {
    if (!initialProduct?.id) return 0;
    return MOCK_ORDERS.filter((o) =>
      o.items.some((item) => item.productId === initialProduct.id)
    ).length;
  }, [initialProduct]);

  // ========================================================
  // BROUILLON & AVERTISSEMENTS (Phase 17-B)
  // ========================================================
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === "object") {
            // RÈGLE STRICTE PROMPT 17-J : Ne JAMAIS charger le brouillon d'un autre produit ou d'une autre boutique
            if (parsed.productId && parsed.productId !== currentProductId) {
              return;
            }
            if (parsed.shopSlug && parsed.shopSlug !== storeSlug) {
              return;
            }
            if (!isEditing) {
              if (parsed.name) setName(parsed.name);
              if (parsed.description) setDescription(parsed.description);
              if (parsed.category) setCategory(parsed.category);
              if (parsed.salePrice) setSalePrice(parsed.salePrice);
              if (parsed.costPrice) setCostPrice(parsed.costPrice);
              showToast("Brouillon automatiquement restauré.");
            }
          }
        }
      } catch {}
    }
  }, [DRAFT_KEY, currentProductId, storeSlug, isEditing]);

  useEffect(() => {
    setIsDirty(true);
  }, [
    name,
    description,
    category,
    salePrice,
    compareAtPrice,
    costPrice,
    trackStock,
    physicalStock,
    sku,
    variants,
    quantityOffers,
    customFields,
    productStatus,
    publishToStorefront,
    tags,
  ]);

  useEffect(() => {
    setIsDirty(false);
  }, []);

  useEffect(() => {
    if (isDirty && typeof window !== "undefined") {
      const draftData = {
        shopSlug: storeSlug,
        productId: currentProductId,
        name,
        description,
        category,
        salePrice,
        costPrice,
        updatedAt: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    }
  }, [isDirty, name, description, category, salePrice, costPrice, DRAFT_KEY, currentProductId, storeSlug]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // ========================================================
  // GESTIONNAIRES MÉDIAS & COLLECTIONS & TAGS
  // ========================================================
  const handleImageFiles = async (files: FileList | File[]) => {
    setMediaErrorMessage(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const availableSlots = MAX_PRODUCT_IMAGES - mediaItems.length;
    if (availableSlots <= 0) {
      setMediaErrorMessage(`Limite maximale atteinte (${MAX_PRODUCT_IMAGES} visuels max).`);
      return;
    }

    const filesToProcess = fileArray.slice(0, availableSlots);
    for (const file of filesToProcess) {
      const validation = validateProductImageFile(file);
      if (!validation.valid) {
        setMediaErrorMessage(validation.error || "Fichier invalide.");
        continue;
      }

      try {
        const cleanDataUrl = await stripExifAndProcessImage(file);
        setMediaItems((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: cleanDataUrl,
            alt: `${name.trim() || "Produit"} - Vue ${prev.length + 1}`,
            isPrimary: prev.length === 0,
          },
        ]);
      } catch (err: any) {
        setMediaErrorMessage(err?.message || "Erreur de traitement de l'image.");
      }
    }
  };

  const handleSetPrimaryMedia = (index: number) => {
    setMediaItems((prev) => {
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [{ ...target, isPrimary: true }, ...rest.map((m) => ({ ...m, isPrimary: false }))];
    });
  };

  const handleDeleteMedia = (index: number) => {
    setMediaItems((prev) =>
      prev.filter((_, i) => i !== index).map((m, idx) => ({ ...m, isPrimary: idx === 0 }))
    );
  };

  const handleSaveAltText = (id: string, newAlt: string) => {
    setMediaItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, alt: newAlt } : m))
    );
    setEditingAltItem(null);
    showToast("Texte alternatif mis à jour.");
  };

  const handleSelectFromLibrary = (url: string) => {
    if (mediaItems.length >= MAX_PRODUCT_IMAGES) {
      setMediaErrorMessage(`Limite de ${MAX_PRODUCT_IMAGES} visuels atteinte.`);
      return;
    }
    setMediaItems((prev) => [
      ...prev,
      {
        id: `lib-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        url,
        alt: `${name || "Produit"} - Médiathèque`,
        isPrimary: prev.length === 0,
      },
    ]);
    setIsMediaLibraryModalOpen(false);
    showToast("Image ajoutée depuis la médiathèque.");
  };

  const handleCreateCollectionOnTheFly = () => {
    const clean = newCollectionInput.trim();
    if (!clean) return;
    if (!collectionsList.includes(clean)) {
      setCollectionsList((prev) => [...prev, clean]);
    }
    setSelectedCollection(clean);
    setNewCollectionInput("");
    setShowNewCollectionForm(false);
    showToast(`Collection « ${clean} » créée et assignée.`);
  };

  const handleAddTag = (newTag: string) => {
    const clean = newTag.trim();
    if (clean && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const togglePixel = (pixelId: string) => {
    setSelectedPixelIds((prev) =>
      prev.includes(pixelId) ? prev.filter((id) => id !== pixelId) : [...prev, pixelId]
    );
  };

  // ========================================================
  // ACTIONS AVANCÉES DU PRODUIT (Phase 17-D, 2)
  // ========================================================
  const handleDuplicateProduct = () => {
    if (!confirm("Voulez-vous dupliquer cette fiche produit ?")) return;
    const duplicated: Product = {
      ...initialProduct!,
      id: `prod_${Date.now()}`,
      name: `${name} (Copie)`,
      title: `${name} (Copie)`,
      slug: `${seoSlug}-copie`,
      status: "draft",
      productStatus: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      salesSummary: { unitsSold: 0, unitsDelivered: 0, deliveryRate: 0, netSales: 0 },
    };
    const all = getShopProductsRaw(storeSlug);
    saveShopProductsList(storeSlug, [duplicated, ...all]);
    showToast("Produit dupliqué avec succès en brouillon.");
    router.push(`/app/${storeSlug}/produits`);
  };

  const handleArchiveProduct = () => {
    if (!confirm("Voulez-vous archiver ce produit ? Il ne sera plus visible sur la vitrine.")) return;
    setProductStatus("archived");
    if (initialProduct?.id) {
      const all = getShopProductsRaw(storeSlug);
      const updated = all.map((p) =>
        p.id === initialProduct.id ? { ...p, status: "archived" as const, productStatus: "archived" as const } : p
      );
      saveShopProductsList(storeSlug, updated);
      showToast("Produit archivé avec succès.");
      router.push(`/app/${storeSlug}/produits`);
    }
  };

  const handleDeleteProduct = () => {
    if (productOrderCount > 0) {
      alert(
        `Suppression impossible : Ce produit a déjà ${productOrderCount} commande(s) enregistrée(s). Pour préserver l'historique comptable et les statistiques, vous devez l'archiver au lieu de le supprimer.`
      );
      return;
    }

    if (confirm("Déplacer ce produit dans la corbeille ? Il sera restaurable pendant 30 jours.")) {
      if (initialProduct?.id) {
        softDeleteProduct(storeSlug, initialProduct.id);
        showToast("Produit déplacé dans la corbeille.");
        router.push(`/app/${storeSlug}/produits`);
      }
    }
  };

  // ========================================================
  // ENREGISTREMENT ET VALIDATION ZOD / CLIENT
  // ========================================================
  const handleSave = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setTitleError("Le titre du produit est obligatoire.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setTitleError(null);

    if (compareAtPriceError) {
      alert(compareAtPriceError);
      return;
    }

    const newId = initialProduct?.id || `prod_${Date.now()}`;
    const productSlug =
      seoSlug.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const sanitizeReport = sanitizeProductDescription(description, { productTitle: cleanName });
    const sanitizedDesc = sanitizeReport.cleanedHtml;

    const currentImages =
      mediaItems.length > 0
        ? mediaItems.map((m) => m.url)
        : ["/products/mushroom-coffee.png"];

    const finalProduct: Product = {
      id: newId,
      name: cleanName,
      title: cleanName,
      slug: productSlug,
      description: sanitizedDesc,
      originalRawDescription: initialProduct?.originalRawDescription || (isEditing ? initialProduct?.description : description),
      importedAt: initialProduct?.importedAt || (isEditing ? undefined : new Date().toISOString()),
      sanitizationReport: sanitizeReport,
      category,
      collection: selectedCollection,
      collections: [selectedCollection],
      productType,
      images: currentImages,
      mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
      videoUrl: videoUrl.trim() || undefined,
      salePrice: Math.round(Number(salePrice) || 0),
      price: Math.round(Number(salePrice) || 0),
      compareAtPrice: compareAtPrice ? Math.round(Number(compareAtPrice)) : undefined,
      unitPriceLabel: unitPriceLabel.trim() || undefined,
      costPrice: Math.round(Number(costPrice) || 0),
      marginAmount: Math.round((Number(salePrice) || 0) - (Number(costPrice) || 0)),
      marginPercent:
        Number(salePrice) > 0
          ? Math.round((((Number(salePrice) || 0) - (Number(costPrice) || 0)) / Number(salePrice)) * 100)
          : 0,
      chargeTax,
      trackQuantity: trackStock,
      trackStock,
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode,
      lowStockThreshold: Number(lowStockThreshold) || 10,
      isPhysical,
      weightKg,
      dimensions: {
        lengthCm: packageLengthCm,
        widthCm: packageWidthCm,
        heightCm: packageHeightCm,
      },
      continueSellingWhenOutOfStock,
      inventoryLocation,
      stock: variants.length > 0 ? variants.reduce((s, v) => s + (v.stock || 0), 0) : availableStock,
      availableStock: variants.length > 0 ? variants.reduce((s, v) => s + (v.stock || 0), 0) : availableStock,
      physicalStock: variants.length > 0 ? variants.reduce((s, v) => s + (v.stock || 0), 0) : physicalStock,
      reservedStock,
      status: (productStatus as ProductStatus) || "active",
      productStatus: (productStatus as ProductStatus) || "active",
      hiddenFromCatalog: !publishToStorefront,
      outOfStockVisibilityOverride,
      supplierId,
      productOptions: hasVariants ? productOptions : undefined,
      variants: hasVariants ? variants : [],
      quantityOffers,
      customFields,
      badgesConfig: initialProduct?.badgesConfig || {
        hasCountdown: false,
        countdownMinutes: 30,
        hasComparePrice: Boolean(compareAtPrice),
        hasLowStockWarning: true,
        lowStockThreshold: Number(lowStockThreshold) || 10,
        hasQuantityPacks: quantityOffers.length > 0,
      },
      tags,
      template: themeTemplate,
      publishedChannels: [
        publishToStorefront ? "Vitrine de la boutique" : null,
        publishToMetaCatalog ? "Catalogue Meta" : null,
      ].filter(Boolean) as string[],
      seo: {
        title: seoTitle || cleanName,
        description: seoDescription,
        slug: productSlug,
      },
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          action: isEditing ? "Mise à jour des prix, stock et variantes" : "Création du produit",
          performedBy: activeRole === "admin" ? "Admin" : activeRole === "closer" ? "Closeuse" : "Utilisateur",
          timestamp: new Date().toISOString(),
        },
        ...auditTrail,
      ],
      createdAt: initialProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allProducts = getShopProductsRaw(storeSlug);
    let updatedList: Product[];
    if (isEditing) {
      updatedList = allProducts.map((p) => (p.id === newId ? finalProduct : p));
    } else {
      updatedList = [finalProduct, ...allProducts];
    }
    saveShopProductsList(storeSlug, updatedList);

    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_KEY);
    }

    setIsDirty(false);
    showToast("Produit enregistré avec succès !");
    router.push(`/app/${storeSlug}/produits`);
  };

  const handleCancel = () => {
    if (isDirty) {
      if (!confirm("Voulez-vous abandonner vos modifications non enregistrées ?")) return;
    }
    router.push(`/app/${storeSlug}/produits`);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Toast de confirmation */}
      {toastMessage && (
        <div
          id="product-form-toast"
          className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#111111] text-white text-xs font-bold shadow-2xl animate-in slide-in-from-top-2 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation sous-menu Produits */}
      <ProductsNavTabs storeSlug={storeSlug} />

      {/* ======================================================== */}
      {/* BARRE EN HAUT : RETOUR, TITRE & ACTIONS FIXES */}
      {/* ======================================================== */}
      <div
        id="product-form-top-bar"
        className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E6E0D4] shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/app/${storeSlug}/produits`}
            className="p-2.5 rounded-xl bg-white border border-[#E6E0D4] hover:bg-[#F3EFE6] transition-colors text-[#111111]"
            title="Retour à la liste des produits"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A]">
                {isEditing ? "Modification du produit" : "Nouveau produit"}
              </span>
              {initialProduct?.id && (
                <span className="px-1.5 py-0.5 rounded bg-stone-100 text-[10px] font-mono font-medium text-stone-600 border border-stone-200" title={`Identifiant unique : ${initialProduct.id}`}>
                  ID: {initialProduct.id}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight line-clamp-1">
              {isEditing && initialProduct
                ? (initialProduct.name || initialProduct.title || "Produit sans titre")
                : (name || "Ajouter un produit")}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {initialProduct && (
            <a
              id="btn-product-preview-store"
              href={getProductPublicUrl(initialProduct, storeSlug, { preview: true })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E0D4] bg-white text-xs font-semibold text-[#111111] hover:bg-[#F3EFE6] transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[#666660]" />
              <span>Aperçu vitrine</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl border border-[#E6E0D4] bg-white text-xs font-semibold text-[#666660] hover:bg-[#F3EFE6] transition-colors"
          >
            Annuler
          </button>

          <button
            type="button"
            id="btn-save-product-top"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DISPOSITION 2 COLONNES (STYLE SHOPIFY / NOVIKA) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ======================================================== */}
        {/* COLONNE PRINCIPALE (lg:col-span-2) */}
        {/* ======================================================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1) TITRE DU PRODUIT */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#111111]">
                Titre du produit <span className="text-rose-500">*</span>
              </label>
              {name.trim().length > 0 && (
                <span className="text-[11px] text-[#7A7A7A]">
                  {name.trim().length} caractères
                </span>
              )}
            </div>
            <input
              type="text"
              id="input-product-title"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (titleError) setTitleError(null);
                if (!isEditing && !seoTitle) {
                  setSeoTitle(`${e.target.value} - Meilleur Prix`);
                  setSeoSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }
              }}
              placeholder="Ex: Sérum Éclat Vitamine C & Niacinamide"
              className={cn(
                "w-full px-4 py-3 rounded-2xl border text-sm font-semibold text-[#111111] placeholder:text-[#999990] bg-[#FAF8F5] focus:outline-none focus:bg-white focus:border-[#111111] transition-colors",
                titleError ? "border-rose-400 bg-rose-50/50" : "border-[#E6E0D4]"
              )}
            />
            {titleError && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{titleError}</span>
              </p>
            )}
          </div>

          {/* 2) DESCRIPTION */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-[#111111]">
                  Description
                </label>
                <p className="text-xs text-[#7A7A7A] mt-0.5">
                  Bénéfices du produit, conseils d'utilisation et réassurance pour le paiement à la livraison.
                </p>
              </div>

              {Boolean(initialProduct?.originalRawDescription || initialProduct?.sanitizationReport) && (
                <button
                  type="button"
                  id="btn-open-comparison-modal"
                  onClick={() => setIsComparisonModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-[#E6E0D4] hover:bg-[#FAF8F5] text-xs font-bold text-[#111111] transition-colors"
                >
                  Voir avant / après (Source 30j)
                </button>
              )}
            </div>

            <RichDescriptionEditor
              value={description}
              onChange={(val) => setDescription(val)}
              productTitle={name || "Nouveau produit"}
              storeSlug={storeSlug}
              onOpenAiGenerator={() => {
                router.push(`/app/${storeSlug}/produits/nouveau-ia`);
              }}
            />
          </div>

          {/* 3) SUPPORTS MULTIMÉDIAS */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleImageFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#111111]">Supports multimédias</h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF8F5] border border-[#E6E0D4] text-[#111111]">
                    {mediaItems.length} / {MAX_PRODUCT_IMAGES}
                  </span>
                </div>
                <p className="text-xs text-[#7A7A7A] mt-0.5">
                  La première image est la photo principale de la fiche vitrine et du panier.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-upload-media-file"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs font-semibold text-[#111111] hover:bg-[#EFECE6] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#666660]" />
                  <span>Importer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMediaLibraryModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs font-semibold text-[#111111] hover:bg-[#EFECE6] transition-colors"
                >
                  <Library className="w-3.5 h-3.5 text-[#666660]" />
                  <span>Médiathèque</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowVideoInput(!showVideoInput)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors",
                    videoUrl
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold"
                      : "border-[#E6E0D4] bg-[#FAF8F5] text-[#111111] hover:bg-[#EFECE6]"
                  )}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{videoUrl ? "Vidéo active" : "Ajouter vidéo"}</span>
                </button>
              </div>
            </div>

            {showVideoInput && (
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D4] space-y-2 animate-in fade-in">
                <label className="block text-xs font-bold text-[#111111]">
                  Lien vidéo (YouTube ou Vimeo)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-white focus:outline-none"
                  />
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => setVideoUrl("")}
                      className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
                    >
                      Effacer
                    </button>
                  )}
                </div>
              </div>
            )}

            {mediaErrorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
                <span>{mediaErrorMessage}</span>
                <button
                  type="button"
                  onClick={() => setMediaErrorMessage(null)}
                  className="font-bold text-rose-900 ml-2"
                >
                  Fermer
                </button>
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-[#E6E0D4] hover:border-[#111111] bg-[#FAF8F5] rounded-3xl p-8 text-center cursor-pointer transition-colors group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E6E0D4] flex items-center justify-center mx-auto text-[#7A7A7A] group-hover:text-[#111111] group-hover:border-[#111111] transition-colors mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#111111]">
                Glissez-déposez vos fichiers ici, ou cliquez pour parcourir
              </p>
              <p className="text-xs text-[#7A7A7A] mt-1">
                Formats acceptés : JPG, PNG, WebP, GIF, MP4 (max 5 Mo par fichier). Métadonnées EXIF retirées automatiquement.
              </p>
            </div>

            {mediaItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                {mediaItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative rounded-2xl border border-[#E6E0D4] bg-white overflow-hidden aspect-square flex items-center justify-center shadow-2xs transition-all",
                      item.isPrimary && "ring-2 ring-[#111111]"
                    )}
                  >
                    <img
                      src={item.url}
                      alt={item.alt || name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />

                    {item.isPrimary && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#111111] text-white shadow-xs">
                        Principale
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAltItem({ id: item.id, alt: item.alt || "" });
                          }}
                          className="p-1 rounded-lg bg-white/20 hover:bg-white text-white hover:text-black transition-colors"
                          title="Modifier le texte alternatif (Alt)"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMedia(idx);
                          }}
                          className="p-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {!item.isPrimary && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimaryMedia(idx);
                          }}
                          className="w-full py-1 text-[10px] font-bold rounded-lg bg-white text-black hover:bg-[#FAF8F5] transition-colors"
                        >
                          Définir principale
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4) CATÉGORIE DU PRODUIT */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-[#111111]">
                  Catégorie du catalogue
                </label>
                <p className="text-xs text-[#7A7A7A] mt-0.5">
                  Aide à classer le produit et à alimenter le catalogue Meta.
                </p>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                id="input-product-category"
                value={category}
                onFocus={() => setIsCategoryPickerOpen(true)}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setCategorySearchQuery(e.target.value);
                  setIsCategoryPickerOpen(true);
                }}
                placeholder="Ex: Soins du Visage, Santé & Nutrition..."
                className="w-full px-4 py-2.5 rounded-2xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
              />

              {isCategoryPickerOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-2 rounded-2xl border border-[#E6E0D4] bg-white shadow-xl z-30 max-h-48 overflow-y-auto">
                  <div className="text-[10px] uppercase font-bold text-[#7A7A7A] px-2 py-1">
                    Suggestions de catégories
                  </div>
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setIsCategoryPickerOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors hover:bg-[#FAF8F5] flex items-center justify-between",
                        category === cat ? "bg-[#FAF8F5] font-bold text-[#111111]" : "text-[#4A4A4A]"
                      )}
                    >
                      <span>{cat}</span>
                      {category === cat && <Check className="w-3.5 h-3.5 text-black" />}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCategoryPickerOpen(false)}
                    className="w-full text-center py-1 mt-1 text-[11px] text-[#7A7A7A] hover:underline"
                  >
                    Fermer la liste
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 5) APERÇU SUR LES MOTEURS DE RECHERCHE */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Aperçu sur les moteurs de recherche</h3>
                <p className="text-xs text-[#7A7A7A] mt-0.5">
                  Rendu en direct de votre produit dans les résultats de recherche Google.
                </p>
              </div>
              <button
                type="button"
                id="btn-edit-seo"
                onClick={() => setIsSeoCustomOpen(!isSeoCustomOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs font-semibold text-[#111111] hover:bg-[#EFECE6] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-[#666660]" />
                <span>{isSeoCustomOpen ? "Fermer l'édition" : "Modifier le référencement"}</span>
              </button>
            </div>

            <div className="rounded-2xl border border-[#E6E0D4] bg-white p-4 space-y-1.5 font-sans">
              <div className="flex items-center gap-2 text-xs text-[#202124]">
                <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[9px] font-bold">
                  N
                </div>
                <div className="flex items-center gap-1 truncate text-[11px] text-[#5f6368]">
                  <span>https://novika.store</span>
                  <span>›</span>
                  <span>boutique</span>
                  <span>›</span>
                  <span>{storeSlug}</span>
                  <span>›</span>
                  <span className="font-semibold">{seoSlug || "mon-produit"}</span>
                </div>
              </div>

              <h4 className="text-base text-[#1a0dab] font-medium hover:underline cursor-pointer line-clamp-1">
                {seoTitle || name || "Titre du produit - Boutique officielle"}
              </h4>

              <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                {seoDescription ||
                  "Commandez en ligne avec livraison express et paiement sécurisé à la réception partout en Afrique de l'Ouest."}
              </p>
            </div>

            {isSeoCustomOpen && (
              <div className="space-y-3 pt-2 border-t border-[#E6E0D4] animate-in fade-in">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-[#111111]">Titre de la page</label>
                    <span className="text-[10px] text-[#7A7A7A]">{seoTitle.length} / 70 max</span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Titre pour les moteurs de recherche"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-[#111111]">Méta-description</label>
                    <span className="text-[10px] text-[#7A7A7A]">{seoDescription.length} / 160 max</span>
                  </div>
                  <textarea
                    rows={3}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Description attrayante pour le moteur de recherche..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">Adresse URL simplifiée (Slug)</label>
                  <input
                    type="text"
                    value={seoSlug}
                    onChange={(e) => setSeoSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                    placeholder="mon-produit-phare"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111] focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 6) CARTE PRIX (Phase 17-C, 1) */}
          {/* ======================================================== */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Tarification</h3>
                <p className="text-xs text-[#7A7A7A] mt-0.5">
                  Montants en FCFA (sans décimales, entiers).
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] text-xs font-bold text-[#111111]">
                FCFA
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Prix de vente <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  id="input-product-price"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Math.round(Number(e.target.value)))}
                  className="w-full px-4 py-2.5 text-sm font-black rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111] focus:outline-none focus:bg-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A7A7A]">
                  FCFA
                </span>
              </div>
            </div>

            {/* Ligne repliable : Prix d'affichage supplémentaires */}
            <div className="border-t border-[#F0EBE0] pt-2">
              <button
                type="button"
                onClick={() => setShowExtraPricing(!showExtraPricing)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#111111] hover:underline"
              >
                <span>Prix d'affichage supplémentaires</span>
                {showExtraPricing ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showExtraPricing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Prix de comparaison (barré avant réduction)
                    </label>
                    <input
                      type="number"
                      step="1"
                      id="input-compare-at-price"
                      value={compareAtPrice || ""}
                      onChange={(e) =>
                        setCompareAtPrice(e.target.value ? Math.round(Number(e.target.value)) : undefined)
                      }
                      placeholder="Ex: 25000"
                      className={cn(
                        "w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-[#FAF8F5] text-[#111111] focus:outline-none",
                        compareAtPriceError ? "border-rose-400 bg-rose-50/50" : "border-[#E6E0D4]"
                      )}
                    />
                    {compareAtPriceError && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        {compareAtPriceError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Prix unitaire d'affichage (optionnel)
                    </label>
                    <input
                      type="text"
                      value={unitPriceLabel}
                      onChange={(e) => setUnitPriceLabel(e.target.value)}
                      placeholder="Ex: 5 000 FCFA pour 100 ml"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chargeTax}
                        onChange={(e) => setChargeTax(e.target.checked)}
                        className="rounded border-[#E6E0D4] text-black focus:ring-black"
                      />
                      <span className="text-xs font-semibold text-[#4A4A4A]">
                        Facturer la taxe sur ce produit (activé seulement si la boutique gère une TVA légale)
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Ligne Coût / Bénéfice / Marge (Admin/Co-admin uniquement) */}
            {canViewFinancials ? (
              <div className="pt-3 border-t border-[#F0EBE0] bg-[#FAF8F5] -mx-6 -mb-6 p-6 rounded-b-3xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] text-[#7A7A7A] block font-bold uppercase tracking-wider">
                    Coût par article (Prix de revient)
                  </span>
                  <input
                    type="number"
                    step="1"
                    id="input-product-cost"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Math.round(Number(e.target.value)))}
                    className="w-full mt-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E6E0D4] bg-white text-[#111111]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#7A7A7A] block font-bold uppercase tracking-wider">
                    Bénéfice estimé
                  </span>
                  <div className="text-sm font-extrabold text-emerald-700 py-1.5">
                    +{formatFcfa(salePrice - costPrice)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A7A7A] block font-bold uppercase tracking-wider">
                    Marge brute
                  </span>
                  <div className="text-sm font-extrabold text-emerald-700 py-1.5">
                    {salePrice > 0
                      ? (((salePrice - costPrice) / salePrice) * 100).toFixed(1)
                      : "0"}{" "}
                    %
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-[#FAF8F5] text-xs text-[#7A7A7A] italic flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#7A7A7A]" />
                <span>Les marges et coûts d'achat sont réservés à l'administration.</span>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 7) OFFRES PAR PRODUIT (FORMULES DE QUANTITÉ COD) (Phase 17-C, 5) */}
          {/* ======================================================== */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Offres groupées (Packs COD)</h3>
                <p className="text-xs text-[#7A7A7A] mt-0.5">
                  Augmentez le panier moyen en incitant les clients à commander 2 ou 3 unités à la livraison.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextQty = quantityOffers.length + 1;
                  setQuantityOffers((prev) => [
                    ...prev,
                    {
                      id: `off-${Date.now()}`,
                      quantity: nextQty,
                      unitPrice: Math.round((salePrice * 0.8) / 100) * 100,
                      totalPrice: Math.round((salePrice * 0.8 * nextQty) / 100) * 100,
                      badgeText: `Méga Pack (-20%)`,
                    },
                  ]);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] text-xs font-bold text-[#111111] hover:bg-[#EFECE6]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une formule</span>
              </button>
            </div>

            <div className="space-y-3">
              {quantityOffers.map((offer, idx) => {
                const regularTotal = salePrice * offer.quantity;
                const savings = regularTotal > offer.totalPrice ? regularTotal - offer.totalPrice : 0;
                return (
                  <div
                    key={offer.id}
                    className="p-3.5 rounded-2xl border border-[#E6E0D4] bg-[#FAF8F5] grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
                  >
                    <div>
                      <span className="text-[10px] text-[#7A7A7A] block font-bold">Quantité</span>
                      <input
                        type="number"
                        min="1"
                        value={offer.quantity}
                        onChange={(e) => {
                          const q = Number(e.target.value);
                          setQuantityOffers((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, quantity: q } : o))
                          );
                        }}
                        className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-[#E6E0D4] bg-white"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-[#7A7A7A] block font-bold">Prix total du pack</span>
                      <input
                        type="number"
                        step="1"
                        value={offer.totalPrice}
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          setQuantityOffers((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, totalPrice: p } : o))
                          );
                        }}
                        className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-[#E6E0D4] bg-white text-emerald-700"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-[#7A7A7A] block font-bold">Badge promotionnel</span>
                      <input
                        type="text"
                        value={offer.badgeText || ""}
                        onChange={(e) => {
                          const t = e.target.value;
                          setQuantityOffers((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, badgeText: t } : o))
                          );
                        }}
                        placeholder="Ex: Le plus populaire"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-[#E6E0D4] bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-4">
                      {savings > 0 && (
                        <span className="text-[11px] font-bold text-emerald-700">
                          Éco. {formatFcfa(savings)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setQuantityOffers((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Supprimer cette offre"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 8) CARTE STOCK & INVENTAIRE (Phase 17-C, 2) */}
          {/* ======================================================== */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Stock & Inventaire</h3>
                <p className="text-xs text-[#7A7A7A] mt-0.5">
                  Source unique des niveaux de stock synchronisée avec l'inventaire en direct.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="toggle-track-stock"
                  checked={trackStock}
                  onChange={(e) => setTrackStock(e.target.checked)}
                  className="rounded border-[#E6E0D4] text-black focus:ring-black h-4 w-4"
                />
                <span className="text-xs font-bold text-[#111111]">Stock suivi</span>
              </label>
            </div>

            {trackStock && (
              <div className="space-y-4 pt-1">
                {/* Emplacement de stockage */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D4] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#111111] block">
                        {inventoryLocation}
                      </span>
                      <span className="text-[11px] text-[#7A7A7A]">
                        Emplacement principal de traitement des commandes
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-white border border-[#E6E0D4] text-emerald-800">
                      {availableStock} dispo
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E6E0D4]/60">
                    <div>
                      <span className="text-[10px] text-[#7A7A7A] block font-semibold">En main (Physique)</span>
                      <input
                        type="number"
                        min="0"
                        id="input-physical-stock"
                        value={physicalStock}
                        onChange={(e) => setPhysicalStock(Math.max(0, Number(e.target.value)))}
                        className="w-full mt-0.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-[#E6E0D4] bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7A7A7A] block font-semibold">Réservé (Commandes)</span>
                      <div className="text-xs font-bold text-[#111111] py-1.5 px-2 bg-stone-100 rounded-lg">
                        {reservedStock}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7A7A7A] block font-semibold">Disponible à la vente</span>
                      <div className="text-xs font-bold text-emerald-700 py-1.5 px-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        {availableStock}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ligne repliable : Plus de détails */}
                <div className="border-t border-[#F0EBE0] pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStockDetails(!showStockDetails)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#111111] hover:underline"
                  >
                    <span>Plus de détails (SKU, code-barres, rupture)</span>
                    {showStockDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showStockDetails && (
                    <div className="space-y-3 pt-3 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#111111] mb-1">SKU</label>
                          <input
                            type="text"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            placeholder="CF-MUSH-01"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#111111] mb-1">Code-barres (EAN/UPC)</label>
                          <input
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            placeholder="69382910..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#111111] mb-1">Seuil stock bas</label>
                          <input
                            type="number"
                            value={lowStockThreshold}
                            onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]"
                          />
                        </div>
                      </div>

                      {/* Continuer à vendre en cas de rupture de stock */}
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D4] space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            id="toggle-continue-selling"
                            checked={continueSellingWhenOutOfStock}
                            onChange={(e) => setContinueSellingWhenOutOfStock(e.target.checked)}
                            className="rounded border-[#E6E0D4] text-black focus:ring-black h-4 w-4"
                          />
                          <span className="text-xs font-bold text-[#111111]">
                            Continuer à vendre en cas de rupture de stock
                          </span>
                        </label>
                        <p className="text-[11px] text-[#7A7A7A] pl-6">
                          Si cette case est activée, la commande est acceptée à stock zéro et passe automatiquement en « En attente de stock » (conformité Prompt 16-b).
                        </p>
                      </div>

                      {/* Surcharge Prompt 16-b */}
                      <div>
                        <label className="block text-xs font-bold text-[#111111] mb-1">
                          Comportement en cas de rupture sur la vitrine
                        </label>
                        <select
                          value={outOfStockVisibilityOverride}
                          onChange={(e) => setOutOfStockVisibilityOverride(e.target.value as any)}
                          className="w-full sm:w-2/3 px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-white font-semibold"
                        >
                          <option value="store_default">Suivre le réglage de la boutique (Par défaut)</option>
                          <option value="always_show">Toujours afficher (avec mention Rupture)</option>
                          <option value="always_hide">Toujours masquer de la vitrine en cas de rupture</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 9) CARTE EXPÉDITION (Phase 17-C, 3) */}
          {/* ======================================================== */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Expédition & Colis</h3>
                <p className="text-xs text-[#7A7A7A] mt-0.5">
                  La livraison est offerte et gratuite pour le client lors de la validation COD.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="toggle-is-physical"
                  checked={isPhysical}
                  onChange={(e) => setIsPhysical(e.target.checked)}
                  className="rounded border-[#E6E0D4] text-black focus:ring-black h-4 w-4"
                />
                <span className="text-xs font-bold text-[#111111]">Produit physique</span>
              </label>
            </div>

            {isPhysical && (
              <div className="border-t border-[#F0EBE0] pt-2">
                <button
                  type="button"
                  onClick={() => setShowPackageDimensions(!showPackageDimensions)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#111111] hover:underline"
                >
                  <span>Poids et dimensions du colis (optionnel)</span>
                  {showPackageDimensions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showPackageDimensions && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111111] mb-1">Poids (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={weightKg}
                        onChange={(e) => setWeightKg(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111111] mb-1">Longueur (cm)</label>
                      <input
                        type="number"
                        value={packageLengthCm}
                        onChange={(e) => setPackageLengthCm(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111111] mb-1">Largeur (cm)</label>
                      <input
                        type="number"
                        value={packageWidthCm}
                        onChange={(e) => setPackageWidthCm(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111111] mb-1">Hauteur (cm)</label>
                      <input
                        type="number"
                        value={packageHeightCm}
                        onChange={(e) => setPackageHeightCm(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 10) CARTE VARIANTES (Phase 17-C, 4) */}
          {/* ======================================================== */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Variantes</h3>
                <p className="text-xs text-[#7A7A7A] mt-0.5">
                  Ce produit est-il décliné en plusieurs options (taille, couleur, etc.) ?
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="toggle-has-variants"
                  checked={hasVariants}
                  onChange={(e) => {
                    setHasVariants(e.target.checked);
                    if (e.target.checked && productOptions.length === 0) {
                      handleAddOption();
                    }
                  }}
                  className="rounded border-[#E6E0D4] text-black focus:ring-black h-4 w-4"
                />
                <span className="text-xs font-bold text-[#111111]">Ce produit a des variantes</span>
              </label>
            </div>

            {hasVariants && (
              <div className="space-y-4 pt-1">
                {/* Options (max 3) */}
                <div className="space-y-3">
                  {productOptions.map((opt, optIndex) => (
                    <div
                      key={opt.id}
                      className="p-4 rounded-2xl border border-[#E6E0D4] bg-[#FAF8F5] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-[#7A7A7A]" />
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) => {
                              const n = e.target.value;
                              setProductOptions((prev) =>
                                prev.map((o) => (o.id === opt.id ? { ...o, name: n } : o))
                              );
                            }}
                            placeholder="Nom de l'option (ex: Taille, Couleur)"
                            className="px-3 py-1 text-xs font-bold rounded-lg border border-[#E6E0D4] bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt.id)}
                          className="text-xs font-bold text-rose-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      </div>

                      {/* Valeurs saisies en étiquettes */}
                      <div>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newOptionValueInputs[opt.id] || ""}
                            onChange={(e) =>
                              setNewOptionValueInputs((prev) => ({
                                ...prev,
                                [opt.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault();
                                handleAddOptionValue(opt.id, newOptionValueInputs[opt.id] || "");
                              }
                            }}
                            placeholder="Tapez une valeur (ex: S, M, Rouge) et appuyez sur Entrée..."
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#E6E0D4] bg-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleAddOptionValue(opt.id, newOptionValueInputs[opt.id] || "")
                            }
                            className="px-3 py-1.5 rounded-xl bg-[#111111] text-white text-xs font-bold"
                          >
                            Ajouter
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {opt.values.map((val) => (
                            <span
                              key={val}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E6E0D4] text-xs font-semibold text-[#111111]"
                            >
                              <span>{val}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionValue(opt.id, val)}
                                className="text-[#888880] hover:text-black"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {productOptions.length < 3 && (
                    <button
                      type="button"
                      id="btn-add-variant-option"
                      onClick={handleAddOption}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter une autre option</span>
                    </button>
                  )}
                </div>

                {/* Tableau des variantes générées */}
                {variants.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-[#E6E0D4]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111111]">
                        {variants.length} variante(s) générée(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowBulkEditModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs font-bold hover:bg-[#EFECE6]"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Modifier en masse</span>
                      </button>
                    </div>

                    <div className="rounded-2xl border border-[#E6E0D4] overflow-hidden overflow-x-auto bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF8F5] border-b border-[#E6E0D4] font-bold text-[#111111]">
                          <tr>
                            <th className="p-3">Variante</th>
                            <th className="p-3">Prix (FCFA)</th>
                            <th className="p-3">Stock</th>
                            <th className="p-3">SKU</th>
                            <th className="p-3">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6E0D4]">
                          {variants.map((v, idx) => (
                            <tr key={v.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                              <td className="p-3 font-bold text-[#111111]">{v.name}</td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  step="1"
                                  value={v.price}
                                  onChange={(e) => {
                                    const p = Number(e.target.value);
                                    setVariants((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, price: p } : item))
                                    );
                                  }}
                                  className="w-24 px-2 py-1 rounded-lg border border-[#E6E0D4] font-bold"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={v.stock}
                                  onChange={(e) => {
                                    const s = Number(e.target.value);
                                    setVariants((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, stock: s } : item))
                                    );
                                  }}
                                  className="w-20 px-2 py-1 rounded-lg border border-[#E6E0D4]"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={v.sku || ""}
                                  onChange={(e) => {
                                    const sk = e.target.value;
                                    setVariants((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, sku: sk } : item))
                                    );
                                  }}
                                  className="w-28 px-2 py-1 rounded-lg border border-[#E6E0D4] font-mono"
                                />
                              </td>
                              <td className="p-3">
                                {v.stock > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    En stock
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-600">
                                    Épuisé (grisé)
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 11) CARTE CHAMPS PERSONNALISÉS (Phase 17-D, 1) */}
          {/* ======================================================== */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Champs personnalisés (Méta-champs)</h3>
                <p className="text-xs text-[#7A7A7A] mt-0.5">
                  Informations spécifiques (ingrédients, mode d'emploi, garantie) affichées dans le thème.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomFieldModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs font-bold text-[#111111] hover:bg-[#EFECE6]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une définition</span>
              </button>
            </div>

            {/* Modèles prêts en un clic */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] font-bold text-[#7A7A7A] self-center">Modèles prêts :</span>
              {predefinedMetafieldTemplates.map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => handleAddPredefinedTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg border border-[#E6E0D4] bg-[#FAF8F5] hover:bg-white text-xs font-medium text-[#111111]"
                >
                  + {tpl.label}
                </button>
              ))}
            </div>

            {/* Liste des champs saisis */}
            {customFields.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D4] text-xs text-[#7A7A7A] text-center">
                Aucun champ personnalisé épinglé pour le moment.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {customFields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-2xl border border-[#E6E0D4] bg-[#FAF8F5] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111111]">{field.label}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomFields((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Retirer
                      </button>
                    </div>

                    {field.type === "long_text" ? (
                      <textarea
                        rows={3}
                        value={field.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomFields((prev) =>
                            prev.map((f, i) => (i === idx ? { ...f, value: val } : f))
                          );
                        }}
                        placeholder={`Saisissez le texte pour ${field.label.toLowerCase()}...`}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-white focus:outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomFields((prev) =>
                            prev.map((f, i) => (i === idx ? { ...f, value: val } : f))
                          );
                        }}
                        placeholder={`Valeur pour ${field.label.toLowerCase()}...`}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-white focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 12) ACTIONS AVANCÉES & HISTORIQUE (Phase 17-D, 2 & 3) */}
          {/* ======================================================== */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111]">Actions sur le produit</h3>
              {initialProduct && (
                <button
                  type="button"
                  onClick={() => setShowAuditTrail(!showAuditTrail)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111111] hover:underline"
                >
                  <History className="w-3.5 h-3.5 text-[#7A7A7A]" />
                  <span>Historique des modifications</span>
                </button>
              )}
            </div>

            {/* Historique si déplié */}
            {showAuditTrail && (
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D4] space-y-2 animate-in fade-in">
                <span className="text-[10px] uppercase font-bold text-[#7A7A7A] block">
                  Journal d'audit du produit
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {auditTrail.map((entry) => (
                    <div
                      key={entry.id}
                      className="text-[11px] text-[#4A4A4A] flex items-center justify-between border-b border-[#E6E0D4]/40 pb-1"
                    >
                      <span className="font-semibold">{entry.action}</span>
                      <span className="text-[#7A7A7A]">
                        par {entry.performedBy} ({new Date(entry.timestamp).toLocaleDateString("fr-FR")})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              {initialProduct && canManage && (
                <button
                  type="button"
                  id="btn-duplicate-product"
                  onClick={handleDuplicateProduct}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs font-bold text-[#111111] hover:bg-[#EFECE6] transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Dupliquer ce produit</span>
                </button>
              )}

              {initialProduct && canManage && (
                <button
                  type="button"
                  id="btn-archive-product"
                  onClick={handleArchiveProduct}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archiver le produit</span>
                </button>
              )}

              {initialProduct && canManage && (
                <button
                  type="button"
                  id="btn-delete-product"
                  onClick={handleDeleteProduct}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-300 bg-rose-50 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer le produit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PANNEAU LATÉRAL (lg:col-span-1) (Prompt 17 - Phase 17-B) */}
        {/* ======================================================== */}
        <div className="space-y-6">
          {/* 1) STATUT DU PRODUIT */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#111111]">Statut du produit</h3>
            <select
              value={productStatus}
              id="select-product-status"
              onChange={(e) => setProductStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E0D4] bg-white text-xs font-bold text-[#111111] focus:outline-none"
            >
              <option value="active">Actif (Visible sur la boutique)</option>
              <option value="draft">Brouillon (Masqué du public)</option>
              <option value="archived">Archivé (Non commandable)</option>
              <option value="scheduled">Programmé (Publication différée)</option>
            </select>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setProductStatus("active")}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-colors",
                  productStatus === "active"
                    ? "bg-[#111111] text-white border-black"
                    : "bg-[#FAF8F5] text-[#4A4A4A] border-[#E6E0D4] hover:bg-[#EFECE6]"
                )}
              >
                Actif
              </button>
              <button
                type="button"
                onClick={() => setProductStatus("draft")}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-colors",
                  productStatus === "draft"
                    ? "bg-[#111111] text-white border-black"
                    : "bg-[#FAF8F5] text-[#4A4A4A] border-[#E6E0D4] hover:bg-[#EFECE6]"
                )}
              >
                Brouillon
              </button>
              <button
                type="button"
                onClick={() => setProductStatus("archived")}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-colors",
                  productStatus === "archived"
                    ? "bg-[#111111] text-white border-black"
                    : "bg-[#FAF8F5] text-[#4A4A4A] border-[#E6E0D4] hover:bg-[#EFECE6]"
                )}
              >
                Archivé
              </button>
              <button
                type="button"
                onClick={() => setProductStatus("scheduled")}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-colors",
                  productStatus === "scheduled"
                    ? "bg-[#111111] text-white border-black"
                    : "bg-[#FAF8F5] text-[#4A4A4A] border-[#E6E0D4] hover:bg-[#EFECE6]"
                )}
              >
                Programmé
              </button>
            </div>

            {productStatus === "scheduled" && (
              <div className="pt-2 animate-in fade-in space-y-1">
                <label className="block text-[11px] font-bold text-[#111111]">
                  Date et heure de mise en ligne automatique
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]"
                />
              </div>
            )}
          </div>

          {/* 2) PUBLICATION */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#111111]">Publication & Canaux</h3>
            <p className="text-xs text-[#7A7A7A]">
              Choisissez où le produit doit être accessible pour les clients et la publicité.
            </p>

            <div className="space-y-3 pt-1">
              <label className="flex items-center justify-between p-3 rounded-2xl border border-[#E6E0D4] bg-[#FAF8F5] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[#111111] block">Vitrine de la boutique</span>
                  <span className="text-[11px] text-[#7A7A7A]">Visible dans le catalogue public</span>
                </div>
                <input
                  type="checkbox"
                  id="toggle-publish-storefront"
                  checked={publishToStorefront}
                  onChange={(e) => setPublishToStorefront(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E6E0D4] text-black focus:ring-black"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl border border-[#E6E0D4] bg-[#FAF8F5] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[#111111] block">Catalogue Meta</span>
                  <span className="text-[11px] text-[#7A7A7A]">Export flux Facebook & Instagram Ads</span>
                </div>
                <input
                  type="checkbox"
                  checked={publishToMetaCatalog}
                  onChange={(e) => setPublishToMetaCatalog(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E6E0D4] text-black focus:ring-black"
                />
              </label>
            </div>
          </div>

          {/* 3) ORGANISATION DU PRODUIT */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#111111]">Organisation du produit</h3>

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Type de produit</label>
              <input
                type="text"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                placeholder="Ex: Sérum, Café bio, Crème..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111]"
              />
            </div>

            {/* Fournisseur */}
            {!isCloser && (
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Fournisseur</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111]"
                >
                  {MOCK_SUPPLIERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.country})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Collections avec création à la volée */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#111111]">Collection</label>
                <button
                  type="button"
                  onClick={() => setShowNewCollectionForm(!showNewCollectionForm)}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  {showNewCollectionForm ? "Annuler" : "+ Créer une collection"}
                </button>
              </div>

              {showNewCollectionForm ? (
                <div className="flex gap-2 mb-2 animate-in fade-in">
                  <input
                    type="text"
                    value={newCollectionInput}
                    onChange={(e) => setNewCollectionInput(e.target.value)}
                    placeholder="Nom de la collection..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#E6E0D4] bg-white"
                  />
                  <button
                    type="button"
                    id="btn-add-collection-confirm"
                    onClick={handleCreateCollectionOnTheFly}
                    className="px-3 py-1.5 rounded-xl bg-[#111111] text-white text-xs font-bold"
                  >
                    Ajouter
                  </button>
                </div>
              ) : null}

              <select
                value={selectedCollection}
                id="select-product-collection"
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111]"
              >
                {collectionsList.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Balises (Tags) */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Balises (Tags)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder="Tapez et appuyez sur Entrée..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111]"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] text-xs font-bold text-[#111111]"
                >
                  +
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E6E0D4] text-xs font-medium text-[#111111]"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-[#888880] hover:text-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 4) MODÈLE DE THÈME */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#111111]">Modèle de thème</h3>
            <p className="text-xs text-[#7A7A7A]">
              Modèle de mise en page assigné depuis le thème actif de la vitrine.
            </p>
            <select
              value={themeTemplate}
              id="select-theme-template"
              onChange={(e) => setThemeTemplate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E0D4] bg-white text-xs font-bold text-[#111111]"
            >
              <option value="Modèle par défaut : Produit">Modèle par défaut : Produit</option>
              <option value="Page de vente directe / Landing page">Page de vente directe / Landing page</option>
              <option value="Pack promotionnel">Pack promotionnel</option>
            </select>
          </div>

          {/* 5) PIXELS META */}
          <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111]">Pixels Meta</h3>
              <span className="text-[11px] text-[#7A7A7A]">Max 3 pixels</span>
            </div>
            <p className="text-xs text-[#7A7A7A]">
              Ciblage publicitaire et suivi des événements d'achat (Purchase / Lead) pour ce produit.
            </p>

            <div className="space-y-2 pt-1">
              {shopPixels.length === 0 ? (
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D4] text-xs text-[#7A7A7A]">
                  Aucun pixel configuré pour cette boutique. Rendez-vous dans Réglages → Connexions pour en ajouter.
                </div>
              ) : (
                shopPixels.map((p) => {
                  const isChecked = selectedPixelIds.includes(p.id) || p.applyToAllProducts;
                  return (
                    <label
                      key={p.id}
                      className="flex items-start gap-2.5 p-3 rounded-2xl border border-[#E6E0D4] bg-[#FAF8F5] cursor-pointer hover:bg-white transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={p.applyToAllProducts}
                        onChange={() => togglePixel(p.id)}
                        className="mt-0.5 rounded border-[#E6E0D4] text-black focus:ring-black"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#111111] block truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-[#7A7A7A] block font-mono">
                          ID: {p.pixelId} {p.applyToAllProducts && "(Appliqué à toute la boutique)"}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALE : MODIFICATION GROUPÉE DES VARIANTES */}
      {/* ======================================================== */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#111111]">
              Modification groupée des variantes
            </h3>
            <p className="text-xs text-[#7A7A7A]">
              Appliquez une valeur commune à l'ensemble des {variants.length} variantes.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Nouveau prix pour toutes les variantes (FCFA)
                </label>
                <input
                  type="number"
                  step="1"
                  value={bulkPriceInput}
                  onChange={(e) => setBulkPriceInput(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Laisser vide pour ne pas modifier"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Nouveau stock pour toutes les variantes
                </label>
                <input
                  type="number"
                  min="0"
                  value={bulkStockInput}
                  onChange={(e) => setBulkStockInput(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Laisser vide pour ne pas modifier"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E0D4]">
              <button
                type="button"
                onClick={() => setShowBulkEditModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E0D4] text-xs font-semibold text-[#666660]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleBulkApply}
                className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold"
              >
                Appliquer à toutes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE : CRÉATION D'UN CHAMP PERSONNALISÉ */}
      {/* ======================================================== */}
      {showAddCustomFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#111111]">
              Ajouter une définition de champ personnalisé
            </h3>
            <p className="text-xs text-[#7A7A7A]">
              Les données seront stockées sous forme de texte brut sécurisé pour le thème.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Nom du champ</label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Ex: Conseils de conservation"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Clé interne (optionnelle)</label>
                <input
                  type="text"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  placeholder="Ex: storage_advice"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Type de champ</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-white font-semibold"
                >
                  <option value="short_text">Texte court (1 ligne)</option>
                  <option value="long_text">Texte long (paragraphe)</option>
                  <option value="number">Nombre entier ou décimal</option>
                  <option value="boolean">Oui / Non</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E0D4]">
              <button
                type="button"
                onClick={() => setShowAddCustomFieldModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E0D4] text-xs font-semibold text-[#666660]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateCustomField}
                className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold"
              >
                Créer la définition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE : ÉDITION DU TEXTE ALTERNATIF (Alt) */}
      {/* ======================================================== */}
      {editingAltItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#111111]">
              Texte alternatif (Alt text)
            </h3>
            <p className="text-xs text-[#7A7A7A]">
              Améliore l'accessibilité pour les malvoyants et favorise le référencement naturel Google Images.
            </p>
            <input
              type="text"
              value={editingAltItem.alt}
              onChange={(e) => setEditingAltItem({ ...editingAltItem, alt: e.target.value })}
              placeholder="Ex: Vue avant du flacon de sérum éclat 100ml"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111] focus:outline-none focus:border-[#111111]"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E0D4]">
              <button
                type="button"
                onClick={() => setEditingAltItem(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E0D4] text-xs font-semibold text-[#666660]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleSaveAltText(editingAltItem.id, editingAltItem.alt)}
                className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold"
              >
                Enregistrer le texte Alt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE : MÉDIATHÈQUE DE LA BOUTIQUE */}
      {/* ======================================================== */}
      {isMediaLibraryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D4]">
              <h3 className="text-base font-bold text-[#111111]">
                Médiathèque de la boutique
              </h3>
              <button
                type="button"
                onClick={() => setIsMediaLibraryModalOpen(false)}
                className="text-[#7A7A7A] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#7A7A7A]">
              Sélectionnez un visuel déjà téléversé sur votre boutique pour l'ajouter à cette fiche produit.
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
              {MOCK_PRODUCTS.flatMap((p) => p.images || []).map((imgUrl, i) => (
                <button
                  key={`${imgUrl}-${i}`}
                  type="button"
                  onClick={() => handleSelectFromLibrary(imgUrl)}
                  className="rounded-xl border border-[#E6E0D4] aspect-square overflow-hidden hover:scale-105 hover:ring-2 hover:ring-black transition-all bg-[#FAF8F5]"
                >
                  <img src={imgUrl} alt="Média boutique" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E6E0D4]">
              <button
                type="button"
                onClick={() => setIsMediaLibraryModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E0D4] text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BARRE COLLANTE FIXE EN BAS : MODIFICATIONS NON ENREGISTRÉES */}
      {/* ======================================================== */}
      {isDirty && (
        <div
          id="bar-unsaved-changes-sticky"
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#111111]/95 backdrop-blur-md text-white border-t border-black/20 px-6 py-3.5 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold">Modifications non enregistrées</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3.5 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              id="btn-save-product-bottom"
              onClick={handleSave}
              className="px-5 py-1.5 rounded-xl bg-white text-[#111111] hover:bg-[#F3EFE6] text-xs font-black transition-all shadow-sm"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE : COMPARATEUR AVANT / APRÈS (Prompt 17-F) */}
      {/* ======================================================== */}
      {isComparisonModalOpen && initialProduct && (
        <DescriptionComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          product={initialProduct}
          onEditInForm={() => setIsComparisonModalOpen(false)}
        />
      )}
    </div>
  );
}
