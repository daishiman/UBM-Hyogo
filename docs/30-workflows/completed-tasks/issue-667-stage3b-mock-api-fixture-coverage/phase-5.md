# Phase 5: 環境準備（packages/contracts scaffold + pnpm workspace 反映）

## メタ情報

| key | value |
|-----|-------|
| Phase | 5 |
| Phase Name | 環境準備 |
| 作成日 | 2026-05-14 |
| 前 Phase | 4 |
| 次 Phase | 6 |
| 分類ラベル | `existing-hardening` |
| 実装区分 | 実装仕様書（パッケージ scaffold） |
| visualEvidence | NON_VISUAL |
| hostEnvironmentChange | **false**（local repo 内の package 追加のみ。`~/.zshrc` / global settings の書き換えなし） |
| 3 点セット必須化 | **不要**（`phase-5-deployment-checkpoint-standard.md` §1 該当なし） |

## 目的

Phase 6 GREEN 着手前に必要な scaffold を整える。具体的には:

1. `packages/contracts/` パッケージの package.json / tsconfig / plain ESM / vitest 設定を作成（**zod schema 実体は Phase 6 で追加**）
2. `pnpm-workspace.yaml` で `packages/contracts` が認識されることを確認
3. `apps/api` / `apps/web` の `package.json#dependencies` に `@ubm-hyogo/contracts: workspace:*` を追記
4. `mise exec -- pnpm install` を完走させ、workspace symlink を貼る
5. 現状の mock（拡張前）に対し `/health` ローカル動作確認を行い、CI readiness wait のローカル等価動作を担保

> **Phase 5 deployment-checkpoint-standard との関係**: 本 Phase は host 環境ファイル / Cloudflare / D1 を一切触らない。よって 3 点セット（backup-manifest / runbook-execution-log / manual-smoke-log）は不要。ただし「**host 環境チェックポイント**」（Node 24 / pnpm 10 / mise）と「**ローカル smoke**」（`/health` curl 200）は本 Phase の完了条件として残す。

## 既存実装検査ゲート（Phase 2 から再確認）

| 対象 | 状態 | 確認コマンド |
|------|------|-------------|
| `packages/contracts/` | 不在 | `ls packages/ \| grep contracts` で 0 件 |
| `packages/shared/` | 既存 | `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` 定義済 |
| `pnpm-workspace.yaml` | 既存 | `cat pnpm-workspace.yaml` で `packages/*` glob 確認 |
| `apps/api/package.json` / `apps/web/package.json` | 既存 | 依存追加が必要 |

## host 環境チェックポイント（Phase 5 共通）

| 項目 | 期待 | 確認コマンド |
|------|------|-------------|
| Node | `v24.15.0` | `mise exec -- node -v` |
| pnpm | `10.33.2` | `mise exec -- pnpm -v` |
| mise | 利用可能 | `which mise` |
| `.mise.toml` | 正本一致 | `cat .mise.toml \| grep -E "node\|pnpm"` |
| `pnpm-workspace.yaml` | `packages/*` 含む | `cat pnpm-workspace.yaml` |

いずれかが NG の場合は Phase 5 を blocker とし、CLAUDE.md §開発環境セットアップに沿って復旧してから再開する。

## 実行タスク

1. `packages/contracts/` ディレクトリ作成 + `package.json` / `tsconfig.json` / `plain ESM .mjs exports` / `vitest.config.ts` を新規作成
2. `pnpm-workspace.yaml` の `packages` glob が `packages/contracts` を含むことを確認（既存 `packages/*` で OK）
3. `apps/api/package.json` の `dependencies` に `"@ubm-hyogo/contracts": "workspace:*"` を追記
4. `apps/web/package.json` の `dependencies` に `"@ubm-hyogo/contracts": "workspace:*"` を追記
5. `mise exec -- pnpm install` 実行（lefthook install + workspace symlink）
6. ローカル smoke: `node scripts/e2e-mock-api.mjs &` で mock 起動 → `curl -sf http://127.0.0.1:8787/health` で 200 確認 → `kill`
7. 結果を `outputs/phase-5/scaffold-log.md` / `outputs/phase-5/local-smoke-log.md` に保存

