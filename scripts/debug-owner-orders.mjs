import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext();
  await ctx.addCookies([
    {
      name: "novika_session",
      value: JSON.stringify({
        id: "1",
        email: "promisesbedi@gmail.com",
        role: "owner",
      }),
      domain: "localhost",
      path: "/",
    },
    {
      name: "novika_active_role",
      value: "owner",
      domain: "localhost",
      path: "/",
    },
  ]);
  const page = await ctx.newPage();
  page.on("console", (m) => console.log("PAGE LOG:", m.text()));
  page.on("pageerror", (e) => console.error("PAGE ERR:", e));
  await page.goto("http://localhost:3000/app/kelio/commandes", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const text = await page.locator("body").innerText();
  console.log("BODY TEXT:\n", text);
  await b.close();
}

main().catch(console.error);
