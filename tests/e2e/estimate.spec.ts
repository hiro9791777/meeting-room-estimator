import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill("correct-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/rooms$/);
}

test.describe("見積もりフロー", () => {
  test("料金計算、保存、履歴、詳細表示を確認し、他ユーザーには表示しない", async ({
    page,
  }) => {
    await login(page, "e2e@example.com");

    await page.getByRole("radio", { name: /Focus 6/ }).click();
    await page.getByRole("button", { name: "この会議室で見積もる" }).click();
    await expect(page).toHaveURL(/\/estimate\?roomId=1$/);

    await page.getByLabel("利用時間").fill("3");
    await page.getByLabel("利用人数").fill("6");
    await page.getByLabel(/プロジェクター/).check();
    await page.locator("#equipment-1-quantity").fill("2");
    await page.getByLabel(/ミネラルウォーター/).check();
    await page.locator("#drink-1-quantity").fill("4");

    const breakdown = page.locator("aside");
    await expect(breakdown.getByText("￥9,600")).toBeVisible();
    await expect(breakdown.getByText("￥4,400")).toBeVisible();
    await expect(breakdown.getByText("￥600")).toBeVisible();
    await expect(breakdown.getByText("￥14,600")).toBeVisible();

    await page.getByRole("button", { name: "見積もりを保存" }).click();
    await expect(page).toHaveURL(/\/estimates\/\d+\?saved=1$/);
    await expect(page.getByRole("status")).toHaveText(
      "見積もりを保存しました。",
    );
    await expect(page.getByRole("heading", { name: "Focus 6" })).toBeVisible();
    await expect(page.getByText("3時間")).toBeVisible();
    await expect(page.getByText("6名")).toBeVisible();
    await expect(page.getByText("プロジェクター")).toBeVisible();
    await expect(page.getByText("ミネラルウォーター")).toBeVisible();

    const estimateUrl = page.url().replace("?saved=1", "");
    await page.getByRole("link", { name: "見積もり履歴へ" }).click();
    await expect(page).toHaveURL(/\/estimates$/);
    const historyItem = page.getByRole("link", { name: /Focus 6/ });
    await expect(historyItem).toContainText("3時間・6名");
    await expect(historyItem).toContainText("￥14,600");
    await historyItem.click();
    await expect(page).toHaveURL(estimateUrl);

    await page.getByRole("button", { name: "ログアウト" }).click();
    await login(page, "other@example.com");
    await page.goto(estimateUrl);
    await expect(page.getByText("This page could not be found.")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Focus 6" }),
    ).not.toBeVisible();
  });
});
