import { expect, test } from "@playwright/test";

test.describe("認証フロー", () => {
  test("新規登録に成功すると会議室一覧へ移動する", async ({ page }) => {
    const uniqueEmail = `signup-${Date.now()}@example.com`;

    await page.goto("/signup");
    await page.getByLabel("表示名").fill("新規登録ユーザー");
    await page.getByLabel("メールアドレス").fill(uniqueEmail);
    await page.getByLabel("パスワード").fill("signup-password");
    await page.getByRole("button", { name: "アカウントを作成" }).click();

    await expect(page).toHaveURL(/\/rooms$/);
    await expect(
      page.getByRole("heading", { name: "目的に合う会議室を選ぶ" }),
    ).toBeVisible();
    await expect(page.getByText("新規登録ユーザー さん")).toBeVisible();
  });

  test("正しい認証情報でログインできる", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("e2e@example.com");
    await page.getByLabel("パスワード").fill("correct-password");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page).toHaveURL(/\/rooms$/);
    await expect(
      page.getByRole("button", { name: "ログアウト" }),
    ).toBeVisible();
    await expect(page.getByText("E2Eユーザー さん")).toBeVisible();
  });

  test("誤った認証情報ではエラーを表示する", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("e2e@example.com");
    await page.getByLabel("パスワード").fill("wrong-password");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("#auth-error")).toHaveText(
      "ログインできませんでした。メールアドレスとパスワードをご確認ください。",
    );
  });

  test("ログアウト後は認証必須画面へアクセスできない", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("e2e@example.com");
    await page.getByLabel("パスワード").fill("correct-password");
    await page.getByRole("button", { name: "ログイン" }).click();
    await expect(page).toHaveURL(/\/rooms$/);

    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/estimates");
    await expect(page).toHaveURL(/\/login\?next=%2Festimates$/);
    await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  });
});
