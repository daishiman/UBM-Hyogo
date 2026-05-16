import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright/tests",
  timeout: 60_000,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
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
});
