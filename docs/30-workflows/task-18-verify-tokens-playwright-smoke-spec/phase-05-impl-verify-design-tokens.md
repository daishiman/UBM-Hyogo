[実装区分: 実装仕様書]

# Phase 5: `scripts/verify-design-tokens.ts` 実装仕様

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Phase | 5 / 13 |
| 目的 | 09b §9 JSON / `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css` (`@theme inline`) の OKLch リテラル drift を検知する CLI と Vitest self-test を実装する |
| 前提 Phase | Phase 1（DAG 確定）/ Phase 2（変更対象ファイル表）/ Phase 3（既存 token 正本の inventory）/ Phase 4（package.json scripts 設計） |
| 想定工数 | 0.25 人日 |
| ブランチ | `feat/ui-mvp-task-18-regression-gate` 上の Phase 5 commit |

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. `scripts/verify-design-tokens.ts` を実装し、`mise exec -- pnpm verify:tokens` が drift 0 のとき exit 0 / drift 検出時 exit 1 を返すこと。
2. 4 種 drift 分類（`value-mismatch` / `missing-in-tokens-css` / `missing-in-09b` / `missing-theme-bridge`）を仕様通り出力すること。
3. Vitest による self-test（C1〜C7）が PASS すること。
4. token 抽出が空白正規化を行い、`color-mix(...)` 等のネスト表現を OKLch リテラルとして誤検出しないこと。

### 2.2 非ゴール

- semantic 検証（contrast ratio 等）。
- `tokens.css` / `globals.css` 自体の修正（drift があっても本 Phase では値を書き換えない）。
- 09b §9 JSON の schema 拡張。

## 3. 変更対象ファイル一覧

| パス | 種別 | 説明 |
|------|------|------|
| `scripts/verify-design-tokens.ts` | new | CLI 本体。`verifyDesignTokens()` を export し、`tsx` で直接実行可能 |
| `scripts/verify-design-tokens.test.ts` | new | Vitest unit test（C1〜C7） |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | reference only | §9 JSON を最初の fenced `json` block から抽出 |
| `apps/web/src/styles/tokens.css` | reference only | CSS custom property 群（`--ubm-*`） |
| `apps/web/src/styles/globals.css` | reference only | `@theme inline { ... }` ブロック内の bridge token |

## 4. 関数・型シグネチャ

```ts
// scripts/verify-design-tokens.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface TokenValue {
  /** 例: "--ubm-color-accent" / "--ubm-color-ok-soft" */
  name: string;
  /** 例: "oklch(0.58 0.10 55)" / "#f5f4f1" */
  raw: string;
  /** 出現したセレクタ（":root" / "[data-theme='warm']" 等） */
  scope: string;
}

export interface VerifyResult {
  specTokens: Map<string, TokenValue>;
  cssTokens: Map<string, TokenValue>;
  drifts: TokenDrift[];
  ok: boolean;
}

export interface TokenDrift {
  key: string;
  spec: TokenValue | null;
  css: TokenValue | null;
  reason: "missing-in-tokens-css" | "missing-in-09b" | "missing-theme-bridge" | "value-mismatch";
}

export async function verifyDesignTokens(options?: {
  specPath?: string;
  tokensCssPath?: string;
  globalsCssPath?: string;
  includeThemeBridge?: boolean;
}): Promise<VerifyResult>;
```

### 4.1 実装方針

- 09b は **最初の fenced `json` block** を抽出し、leaf の `css` / `value` pair を walk する。
- `tokens.css` は CSS custom property 宣言（`--ubm-*: <value>;`）を正規表現で抽出。`scope` には `:root` 等を保持する。
- `globals.css` の `@theme inline { ... }` ブロックは **中括弧マッチで切り出し**、09b §10 が要求する bridge token（例 `--color-accent`）の欠落を検査する（`includeThemeBridge: true` がデフォルト）。
- diff 順序は **09b JSON の宣言順**を維持する。
- 値比較前に空白を 1 個に正規化（C5）し、`color-mix(...)` を含む宣言は OKLch literal として扱わない（C6）。

### 4.2 出力フォーマット

成功時 (stdout / exit 0):

```
✓ design tokens in sync (N tracked)
```

失敗時 (stderr / exit 1):

```
✗ token drift detected (3):
  --ubm-color-accent     09b: oklch(0.58 0.10 55)   tokens.css: oklch(0.58 0.10 60)   [value-mismatch]
  --ubm-color-ok-soft    09b: oklch(0.95 0.04 155)  tokens.css: <missing>             [missing-in-tokens-css]
  --color-accent         09b: required bridge        globals.css: <missing>            [missing-theme-bridge]
hint: 09b        = docs/00-getting-started-manual/specs/09b-design-tokens.md
      tokens.css = apps/web/src/styles/tokens.css
      globals    = apps/web/src/styles/globals.css (@theme inline block)
```

### 4.3 CLI entrypoint

ファイル末尾に以下を配置:

- 直接実行 (`tsx scripts/verify-design-tokens.ts`) の場合、`verifyDesignTokens()` を呼び出し、`result.ok` が false なら drift を整列出力して `process.exit(1)`、true なら success 行を 1 行出力して `process.exit(0)`。

## 5. テスト方針（Phase 5 内で動くテスト）

`scripts/verify-design-tokens.test.ts`（Vitest）で以下を担保:

| ID | 入力 | 期待 |
|----|------|------|
| C1 | 09b / tokens.css 同値・bridge 欠落 0 | `ok: true` / `drifts.length === 0` / exit 0 |
| C2 | tokens.css 側 `--ubm-color-accent` を `oklch(0.99 0 0)` に書換 | `value-mismatch` 1 件 / exit 1 |
| C3 | tokens.css から `--ubm-color-ok-soft` を削除 | `missing-in-tokens-css` 1 件 |
| C4 | 09b fixture から `--ubm-color-info` を削除 | `missing-in-09b` 1 件 |
| C5 | `oklch(0.58  0.10  55)`（double space）と `oklch(0.58 0.10 55)` | drift 0（normalize 済み） |
| C6 | `color-mix(in oklch, var(--accent) 12%, transparent)` 含む宣言 | OKLch literal として扱わない |
| C7 | globals.css `@theme inline` から `--color-accent` を削除 | `missing-theme-bridge` 1 件 |

入力ファイルは temp directory に書き出し、`verifyDesignTokens({ specPath, tokensCssPath, globalsCssPath })` を直接呼び出して assert する。

## 6. ローカル実行・検証コマンド

```bash
# 依存
mise exec -- pnpm install --frozen-lockfile

# CLI 実行
mise exec -- pnpm verify:tokens

# Vitest self-test
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts

# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 7. DoD チェックリスト

- [ ] `scripts/verify-design-tokens.ts` が export する `verifyDesignTokens` / `VerifyResult` / `TokenDrift` / `TokenValue` の型シグネチャが §4 と一致
- [ ] `mise exec -- pnpm verify:tokens` が現行 `tokens.css` / `globals.css` / 09b に対し exit 0
- [ ] drift を意図的に注入したケースで exit 1 と §4.2 のフォーマットで stderr 出力されること
- [ ] C1〜C7 の 7 ケースが Vitest で PASS
- [ ] `tsx` 経由で直接実行可能（root `package.json#scripts.verify:tokens` が `tsx scripts/verify-design-tokens.ts`）
- [ ] `tokens.css` / `globals.css` / 09b の値は本 Phase で改変しない
