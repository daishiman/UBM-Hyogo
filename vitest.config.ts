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
      "apps/**/src/**/*.spec.{ts,tsx}",
      "apps/**/app/**/*.spec.{ts,tsx}",
      "apps/**/scripts/**/*.spec.{ts,tsx}",
      "apps/**/migrations/**/*.spec.ts",
      "packages/**/src/**/*.spec.{ts,tsx}",
      "scripts/**/*.spec.ts",
      "infra/cloudflare-alerts/lib/__tests__/**/*.spec.ts",
    ],
    // issue-617: D1 binding を使う apps/api test は vitest.d1.config.ts に分離。
    // Phase 4 classification.md (docs/30-workflows/issue-617-ci-test-time-reduction-split/) を正本。
    // 同 glob 集合は vitest.d1.config.ts の include と disjoint で対応する。
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts",
      "apps/api/migrations/seed/__tests__/issue-399-seed-syntax.spec.ts",
      "apps/api/src/__tests__/invariants.spec.ts",
      "apps/api/src/env.spec.ts",
      "apps/api/src/health-db.contract.spec.ts",
      "apps/api/src/middleware/me-session-resolver.authz.spec.ts",
      "apps/api/src/middleware/repository-providers.spec.ts",
      "apps/api/src/middleware/__tests__/rate-limit-magic-link.authz.spec.ts",
      "apps/api/src/audit-correlation/__tests__/persist.spec.ts",
      "apps/api/src/audit-correlation/__tests__/run-correlation.spec.ts",
      "apps/api/src/jobs/**/*.contract.spec.ts",
      "apps/api/src/repository/**/*.repository.spec.ts",
      "apps/api/src/routes/**/*.contract.spec.ts",
      "apps/api/src/sync/**/*.contract.spec.ts",
      "apps/api/src/sync/schema/**/*.spec.ts",
      "apps/api/src/use-cases/auth/__tests__/*.spec.ts",
      "apps/api/src/workflows/*.contract.spec.ts",
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
        "apps/web/src/__tests__/__fixtures__/**",
        "**/wrangler.toml",
        "**/*.d.ts",
        "**/*.config.{ts,js,mjs,cjs}",
        "**/dist/**",
        "**/build/**",
      ],
    },
  },
});
