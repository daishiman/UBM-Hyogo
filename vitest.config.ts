import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// pnpm の isolated node-linker (CI 既定) では apps/web を cwd とする vitest 実行時に
// `react/jsx-dev-runtime` 等の subpath exports を Vite が解決できず
// "Failed to resolve import 'react/jsx-dev-runtime'" で失敗するケースがある
// (ローカルは pnpm config の node-linker=hoisted で発症しないため CI 限定で再現)。
// ルート `node_modules` の react / react-dom を正本として alias + dedupe で固定する。
const rootReact = fileURLToPath(new URL("./node_modules/react", import.meta.url));
const rootReactDom = fileURLToPath(new URL("./node_modules/react-dom", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: /^react$/, replacement: `${rootReact}/index.js` },
      { find: /^react\/jsx-runtime$/, replacement: `${rootReact}/jsx-runtime.js` },
      { find: /^react\/jsx-dev-runtime$/, replacement: `${rootReact}/jsx-dev-runtime.js` },
      { find: /^react-dom$/, replacement: `${rootReactDom}/index.js` },
      { find: /^react-dom\/client$/, replacement: `${rootReactDom}/client.js` },
      { find: /^react-dom\/test-utils$/, replacement: `${rootReactDom}/test-utils.js` },
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
    ],
  },
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
