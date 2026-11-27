"use client";

import React, {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  TrendingUp,
  X,
} from "lucide-react";
import {
  DateRange,
  DEFAULT_TIMEZONE,
  dayKey,
  formatDateFr,
  getRangeDisplayLabel,
  keyToDate,
  PERIOD_PRESETS,
  PeriodPreset,
  presetRange,
  previousRange,
  shiftDays,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface DateRangePickerProps {
  id?: string;
  preset?: PeriodPreset;
  range?: DateRange;
  onChange?: (preset: PeriodPreset, range: DateRange) => void;
  syncWithUrl?: boolean;
  timeZone?: string;
  maxPastDays?: number;
  allowFuture?: boolean;
  className?: string;
  buttonClassName?: string;
  showPrefix?: boolean;
  align?: "left" | "right";
}

const MONTH_NAMES_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// Initiales à deux lettres (Lu Ma Me Je Ve Sa Di) sur une seule ligne
const WEEKDAY_NAMES_2L_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export function DateRangePicker({
  id = "btn-date-range-trigger",
  preset: controlledPreset,
  range: controlledRange,
  onChange,
  syncWithUrl = true,
  timeZone = DEFAULT_TIMEZONE,
  allowFuture = false,
  className,
  buttonClassName,
  showPrefix = false,
  align = "right",
}: DateRangePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pickerId = useId();
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialisation à partir de l'URL ou des props
  const initialPreset: PeriodPreset = useMemo(() => {
    if (controlledPreset) return controlledPreset;
    if (syncWithUrl && searchParams) {
      const urlPreset = searchParams.get("preset") as PeriodPreset | null;
      if (
        urlPreset &&
        (PERIOD_PRESETS.some((p) => p.id === urlPreset) || urlPreset === "custom")
      ) {
        return urlPreset;
      }
    }
    return "last7";
  }, [controlledPreset, syncWithUrl, searchParams]);

  const initialRange: DateRange = useMemo(() => {
    if (controlledRange) return controlledRange;
    if (syncWithUrl && searchParams) {
      const urlFrom = searchParams.get("from");
      const urlTo = searchParams.get("to");
      if (urlFrom && urlTo) {
        return {
          from: keyToDate(urlFrom, timeZone),
          to: shiftDays(keyToDate(urlTo, timeZone), 1, timeZone),
        };
      }
    }
    return presetRange(initialPreset, new Date(), timeZone);
  }, [controlledRange, syncWithUrl, searchParams, initialPreset, timeZone]);

  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PeriodPreset>(initialPreset);
  const [selectedRange, setSelectedRange] = useState<DateRange>(initialRange);
  const [tempFromDate, setTempFromDate] = useState<Date>(initialRange.from);
  const [tempToDate, setTempToDate] = useState<Date>(
    shiftDays(initialRange.to, -1, timeZone)
  );

  // Interrupteur Comparer
  const [isCompareEnabled, setIsCompareEnabled] = useState(true);

  // Saisie textuelle des dates jj/mm/aaaa
  const formatDateToInput = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [inputFromText, setInputFromText] = useState(formatDateToInput(tempFromDate));
  const [inputToText, setInputToText] = useState(formatDateToInput(tempToDate));
  const [inputError, setInputError] = useState("");

  // Mois affichés dans les deux calendriers
  const [leftMonth, setLeftMonth] = useState<Date>(() => {
    const d = new Date(initialRange.from);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [rightMonth, setRightMonth] = useState<Date>(() => {
    const d = new Date(initialRange.from);
    return new Date(d.getFullYear(), d.getMonth() + 1, 1);
  });

  // Pour vue mobile : calendrier unique
  const [mobileMonth, setMobileMonth] = useState<Date>(() => {
    const d = new Date(initialRange.from);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Calcul du positionnement dynamique avec détection de collision
  const [panelPosition, setPanelPosition] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    isMobile: boolean;
  }>({ isMobile: false });

  const calculatePosition = useCallback(() => {
    if (!triggerButtonRef.current || typeof window === "undefined") return;

    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setPanelPosition({ isMobile: true });
      return;
    }

    const rect = triggerButtonRef.current.getBoundingClientRect();
    const panelWidth = Math.min(820, window.innerWidth - 32);
    const estimatedHeight = 560;

    // Détection de collision verticale
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let openAbove = false;

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      openAbove = true;
    }

    // Alignement horizontal : aligné sur son bord droit
    let rightPos = window.innerWidth - rect.right;
    let leftPos: number | undefined = undefined;

    // Marge de 16px avec les bords d'écran
    if (rightPos < 16) {
      rightPos = 16;
    }

    // Si la largeur dépasse le bord gauche
    if (window.innerWidth - rightPos - panelWidth < 16) {
      rightPos = Math.max(16, window.innerWidth - panelWidth - 16);
    }

    if (openAbove) {
      setPanelPosition({
        bottom: window.innerHeight - rect.top + 8,
        right: rightPos,
        isMobile: false,
      });
    } else {
      setPanelPosition({
        top: rect.bottom + 8,
        right: rightPos,
        isMobile: false,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition, true);
      return () => {
        window.removeEventListener("resize", calculatePosition);
        window.removeEventListener("scroll", calculatePosition, true);
      };
    }
  }, [isOpen, calculatePosition]);

  // Fermeture par clic extérieur et touche Échap
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Synchronisation avec les props externes
  useEffect(() => {
    if (controlledPreset) setActivePreset(controlledPreset);
    if (controlledRange) {
      setSelectedRange(controlledRange);
      setTempFromDate(controlledRange.from);
      const incTo = shiftDays(controlledRange.to, -1, timeZone);
      setTempToDate(incTo);
      setInputFromText(formatDateToInput(controlledRange.from));
      setInputToText(formatDateToInput(incTo));
    }
  }, [controlledPreset, controlledRange, timeZone]);

  // Mise à jour de l'URL
  const updateUrl = (preset: PeriodPreset, range: DateRange) => {
    if (!syncWithUrl || typeof window === "undefined") return;
    const currentParams = new URLSearchParams(searchParams?.toString() || "");
    currentParams.set("preset", preset);
    currentParams.set("from", dayKey(range.from, timeZone));
    currentParams.set("to", dayKey(shiftDays(range.to, -1, timeZone), timeZone));
    router.replace(`?${currentParams.toString()}`, { scroll: false });
  };

  // Sélection d'un preset rapide
  const handleSelectPreset = (p: PeriodPreset) => {
    setActivePreset(p);
    const newRange = presetRange(p, new Date(), timeZone);
    setSelectedRange(newRange);
    setTempFromDate(newRange.from);
    const incTo = shiftDays(newRange.to, -1, timeZone);
    setTempToDate(incTo);
    setInputFromText(formatDateToInput(newRange.from));
    setInputToText(formatDateToInput(incTo));
    setInputError("");

    // Ajuste les mois affichés
    const startM = new Date(newRange.from.getFullYear(), newRange.from.getMonth(), 1);
    setLeftMonth(startM);
    setRightMonth(new Date(startM.getFullYear(), startM.getMonth() + 1, 1));
    setMobileMonth(startM);

    if (onChange) onChange(p, newRange);
    updateUrl(p, newRange);
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  };

  // Clic sur un jour dans un calendrier
  const handleDayClick = (clickedDate: Date) => {
    setActivePreset("custom");

    if (tempFromDate && tempToDate && tempFromDate.getTime() !== tempToDate.getTime()) {
      setTempFromDate(clickedDate);
      setTempToDate(clickedDate);
      setInputFromText(formatDateToInput(clickedDate));
      setInputToText(formatDateToInput(clickedDate));
    } else if (tempFromDate && (!tempToDate || tempFromDate.getTime() === tempToDate.getTime())) {
      if (clickedDate.getTime() < tempFromDate.getTime()) {
        setTempFromDate(clickedDate);
        setTempToDate(tempFromDate);
        setInputFromText(formatDateToInput(clickedDate));
        setInputToText(formatDateToInput(tempFromDate));
      } else {
        setTempToDate(clickedDate);
        setInputToText(formatDateToInput(clickedDate));
      }
    } else {
      setTempFromDate(clickedDate);
      setTempToDate(clickedDate);
      setInputFromText(formatDateToInput(clickedDate));
      setInputToText(formatDateToInput(clickedDate));
    }
    setInputError("");
  };

  // Validation et saisie masquée jj/mm/aaaa
  const parseDateInput = (val: string): Date | null => {
    const parts = val.split("/");
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    const date = new Date(y, m, d);
    if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) {
      return null;
    }
    return date;
  };

  const handleFromInputChange = (val: string) => {
    setInputFromText(val);
    const parsed = parseDateInput(val);
    if (parsed) {
      setTempFromDate(parsed);
      if (parsed > tempToDate) {
        setInputError("La date de début doit être antérieure ou égale à la date de fin.");
      } else {
        setInputError("");
      }
    }
  };

  const handleToInputChange = (val: string) => {
    setInputToText(val);
    const parsed = parseDateInput(val);
    if (parsed) {
      setTempToDate(parsed);
      if (tempFromDate > parsed) {
        setInputError("La date de fin doit être postérieure ou égale à la date de début.");
      } else {
        setInputError("");
      }
    }
  };

  // Application de la plage personnalisée
  const handleApplyCustom = () => {
    const from = tempFromDate < tempToDate ? tempFromDate : tempToDate;
    const inclusiveTo = tempFromDate < tempToDate ? tempToDate : tempFromDate;
    const to = shiftDays(inclusiveTo, 1, timeZone);

    const newRange = { from, to };
    setSelectedRange(newRange);
    setActivePreset("custom");
    if (onChange) onChange("custom", newRange);
    updateUrl("custom", newRange);
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  };

  const handleReset = () => {
    handleSelectPreset("last7");
  };

  // Comparaison automatique avec la période précédente
  const prevRange = useMemo(() => {
    return previousRange(selectedRange);
  }, [selectedRange]);

  const displayLabel = useMemo(() => {
    const raw = getRangeDisplayLabel(activePreset, selectedRange, timeZone);
    return showPrefix ? `Période : ${raw}` : raw;
  }, [activePreset, selectedRange, timeZone, showPrefix]);

  // Navigation mois calendrier
  const prevLeftMonth = () => {
    setLeftMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setRightMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const nextRightMonth = () => {
    setLeftMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setRightMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Rendu de la grille d'un mois (7 colonnes de 36px fixes, lignes de 36px)
  const renderMonthGrid = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Jour de la semaine (lundi = 0)
    let firstWeekday = firstDay.getDay() - 1;
    if (firstWeekday === -1) firstWeekday = 6;

    const daysInMonth = lastDay.getDate();
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstWeekday; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    return (
      <div className="w-[252px] select-none shrink-0">
        {/* Titre centré « Novembre 2026 » (sans préfixe DE / À) */}
        <div className="h-9 flex items-center justify-center">
          <span className="text-xs font-bold text-[#111111]">
            {MONTH_NAMES_FR[month]} {year}
          </span>
        </div>

        {/* Noms des jours à 2 lettres (Lu Ma Me Je Ve Sa Di) sur une seule ligne */}
        <div className="grid grid-cols-7 text-center h-9 items-center">
          {WEEKDAY_NAMES_2L_FR.map((wd) => (
            <span
              key={wd}
              className="text-[11px] font-bold text-[#888880] flex items-center justify-center h-9"
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Grille des jours : 7 colonnes fixes de 36px */}
        <div
          className="grid gap-y-1"
          style={{ gridTemplateColumns: "repeat(7, 36px)" }}
        >
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="h-9 w-9" />;
            }

            const dayTime = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
            const fromTime = new Date(
              tempFromDate.getFullYear(),
              tempFromDate.getMonth(),
              tempFromDate.getDate()
            ).getTime();
            const toTime = new Date(
              tempToDate.getFullYear(),
              tempToDate.getMonth(),
              tempToDate.getDate()
            ).getTime();

            const isStart = dayTime === fromTime;
            const isEnd = dayTime === toTime;
            const isInRange =
              fromTime < toTime
                ? dayTime > fromTime && dayTime < toTime
                : dayTime > toTime && dayTime < fromTime;

            const isToday = dayTime === todayDate.getTime();
            const isFuture = !allowFuture && dayTime > todayDate.getTime();

            const ariaLabel = `${day.getDate()} ${MONTH_NAMES_FR[month]} ${year}${
              isStart ? ", début de la plage" : isEnd ? ", fin de la plage" : ""
            }`;

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={isFuture}
                onClick={() => handleDayClick(day)}
                aria-label={ariaLabel}
                className={cn(
                  "h-9 w-9 rounded-full text-xs font-medium flex items-center justify-center transition-all cursor-pointer relative",
                  isInRange && "bg-black/[0.06] text-[#111111] rounded-none",
                  (isStart || isEnd) &&
                    "bg-[#1F3A26] text-[#FAF8F5] font-bold shadow-xs rounded-full z-10",
                  !isInRange && !isStart && !isEnd && !isFuture && "hover:bg-black/[0.06] text-[#111111]",
                  isFuture && "opacity-20 cursor-not-allowed",
                  isToday && !isStart && !isEnd && "ring-1 ring-black/40 font-bold"
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("relative inline-block text-left", className)}>
      {/* Bouton Déclencheur (ex: « 7 derniers jours ») */}
      <button
        ref={triggerButtonRef}
        type="button"
        id={id || "btn-date-range-trigger"}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/[0.08] bg-white text-xs font-bold text-[#111111] shadow-2xs hover:border-black/20 hover:bg-[#FAF8F5] transition-all cursor-pointer whitespace-nowrap",
          isOpen && "ring-2 ring-black/[0.12] border-black/20 bg-[#FAF8F5]",
          buttonClassName
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5 text-[#111111] shrink-0" />
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[#111111] shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Rendu dans un PORTAIL avec positionnement absolu/fixe & niveau z-[100] élevé */}
      {isOpen &&
        mounted &&
        createPortal(
          panelPosition.isMobile ? (
            /* ======================================================== */
            /* VUE MOBILE : FEUILLE EN BAS (BOTTOM SHEET 90% MAX) */
            /* ======================================================== */
            <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
              <div
                ref={panelRef}
                id="date-range-mobile-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby={pickerId}
                className="w-full max-h-[90vh] rounded-t-[24px] bg-[#FAF8F5] border-t border-black/[0.1] shadow-2xl p-4 flex flex-col text-[#111111] animate-in slide-in-from-bottom duration-200"
              >
                {/* Poignée de feuille */}
                <div className="w-10 h-1.5 bg-black/20 rounded-full mx-auto mb-3 shrink-0" />

                {/* En-tête mobile avec titre et bouton fermer */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-[#111111]">Sélectionner une période</span>
                  <button
                    type="button"
                    id="btn-close-mobile-date-sheet"
                    onClick={() => setIsOpen(false)}
                    aria-label="Fermer la sélection de période"
                    className="p-1 rounded-lg hover:bg-black/[0.06] text-[#111111] cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Raccourcis en pastilles horizontales défilantes */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 shrink-0 scrollbar-none">
                  {PERIOD_PRESETS.map((p) => {
                    const isSelected = activePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all",
                          isSelected
                            ? "bg-[#1F3A26] text-[#FAF8F5] font-bold shadow-xs"
                            : "bg-white border border-black/[0.08] text-[#111111]"
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Zone calendrier mobile unique */}
                <div className="flex-1 overflow-y-auto py-2 flex flex-col items-center">
                  <div className="flex items-center justify-between w-full max-w-[280px] mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMobileMonth(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                        )
                      }
                      className="p-2 rounded-xl border border-black/[0.08] bg-white text-[#111111]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold">
                      {MONTH_NAMES_FR[mobileMonth.getMonth()]} {mobileMonth.getFullYear()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setMobileMonth(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                        )
                      }
                      className="p-2 rounded-xl border border-black/[0.08] bg-white text-[#111111]"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  {renderMonthGrid(mobileMonth)}

                  {/* Champs de dates en dessous */}
                  <div className="grid grid-cols-2 gap-2 w-full mt-3">
                    <div className="h-11 px-3 rounded-xl border border-black/[0.08] bg-white flex flex-col justify-center">
                      <span className="text-[9px] font-bold text-[#888880] uppercase">De</span>
                      <input
                        type="text"
                        value={inputFromText}
                        onChange={(e) => handleFromInputChange(e.target.value)}
                        className="text-xs font-bold text-[#111111] bg-transparent outline-none"
                      />
                    </div>
                    <div className="h-11 px-3 rounded-xl border border-black/[0.08] bg-white flex flex-col justify-center">
                      <span className="text-[9px] font-bold text-[#888880] uppercase">À</span>
                      <input
                        type="text"
                        value={inputToText}
                        onChange={(e) => handleToInputChange(e.target.value)}
                        className="text-xs font-bold text-[#111111] bg-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Pied collant mobile */}
                <div className="pt-3 border-t border-black/[0.08] flex items-center justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="h-11 px-4 rounded-xl border border-black/[0.1] bg-white text-xs font-bold text-[#111111]"
                  >
                    Réinitialiser
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCustom}
                    className="h-11 flex-1 rounded-xl bg-[#1F3A26] text-xs font-bold text-[#FAF8F5] flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Check className="h-4 w-4" />
                    <span>Appliquer</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* VUE BUREAU (820px max, aligné à droite, pas de transparence) */
            /* ======================================================== */
            <div
              ref={panelRef}
              id="date-range-picker-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={pickerId}
              style={{
                position: "fixed",
                top: panelPosition.top,
                bottom: panelPosition.bottom,
                right: panelPosition.right,
                width: "min(820px, calc(100vw - 32px))",
                maxHeight: "calc(100vh - 96px)",
                zIndex: 100,
              }}
              className="rounded-[24px] border border-black/[0.1] bg-[#FAF8F5] shadow-[0_20px_60px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 duration-150 flex flex-col text-[#111111] overflow-hidden"
            >
              {/* Corps principal : 2 colonnes */}
              <div className="flex flex-1 min-h-0 divide-x divide-black/[0.08]">
                {/* ======================================================== */}
                {/* COLONNE GAUCHE (232px) : SÉLECTION RAPIDE (12 choix sans scrollbar) */}
                {/* ======================================================== */}
                <div className="w-[232px] shrink-0 p-4 flex flex-col overflow-hidden bg-[#FAF8F5]">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#666660] mb-2 px-1">
                    Sélection rapide
                  </span>
                  <div id="date-picker-presets-list" role="radiogroup" aria-label="Sélection rapide de période" className="space-y-0.5 overflow-hidden">
                    {PERIOD_PRESETS.map((p) => {
                      const isSelected = activePreset === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={p.label}
                          onClick={() => handleSelectPreset(p.id)}
                          className={cn(
                            "w-full h-9 flex items-center px-3 rounded-full text-xs font-semibold cursor-pointer transition-all text-left",
                            isSelected
                              ? "bg-[#1F3A26] text-[#FAF8F5] font-bold shadow-xs"
                              : "text-[#111111] hover:bg-black/[0.04]"
                          )}
                        >
                          <span className="truncate">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ======================================================== */}
                {/* COLONNE DROITE : PLAGE PERSONNALISÉE (2 Champs 52px + 2 Calendriers) */}
                {/* ======================================================== */}
                <div className="flex-1 p-5 flex flex-col min-h-0 bg-[#FAF8F5]">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#666660] mb-3">
                    Plage de dates personnalisée
                  </span>

                  {/* 2 Champs « De (début) » et « À (fin) » côte à côte (52px de haut, 16px rayon) */}
                  <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
                    <div className="h-[52px] rounded-2xl border border-black/[0.1] bg-white px-3.5 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-[#888880] uppercase leading-none">
                        De (début)
                      </span>
                      <input
                        type="text"
                        id="date-input-from"
                        value={inputFromText}
                        onChange={(e) => handleFromInputChange(e.target.value)}
                        placeholder="jj/mm/aaaa"
                        className="text-xs font-bold text-[#111111] bg-transparent outline-none mt-1"
                      />
                    </div>
                    <div className="h-[52px] rounded-2xl border border-black/[0.1] bg-white px-3.5 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-[#888880] uppercase leading-none">
                        À (fin)
                      </span>
                      <input
                        type="text"
                        id="date-input-to"
                        value={inputToText}
                        onChange={(e) => handleToInputChange(e.target.value)}
                        placeholder="jj/mm/aaaa"
                        className="text-xs font-bold text-[#111111] bg-transparent outline-none mt-1"
                      />
                    </div>
                  </div>

                  {inputError && (
                    <p className="text-[11px] font-bold text-rose-600 mb-2 -mt-1 px-1">
                      {inputError}
                    </p>
                  )}

                  {/* Zone des 2 calendriers côte à côte avec défilement interne seulement si écran très court */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    <div className="relative">
                      {/* Flèches précédent et suivant alignées sur la ligne du titre */}
                      <button
                        type="button"
                        onClick={prevLeftMonth}
                        title="Mois précédent"
                        className="absolute left-0 top-1 p-1 rounded-lg hover:bg-black/[0.06] text-[#111111] z-20 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={nextRightMonth}
                        title="Mois suivant"
                        className="absolute right-0 top-1 p-1 rounded-lg hover:bg-black/[0.06] text-[#111111] z-20 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>

                      {/* Les 2 calendriers de même largeur alignés sur la même ligne */}
                      <div className="flex items-start justify-between gap-6 px-5">
                        {renderMonthGrid(leftMonth)}
                        <div className="w-[1px] self-stretch bg-black/[0.06]" />
                        {renderMonthGrid(rightMonth)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* PIED FIXE DU PANNEAU (jamais coupé, séparé par un trait) */}
              {/* ======================================================== */}
              <div className="h-16 px-5 border-t border-black/[0.08] bg-[#FAF8F5] flex items-center justify-between gap-4 shrink-0">
                {/* Gauche : Interrupteur Comparer + texte sur une ligne */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    id="switch-compare-period"
                    onClick={() => setIsCompareEnabled(!isCompareEnabled)}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0",
                      isCompareEnabled ? "bg-[#1F3A26]" : "bg-black/20"
                    )}
                    role="switch"
                    aria-checked={isCompareEnabled}
                    title="Activer/désactiver la comparaison de période"
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform shadow-xs",
                        isCompareEnabled ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                  <span className="text-xs font-bold text-[#111111] shrink-0">Comparer</span>
                  {isCompareEnabled && (
                    <span
                      className="text-xs text-[#666660] truncate font-medium"
                      title={`Comparé à : ${formatDateFr(prevRange.from)} – ${formatDateFr(
                        shiftDays(prevRange.to, -1, timeZone)
                      )}`}
                    >
                      · Comparé à : {formatDateFr(prevRange.from)} –{" "}
                      {formatDateFr(shiftDays(prevRange.to, -1, timeZone))}
                    </span>
                  )}
                </div>

                {/* Droite : Bouton Réinitialiser & Bouton Appliquer (44px) */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    id="btn-reset-dates"
                    onClick={handleReset}
                    className="h-11 px-4 rounded-[14px] border border-black/[0.1] bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.04] transition-all cursor-pointer shadow-2xs"
                  >
                    Réinitialiser
                  </button>
                  <button
                    type="button"
                    id="btn-apply-dates"
                    onClick={handleApplyCustom}
                    disabled={Boolean(inputError)}
                    className={cn(
                      "h-11 px-5 rounded-[14px] text-xs font-bold text-[#FAF8F5] flex items-center gap-2 transition-all shadow-xs",
                      inputError
                        ? "bg-black/20 cursor-not-allowed opacity-50"
                        : "bg-[#1F3A26] hover:bg-[#162B1C] cursor-pointer"
                    )}
                  >
                    <Check className="h-4 w-4" />
                    <span>Appliquer</span>
                  </button>
                </div>
              </div>
            </div>
          ),
          document.body
        )}
    </div>
  );
}
