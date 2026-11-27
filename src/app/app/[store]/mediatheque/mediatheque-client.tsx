"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  UploadCloud,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ShieldAlert,
  CheckCircle,
  Copy,
  RefreshCw,
  HardDrive,
  FileImage,
  Layers,
  Sparkles,
  AlertCircle,
  Info,
} from "lucide-react";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";
import { StoredMediaItem, MediaUsageType } from "@/lib/media-storage";
import { useImageUpload } from "@/components/media/useImageUpload";
import { cn } from "@/lib/utils";

interface MediathequeClientProps {
  storeSlug: string;
}

export function MediathequeClient({ storeSlug }: MediathequeClientProps) {
  const [items, setItems] = useState<StoredMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<StoredMediaItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState<any | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Stockage
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);
  const maxStorageBytes = 500 * 1024 * 1024; // 500 Mo par défaut

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isUploading, progress, uploadFile } = useImageUpload({
    storeSlug,
    contextType: "gallery",
    onSuccess: (newMedia) => {
      setItems((prev) => [newMedia, ...prev]);
      setStorageUsedBytes((prev) => prev + newMedia.sizeBytes);
      setSuccessMessage("Image téléversée avec succès.");
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/media/library?storeSlug=${storeSlug}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setStorageUsedBytes(data.totalSizeBytes || 0);
      }
    } catch (err) {
      console.error("Erreur chargement médiathèque :", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [storeSlug]);

  const handleMultipleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    loadMedia();
  };

  const handleDeleteItem = async (item: StoredMediaItem) => {
    if (item.usageCount > 0) {
      setDeleteError(
        `Impossible de supprimer : cette image est actuellement utilisée dans ${item.usageCount} élément(s) (${item.usedIn.map((u) => u.title || u.type).join(", ")}).`
      );
      setTimeout(() => setDeleteError(null), 6000);
      return;
    }

    if (!confirm(`Confirmez-vous la suppression définitive de "${item.originalName}" ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/media/delete?id=${item.id}&storeSlug=${storeSlug}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setStorageUsedBytes((prev) => Math.max(0, prev - item.sizeBytes));
        if (selectedItem?.id === item.id) setSelectedItem(null);
        setSuccessMessage("Image supprimée avec succès.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setDeleteError(data.error || "Erreur lors de la suppression.");
      }
    } catch (err) {
      setDeleteError("Erreur réseau lors de la suppression.");
    }
  };

  const handleMigrateExternal = async () => {
    setIsMigrating(true);
    setMigrationReport(null);
    try {
      const res = await fetch("/api/media/migrate-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeSlug }),
      });
      const data = await res.json();
      if (data.success) {
        setMigrationReport(data.report);
        loadMedia();
        setSuccessMessage(`Migration terminée : ${data.report.migrated} image(s) rapatriée(s).`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error("Erreur migration externe :", err);
    } finally {
      setIsMigrating(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.altText && item.altText.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedType === "all") return true;
    if (selectedType === "unused") return item.usageCount === 0;
    if (selectedType === "used") return item.usageCount > 0;
    return item.usedIn.some((u) => u.type === selectedType);
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const storagePercentage = Math.min(100, Math.round((storageUsedBytes / maxStorageBytes) * 100));

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation Produits & Catalogue */}
      <ProductsNavTabs storeSlug={storeSlug} />

      {/* En-tête avec Quota & Actions */}
      <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#111111]">Médiathèque de la boutique</h1>
                <p className="text-xs text-[#7A7A7A]">
                  Gestion centralisée des photos de produits, bannières, logos et descriptions. Stockage 100% sécurisé et souverain.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleMigrateExternal}
              disabled={isMigrating}
              className="px-4 py-2.5 rounded-xl border border-[#E6E0D4] hover:bg-[#FAF8F5] text-xs font-bold text-[#111111] transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Rapatrie automatiquement les images externes (Shopify / CSV) dans notre stockage sécurisé"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-stone-600", isMigrating && "animate-spin")} />
              <span>{isMigrating ? "Migration en cours..." : "Migrer images externes"}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleMultipleUpload}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl bg-[#1F3A26] hover:bg-[#162B1C] text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isUploading ? `Envoi en cours (${progress}%)...` : "Ajouter des images"}</span>
            </button>
          </div>
        </div>

        {/* Jauge d'utilisation du stockage */}
        <div className="mt-6 pt-6 border-t border-[#E6E0D4] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#4A4A4A]">
                <HardDrive className="w-3.5 h-3.5 text-stone-500" />
                <span>Espace de stockage utilisé</span>
              </span>
              <span className="text-[#111111]">
                {formatSize(storageUsedBytes)} sur {formatSize(maxStorageBytes)} ({storagePercentage}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  storagePercentage > 85 ? "bg-rose-500" : storagePercentage > 60 ? "bg-amber-500" : "bg-emerald-600"
                )}
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 text-xs text-[#7A7A7A]">
            <div className="flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5 text-stone-400" />
              <span>{items.length} fichier{items.length > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-stone-400" />
              <span>{items.filter((i) => i.usageCount > 0).length} actif{items.filter((i) => i.usageCount > 0).length > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages d'alerte et de confirmation */}
      {deleteError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-start gap-3 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-black">Protection anti-suppression active</p>
            <p className="font-normal text-rose-700 mt-0.5">{deleteError}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Rapport de migration externe si présent */}
      {migrationReport && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Rapport de rapatriement d'images externes</span>
            </span>
            <span className="text-blue-700">Durée : {migrationReport.durationMs}ms</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className="p-2 bg-white rounded-xl border border-blue-100">
              <div className="text-lg font-black text-blue-900">{migrationReport.totalScanned}</div>
              <div className="text-[10px] text-blue-600 uppercase font-bold">Examinées</div>
            </div>
            <div className="p-2 bg-white rounded-xl border border-blue-100">
              <div className="text-lg font-black text-emerald-700">{migrationReport.migrated}</div>
              <div className="text-[10px] text-emerald-600 uppercase font-bold">Rapatriées</div>
            </div>
            <div className="p-2 bg-white rounded-xl border border-blue-100">
              <div className="text-lg font-black text-rose-700">{migrationReport.failed}</div>
              <div className="text-[10px] text-rose-600 uppercase font-bold">Échecs</div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de filtres et recherche */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou texte alt..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E6E0D4] bg-white text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {[
            { id: "all", label: "Tous" },
            { id: "used", label: "Utilisés" },
            { id: "unused", label: "Non utilisés" },
            { id: "product", label: "Produits" },
            { id: "description", label: "Descriptions" },
            { id: "banner", label: "Bannières" },
            { id: "logo", label: "Logos" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap",
                selectedType === tab.id
                  ? "bg-[#1F3A26] text-white"
                  : "bg-white border border-[#E6E0D4] text-[#4A4A4A] hover:bg-[#FAF8F5]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des médias + Panneau de détails */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grille principale (2 colonnes sur 3) */}
        <div className="lg:col-span-2 rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-[#7A7A7A] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-stone-400" />
              <p>Chargement des fichiers multimédias...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#7A7A7A] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="font-bold text-[#111111]">Aucune image trouvée</p>
              <p className="text-stone-500 max-w-sm mx-auto">
                {searchQuery
                  ? "Aucun fichier ne correspond à votre recherche."
                  : "Téléversez vos premières images pour enrichir vos fiches produits et votre vitrine."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "group relative aspect-square rounded-2xl overflow-hidden border cursor-pointer transition-all bg-stone-50",
                      isSelected
                        ? "border-[#111111] ring-2 ring-black shadow-md"
                        : "border-[#E6E0D4] hover:border-stone-400"
                    )}
                  >
                    <img
                      src={item.url}
                      alt={item.altText || item.originalName}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Badge d'utilisation */}
                    <div className="absolute top-2 left-2">
                      {item.usageCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-white">
                          {item.usageCount} {item.usageCount > 1 ? "utilisations" : "utilisation"}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-stone-200/90 text-[10px] font-bold text-stone-700">
                          Inactif
                        </span>
                      )}
                    </div>

                    {/* Nom en surimpression au survol */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      {item.originalName}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panneau de détails de l'image sélectionnée */}
        <div className="rounded-3xl border border-[#E6E0D4] bg-white p-6 shadow-2xs h-fit space-y-5">
          {selectedItem ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#111111]">Détails du fichier</h3>
                <span className="text-[11px] font-bold text-stone-500 uppercase">{selectedItem.mimeType.replace("image/", "")}</span>
              </div>

              {/* Aperçu grand format */}
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[#E6E0D4] bg-stone-100 relative">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.altText || selectedItem.originalName}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Métadonnées */}
              <div className="space-y-3 text-xs divide-y divide-[#E6E0D4]/60">
                <div className="pt-2 flex justify-between">
                  <span className="text-[#7A7A7A]">Nom du fichier</span>
                  <span className="font-bold text-[#111111] truncate max-w-[180px] text-right" title={selectedItem.originalName}>
                    {selectedItem.originalName}
                  </span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-[#7A7A7A]">Taille</span>
                  <span className="font-bold text-[#111111]">{formatSize(selectedItem.sizeBytes)}</span>
                </div>

                {selectedItem.width && selectedItem.height && (
                  <div className="pt-2 flex justify-between">
                    <span className="text-[#7A7A7A]">Dimensions</span>
                    <span className="font-bold text-[#111111]">
                      {selectedItem.width} × {selectedItem.height} px
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-between">
                  <span className="text-[#7A7A7A]">Texte alternatif (SEO)</span>
                  <span className="font-bold text-[#111111] truncate max-w-[180px] text-right">
                    {selectedItem.altText || "Non défini"}
                  </span>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[#7A7A7A]">URL publique</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.url);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="flex items-center gap-1 font-bold text-amber-700 hover:text-amber-800"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedUrl ? "Copié !" : "Copier le lien"}</span>
                  </button>
                </div>
              </div>

              {/* Emplacements d'utilisation */}
              <div className="pt-2 border-t border-[#E6E0D4] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#4A4A4A]">Emplacements d'utilisation</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px]",
                      selectedItem.usageCount > 0 ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                    )}
                  >
                    {selectedItem.usageCount} élément{selectedItem.usageCount > 1 ? "s" : ""}
                  </span>
                </div>

                {selectedItem.usedIn && selectedItem.usedIn.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedItem.usedIn.map((use, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-stone-50 border border-[#E6E0D4] text-xs flex items-center justify-between"
                      >
                        <span className="font-bold text-[#111111] truncate max-w-[160px]">
                          {use.title || use.id}
                        </span>
                        <span className="text-[10px] font-bold text-stone-500 uppercase px-1.5 py-0.5 rounded bg-white border border-[#E6E0D4]">
                          {use.type}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-dashed border-[#E6E0D4]">
                    Ce fichier n'est rattaché à aucun produit, description ou bannière. Vous pouvez le supprimer en toute sécurité.
                  </p>
                )}
              </div>

              {/* Bouton de suppression */}
              <div className="pt-3 border-t border-[#E6E0D4]">
                <button
                  onClick={() => handleDeleteItem(selectedItem)}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                    selectedItem.usageCount > 0
                      ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                  )}
                  title={
                    selectedItem.usageCount > 0
                      ? "Impossible de supprimer : le fichier est utilisé dans le catalogue"
                      : "Supprimer définitivement ce fichier"
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {selectedItem.usageCount > 0 ? "Suppression verrouillée (fichier utilisé)" : "Supprimer ce fichier"}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-[#7A7A7A] space-y-2">
              <Info className="w-6 h-6 mx-auto text-stone-400" />
              <p className="font-bold text-[#111111]">Aucun média sélectionné</p>
              <p className="text-stone-500 max-w-xs mx-auto">
                Cliquez sur une image de la grille pour afficher ses dimensions, sa taille, son texte alternatif et ses utilisations dans le catalogue.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
