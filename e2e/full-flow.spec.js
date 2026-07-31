import { test, expect } from "@playwright/test";

// Serial: the flow builds on one shared group; each test still gets a fresh
// browser context (Playwright default), so auth is seeded via localStorage.
test.describe.configure({ mode: "serial" });

let groupId;
let aliceId, bobId, carolId, aliceToken;

const seededAlice = {
  name: "Alice",
  email: `alice-${Date.now()}@e2e.test`,
  password: "password123",
};
const uiAlice = {
  name: "Alice",
  email: `ui-alice-${Date.now()}@e2e.test`,
  password: "password123",
};
const bob = { name: "Bob", email: `bob-${Date.now()}@e2e.test`, password: "password123" };
const carol = { name: "Carol", email: `carol-${Date.now()}@e2e.test`, password: "password123" };

test.beforeAll(async ({ request }) => {
  // Create users via the real API (through nginx). The browser tests below
  // then either sign up/login through the UI or seed this token in localStorage.
  const aliceRes = await request.post("/api/auth/signup", { data: seededAlice });
  expect(aliceRes.status()).toBe(201);
  const aliceBody = await aliceRes.json();
  aliceId = aliceBody.user.id;
  aliceToken = aliceBody.access_token;

  const bobRes = await request.post("/api/auth/signup", { data: bob });
  expect(bobRes.status()).toBe(201);
  bobId = (await bobRes.json()).user.id;

  const carolRes = await request.post("/api/auth/signup", { data: carol });
  expect(carolRes.status()).toBe(201);
  carolId = (await carolRes.json()).user.id;
});

// Each test starts with a clean context; replay the session by writing the
// JWT to localStorage before any app code runs (matches how the app rehydrates).
async function seedSession(page, token) {
  await page.addInitScript(
    (t) => window.localStorage.setItem("token", t),
    token,
  );
}

// Balance rows render "User #<id>" as a standalone span; the exact filter
// avoids matching suggested-settlement rows like "User #13 → User #12".
function balanceRow(page, userId) {
  return page
    .locator("div.flex.justify-between")
    .filter({ has: page.getByText(`User #${userId}`, { exact: true }) });
}

test("sign up a new user and get redirected away from /signup", async ({ page }) => {
  await page.goto("/signup");
  await page.getByPlaceholder("Ada Lovelace").fill(uiAlice.name);
  await page.getByPlaceholder("you@example.com").fill(uiAlice.email);
  await page.getByPlaceholder("At least 6 characters").fill(uiAlice.password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/profile/);
  await expect(page.locator(".user-chip")).toHaveText("A");
});

test("log in and get redirected away from /login", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(uiAlice.email);
  await page.getByPlaceholder("At least 6 characters").fill(uiAlice.password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/profile/);
});

test("refresh keeps the session (not bounced back to /login)", async ({ page }) => {
  await seedSession(page, aliceToken);
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/profile/);
  await page.reload();
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.locator(".user-chip")).toHaveText("A");
});

test("create a group", async ({ page }) => {
  await seedSession(page, aliceToken);
  await page.goto("/groups");
  await page.getByPlaceholder("e.g. Bali Trip 2026").fill("Playwright Trip");
  await page.getByRole("button", { name: "Create Group" }).click();

  await expect(page.getByText("Group created.")).toBeVisible();
  await expect(page.locator(".friend-item", { hasText: "Playwright Trip" })).toBeVisible();
});

test("add members to the group", async ({ page }) => {
  await seedSession(page, aliceToken);
  await page.goto("/groups");
  await page
    .locator(".friend-item", { hasText: "Playwright Trip" })
    .getByRole("link", { name: "View" })
    .click();
  await expect(page).toHaveURL(/\/groups\/\d+$/);
  groupId = Number(page.url().split("/").pop());

  for (const member of [bob, carol]) {
    await page.getByPlaceholder("Search by email…").fill(member.email);
    const result = page.locator("li", { hasText: member.email });
    await expect(result).toBeVisible();
    await result.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Member added.")).toBeVisible();
  }
  await expect(page.locator(".friend-item", { hasText: "Bob" })).toBeVisible();
  await expect(page.locator(".friend-item", { hasText: "Carol" })).toBeVisible();
});

