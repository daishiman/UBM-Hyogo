import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    // setupD1 (Miniflare 起動 + migration) で初回 hook が 10s 超になることがある。
    // testTimeout / hookTimeout を 30000 ms に統一する。
    testTimeout: 30000,
    hookTimeout: 30000,
    include: [
      "apps/**/src/**/*.test.{ts,tsx}",
      "packages/**/src/**/*.test.{ts,tsx}",
      "scripts/**/*.test.ts",
    ],
  },
});
