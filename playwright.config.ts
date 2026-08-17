import { defineConfig, devices } from "@playwright/test";

const appUrl = "http://127.0.0.1:3000";
const mockSupabaseUrl = "http://127.0.0.1:54329";

export default defineConfig({
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: "test-results",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.platform === "darwin" ? "chrome" : undefined,
      },
    },
  ],
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  retries: process.env.CI ? 2 : 0,
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: appUrl,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node tests/e2e/support/mock-supabase.mjs",
      reuseExistingServer: !process.env.CI,
      url: `${mockSupabaseUrl}/health`,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1",
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "e2e-publishable-key",
        NEXT_PUBLIC_SUPABASE_URL: mockSupabaseUrl,
      },
      reuseExistingServer: !process.env.CI,
      stderr: "pipe",
      stdout: "pipe",
      url: `${appUrl}/login`,
    },
  ],
  workers: 1,
});
