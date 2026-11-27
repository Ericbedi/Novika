/** E-mail professionnel (Zoho Mail) : enregistrements DNS à créer et vérification. */

export type ZohoRegion = "com" | "eu";

export interface EmailDnsRecord {
  key: string;
  type: "MX" | "TXT";
  name: string; // "@" ou nom d'hôte relatif
  value: string;
  priority?: number;
  note: string;
}

export function zohoRecords(region: ZohoRegion): EmailDnsRecord[] {
  return [
    { key: "mx1", type: "MX", name: "@", value: `mx.zoho.${region}`, priority: 10, note: "Réception des e-mails" },
    { key: "mx2", type: "MX", name: "@", value: `mx2.zoho.${region}`, priority: 20, note: "Réception (secours)" },
    { key: "mx3", type: "MX", name: "@", value: `mx3.zoho.${region}`, priority: 50, note: "Réception (secours)" },
    { key: "spf", type: "TXT", name: "@", value: `v=spf1 include:zoho.${region} ~all`, note: "SPF : autorise Zoho à envoyer en votre nom" },
  ];
}

export interface EmailCheckResult {
  mx: boolean;
  spf: boolean;
  dkim: boolean;
}

/** Analyse des réponses DNS (testable sans réseau). */
export function analyzeEmailDns(region: ZohoRegion, mxAnswers: string[], txtAnswers: string[], dkimAnswers: string[]): EmailCheckResult {
  const norm = (s: string) => s.toLowerCase().replace(/^\d+\s+/, "").replace(/\.$/, "");
  const mx = mxAnswers.map(norm).some((h) => h === `mx.zoho.${region}`);
  const spf = txtAnswers.some((t) => t.replace(/"/g, "").toLowerCase().includes(`include:zoho.${region}`));
  const dkim = dkimAnswers.some((t) => t.replace(/"/g, "").toLowerCase().includes("v=dkim1"));
  return { mx, spf, dkim };
}
