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
      "apps/**/app/**/*.test.{ts,tsx}",
      "apps/**/migrations/**/*.test.ts",
      "packages/**/src/**/*.test.{ts,tsx}",
      "scripts/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: [
        "apps/**/src/**/*.{ts,tsx}",
        "packages/**/src/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
        "**/.next/**",
        "**/.open-next/**",
        "**/.wrangler/**",
        "apps/web/src/app/**/page.tsx",
        "apps/web/src/app/**/layout.tsx",
        "apps/web/src/app/**/loading.tsx",
        "apps/web/src/app/**/error.tsx",
        "apps/web/src/app/**/not-found.tsx",
        "apps/web/next.config.*",
        "apps/web/middleware.ts",
        "apps/web/src/lib/api/me-types.ts",
        "**/wrangler.toml",
        "**/*.d.ts",
        "**/*.config.{ts,js,mjs,cjs}",
        "**/dist/**",
        "**/build/**",
      ],
    },
  },
});