## 参照資料

- Phase 2: `outputs/phase-2/design.md` Concern A（package 構造）
- Phase 4: `outputs/phase-4/test-plan.md`（test が想定する import パス）
- `phase-5-deployment-checkpoint-standard.md`（3 点セット **非適用** 確認）
- 既存: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/plain ESM .mjs exports`（scaffold の reference）
- CLAUDE.md §開発環境セットアップ / §よく使うコマンド

## 変更対象ファイル一覧

| パス | 種別 | 内容 |
|------|------|------|
| `packages/contracts/package.json` | 新規 | name / version / exports / scripts / deps |
| `packages/contracts/tsconfig.json` | 新規 | `extends: ../../tsconfig.base.json`（既存に倣う） |
| `packages/contracts/src/index.mjs` | 新規（**空 stub**） | plain ESM aggregator（Phase 6 で本体追加） |
| `apps/api/package.json` | 編集 | `dependencies` に `@ubm-hyogo/contracts: workspace:*` 追加 |
| `apps/web/package.json` | 編集 | 同上 |
| `outputs/phase-5/scaffold-log.md` | 新規 | scaffold 実行ログ |
| `outputs/phase-5/local-smoke-log.md` | 新規 | `/health` ローカル smoke ログ |

## 実行手順

### 1. `packages/contracts/package.json`

```json
{
  "name": "@ubm-hyogo/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.mjs",
    "./src": "./src/index.mjs"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "zod": "workspace:*"
  },
  "devDependencies": {}
}
```

> 実際の version pin は workspace root の lockfile に倣う。`packages/contracts` は `zod` のみ runtime dependency とし、`@ubm-hyogo/shared` には依存しない。

### 2. `packages/contracts/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "composite": false
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.spec.ts"]
}
```

### 3. `packages/contracts/plain ESM .mjs exports`

```ts
import { defineConfig } from 'plain ESM';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
});
```

### 4. Root Vitest config

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'dist/**'],
    },
  },
});
```

### 5. `packages/contracts/src/index.mjs`（Phase 5 では stub）

```ts
// Phase 5 scaffold: 本体は Phase 6 で追加する。
// この stub により pnpm install / typecheck は通るが、Phase 4 RED test は import 解決失敗のまま。
export const __scaffold = true;
```

> **意図**: Phase 6 で `export { schemas } from './schemas'` / `export { fixtures } from './fixtures'` 等を追加した時点で Phase 4 RED test が GREEN へ遷移する。

### 6. `apps/api/package.json` / `apps/web/package.json` 編集

```diff
   "dependencies": {
+    "@ubm-hyogo/contracts": "workspace:*",
     "@ubm-hyogo/shared": "workspace:*",
     ...
   }
```

### 7. `pnpm-workspace.yaml` 確認

```bash
cat pnpm-workspace.yaml
# 期待:
# packages:
#   - 'apps/*'
#   - 'packages/*'
```

`packages/*` が既にあるため追記不要。明示列挙形式の場合のみ `- 'packages/contracts'` を追記する。

### 8. install 実行

```bash
mise exec -- pnpm install
```

期待:
- `packages/contracts/node_modules/.bin/plain ESM` 等が解決される
- `apps/api/node_modules/@ubm-hyogo/contracts` / `apps/web/node_modules/@ubm-hyogo/contracts` が **symlink** で生える
- lefthook install が prepare hook 経由で実行される

### 9. ローカル smoke（`/health` readiness wait のローカル等価）

```bash
# 別シェルまたは backgrounded
node scripts/e2e-mock-api.mjs > /tmp/e2e-mock-api-phase5.log 2>&1 &
MOCK_PID=$!

# readiness wait（CI step と同じ pattern）
for i in {1..30}; do
  if curl -sf http://127.0.0.1:8787/health; then
    echo "mock ready (attempt=$i)"
    break
  fi
  sleep 1
done

# teardown
kill $MOCK_PID
```

