import { describe, expect, it } from "vitest";
import { defaultFormConfig, readableTextColor, sanitizeFormConfig } from "./order-form-config";

describe("configuration du formulaire", () => {
  it("garde nom, téléphone et ville même s'ils sont absents", () => {
    const c = sanitizeFormConfig({ fields: [{ id: "a", kind: "text", label: "Taille", required: true }] })!;
    expect(c.fields.map((f) => f.kind)).toEqual(["name", "phone", "city", "text"]);
    expect(c.fields.find((f) => f.kind === "name")!.required).toBe(true);
  });
  it("rejette les types inconnus, couleurs invalides et limite les champs", () => {
    const c = sanitizeFormConfig({
      buttonColor: "red", countries: ["TG", "xx", "<b>"],
      fields: [{ kind: "script", label: "x" }, ...Array.from({ length: 40 }, () => ({ kind: "text", label: "t" }))],
    })!;
    expect(c.buttonColor).toBe("#000000");
    expect(c.countries).toEqual(["TG"]);
    expect(c.fields.length).toBeLessThanOrEqual(23);
    expect(c.fields.some((f) => (f.kind as string) === "script")).toBe(false);
  });
  it("renvoie null sans configuration et un texte lisible", () => {
    expect(sanitizeFormConfig(null)).toBeNull();
    expect(readableTextColor("#C8F560")).toBe("#111111");
    expect(readableTextColor("#000000")).toBe("#FFFFFF");
    expect(defaultFormConfig().fields.length).toBe(4);
  });
});
