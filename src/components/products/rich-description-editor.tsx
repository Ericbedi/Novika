"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
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
  Palette,
  Eye,
  Indent,
  Outdent,
  Plus,
  Minus,
} from "lucide-react";
import { sanitizeHtml, cleanHtmlToPlainText } from "@/lib/html-sanitizer";
import { cn } from "@/lib/utils";

interface RichDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  onOpenAiGenerator?: () => void;
}

export function RichDescriptionEditor({
  value,
  onChange,
  onOpenAiGenerator,
}: RichDescriptionEditorProps) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Synchronisation initiale du contenu dans l'éditeur visuel
  useEffect(() => {
    if (editorRef.current && mode === "visual") {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, mode]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const sanitized = sanitizeHtml(html).cleanHtml;
      onChange(sanitized);
    }
  };

  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (mode !== "visual") return;
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleInsertHeading = (tag: "h1" | "h2" | "h3" | "p") => {
    if (mode !== "visual") return;
    document.execCommand("formatBlock", false, `<${tag}>`);
    handleInput();
  };

  const handleInsertLink = () => {
    const url = prompt("Entrez l'URL du lien (ex: https://...) :");
    if (url && url.trim()) {
      const openInNewTab = confirm("Ouvrir ce lien dans un nouvel onglet ?");
      const targetAttr = openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
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

  const handleInsertImage = () => {
    const url = prompt("Entrez l'URL de l'image (ex: https://.../photo.webp) :");
    if (url && url.trim()) {
      execCmd("insertImage", url.trim());
    }
  };

  const handleInsertVideo = () => {
    const url = prompt(
      "Entrez le lien YouTube ou Vimeo (ex: https://www.youtube.com/watch?v=... ou https://vimeo.com/...) :"
    );
    if (!url || !url.trim()) return;

    let embedUrl = "";
    const cleanUrl = url.trim();

    if (cleanUrl.includes("youtube.com/watch?v=")) {
      const videoId = cleanUrl.split("v=")[1]?.split("&")[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (cleanUrl.includes("youtu.be/")) {
      const videoId = cleanUrl.split("youtu.be/")[1]?.split("?")[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (cleanUrl.includes("vimeo.com/")) {
      const videoId = cleanUrl.split("vimeo.com/")[1]?.split("?")[0];
      if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
    } else if (
      cleanUrl.startsWith("https://www.youtube.com/embed/") ||
      cleanUrl.startsWith("https://player.vimeo.com/video/")
    ) {
      embedUrl = cleanUrl;
    }

    if (embedUrl) {
      const iframeHtml = `<div class="aspect-video w-full my-3"><iframe src="${embedUrl}" width="100%" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br></p>`;
      if (mode === "visual") {
        document.execCommand("insertHTML", false, iframeHtml);
        handleInput();
      } else {
        onChange(value + "\n" + iframeHtml);
      }
    } else {
      alert("Veuillez fournir un lien YouTube ou Vimeo valide.");
    }
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table class="w-full my-3 border border-stone-300 text-xs text-left">
        <thead>
          <tr class="bg-stone-100 border-b border-stone-300 font-bold">
            <th class="p-2 border-r border-stone-300">Caractéristique</th>
            <th class="p-2">Détails</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-stone-200">
            <td class="p-2 border-r border-stone-200 font-medium">Origine</td>
            <td class="p-2">Naturelle / Biologique</td>
          </tr>
          <tr>
            <td class="p-2 border-r border-stone-200 font-medium">Contenance</td>
            <td class="p-2">Flacon 100 ml</td>
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
    row.className = "border-b border-stone-200";
    const colCount = table.querySelector("tr")?.children.length || 2;
    for (let i = 0; i < colCount; i++) {
      const cell = document.createElement("td");
      cell.className = "p-2 border-r border-stone-200 text-xs";
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
      th.className = "p-2 border-r border-stone-300 font-bold text-xs";
      th.innerHTML = "Colonne";
      theadRow.appendChild(th);
    }
    const bodyRows = table.querySelectorAll("tbody tr");
    bodyRows.forEach((r) => {
      const td = document.createElement("td");
      td.className = "p-2 border-r border-stone-200 text-xs";
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

  const handleClearFormat = () => {
    if (confirm("Voulez-vous réinitialiser le formatage pour revenir à un texte brut épuré ?")) {
      const plain = cleanHtmlToPlainText(value);
      const paragraphs = plain
        .split("\n\n")
        .filter(Boolean)
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("\n");
      onChange(paragraphs);
    }
  };

  const colors = [
    { name: "Noir", code: "#111111" },
    { name: "Gris", code: "#4A4A4A" },
    { name: "Émeraude", code: "#047857" },
    { name: "Bleu", code: "#1D4ED8" },
    { name: "Ambre", code: "#B45309" },
    { name: "Rouge", code: "#B91C1C" },
    { name: "Violet", code: "#6D28D9" },
  ];

  return (
    <div className="border border-[#E6E0D4] rounded-2xl overflow-hidden bg-white shadow-2xs">
      {/* Barre d'outils complète */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#FAF8F5] border-b border-[#E6E0D4] text-xs">
        {/* Titres et Paragraphes */}
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
            onClick={() => handleInsertHeading("h1")}
            className="px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#EFECE6] text-[#111111]"
            title="Titre H1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => handleInsertHeading("h2")}
            className="px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#EFECE6] text-[#111111]"
            title="Titre H2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => handleInsertHeading("h3")}
            className="px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#EFECE6] text-[#111111]"
            title="Titre H3"
          >
            H3
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

          {/* Nuancier de couleur */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setColorPickerOpen(!colorPickerOpen)}
              className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
              title="Couleur du texte"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {colorPickerOpen && (
              <div className="absolute left-0 mt-1 p-2 rounded-xl bg-white border border-[#E6E0D4] shadow-xl z-20 flex items-center gap-1.5">
                {colors.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      execCmd("foreColor", c.code);
                      setColorPickerOpen(false);
                    }}
                    style={{ backgroundColor: c.code }}
                    className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform"
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>
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

        {/* Listes & Retraits */}
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
          <button
            type="button"
            onClick={() => execCmd("indent")}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Augmenter le retrait"
          >
            <Indent className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("outdent")}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Diminuer le retrait"
          >
            <Outdent className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Médias & Liens & Tableaux */}
        <div className="flex items-center gap-0.5 border-r border-[#E6E0D4] pr-1.5 mr-1">
          <button
            type="button"
            onClick={handleInsertLink}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Insérer un lien (avec option nouvel onglet)"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertImage}
            className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
            title="Insérer une image par URL"
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

          {/* Menu Tableau (Insérer, Lignes, Colonnes) */}
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
              <div className="absolute left-0 mt-1 p-2 rounded-xl bg-white border border-[#E6E0D4] shadow-xl z-20 w-44 space-y-1">
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

        {/* Effacer le format */}
        <button
          type="button"
          onClick={handleClearFormat}
          className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#4A4A4A]"
          title="Effacer le formatage"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>

        {/* Bouton IA */}
        {onOpenAiGenerator && (
          <button
            type="button"
            onClick={onOpenAiGenerator}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors shadow-2xs"
            title="Ouvrir le générateur de fiche produit IA"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span>Générer avec l'IA</span>
          </button>
        )}

        {/* Bascule Mode Code HTML / Visuel */}
        <button
          type="button"
          onClick={() => {
            if (mode === "visual") {
              setMode("html");
            } else {
              setMode("visual");
            }
          }}
          className={cn(
            "p-1.5 rounded-lg transition-colors ml-1",
            mode === "html" ? "bg-[#111111] text-white" : "hover:bg-[#EFECE6] text-[#4A4A4A]"
          )}
          title={mode === "html" ? "Basculer en mode visuel (WYSIWYG)" : "Basculer en mode code HTML"}
        >
          {mode === "html" ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Zone d'édition */}
      {mode === "visual" ? (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="p-4 min-h-[220px] max-h-[500px] overflow-y-auto text-sm text-[#111111] focus:outline-none prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-[#111111] prose-a:text-blue-600 prose-img:rounded-xl"
          data-testid="rich-description-content-editable"
        />
      ) : (
        <div className="p-3 bg-stone-900 text-emerald-400 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800 text-[11px] text-stone-400">
            <span>Mode Code HTML restreint (scripts et iframes tiers bloqués)</span>
            <span className="text-emerald-500 font-semibold">HTML assaini</span>
          </div>
          <textarea
            rows={10}
            value={value}
            onChange={(e) => {
              const sanitized = sanitizeHtml(e.target.value).cleanHtml;
              onChange(sanitized);
            }}
            className="w-full bg-transparent text-emerald-300 focus:outline-none font-mono text-xs leading-relaxed"
            placeholder="<p>Écrivez votre code HTML ici...</p>"
            data-testid="rich-description-html-textarea"
          />
        </div>
      )}
    </div>
  );
}
