import { chromium } from "@playwright/test";
import fs from "node:fs";

const SHOTS = "/tmp/opencode/shots";
fs.mkdirSync(SHOTS, { recursive: true });
const BASE = "http://localhost:5173";
const issues = [];
const navs = [];

const email = `visual-${Date.now()}@e2e.test`;
const password = "password123";
const user = { name: "Visual Alice", email, password };
let groupId;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, baseURL: BASE });
const page = await context.newPage();

page.on("console", (m) => {
  if (m.type() === "error") issues.push(`[console.error] ${m.text().slice(0, 300)}`);
});
page.on("pageerror", (e) => issues.push(`[pageerror] ${e.message.slice(0, 300)}`));
page.on("requestfailed", (r) => issues.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));
page.on("framenavigated", (f) => {
  if (f === page.mainFrame()) navs.push(f.url().replace(BASE, ""));
});

async function shot(name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

async function inspect(label) {
  const layout = await page.evaluate(() => {
    const d = document.documentElement;
    const overflowers = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        const cls = (el.className && typeof el.className === "string" && el.className.split(" ").slice(0, 2).join(".")) || el.tagName;
        overflowers.push(`${cls} (${Math.round(r.left)},${Math.round(r.right)})`);
      }
    }
    return {
      scrollW: d.scrollWidth,
      clientW: d.clientWidth,
      overflowers: overflowers.slice(0, 8),
    };
  });
  const hOverflow = layout.scrollW > layout.clientW;
  issues.push(
    `${label}: horizontal overflow ${hOverflow ? "!!" : "ok"} (scroll ${layout.scrollW} vs client ${layout.clientW})` +
      (layout.overflowers.length ? ` | elements past viewport: ${layout.overflowers.join(", ")}` : ""),
  );
}

const shotAndInspect = async (name, label) => {
  await shot(name);
  await inspect(label);
};

// 1. Sign up
await page.goto("/signup");
await page.getByPlaceholder("Ada Lovelace").fill("Visual Alice");
await page.getByPlaceholder("you@example.com").fill(email);
await page.getByPlaceholder("At least 6 characters").fill(password);
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/\/profile/);
await shotAndInspect("01-after-signup", "after-signup");
console.log("01 after-signup URL:", page.url());

// Create second and third users for member-add via API
const bobRes = await context.request.post(`${BASE}/api/auth/signup`, {
  data: { name: "Visual Bob", email: `visual-bob-${Date.now()}@e2e.test`, password },
});
const bob = (await bobRes.json()).user;
const carolRes = await context.request.post(`${BASE}/api/auth/signup`, {
  data: { name: "Visual Carol", email: `visual-carol-${Date.now()}@e2e.test`, password },
});
const carol = (await carolRes.json()).user;

// 2. Log out, log back in
await page.getByRole("button", { name: "Log out" }).click();
await page.waitForURL(/\/login/);
await page.getByPlaceholder("you@example.com").fill(email);
await page.getByPlaceholder("At least 6 characters").fill(password);
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL(/\/profile/);
await shotAndInspect("02-after-login", "after-login");
console.log("02 after-login URL:", page.url());

// 3. Create group + add member
await page.goto("/groups");
await page.getByPlaceholder("e.g. Bali Trip 2026").fill("Visual Walkthrough Trip");
await page.getByRole("button", { name: "Create Group" }).click();
await page.getByText("Group created.").waitFor();
await page.locator(".friend-item", { hasText: "Visual Walkthrough Trip" }).getByRole("link", { name: "View" }).click();
await page.waitForURL(/\/groups\/\d+$/);
groupId = Number(page.url().split("/").pop());

await page.getByPlaceholder("Search by email…").fill(bob.email);
await page.locator("li", { hasText: bob.email }).getByRole("button", { name: "Add" }).click();
await page.getByText("Member added.").waitFor();
await page.getByPlaceholder("Search by email…").fill(carol.email);
await page.locator("li", { hasText: carol.email }).getByRole("button", { name: "Add" }).click();
await page.getByText("Member added.").waitFor();
await shotAndInspect("03-group-detail", "group-detail");
console.log("03 group-detail:", (await page.locator("main").innerText()).slice(0, 300).replace(/\n/g, " | "));

// 4. Add expense with only 2 of 3 participants (Bob excluded)
await page.goto(`/groups/${groupId}`);
const form = page.locator("form", { hasText: "Add expense" });
await form.getByPlaceholder("Dinner, Uber, groceries...").fill("Team Dinner");
await form.getByPlaceholder("0.00").fill("90.00");
// Bob is NOT a participant — uncheck him. Alice pays, Carol participates.
await form
  .locator("div.flex.items-center.gap-3", { hasText: "Visual Bob" })
  .locator("input[type=checkbox]")
  .uncheck();
await form.getByRole("button", { name: "Add expense" }).click();
await page.getByText("Team Dinner").waitFor();
await shotAndInspect("04-expense-list", "expense-list");
console.log("04 expense-list shows:", await page.getByText(/owed|owe/i).allInnerTexts());

