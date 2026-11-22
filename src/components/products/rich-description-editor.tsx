"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Table,
  Code,
  Sparkles,
  RemoveFormatting,
  Eye,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  Wand2,
} from "lucide-react";
import {
  sanitizeProductDescription,
  formatAiStructuredDescription,
  HtmlSanitizeReport,
} from "@/lib/server-html-sanitizer";
import { ProductDescription } from "./product-description";
import { ImagePicker, SelectedImageData } from "@/components/media/ImagePicker";
import { VideoEmbedModal } from "@/components/media/VideoEmbedModal";
import { cn } from "@/lib/utils";

interface RichDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  productTitle?: string;
  storeSlug?: string;
  onOpenAiGenerator?: () => void;
}

export function RichDescriptionEditor({
  value,
  onChange,
  productTitle = "Nouveau produit",
  storeSlug = "lome-glow",
  onOpenAiGenerator,
}: RichDescriptionEditorProps) {
  const [mode, setMode] = useState<"visual" | "html" | "preview">("visual");
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [cleanFeedback, setCleanFeedback] = useState<string | null>(null);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [, setImgTick] = useState(0);
  const isInternalUpdateRef = useRef(false);

  // Synchronisation du contenu dans l'éditeur visuel UNIQUEMENT lors des changements externes (Prompt 17-J)
  // Ne JAMAIS réécraser innerHTML pendant que l'utilisateur est en train de taper !
  useEffect(() => {
    if (editorRef.current && mode === "visual") {
      if (isInternalUpdateRef.current) {
        isInternalUpdateRef.current = false;
        return;
      }
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, mode]);


  // Rognage non destructif d'une image (cadrage, position, taille) — enregistré en attributs sûrs
  const RATIO_STYLE: Record<string, string> = { "1-1": "1 / 1", "4-3": "4 / 3", "3-4": "3 / 4", "16-9": "16 / 9" };
  const applyImgProps = (changes: { ratio?: string | null; pos?: string | null; size?: string | null }) => {
    const img = selectedImg;
    if (!img) return;
    const setOrClear = (attr: string, v: string | null | undefined) => {
      if (v === undefined) return;
      if (v === null) img.removeAttribute(attr);
      else img.setAttribute(attr, v);
    };
    setOrClear("data-ratio", changes.ratio);
    setOrClear("data-pos", changes.pos);
    setOrClear("data-size", changes.size);
    // Aperçu dans l'éditeur (le style est retiré à l'affichage public, les attributs restent)
    const ratio = img.getAttribute("data-ratio");
    const pos = img.getAttribute("data-pos");
    const size = img.getAttribute("data-size");
    img.style.aspectRatio = ratio ? RATIO_STYLE[ratio] : "";
    img.style.width = ratio ? "100%" : "";
    img.style.objectFit = ratio ? "cover" : "";
    img.style.objectPosition = pos === "top" ? "top" : pos === "bottom" ? "bottom" : "center";
    img.style.maxWidth = size === "small" ? "260px" : size === "medium" ? "420px" : "100%";
    img.style.height = "auto";
    handleInput();
    setImgTick((n) => n + 1);
  };

  const removeSelectedImage = () => {
    if (!selectedImg) return;
    const figure = selectedImg.closest("figure");
    (figure || selectedImg).remove();
    setSelectedImg(null);
    handleInput();
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (selectedImg) selectedImg.style.outline = "";
    if (target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      img.style.outline = "3px solid #C2410C";
      img.style.outlineOffset = "2px";
      setSelectedImg(img);
    } else {
      setSelectedImg(null);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML.replace(/outline:\s*[^;"]*;?\s*outline-offset:\s*[^;"]*;?/g, "");
      isInternalUpdateRef.current = true;
      // Nettoyage HTML : UNIQUEMENT à l'enregistrement et à l'affichage, JAMAIS à chaque frappe ! (Prompt 17-J)
      onChange(html);
    }
  };

  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (mode !== "visual") return;
    document.execCommand(command, false, arg);
    handleInput();
  };

  // Raccourcis clavier usuels (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Z, Ctrl+Y, Ctrl+K)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (mode !== "visual") return;
    const isMod = e.ctrlKey || e.metaKey;

    if (isMod) {
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        execCmd("bold");
      } else if (key === "i") {
        e.preventDefault();
        execCmd("italic");
      } else if (key === "u") {
        e.preventDefault();
        execCmd("underline");
      } else if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        execCmd("undo");
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        execCmd("redo");
      } else if (key === "k") {
        e.preventDefault();
        handleInsertLink();
      }
    }
  };

  const handleInsertHeading = (tag: "h2" | "h3" | "h4" | "p") => {
    if (mode !== "visual") return;
    document.execCommand("formatBlock", false, `<${tag}>`);
    handleInput();
  };

  const handleInsertLink = () => {
    const url = prompt("Entrez l'URL du lien (ex: https://...) :");
    if (url && url.trim()) {
      const targetAttr = ' target="_blank" rel="noopener noreferrer nofollow"';
      if (mode === "visual") {
        const selection = window.getSelection();
        const selectedText = selection?.toString()?.trim() || url.trim();
        const linkHtml = `<a href="${url.trim()}"${targetAttr}>${selectedText}</a>`;
        document.execCommand("insertHTML", false, linkHtml);
        handleInput();
      } else {
        onChange(value + ` <a href="${url.trim()}"${targetAttr}>${url.trim()}</a>`);
      }
    }
  };

  // Remplacement de tout prompt() par le sélecteur d'image unifié (Prompt 17-G)
  const handleInsertImage = () => {
    setIsImagePickerOpen(true);
  };

  const handleSelectImage = (imageData: SelectedImageData) => {
    const { url, altText = productTitle, align = "center", width = "medium" } = imageData;
    const widthClass = width === "small" ? "max-w-xs" : width === "medium" ? "max-w-md" : "w-full";
    const alignClass = align === "left" ? "mr-auto text-left" : align === "right" ? "ml-auto text-right" : "mx-auto text-center";

    const imageHtml = `<figure class="my-4 ${alignClass}"><img src="${url}" alt="${altText.replace(/"/g, "&quot;")}" class="${widthClass} rounded-xl shadow-xs inline-block" loading="lazy" /><figcaption class="text-xs text-stone-500 mt-1">${altText.replace(/</g, "&lt;")}</figcaption></figure><p><br></p>`;

    if (mode === "visual") {
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, imageHtml);
      handleInput();
    } else {
      onChange(value + "\n" + imageHtml);
    }
    setIsImagePickerOpen(false);
  };

  // Remplacement de tout prompt() par la modale vidéo YouTube/Vimeo sécurisée (Prompt 17-G)
  const handleInsertVideo = () => {
    setIsVideoModalOpen(true);
  };

  const handleSelectVideo = (embedUrl: string) => {
    const iframeHtml = `<div class="aspect-video w-full my-4 rounded-xl overflow-hidden shadow-xs"><iframe src="${embedUrl}" width="100%" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br></p>`;
    if (mode === "visual") {
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, iframeHtml);
      handleInput();
    } else {
      onChange(value + "\n" + iframeHtml);
    }
    setIsVideoModalOpen(false);
  };

  // Support direct du glisser-déposer et du collage d'image dans l'éditeur (Prompt 17-G & 17-J)
  const handleDirectFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const isGif = file.type === "image/gif" || /\.gif$/i.test(file.name);
    const maxSize = isGif ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(
        isGif
          ? "L'animation GIF dépasse la taille maximale autorisée de 8 Mo."
          : "L'image dépasse la taille maximale autorisée de 5 Mo."
      );
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storeSlug", storeSlug);
      formData.append("contextType", "description");
      formData.append("altText", productTitle);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && (data.media?.url || data.url)) {
        handleSelectImage({
          url: data.media?.url || data.url,
          altText: productTitle,
          align: "center",
          width: "medium",
        });
      }
    } catch (e) {
      console.error("Échec de l'upload direct :", e);
    }
  };

  const handleEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleDirectFileUpload(file);
        return;
      }
    }
  };

  const handleEditorDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        handleDirectFileUpload(file);
      }
    }
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table class="w-full my-4 border border-[#E6E0D4] text-xs text-left">
        <thead>
          <tr class="bg-[#FAF8F5] border-b border-[#E6E0D4] font-bold">
            <th class="p-2.5 border-r border-[#E6E0D4]">Caractéristique</th>
            <th class="p-2.5">Détails</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-[#E6E0D4]/70">
            <td class="p-2.5 border-r border-[#E6E0D4]/70 font-medium">Origine</td>
            <td class="p-2.5">Naturelle / Biologique</td>
          </tr>
          <tr>
            <td class="p-2.5 border-r border-[#E6E0D4]/70 font-medium">Contenance</td>
            <td class="p-2.5">Flacon 100 ml</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    if (mode === "visual") {
      document.execCommand("insertHTML", false, tableHtml);
      handleInput();
    } else {
      onChange(value + "\n" + tableHtml);
    }
    setTableMenuOpen(false);
  };

  const handleAddTableRow = () => {
    if (mode !== "visual" || !editorRef.current) return;
    const table = editorRef.current.querySelector("table");
    if (!table) {
      handleInsertTable();
      return;
    }
    const tbody = table.querySelector("tbody") || table;
    const row = document.createElement("tr");
    row.className = "border-b border-[#E6E0D4]/70";
    const colCount = table.querySelector("tr")?.children.length || 2;
    for (let i = 0; i < colCount; i++) {
      const cell = document.createElement("td");
      cell.className = "p-2.5 border-r border-[#E6E0D4]/70 text-xs";
      cell.innerHTML = "Nouvelle cellule";
      row.appendChild(cell);
    }
    tbody.appendChild(row);
    handleInput();
    setTableMenuOpen(false);
  };

  const handleDeleteTableRow = () => {
    if (mode !== "visual" || !editorRef.current) return;
    const table = editorRef.current.querySelector("table");
    if (!table) return;
    const rows = table.querySelectorAll("tbody tr");
    if (rows.length > 1) {
      rows[rows.length - 1].remove();
      handleInput();
    }
    setTableMenuOpen(false);
  };

  const handleAddTableColumn = () => {
    if (mode !== "visual" || !editorRef.current) return;
    const table = editorRef.current.querySelector("table");
    if (!table) {
      handleInsertTable();
      return;
    }
    const theadRow = table.querySelector("thead tr");
    if (theadRow) {
      const th = document.createElement("th");
      th.className = "p-2.5 border-r border-[#E6E0D4] font-bold text-xs uppercase";
      th.innerHTML = "Colonne";
      theadRow.appendChild(th);
    }
    const bodyRows = table.querySelectorAll("tbody tr");
    bodyRows.forEach((r) => {
      const td = document.createElement("td");
      td.className = "p-2.5 border-r border-[#E6E0D4]/70 text-xs";
      td.innerHTML = "-";
      r.appendChild(td);
    });
    handleInput();
    setTableMenuOpen(false);
  };

  const handleDeleteTableColumn = () => {
    if (mode !== "visual" || !editorRef.current) return;
    const table = editorRef.current.querySelector("table");
    if (!table) return;
    const rows = table.querySelectorAll("tr");
    if (rows.length > 0 && rows[0].children.length > 1) {
      rows.forEach((r) => {
        if (r.lastElementChild) r.lastElementChild.remove();
      });
      handleInput();
    }
    setTableMenuOpen(false);
  };

  // Bouton "Nettoyer la mise en forme" (Prompt 17-F, 5)
  const handleCleanFormatting = () => {
    const report: HtmlSanitizeReport = sanitizeProductDescription(value, {
      productTitle,
    });
    onChange(report.cleanedHtml);

    if (report.hasChanges) {
      setCleanFeedback(
        report.status === "sanitized"
          ? "Éléments non conformes ou scripts neutralisés avec succès."
          : "Styles superflus retirés et mise en forme Novika appliquée."
      );
    } else {
      setCleanFeedback("Description déjà parfaitement conforme.");
    }
    setTimeout(() => setCleanFeedback(null), 3500);
  };

  // Bouton "Améliorer avec l'IA" (Prompt 17-F, 5)
  const handleAiImprove = () => {
    const formatted = formatAiStructuredDescription({
      title: productTitle,
      rawTextOrHtml: value,
    });
    onChange(formatted);
    setCleanFeedback("Fiche restructurée par l'IA en sections clés (Accroche, Bénéfices, Mode d'emploi).");
    setTimeout(() => setCleanFeedback(null), 4000);
  };

  return (
    <div className="border border-[#E6E0D4] rounded-2xl overflow-hidden bg-white shadow-2xs">
      {/* Barre de notification / Feedback rapide */}
      {cleanFeedback && (
        <div className="px-3.5 py-1.5 bg-emerald-50 border-b border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{cleanFeedback}</span>
        </div>
      )}

      {/* Barre d'outils complète */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#FAF8F5] border-b border-[#E6E0D4] text-xs">
        {/* Titres et Paragraphes (H1 interdit pour le SEO, seul le titre du produit est H1) */}
        <div className="flex items-center gap-0.5 border-r border-[#E6E0D4] pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => handleInsertHeading("p")}
            className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Paragraphe standard"
          >
            P
          </button>
          <button
            type="button"
            onClick={() => handleInsertHeading("h2")}
            className="px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#EFECE6] text-[#111111]"
            title="Titre H2 (Section principale)"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => handleInsertHeading("h3")}
            className="px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#EFECE6] text-[#111111]"
            title="Sous-titre H3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => handleInsertHeading("h4")}
            className="px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#EFECE6] text-[#111111]"
            title="Sous-titre H4"
          >
            H4
          </button>
        </div>

        {/* Style de texte */}
        <div className="flex items-center gap-0.5 border-r border-[#E6E0D4] pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => execCmd("bold")}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A] hover:text-[#111111]"
            title="Gras (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("italic")}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A] hover:text-[#111111]"
            title="Italique (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("underline")}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A] hover:text-[#111111]"
            title="Souligné (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Listes */}
        <div className="flex items-center gap-0.5 border-r border-[#E6E0D4] pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => execCmd("insertUnorderedList")}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Liste à puces"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertOrderedList")}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Liste numérotée"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignement */}
        <div className="flex items-center gap-0.5 border-r border-[#E6E0D4] pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => execCmd("justifyLeft")}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Aligner à gauche"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyCenter")}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Centrer"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyRight")}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Aligner à droite"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Médias & Liens */}
        <div className="flex items-center gap-0.5 border-r border-[#E6E0D4] pr-1.5 mr-1">
          <button
            type="button"
            onClick={handleInsertLink}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Insérer un lien sécurisé"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertImage}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Insérer une image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertVideo}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Insérer une vidéo (YouTube / Vimeo)"
          >
            <Video className="w-3.5 h-3.5" />
          </button>

          {/* Menu Tableau */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTableMenuOpen(!tableMenuOpen)}
              className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
              title="Tableau (Insérer / Lignes / Colonnes)"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
            {tableMenuOpen && (
              <div className="absolute left-0 mt-1 p-2 rounded-xl bg-white border border-[#E6E0D4] shadow-xl z-20 w-48 space-y-1">
                <button
                  type="button"
                  onClick={handleInsertTable}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#FAF8F5] text-xs font-semibold text-[#111111]"
                >
                  Insérer tableau (2x2)
                </button>
                <div className="border-t border-[#F0EBE0] my-1" />
                <button
                  type="button"
                  onClick={handleAddTableRow}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-[#FAF8F5] text-[11px] text-[#4A4A4A] flex items-center justify-between"
                >
                  <span>Ajouter une ligne</span>
                  <Plus className="w-3 h-3 text-emerald-600" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTableRow}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-[#FAF8F5] text-[11px] text-[#4A4A4A] flex items-center justify-between"
                >
                  <span>Supprimer dernière ligne</span>
                  <Minus className="w-3 h-3 text-rose-500" />
                </button>
                <button
                  type="button"
                  onClick={handleAddTableColumn}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-[#FAF8F5] text-[11px] text-[#4A4A4A] flex items-center justify-between"
                >
                  <span>Ajouter une colonne</span>
                  <Plus className="w-3 h-3 text-emerald-600" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTableColumn}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-[#FAF8F5] text-[11px] text-[#4A4A4A] flex items-center justify-between"
                >
                  <span>Supprimer dernière colonne</span>
                  <Minus className="w-3 h-3 text-rose-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bouton "Nettoyer la mise en forme" (Prompt 17-F, 5) */}
        <button
          type="button"
          id="btn-clean-formatting"
          onClick={handleCleanFormatting}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E6E0D4] hover:bg-white text-xs font-bold text-[#4A4A4A] hover:text-[#111111] transition-colors"
          title="Nettoyer les styles superflus et vérifier la conformité"
        >
          <RemoveFormatting className="w-3.5 h-3.5 text-[#7A7A7A]" />
          <span>Nettoyer</span>
        </button>

        {/* Bouton "Améliorer avec l'IA" (Prompt 17-F, 5) */}
        <button
          type="button"
          id="btn-ai-improve"
          onClick={handleAiImprove}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold transition-colors"
          title="Restructurer la fiche en sections claires avec l'IA (Accroche, Bénéfices, Mode d'emploi)"
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-600" />
          <span>Améliorer avec l'IA</span>
        </button>

        {/* Bouton Générateur IA complet si branché */}
        {onOpenAiGenerator && (
          <button
            type="button"
            onClick={onOpenAiGenerator}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold transition-colors"
            title="Ouvrir l'assistant complet de rédaction IA"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Rédiger avec IA</span>
          </button>
        )}

        {/* Sélecteur de mode : Visuel / Code HTML / Aperçu Vitrine */}
        <div className="ml-auto flex items-center gap-1 bg-[#EFECE6] p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("visual")}
            className={cn(
              "px-2.5 py-1 rounded-lg transition-colors",
              mode === "visual" ? "bg-white text-[#111111] shadow-2xs" : "text-[#7A7A7A] hover:text-black"
            )}
          >
            Visuel
          </button>
          <button
            type="button"
            id="btn-mode-html"
            onClick={() => setMode("html")}
            className={cn(
              "px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1",
              mode === "html" ? "bg-white text-[#111111] shadow-2xs" : "text-[#7A7A7A] hover:text-black"
            )}
          >
            <Code className="w-3 h-3" />
            <span>Code HTML</span>
          </button>
          <button
            type="button"
            id="btn-mode-preview"
            onClick={() => setMode("preview")}
            className={cn(
              "px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1",
              mode === "preview" ? "bg-white text-[#111111] shadow-2xs" : "text-[#7A7A7A] hover:text-black"
            )}
          >
            <Eye className="w-3 h-3" />
            <span>Aperçu Vitrine</span>
          </button>
        </div>
      </div>

      {mode === "visual" && selectedImg && (
        <div
          data-testid="image-crop-panel"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 border-b border-[#E6E0D4] bg-[#FFF7ED] text-[11px] font-bold text-[#111111]"
        >
          <span className="text-[#C2410C]">Image sélectionnée</span>
          <div className="flex items-center gap-1">
            <span className="text-stone-500 font-semibold">Rogner :</span>
            {[
              ["Original", null],
              ["Carré", "1-1"],
              ["4:3", "4-3"],
              ["3:4", "3-4"],
              ["16:9", "16-9"],
            ].map(([label, val]) => (
              <button
                key={label as string}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyImgProps({ ratio: val as string | null })}
                className={cn(
                  "px-2 py-1 rounded-lg border cursor-pointer",
                  (selectedImg.getAttribute("data-ratio") || null) === val
                    ? "bg-black text-white border-black"
                    : "bg-white border-[#E6E0D4] hover:bg-stone-50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-stone-500 font-semibold">Cadrage :</span>
            {[
              ["Haut", "top"],
              ["Centre", null],
              ["Bas", "bottom"],
            ].map(([label, val]) => (
              <button
                key={label as string}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyImgProps({ pos: val as string | null })}
                className={cn(
                  "px-2 py-1 rounded-lg border cursor-pointer",
                  (selectedImg.getAttribute("data-pos") || null) === val
                    ? "bg-black text-white border-black"
                    : "bg-white border-[#E6E0D4] hover:bg-stone-50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-stone-500 font-semibold">Taille :</span>
            {[
              ["Petite", "small"],
              ["Moyenne", "medium"],
              ["Pleine", null],
            ].map(([label, val]) => (
              <button
                key={label as string}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyImgProps({ size: val as string | null })}
                className={cn(
                  "px-2 py-1 rounded-lg border cursor-pointer",
                  (selectedImg.getAttribute("data-size") || null) === val
                    ? "bg-black text-white border-black"
                    : "bg-white border-[#E6E0D4] hover:bg-stone-50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={removeSelectedImage}
            className="ml-auto px-2 py-1 rounded-lg border border-red-200 text-red-700 bg-white hover:bg-red-50 cursor-pointer"
          >
            Supprimer l&apos;image
          </button>
        </div>
      )}

      {/* Zone de contenu selon le mode */}
      {mode === "visual" && (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onClick={handleEditorClick}
          onBlur={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handleEditorPaste}
          onDrop={handleEditorDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          className={cn(
            "p-4 min-h-[220px] max-h-[500px] overflow-y-auto text-sm text-[#111111] focus:outline-none transition-all",
            isDraggingOver && "bg-amber-50/50 ring-2 ring-dashed ring-amber-400"
          )}
          data-testid="rich-description-content-editable"
        />
      )}

      {mode === "html" && (
        <div className="p-3 bg-stone-900 text-emerald-400 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800 text-[11px] text-stone-400">
            <span>Mode Code HTML strict (seules les balises autorisées sont conservées)</span>
            <span className="text-emerald-500 font-semibold">Nettoyage automatique</span>
          </div>
          <textarea
            rows={10}
            value={value}
            onChange={(e) => {
              const report = sanitizeProductDescription(e.target.value, { productTitle });
              onChange(report.cleanedHtml);
            }}
            className="w-full bg-transparent text-emerald-300 focus:outline-none font-mono text-xs leading-relaxed"
            placeholder="<p>Écrivez votre code HTML ici...</p>"
            data-testid="rich-description-html-textarea"
          />
        </div>
      )}

      {mode === "preview" && (
        <div className="p-6 bg-white min-h-[220px] max-h-[500px] overflow-y-auto">
          <div className="pb-3 mb-4 border-b border-[#E6E0D4] flex items-center justify-between text-xs text-[#7A7A7A]">
            <span>Rendu exact tel qu'affiché sur la boutique client</span>
            <span className="font-bold text-emerald-700">Composant ProductDescription actif</span>
          </div>
          <ProductDescription html={value} productTitle={productTitle} isStorefront={true} />
        </div>
      )}

      {/* Modale unifiée d'import d'image (Prompt 17-G) */}
      <ImagePicker
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelectImage={handleSelectImage}
        storeSlug={storeSlug}
        context="description"
        defaultAlt={productTitle}
        showFormatOptions={true}
      />

      {/* Modale vidéo YouTube / Vimeo sécurisée (Prompt 17-G) */}
      <VideoEmbedModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onInsertVideo={handleSelectVideo}
      />
    </div>
  );
}
