# Phase 12 成果物 — ドキュメント更新

## 状態
- 実行済（2026-05-01）

## 更新内容

### 1. 02c 完了タスクの implementation-guide.md（AC-5）

`docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-12/implementation-guide.md`

- 不変条件 #6 行に「三重防御で固定」表記を追記:

  > #6 | `__fixtures__/admin.fixture.ts` は dev 用。production seed として扱わない。**三重防御（後述補強）で固定。** | AC-10

- 直下に sub-section 追加:

  ```markdown
  #### #6 の三重防御（02c-followup-002 で追加）

  `__fixtures__/admin.fixture.ts` および `__tests__/_setup.ts` を production runtime に流入させない構成上の固定:

  1. **build 構成**: `apps/api/tsconfig.build.json` が `src/**/__tests__/**` / `src/**/__fixtures__/**` / `*.test.ts` を `exclude`。
  2. **境界 lint**: `.dependency-cruiser.cjs` の `no-prod-to-fixtures-or-tests` rule。
  3. **runtime bundling**: Cloudflare Workers の wrangler/esbuild は `src/index.ts` から到達可能な module だけを bundle する。

  詳細仕様: `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/`。
  ```

### 2. 本 follow-up タスクの outputs/phase-01〜phase-11/main.md

各フェーズの成果物として実装決定・evidence・テスト結果を記録（本ディレクトリ配下）。

## implementation-guide.md（本タスク版）

### 概要

`apps/api` の build 成果物から `__fixtures__/**` / `__tests__/**` を構成上強制的に除外
し、production runtime に dev-only コード（miniflare 等の test 専用依存・dev fixture seed）
が流入しない状態を foundation として固定する。

### 変更点

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/tsconfig.build.json` | 新規 | production typecheck 専用 tsconfig。test / fixture / spec を `exclude`。 |
| `apps/api/package.json` | 変更 | `build` script を `tsc -p tsconfig.build.json --noEmit` に切替。 |
| `.dependency-cruiser.cjs` | 変更 | `no-prod-to-fixtures-or-tests` rule 追加、`options.exclude` を narrow。 |
| root `package.json` | 変更 | `lint:deps` を追加し、root `lint` から dep-cruiser gate を実行。 |
| `docs/30-workflows/completed-tasks/02c-.../outputs/phase-12/implementation-guide.md` | 変更 | 不変条件 #6 節に三重防御 sub-section 追記。 |

### evidence

- esbuild bundle: 792.9 KB / `__fixtures__` `__tests__` `miniflare` 文字列 0 件（Phase 11）。
- build から exclude する source: 344,831 B / 90 ファイル（apps/api/src 全 722,356 B の 47.7%）。
- dep-cruiser: 通常実行 0 violations / 合成違反 1 error（Phase 6）。
- typecheck / build: いずれも exit 0（Phase 9）。

### 不変条件

- #6 dev fixture を production seed として扱わない → build / lint / runtime bundling の三層で固定。
- production runtime に test 専用依存（miniflare 等）を流入させない → bundle 検査 0 件。
- Cloudflare Workers free-tier bundle size 上限 → 本タスクで bundle 増加なし、test/fixture を構造的に除外。

### scope-out

02a / 02b の test refactor、production fixture / seed 新規実装、monorepo 全体の tsconfig
構成見直し、新規アプリケーションコード、deploy、commit、push、PR 作成は本タスクに含めない
（Phase 13 PR 作成は user 指示で抑止）。
