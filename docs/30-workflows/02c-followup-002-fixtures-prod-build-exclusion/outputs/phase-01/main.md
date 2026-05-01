# Phase 1 成果物 — 要件定義

## 状態
- 実行済（2026-05-01）

## 真因

02c 本体タスクは `apps/api/src/repository/__fixtures__/admin.fixture.ts`（dev seeder）と
`apps/api/src/repository/__tests__/_setup.ts`（in-memory D1 fixture loader / miniflare /
fs / migration 依存）を実装した。不変条件 #6 は「dev fixture を production seed として
扱わない」を要請するが、`apps/api/tsconfig.json` は build / test 共用の単一構成であり、
production bundle に dev-only コードが流入するリスクが構成上残っていた。本 follow-up は
build 構成と境界 lint だけで三重防御を固定する。

## scope

### in
- `apps/api/tsconfig.build.json` 新設（test/fixture/spec を `exclude`）。
- `apps/api/package.json` の `build` script を `tsc -p tsconfig.build.json --noEmit` に変更。
- `.dependency-cruiser.cjs` に `no-prod-to-fixtures-or-tests` rule 追加。
- 02c implementation-guide.md 不変条件 #6 節に三重防御補強。
- `pnpm build` / esbuild bundle を AC-1 / AC-4 evidence 対象とする。

### out
- 02a / 02b の test refactor、production fixture / seed 新規実装、monorepo 全体の tsconfig
  構成見直し、新規アプリケーションコード、deploy、commit、push、PR 作成。

## AC ↔ evidence

| AC | 検証手段 | evidence |
| --- | --- | --- |
| AC-1 build 成果物に `__fixtures__/**` `__tests__/**` を含めない | esbuild 直接 bundle で `__fixtures__` `__tests__` `miniflare` 文字列 0 件 | outputs/phase-11/main.md |
| AC-2 `pnpm test` が引き続き通る | root `vitest.config.ts` は build tsconfig と独立 / 変更不要 | outputs/phase-09/main.md |
| AC-3 prod → `__fixtures__` import が error | dependency-cruiser `no-prod-to-fixtures-or-tests` rule | outputs/phase-06/main.md |
| AC-4 bundle size 縮小記録 | esbuild bundle 792.9 KB / test+fixture source 344,831 B (47.7%) を build から exclude | outputs/phase-11/main.md |
| AC-5 02c implementation-guide.md #6 節補強 | 完了タスクの implementation-guide.md に三重防御 sub-section 追記 | docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-12/implementation-guide.md |

## blocker / approval gate
- 自走禁止: deploy、commit、push、PR 作成。
- runtime 影響: なし（runtime コード未変更）。
- user approval gate: なし（ローカル検証のみ）。
