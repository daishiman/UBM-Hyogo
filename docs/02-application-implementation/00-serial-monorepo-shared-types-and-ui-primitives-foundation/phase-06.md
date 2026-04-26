# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 6 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 5 (実装ランブック) |
| 下流 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

Phase 5 の runbook と Phase 4 の test 戦略に対し、想定される失敗ケース（typecheck NG / lint rule trigger / scaffold-smoke 失敗 / 依存解決失敗）を網羅し、対応方針を確定する。本 Wave は API を持たないため 401/403/404/422/5xx は対象外、代わりに開発時失敗ケースを扱う。

## 実行タスク

1. failure case 一覧化（typecheck / lint / test / build / scaffold / monorepo 解決）
2. 各 case に「期待される error message / exit code」と「修復手順」を対応
3. 不変条件違反の意図的 trigger ケース（apps/web から D1 import 等）を含める
4. outputs/phase-06/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | verify suite |
| 必須 | outputs/phase-05/runbook.md | step ごとの sanity |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | a11y 失敗観点 |

## 実行手順

### ステップ 1: failure case 表作成
- 開発時失敗（typecheck / lint / test / build）
- 不変条件違反の意図 trigger
- 統合失敗（pnpm 解決 / wrangler dev 起動）

### ステップ 2: 修復手順の付与

### ステップ 3: outputs/phase-06/main.md 作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスの「異常系」列で参照 |
| Phase 9 | secret hygiene / a11y で再確認 |
| Phase 11 | manual smoke で意図的に trigger して確認 |

## 多角的チェック観点（不変条件参照）

- **#1**: 型 4 層を統合する PR があれば lint で blocker（このタスクで防御）
- **#5**: apps/web から `import { D1Database } from '@cloudflare/workers-types'` を試みる → ESLint error
- **#6**: primitive 内で `localStorage.getItem(...)` を呼ぶ → ESLint custom rule で warn （Phase 8 で rule 追加検討）
- **#8**: Avatar に `localStorage` 依存導入 → Phase 6 のテストで意図的に検出

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 表 | 6 | pending | 12 ケース以上 |
| 2 | 不変条件 trigger | 6 | pending | 4 件 |
| 3 | 修復手順 | 6 | pending | 各ケース |
| 4 | outputs 作成 | 6 | pending | outputs/phase-06/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure cases + 修復手順 |
| メタ | artifacts.json | Phase 6 を completed |

## 完了条件

- [ ] failure case 12 件以上が列挙
- [ ] 不変条件違反 trigger 4 件が列挙
- [ ] 各ケースに修復手順 1 行以上

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs/phase-06/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 7（AC マトリクス）
- 引き継ぎ事項: failure case → AC matrix の異常系列
- ブロック条件: outputs/phase-06/main.md 未作成

## Failure Cases 一覧

| # | カテゴリ | ケース | 期待 error / exit | 修復手順 |
| --- | --- | --- | --- | --- |
| 1 | typecheck | `MemberId` を string として渡す | TS2322 | branded type の brand キーを正しく付与 |
| 2 | typecheck | shared から `viewmodel` 未実装 import | export not found | 01b で実装後に再 typecheck |
| 3 | lint | apps/web → D1 import | ESLint error: `noD1FromWeb` | apps/api 経由に書き換え |
| 4 | lint | apps/web → apps/api 直接 import | ESLint error: `import/no-restricted-paths` | fetch / RSC 経由に書き換え |
| 5 | lint | primitive で `localStorage.setItem` | ESLint custom rule warn | サーバー側保存に切替 |
| 6 | unit | `tones.test.ts` mapping 不一致 | Vitest fail | tones.ts の switch を仕様に合わせる |
| 7 | unit | Avatar smoke で `hue` が非決定論的 | assert fail | hashStringToHue 確認 |
| 8 | scaffold | `pnpm install` で `ERR_PNPM_UNSUPPORTED_ENGINE` | pnpm version 不一致 | corepack で 8.x 以上に固定 |
| 9 | scaffold | apps/api `wrangler dev` で port 競合 | EADDRINUSE | port 切替 or kill |
| 10 | scaffold | apps/web `next dev` で `@opennextjs/cloudflare` 未解決 | module not found | dev dependency 追加 |
| 11 | scaffold | barrel export 漏れ（15 種未満） | AC-5 fail | index.ts に追記 |
| 12 | a11y | Drawer に `role="dialog"` なし | smoke test fail | role 付与 |
| 13 | a11y | Avatar に `aria-label` なし | smoke test fail | aria-label 付与 |
| 14 | invariant #1 | shared に Form schema を直書き | code review reject | 01b の zod schema 経由 |
| 15 | invariant #5 | apps/web に D1 binding 設定 | wrangler.toml に binding 検出 | 削除 |
| 16 | invariant #6 | primitive で `localStorage` 操作 | ESLint warn + review reject | 削除 |
| 17 | invariant #8 | Avatar の hue を `Math.random()` 化 | smoke test fail（決定論性） | hashStringToHue 維持 |

## ESLint custom rule 設計（参考）

```ts
// .eslintrc/rules/no-localstorage-in-primitives.ts (placeholder)
// apps/web/src/components/ui/ 配下で localStorage / sessionStorage の参照を warn
```