test("add an expense with only some members as participants", async ({ page }) => {
  await seedSession(page, aliceToken);
  await page.goto(`/groups/${groupId}`);

  const form = page.locator("form", { hasText: "Add expense" });
  await form.getByPlaceholder("Dinner, Uber, groceries...").fill("Team Dinner");
  await form.getByPlaceholder("0.00").fill("90.00");

  // Only Alice and Bob participate; Carol (not a participant) must be unchecked.
  await form
    .locator("div.flex.items-center.gap-3", { hasText: "Carol" })
    .locator("input[type=checkbox]")
    .uncheck();

  await form.getByRole("button", { name: "Add expense" }).click();

  // Expense appears in the list; payer is owed their share of the split.
  await expect(page.getByText("Team Dinner")).toBeVisible();
  await expect(page.getByText(/You're owed \$45\.00/)).toBeVisible();
});

test("balances page: math is correct, non-participant shows $0", async ({ page }) => {
  await seedSession(page, aliceToken);
  await page.goto(`/groups/${groupId}`);
  await page.getByRole("link", { name: "View Balances" }).click();
  await expect(page).toHaveURL(/\/balances/);

  await expect(balanceRow(page, aliceId)).toContainText("is owed 45");
  await expect(balanceRow(page, bobId)).toContainText("owes 45");
  await expect(balanceRow(page, carolId)).toContainText("is owed 0");
});

test("record a settlement; balances update to reflect it", async ({ page }) => {
  await seedSession(page, aliceToken);
  await page.goto(`/groups/${groupId}/balances`);

  await page.getByRole("button", { name: "Settle Up" }).click();

  const modal = page.locator(".fixed.inset-0");
  await expect(modal).toBeVisible();
  await modal.locator("select").nth(0).selectOption({ label: bob.name });
  await modal.locator("select").nth(1).selectOption({ label: "Alice" });
  await modal.getByPlaceholder("Amount").fill("45.00");
  await modal.getByRole("button", { name: "Confirm" }).click();

  // Settlement closes the modal; both balances return to zero. Zero is
  // rendered as "is owed 0" (amount >= 0 takes the positive branch).
  await expect(modal).toHaveCount(0);
  await expect(balanceRow(page, aliceId)).toContainText("is owed 0");
  await expect(balanceRow(page, bobId)).toContainText("is owed 0");
});

test("notification bell reflects the settlement for the payee, not the payer", async ({ page }) => {
  // Alice is the payee — her bell should show one unread settlement notification.
  await seedSession(page, aliceToken);
  await page.goto(`/groups/${groupId}/balances`);
  const bell = page.locator("button", { hasText: "\u{1F514}" });
  await expect(bell.locator("span")).toHaveText("1", { timeout: 20_000 });
  await bell.click();
  await expect(page.locator("div.w-72")).toContainText("settlement of 45");
});

test("owner can delete the group via the confirmation dialog", async ({ page }) => {
  await seedSession(page, aliceToken);
  await page.goto(`/groups/${groupId}`);

  await page.getByRole("button", { name: "Delete Group" }).click();
  await expect(page.getByText(/Permanently delete this group/)).toBeVisible();
  await page.getByRole("button", { name: "Yes, confirm" }).click();

  await expect(page).toHaveURL(/\/groups$/);
  await expect(page.locator(".friend-item", { hasText: "Playwright Trip" })).toHaveCount(0);
});

test("unauthenticated user is redirected away from a protected route", async ({ page }) => {
  // Establish a session without an init-script (which would re-seed after
  // logout); assert /profile is protected before logging in at all.
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login/);
  await page.evaluate((t) => localStorage.setItem("token", t), aliceToken);
  await page.reload();
  await expect(page).toHaveURL(/\/profile/);

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/groups");
  await expect(page).toHaveURL(/\/login/);
});

test("nonexistent route renders the 404 page", async ({ page }) => {
  await page.goto("/definitely-not-a-real-page");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByText("Page not found")).toBeVisible();
});
