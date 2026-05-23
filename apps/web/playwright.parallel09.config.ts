import { defineConfig, devices } from "@playwright/test";

const localBaseURL = "http://127.0.0.1:3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? localBaseURL;
const shouldStartLocalServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./playwright/tests",
  timeout: 60_000,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    {
      name: "visual-chromium",
      testMatch: /visual\/parallel-09-primitives\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  ...(shouldStartLocalServer
    ? {
        webServer: {
          command: "pnpm dev:webpack --hostname 127.0.0.1",
          url: `${localBaseURL}/visual-harness/formfield-error`,
          reuseExistingServer: !process.env.CI,
          timeout: 240_000,
          env: { PORT: "3000" },
        },
      }
    : {}),
});
