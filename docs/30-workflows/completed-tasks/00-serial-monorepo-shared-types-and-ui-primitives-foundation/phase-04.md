# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 4 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 3 (設計レビュー) |
| 下流 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

Phase 5 の scaffold 実装に対する検証スイート（typecheck / lint / unit / contract / authorization）を「先に」設計する。Wave 0 はビジネスロジックを持たないため、test 対象は「型表面の export」「ESLint rule 動作」「primitives の rendering smoke」に限定する。

## 実行タスク

1. verify suite 4 種を確定（typecheck / lint / unit / scaffold-smoke）
2. test fixture 一覧を確定（このタスクではダミー fixture のみ）
3. ESLint rule の自動テストを設計（apps/web から D1 import を error にする RuleTester）
4. UI primitives の smoke test を設計（@testing-library/react で render が throw しない）
5. AC-1〜AC-9 とテスト項目の対応表を作成
6. outputs/phase-04/test-matrix.md を生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計 |
| 必須 | outputs/phase-03/main.md | 採用案 |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | a11y 最低基準 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型 4 層 |

## 実行手順

### ステップ 1: verify suite の項目確定
- typecheck: `pnpm -w typecheck`（tsc --noEmit）
- lint: `pnpm -w lint`（ESLint）
- unit: `pnpm -w test`（Vitest）
- scaffold-smoke: 各 package の barrel export が import できることを smoke で検証

### ステップ 2: ESLint RuleTester 設計

### ステップ 3: primitive smoke test 設計（render + a11y role assertion）

### ステップ 4: AC ↔ test の対応表作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook で test 実行ステップとして組み込み |
| Phase 7 | AC マトリクスのテスト列に転記 |
| Phase 8 | DRY 化対象（test fixture の共通化） |
| Phase 9 | 品質保証で test カバレッジ確認 |

## 多角的チェック観点（不変条件参照）

- **#1**: 型 4 層の export が typecheck で確認される
- **#5**: ESLint rule のテストで `apps/web` から D1 import が error になることを保証
- **#6**: primitive smoke test で `localStorage` 呼び出しがゼロ
- **#8**: Avatar smoke test で `hue` が memberId 由来（ランダムでない）
- **a11y**: Drawer / Modal smoke で `role="dialog"` が出現

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | verify suite 確定 | 4 | pending | 4 種 |
| 2 | ESLint RuleTester 設計 | 4 | pending | no-restricted-imports |
| 3 | primitive smoke test 設計 | 4 | pending | 15 種 |
| 4 | AC ↔ test 対応表 | 4 | pending | 9 行 |
| 5 | test-matrix.md 作成 | 4 | pending | outputs/phase-04/ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略総合 |
| ドキュメント | outputs/phase-04/test-matrix.md | AC × test 対応表 |
| メタ | artifacts.json | Phase 4 を completed |

## 完了条件

- [ ] verify suite 4 種すべて command が確定（`pnpm -w typecheck` 等）
- [ ] AC-1〜AC-9 が 1 つ以上の test 項目に紐付いている
- [ ] ESLint RuleTester で「apps/web から D1 import → error」を検証する spec の placeholder が記述
- [ ] 15 primitives 全てが smoke test に列挙

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスク completed
- [ ] outputs/phase-04/main.md と test-matrix.md 配置済み
- [ ] 全 AC が test 紐付け済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 5（実装ランブック）
- 引き継ぎ事項: test 実行コマンドを runbook に組み込み
- ブロック条件: AC ↔ test 対応表が未完成

## Verify Suite 設計

### 1. typecheck

| 対象 | コマンド | 期待 |
| --- | --- | --- |
| 全パッケージ | `pnpm -w typecheck` | exit 0 |
| apps/web | `pnpm --filter @ubm/web typecheck` | exit 0、tsc --noEmit |
| apps/api | `pnpm --filter @ubm/api typecheck` | exit 0 |
| packages/shared | `pnpm --filter @ubm/shared typecheck` | exit 0、`MemberId/ResponseId/ResponseEmail/StableKey` が export される |
| packages/integrations/google | `pnpm --filter @ubm/integrations-google typecheck` | exit 0 |

### 2. lint

