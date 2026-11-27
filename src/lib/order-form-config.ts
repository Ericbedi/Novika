/** Configuration du formulaire de commande (champs, pays acceptés, bouton), enregistrée dans shops.brand.formConfig. */

export type FormFieldKind = "name" | "phone" | "city" | "address" | "text" | "textarea" | "email" | "select" | "country" | "region";

export interface FormFieldDef {
  id: string;
  kind: FormFieldKind;
  label: string;
  placeholder: string;
  required: boolean;
  /** Champ système : ne peut pas être supprimé */
  system?: boolean;
  /** Pour kind "select" : choix proposés */
  options?: string[];
}

export interface OrderFormConfig {
  name: string;
  /** Codes pays ISO acceptés (vide = tous) */
  countries: string[];
  fields: FormFieldDef[];
  buttonText: string;
  buttonColor: string;
}

export const FIELD_KIND_LABELS: Record<FormFieldKind, { label: string; hint: string }> = {
  name: { label: "Nom", hint: "Nom du client" },
  phone: { label: "Téléphone", hint: "Numéro avec validation" },
  city: { label: "Ville", hint: "Ville ou quartier de livraison" },
  address: { label: "Adresse", hint: "Adresse ou point de repère" },
  text: { label: "Texte court", hint: "Nom, référence, etc." },
  textarea: { label: "Texte long", hint: "Notes, instructions" },
  email: { label: "E-mail", hint: "Adresse électronique" },
  select: { label: "Liste déroulante", hint: "Choix parmi des options" },
  country: { label: "Pays", hint: "Sélection du pays de livraison" },
  region: { label: "Région / Département", hint: "Région de livraison" },
};

export const BUTTON_COLORS = ["#2B4A2C", "#171717", "#B8860B", "#C0392B", "#6C47C4", "#1F7391", "#C8F560", "#D97706"];

export function defaultFormConfig(): OrderFormConfig {
  return {
    name: "",
    countries: [],
    fields: [
      { id: "f_name", kind: "name", label: "Nom complet", placeholder: "Entrez votre nom complet", required: true, system: true },
      { id: "f_phone", kind: "phone", label: "Numéro de téléphone", placeholder: "0555 12 34 56", required: true, system: true },
      { id: "f_city", kind: "city", label: "Ville", placeholder: "Entrez votre ville", required: true, system: true },
      { id: "f_notes", kind: "textarea", label: "Notes supplémentaires", placeholder: "Instructions ou notes de livraison (facultatif)", required: false },
    ],
    buttonText: "Commander",
    buttonColor: "#000000",
  };
}

const KINDS = Object.keys(FIELD_KIND_LABELS);
const HEX = /^#[0-9a-fA-F]{6}$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export function newField(kind: FormFieldKind): FormFieldDef {
  const id = `f_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const base = FIELD_KIND_LABELS[kind];
  const ph: Partial<Record<FormFieldKind, string>> = { email: "vous@exemple.com", select: "Choisissez…", region: "Votre région" };
  return {
    id, kind, label: base.label, placeholder: ph[kind] || "", required: false,
    ...(kind === "select" ? { options: ["Option 1", "Option 2"] } : {}),
  };
}

/** Nettoie une configuration reçue (jamais de confiance au navigateur). Renvoie null si absente. */
export function sanitizeFormConfig(input: unknown): OrderFormConfig | null {
  if (!input || typeof input !== "object") return null;
  const c = input as Record<string, any>;
  const fields: FormFieldDef[] = [];
  const seen = new Set<string>();
  if (Array.isArray(c.fields)) {
    for (const raw of c.fields.slice(0, 20)) {
      if (!raw || typeof raw !== "object" || !KINDS.includes(raw.kind)) continue;
      const id = typeof raw.id === "string" && /^[A-Za-z0-9_]{1,40}$/.test(raw.id) && !seen.has(raw.id) ? raw.id : `f_${fields.length}_${Math.random().toString(36).slice(2, 6)}`;
      seen.add(id);
      const kind = raw.kind as FormFieldKind;
      const f: FormFieldDef = {
        id, kind,
        label: str(raw.label, 80) || FIELD_KIND_LABELS[kind].label,
        placeholder: str(raw.placeholder, 120),
        required: raw.required === true || kind === "name" || kind === "phone" || kind === "city",
      };
      if (kind === "name" || kind === "phone" || kind === "city") f.system = true;
      if (kind === "select") f.options = (Array.isArray(raw.options) ? raw.options : []).filter((o: unknown) => typeof o === "string" && o.trim()).map((o: string) => o.slice(0, 60)).slice(0, 20);
      fields.push(f);
    }
  }
  // Nom, téléphone et ville sont indispensables pour traiter une commande
  const def = defaultFormConfig().fields;
  if (!fields.some((f) => f.kind === "name")) fields.unshift(def[0]);
  if (!fields.some((f) => f.kind === "phone")) fields.splice(1, 0, def[1]);
  if (!fields.some((f) => f.kind === "city")) fields.splice(2, 0, def[2]);
  return {
    name: str(c.name, 80),
    countries: (Array.isArray(c.countries) ? c.countries : []).filter((x: unknown): x is string => typeof x === "string" && /^[A-Z]{2}$/.test(x)).slice(0, 60),
    fields,
    buttonText: str(c.buttonText, 60),
    buttonColor: typeof c.buttonColor === "string" && HEX.test(c.buttonColor) ? c.buttonColor : "#000000",
  };
}

/** Couleur de texte lisible sur le fond choisi. */
export function readableTextColor(hex: string): "#FFFFFF" | "#111111" {
  if (!HEX.test(hex)) return "#FFFFFF";
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#FFFFFF";
}