// 5. Balances before settlement (Bob excluded → should show $0)
await page.goto(`/groups/${groupId}/balances`);
await page.getByRole("button", { name: "Settle Up" }).waitFor();
await shotAndInspect("05-balances-before", "balances-before");
console.log("05 balances text:", (await page.locator("main").innerText()).slice(0, 400).replace(/\n/g, " | "));
const bobRow = await page.locator("div.flex.justify-between", { hasText: `User #${bob.id}` }).innerText();
console.log("05 Bob (excluded) row:", bobRow);

// 6. Bell before settlement
await page.locator("button", { hasText: "🔔" }).click();
await shot("06-bell-before");
console.log("06 bell before:", (await page.locator("div.w-72").innerText()).replace(/\n/g, " | "));
await page.locator("button", { hasText: "🔔" }).click(); // close

// 7. Settle up (Carol pays Alice); screenshot immediately WITHOUT refresh
await page.getByRole("button", { name: "Settle Up" }).click();
const modal = page.locator(".fixed.inset-0");
await modal.locator("select").nth(0).selectOption({ label: "Visual Carol" });
await modal.locator("select").nth(1).selectOption({ label: "Visual Alice" });
await modal.getByPlaceholder("Amount").fill("45.00");
await modal.getByRole("button", { name: "Confirm" }).click();
await expectRow0(page, "Visual Alice");
await shotAndInspect("07-balances-after-settle", "balances-after-settle");
console.log("07 after settle (no refresh):", (await page.locator("main").innerText()).slice(0, 400).replace(/\n/g, " | "));

async function expectRow0(page, name) {
  // wait until Alice's balance row shows zero, without any reload
  const text = await page.locator("main").innerText();
  if (!/is owed 0/.test(text)) {
    await page.waitForFunction(() => document.body.innerText.includes("is owed 0"), null, { timeout: 5000 });
  }
}

// 8. Bell after settlement
await page.locator("button", { hasText: "🔔" }).click();
await page.waitForTimeout(500);
await shot("08-bell-after");
console.log("08 bell after:", (await page.locator("div.w-72").innerText()).replace(/\n/g, " | "));
await page.locator("button", { hasText: "🔔" }).click();

// 9. Refresh mid-session — track URL sequence for flash detection
navs.length = 0;
await page.goto(`/groups/${groupId}/balances`);
navs.length = 0;
await page.reload();
await page.waitForTimeout(1200);
console.log("09 refresh URL sequence:", navs.join(" -> "));
console.log("09 final URL:", page.url());
await shotAndInspect("09-after-refresh", "after-refresh");

// 10. 404
await page.goto("/definitely-not-a-real-page");
await page.getByRole("heading", { name: "404" }).waitFor();
await shotAndInspect("10-404", "404");

// 11. Mobile 375px: balances + group detail
const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, baseURL: BASE });
const mpage = await mobile.newPage();
await mpage.addInitScript((t) => localStorage.setItem("token", t), await page.evaluate(() => localStorage.getItem("token")));
await mpage.goto(`${BASE}/groups/${groupId}/balances`);
await mpage.getByRole("button", { name: "Settle Up" }).waitFor();
await mpage.screenshot({ path: `${SHOTS}/11-mobile-balances.png` });
const mob1 = await mpage.evaluate(() => {
  const d = document.documentElement;
  const bad = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > window.innerWidth + 1 || r.left < -1) {
      bad.push(`${el.tagName}.${(el.className && typeof el.className === "string" ? el.className.split(" ")[0] : "")} ${Math.round(r.left)}-${Math.round(r.right)}`);
    }
  }
  return { scrollW: d.scrollWidth, clientW: d.clientWidth, bad: bad.slice(0, 10) };
});
issues.push(`mobile-balances: scroll ${mob1.scrollW} vs client ${mob1.clientW} ${mob1.scrollW > mob1.clientW ? "!! OVERFLOW" : "ok"}` + (mob1.bad.length ? ` | past-viewport: ${mob1.bad.join(", ")}` : ""));

await mpage.goto(`${BASE}/groups/${groupId}`);
await mpage.getByPlaceholder("Search by email…").waitFor();
await mpage.screenshot({ path: `${SHOTS}/12-mobile-group-detail.png` });
const mob2 = await mpage.evaluate(() => {
  const d = document.documentElement;
  const bad = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > window.innerWidth + 1 || r.left < -1) bad.push(`${el.tagName}.${(el.className && typeof el.className === "string" ? el.className.split(" ")[0] : "")} ${Math.round(r.left)}-${Math.round(r.right)}`);
  }
  return { scrollW: d.scrollWidth, clientW: d.clientWidth, bad: bad.slice(0, 10) };
});
issues.push(`mobile-group-detail: scroll ${mob2.scrollW} vs client ${mob2.clientW} ${mob2.scrollW > mob2.clientW ? "!! OVERFLOW" : "ok"}` + (mob2.bad.length ? ` | past-viewport: ${mob2.bad.join(", ")}` : ""));

await mobile.close();
await browser.close();

console.log("\n===== ISSUES =====");
for (const i of issues) console.log(i);
console.log("\nScreenshots in", SHOTS);
