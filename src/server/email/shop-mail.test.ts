import { describe, expect, it } from "vitest";
import { isEmail, orderConfirmationEmail, resolveFrom } from "./shop-mail";

describe("e-mails de boutique", () => {
  it("utilise le domaine de la boutique seulement s'il est vérifié", () => {
    expect(resolveFrom("Ma Boutique", { status: "verified", address: "contact@ma.com", domain: "ma.com" })).toBe("Ma Boutique <contact@ma.com>");
    expect(resolveFrom("Ma Boutique", { status: "pending", address: "contact@ma.com", domain: "ma.com" })).not.toContain("contact@ma.com");
  });
  it("nettoie le nom d'expéditeur et valide les adresses", () => {
    expect(resolveFrom('Evil <x@y.z>"\n', { status: "verified", address: "a@b.co", domain: "b.co" })).toBe("Evil x@y.z <a@b.co>");
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("a b@c.d")).toBe(false);
    expect(isEmail("<script>@x.y")).toBe(false);
  });
  it("échappe le HTML du client", () => {
    const m = orderConfirmationEmail({ shopName: "S", orderNumber: "N1", customerName: "<b>Eve</b>", total: 12500 });
    expect(m.html).not.toContain("<b>Eve</b>");
    expect(m.text).toContain("N1");
  });
});
