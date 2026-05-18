import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const shouldStartLocalServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./playwright/tests/visual",
  testMatch: /admin-schema-diff\.spec\.ts$/,
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["line"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "off",
    video: "off",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } },
    },
  ],
  ...(shouldStartLocalServer
    ? {
        webServer: {
          command: "pnpm dev:webpack --hostname 127.0.0.1",
          url: `${baseURL}/login`,
          reuseExistingServer: !process.env.CI,
          timeout: 240_000,
          env: {
            AUTH_SECRET: "playwright-e2e-auth-secret-32-bytes",
            AUTH_URL: baseURL,
            ENVIRONMENT: "local",
            INTERNAL_API_BASE_URL: "http://127.0.0.1:8787",
            NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8787",
            PLAYWRIGHT_TASK17_ADMIN_FIXTURE: "1",
            PLAYWRIGHT_TEST: "1",
            PORT: "3000",
            PUBLIC_API_BASE_URL: "http://127.0.0.1:8787",
          },
        },
      }
    : {}),
});
