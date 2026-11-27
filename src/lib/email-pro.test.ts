import { describe, expect, it } from "vitest";
import { analyzeEmailDns, zohoRecords } from "./email-pro";

describe("e-mail pro Zoho", () => {
  it("génère les MX et SPF selon la région", () => {
    expect(zohoRecords("com").map((r) => r.value)).toEqual(["mx.zoho.com", "mx2.zoho.com", "mx3.zoho.com", "v=spf1 include:zoho.com ~all"]);
    expect(zohoRecords("eu")[0].value).toBe("mx.zoho.eu");
  });
  it("détecte MX, SPF et DKIM", () => {
    expect(analyzeEmailDns("com", ["10 mx.zoho.com."], ['"v=spf1 include:zoho.com ~all"'], ['"v=DKIM1; k=rsa; p=abc"'])).toEqual({ mx: true, spf: true, dkim: true });
    expect(analyzeEmailDns("eu", ["10 mx.zoho.com."], [], [])).toEqual({ mx: false, spf: false, dkim: false });
  });
});
