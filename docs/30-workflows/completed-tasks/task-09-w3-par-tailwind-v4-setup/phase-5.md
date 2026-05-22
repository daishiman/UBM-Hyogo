# Phase 5: 実装（GREEN）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 名称 | 実装（GREEN） |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| 実装区分 | 実装仕様書 |

## 目的

Phase 2 設計と Phase 4 RED テストに基づき、変更対象 8 ファイルを実装し、すべてのテストを GREEN にする。

## 実装手順（直列）

### Step 5-1. 依存追加

```bash
cd apps/web
mise exec -- pnpm add -D \
  tailwindcss@~4.0.0 \
  @tailwindcss/postcss@~4.0.0 \
  class-variance-authority@^0.7.0 \
  tailwind-merge@^3.5.0 \
  clsx@^2.1.0
cd ../..
mise exec -- pnpm install
```

`apps/web/package.json` の `devDependencies` 追加と `pnpm-lock.yaml` の更新を確認。

### Step 5-2. `apps/web/postcss.config.mjs` 新設

Phase 2 §S2-1 の内容で新規作成。

### Step 5-3. `apps/web/tailwind.config.ts` 新設

Phase 2 §S2-2 の内容で新規作成。

### Step 5-4. `apps/web/src/styles/tokens.css` 新設

Phase 2 §S2-3 の構造で新規作成。値は task-08 確定値（または元タスク §4.3 の参考値）を写す。**値を「決めない」「変えない」**。

実装時の注意:
- `:root` 内は論理ブロックごとにコメント `/* ---- Brand / Surface ---- */` 等で区切る
- `[data-theme="warm"]` / `[data-theme="cool"]` は最低限 surface / text / border / accent の 12 token override を持つ
- `@supports not (color: oklch(0 0 0))` 内に accent / ok / warn / danger / info の HEX fallback を必ず宣言

### Step 5-5. `apps/web/src/styles/globals.css` 新設

Phase 2 §S2-4 の内容で新規作成。**順序固定**:

1. `@import "tailwindcss";`
2. `@import "./tokens.css";`
3. `@theme inline { ... }`（color / radius / shadow / font の bridge）
4. `@layer base { ... }`（reset + native element）

### Step 5-6. `apps/web/tsconfig.json` への paths 追加

Phase 2 §S2-6 に従い `compilerOptions.paths` に `"@/*": ["./src/*"]` を追加。`baseUrl: "."` が未設定なら併せて追加。

### Step 5-7. `apps/web/app/layout.tsx` の import 切替

Phase 2 §S2-5 の差分を適用。

### Step 5-8. `apps/web/app/styles.css` の削除

Phase 2 §「削除対象（`app/styles.css`）の取り扱い設計」の手順に従う:

1. `git diff` で内容を 3 分類（layout reset / prototype class / ページ固有）
2. layout reset 系のみ `globals.css @layer base` に追記移植
3. `grep -REn "styles\.css" apps/web` で参照箇所が `app/layout.tsx` 以外にないことを確認
4. `git rm apps/web/app/styles.css`

### Step 5-9. テスト実装の最終配置

Phase 4 で記述した `apps/web/src/__tests__/tokens.test.ts` をそのまま配置（RED → GREEN へ）。

### Step 5-10. ローカル GREEN 確認

```bash
# 型チェック
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# unit test (RED → GREEN)
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/__tests__/tokens.test.ts

# Next dev 起動 5 秒 → / 200
mise exec -- pnpm --filter @ubm-hyogo/web dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
kill %1 || true

# Cloudflare Workers ビルド
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare

# Workers preview
mise exec -- pnpm --filter @ubm-hyogo/web preview:cloudflare &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:8788/
kill %1 || true

# HEX grep gate
bash docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-4/hex-grep-gate.sh apps/web/src
```

すべて exit 0 / 200 / 全テスト pass を確認。

## 入力・出力・副作用（CONST_005 必須項目）

### 入力
- Phase 2 確定の変更対象ファイル一覧 / シグネチャ
- Phase 4 確定の RED テスト
- task-08 が確定した OKLch palette 値

### 出力
- 変更対象ファイル 8 件 + テストファイル 1 件の diff
- `pnpm-lock.yaml` 更新

### 副作用
- 既存 prototype class 依存ページの一時的 UI 崩れ（task-10 で解消）
- ローカル `node_modules` 内に `tailwindcss@4` / 関連パッケージが追加

## 完了条件（CONST_005 DoD）

- [ ] Step 5-1〜5-10 がすべて完了
- [ ] `pnpm --filter @ubm-hyogo/web typecheck` が 0 error
- [ ] `pnpm --filter @ubm-hyogo/web test` の token 系テストがすべて GREEN
- [ ] `pnpm --filter @ubm-hyogo/web build:cloudflare` が exit 0、`.open-next/worker.js` が生成
- [ ] `pnpm --filter @ubm-hyogo/web preview:cloudflare` で起動した Workers が `/` に 200 を返す
- [ ] HEX grep gate が exit 0
- [ ] `apps/api/**` に diff が出ていない（`git diff main...HEAD --name-only | grep apps/api` が空）

## 成果物

- `outputs/phase-5/main.md` — 実装サマリ
- `outputs/phase-5/diff-summary.md` — `git diff --stat` の出力
- `outputs/phase-5/local-green-evidence.md` — Step 5-10 の各コマンド出力