| 対象 | コマンド | 期待 |
| --- | --- | --- |
| 全パッケージ | `pnpm -w lint` | exit 0 |
| ESLint RuleTester | `pnpm --filter @ubm/eslint-config test` | RuleTester で `import { D1Database } from '@cloudflare/workers-types'` が error |
| ESLint RuleTester (Apps API) | 同上 | apps/api 内では同じ import が allowed |

### 3. unit (Vitest)

| 対象 | spec | 期待 |
| --- | --- | --- |
| `tones.ts` | `apps/web/src/lib/tones.test.ts` | `zoneTone('0_to_1') === 'cool'`, `statusTone('member') === 'green'` 等 6 ケース |
| `packages/shared/types/ids` | `packages/shared/src/types/ids.test.ts` | branded type が `as` キャストなしで通らないことを type-level test |
| primitive smoke (15 種) | `apps/web/src/components/ui/__tests__/{name}.test.tsx` | `render()` が throw しない、a11y role 出現 |

### 4. scaffold-smoke

| 対象 | コマンド | 期待 |
| --- | --- | --- |
| Hono health | `pnpm --filter @ubm/api dev` 後 `curl localhost:8787/healthz` | `{"ok":true}` 200 |
| Next.js dev | `pnpm --filter @ubm/web dev` 後 `curl localhost:3000` | 200 OK（空ページ可） |
| barrel export | node 経由で `import * from '@ubm/shared'` | throw なし |

## ESLint RuleTester 設計

```ts
// .eslintrc/rules/no-d1-from-web.test.ts (placeholder)
import { RuleTester } from "eslint";
import rule from "./no-d1-from-web";

new RuleTester({ parser: require.resolve("@typescript-eslint/parser") }).run(
  "no-d1-from-web",
  rule,
  {
    valid: [
      { code: "import { Hono } from 'hono';", filename: "apps/api/src/index.ts" },
      { code: "import { D1Database } from '@cloudflare/workers-types';", filename: "apps/api/src/db.ts" },
    ],
    invalid: [
      {
        code: "import { D1Database } from '@cloudflare/workers-types';",
        filename: "apps/web/src/app/page.tsx",
        errors: [{ messageId: "noD1FromWeb" }],
      },
    ],
  }
);
```

## Primitive Smoke Test 一覧（15 種）

| # | primitive | smoke 観点 |
| --- | --- | --- |
| 1 | Chip | `render(<Chip tone="cool">x</Chip>)` がエラーなく描画 |
| 2 | Avatar | `hue` が `memberId` 入力に対し決定論的（同じ ID で同じ hue） |
| 3 | Button | `aria-busy` が `loading=true` で出現 |
| 4 | Switch | `role="switch"` と `aria-checked` |
| 5 | Segmented | `role="radiogroup"` |
| 6 | Field | `htmlFor` ↔ `id` 連携 |
| 7 | Input | `<Field>` 内で `aria-describedby` |
| 8 | Textarea | 同上 |
| 9 | Select | 同上 |
| 10 | Search | clear button で onChange("") 発火 |
| 11 | Drawer | `role="dialog"`、Escape で onClose 発火 |
| 12 | Modal | `role="dialog"`、focus trap |
| 13 | Toast | Provider あり時に `toast()` 呼び出しが throw しない |
| 14 | KVList | `items` 配列の長さに応じて `<dl>` 内項目数 |
| 15 | LinkPills | 外部リンクに `rel="noopener noreferrer"` |

## AC ↔ test 対応表

| AC | テスト項目 | 検証コマンド |
| --- | --- | --- |
| AC-1 | pnpm install | `pnpm install --frozen-lockfile=false` |
| AC-2 | typecheck | `pnpm -w typecheck` |
| AC-3 | lint + RuleTester | `pnpm -w lint && pnpm --filter @ubm/eslint-config test` |
| AC-4 | unit | `pnpm -w test` |
| AC-5 | barrel export | scaffold-smoke の `import * from '@ubm/web/components/ui'` で 15 keys |
| AC-6 | tones unit | `tones.test.ts` 6 ケース |
| AC-7 | next.config.js | `apps/web/next.config.js` に `withOpenNext` 等の存在確認 |
| AC-8 | healthz | `curl localhost:8787/healthz → 200 {"ok":true}` |
| AC-9 | shared export | `import { MemberId, ResponseId, ResponseEmail, StableKey } from '@ubm/shared'` が typecheck 通過 |