期待: `attempt=1` で 200 返却（既存 mock は `/health` 対応済）。失敗時は `/tmp/e2e-mock-api-phase5.log` を `outputs/phase-5/local-smoke-log.md` に貼付し blocker 扱い。

### 10. typecheck / lint で scaffold 健全性確認

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: PASS（scaffold は stub なので破壊しない）。Phase 4 RED test は scaffold 後も import 解決失敗で RED のままが正常。

## 統合テスト連携

- 本 Phase 完了後、Phase 4 で書いた contract test は **mock 起動 + `/health` 200** までは到達可能になる（schema import は依然 RED）
- ローカル smoke の手順は Phase 11 の E2E regression 実行前手順と完全に同一
- `outputs/phase-5/local-smoke-log.md` は CI readiness wait（AC-5）のローカル等価 evidence として Phase 12 changelog に引用

## 多角的チェック観点（AI が判断）

- [ ] `packages/contracts/package.json` の `name` が `@ubm-hyogo/contracts` で他パッケージと衝突しない
- [ ] `dependencies` に `zod` のみが並ぶ（apps / shared への循環参照なし）
- [ ] `apps/api` / `apps/web` 両方の `package.json` に `@ubm-hyogo/contracts: workspace:*` を追加し、片側忘れがない
- [ ] `mise exec -- pnpm install` 後に `apps/api/node_modules/@ubm-hyogo/contracts` / `apps/web/node_modules/@ubm-hyogo/contracts` が symlink で生えている（`ls -la` で確認）
- [ ] `/health` ローカル smoke が 200 で返ること、log が `outputs/phase-5/local-smoke-log.md` に保存されていること
- [ ] host 環境チェックポイント 5 項目すべて PASS
- [ ] `pnpm typecheck` / `pnpm lint` が PASS（scaffold 自体は壊さない）

## サブタスク管理

なし（単一 Phase 内完結）

## 成果物

| 種別 | パス |
|------|------|
| コード | `packages/contracts/package.json` |
| コード | `packages/contracts/tsconfig.json` |
| コード | `packages/contracts/src/index.mjs`（stub） |
| コード | `apps/api/package.json`（編集） |
| コード | `apps/web/package.json`（編集） |
| ドキュメント | `outputs/phase-5/scaffold-log.md` |
| ドキュメント | `outputs/phase-5/local-smoke-log.md` |
| ドキュメント | `outputs/phase-5/host-env-checkpoint.md`（Node 24 / pnpm 10 / mise 確認結果） |

## 完了条件

- [ ] `packages/contracts/` 配下 5 ファイル作成済
- [ ] `apps/api/package.json` / `apps/web/package.json` の `dependencies` 追記済
- [ ] `mise exec -- pnpm install` が exit 0
- [ ] workspace symlink が双方の app に貼られている（`ls -la apps/{api,web}/node_modules/@ubm-hyogo/` で確認）
- [ ] `node scripts/e2e-mock-api.mjs` 起動 → `curl -sf http://127.0.0.1:8787/health` で 200 返却
- [ ] `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が PASS
- [ ] host 環境チェックポイント 5 項目すべて PASS
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% は scaffold stub のみのため measurement skip。Phase 6 / Phase 9 で実評価
- [ ] `bash scripts/coverage-guard.sh` exit 0 は Phase 6 / Phase 9 / Phase 11 完了条件で確認
- [ ] hostEnvironmentChange = `false` を `artifacts.json` メタに記録（3 点セット非適用の根拠）

## タスク100%実行確認【必須】

- [ ] 実行タスク 1-10 全完了
- [ ] 成果物 10 件作成（コード 7 / ドキュメント 3）
- [ ] ローカル smoke ログ保存
- [ ] host 環境チェックポイント 5 項目すべて記録

## 次 Phase

Phase 6: 実装（TDD GREEN — Concern A-D の本体実装で Phase 4 RED test を GREEN 化）
