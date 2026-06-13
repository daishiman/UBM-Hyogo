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
  "apps/api/migrations/__tests__/*.spec.ts",
  "apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts",
  "apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts",
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
  "apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts",
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
    testTimeout: 180000,
    hookTimeout: 180000,
    include: D1_INCLUDE,
    exclude: ["**/node_modules/**", "**/dist/**", "**/.{idea,git,cache,output,temp}/**"],
    // v4: tinypool 削除により poolOptions / singleFork は廃止。
    // issue-617 の D1 直列化（port exhaustion 回避）は top-level maxWorkers: 1 で表現する。
    // NOTE: 旧 singleFork: true は「単一 fork で全ファイルを直列実行」だが
    // モジュール状態はファイル単位で隔離されていた（isolate 既定 true）。
    // migration guide の等価表現とされる isolate: false を併用すると、
    // D1 mock のモジュール状態がファイル間で汚染し `db.prepare is not a function`
    // 等の順序依存 fail を起こすため採用しない。maxWorkers: 1 のみで
    // Miniflare D1 インスタンスを 1 つに直列化し port exhaustion を回避する。
    // Vitest 4 + x64 Node では初回 migration が 120s を超えることがあるため、
    // D1 専用 shard だけ timeout を 180s に広げる。
    pool: "forks",
    maxWorkers: 1,
    coverage: {
      ...baseCoverage,
      reportsDirectory: "apps/api/coverage/d1",
    },
  },
});
