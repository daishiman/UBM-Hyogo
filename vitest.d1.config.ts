// vitest.d1.config.ts — apps/api の D1 binding 利用 test 専用 config
// 仕様: docs/30-workflows/issue-617-ci-test-time-reduction-split/phase-05.md
//
// 目的:
//   - Miniflare D1 port を 1 fork に直列化し port exhaustion (#577) を回避
//   - root vitest.config.ts (unit 既定) から exclude された D1 依存 test を網羅
//
// 包含対象は Phase 4 classification.md と整合した glob 群。
// 2026-05-11 の vitest list 実測では D1 group 94 files / unit group 44 files。
//
// NOTE: mergeConfig は array 系 (include) を concat するため、include はマージせず
// このファイル内で完全に上書きする。plugins / resolve / coverage 等は base を再利用。

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import baseConfig from "./vitest.config";

const rootReact = fileURLToPath(new URL("./node_modules/react", import.meta.url));
const rootReactDom = fileURLToPath(new URL("./node_modules/react-dom", import.meta.url));

const D1_INCLUDE = [
  "apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts",
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
];

export const d1Include = D1_INCLUDE;

// base から coverage 設定だけ取り出して d1 group の reportsDirectory に上書きする。
const baseTest = (baseConfig as { test?: Record<string, unknown> }).test ?? {};
const baseCoverage = (baseTest as { coverage?: Record<string, unknown> }).coverage ?? {};

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
    testTimeout: 30000,
    hookTimeout: 30000,
    include: D1_INCLUDE,
    exclude: ["**/node_modules/**", "**/dist/**", "**/.{idea,git,cache,output,temp}/**"],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      ...baseCoverage,
      reportsDirectory: "apps/api/coverage/d1",
    },
  },
});
