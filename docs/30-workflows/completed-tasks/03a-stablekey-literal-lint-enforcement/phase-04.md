# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-05-01 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

03a AC-7「stableKey リテラル直書き禁止」を **規約のみ → lint 静的検査で fully enforced** へ昇格させるための test 戦略を確定する。
ESLint custom rule（または ts-morph script）の単体・統合・回帰検証の責務を分離し、Phase 5 の実装ランブック・Phase 7 のトレース表に渡す入力を作る。

## test 戦略概要

本タスクは **NON_VISUAL implementation** であり、すべての成果物は自動 test で検証可能。次の 4 層で構成する。

| 層 | 対象 | 実行コマンド | 主な検証観点 |
| --- | --- | --- | --- |
| L1: ユニットテスト | rule 本体（AST マッチャー / allow-list 判定 / 例外パス判定） | `pnpm --filter <lint-package> test` | 入力 source → 期待 report の一致 |
| L2: フィクスチャ snapshot | 違反例 / 許可例の固定 source ファイル | `pnpm --filter <lint-package> test -- -u` で更新 | rule 出力の安定性 |
| L3: monorepo 統合テスト | リポジトリ全体に rule を適用 | `pnpm lint` | 既存 03a 実装が suppression 無しで PASS |
| L4: 回帰テスト | dry-run PR（故意の違反コード追加） | CI workflow で実行 | 違反 PR が fail する |

## ユニットテスト設計（L1）

| # | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| U-1 | 許可モジュール内の stableKey リテラル | `packages/shared/src/zod/field.ts` 由来 source | PASS（report 0 件） |
| U-2 | アプリケーションコード内のリテラル直書き | `apps/api/src/foo.ts` 由来 source で `'q_full_name'` 等 | FAIL（report 1 件以上、message id `no-stablekey-literal`） |
| U-3 | テストファイル内のリテラル | `apps/api/src/foo.test.ts` | PASS（例外パス） |
| U-4 | フィクスチャ内のリテラル | `**/__fixtures__/**` | PASS（例外パス） |
| U-5 | migration seed 内のリテラル | `apps/api/migrations/seed/**` | PASS（例外パス） |
| U-6 | 許可モジュールから import した stableKey 定数を使用するアプリコード | `import { Q_FULL_NAME } from '@ubm-hyogo/shared/zod/field'` | PASS（リテラルではない） |
| U-7 | TemplateLiteral / 計算プロパティの直書き | `` `q_full_name` `` / `obj['q_full_name']` | FAIL（AST 節を網羅） |
| U-8 | 似て非なる literal（stableKey パターン外） | `'foo_bar'` で stableKey 命名規則に一致しない | PASS（false positive 抑止） |

## フィクスチャ（L2）

| 配置 | 用途 |
| --- | --- |
| `__fixtures__/stablekey-literal-violation.ts` | 違反例（U-2 / U-7 ベース） |
| `__fixtures__/stablekey-literal-allowed.ts` | 許可モジュール由来 import 経路の正例（U-6 ベース） |
| `__fixtures__/stablekey-literal-edge.ts` | 命名規則衝突 / TemplateLiteral 等の境界例 |

フィクスチャは **rule 実装スクリプトとは独立** に配置し、内容は Phase 5 ランブックで定義する手順に従って Phase 11 で作成する。

## カバレッジ目標

| 項目 | 目標 |
| --- | --- |
| line coverage（rule 本体） | 90%+ |
| branch coverage（rule 本体、AST 種別 + allow-list 判定 + 例外パス判定） | 80%+ |
| ユニットテストケース数 | 8 件以上（U-1〜U-8 を最低限満たす） |
| フィクスチャ数 | 3 件以上 |

## テスト命名規約

- `describe('no-stablekey-literal', ...)` で rule 名を rootBlock 化
- `it('allows stableKey literal in source-of-truth module', ...)` 形式の英文 + 動詞始まり
- フィクスチャファイル名は `stablekey-literal-<role>.ts`（role: violation / allowed / edge）

## evidence-checklist（NON_VISUAL）

| # | 種別 | 配置先 | 取得方法 |
| --- | --- | --- | --- |
| 1 | ユニットテスト実行ログ | `outputs/phase-11/evidence/unit-test.log` | `pnpm --filter <lint-package> test` 標準出力 |
| 2 | カバレッジレポート | `outputs/phase-11/evidence/coverage-summary.txt` | vitest / jest coverage summary |
| 3 | monorepo lint 実行ログ | `outputs/phase-11/evidence/lint-monorepo.log` | `pnpm lint` |
| 4 | 違反 dry-run 結果 | `outputs/phase-11/evidence/dry-run-violation.log` | 故意違反 PR の lint 出力 |

すべて plain text のため secret hygiene grep（`token|cookie|authorization|bearer`）で 0 hit を確認する。

## 実行タスク

- [ ] `outputs/phase-04/main.md` に test 戦略サマリ
- [ ] `evidence-checklist.md` を NON_VISUAL 4 行で配置
- [ ] ユニットテストケース表（U-1〜U-8）を確定
- [ ] フィクスチャ 3 種の役割と配置先を確定
- [ ] カバレッジ目標と命名規約を明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-03a-stablekey-literal-lint-001.md | 元仕様 / AC |
| 必須 | docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md | AC-7 元文脈 |
| 推奨 | packages/shared/src/zod/field.ts | allow-list 正本（候補） |
| 推奨 | packages/integrations/google/src/forms/mapper.ts | allow-list 正本（候補） |

## 完了条件

- [ ] ユニットテスト 8 ケース表配置
- [ ] フィクスチャ 3 種配置先確定
- [ ] カバレッジ目標明示（branch 80%+）
- [ ] evidence-checklist NON_VISUAL 4 行配置

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 4 を completed

## 次 Phase

- 次: Phase 5 (実装ランブック)
- 引き継ぎ: 8 ユニットケース、3 フィクスチャ、カバレッジ目標、evidence-checklist

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-04/main.md` | テスト戦略サマリ |
| `outputs/phase-04/test-matrix.md` | RuleTester / fixture / monorepo lint matrix |

## 統合テスト連携

Phase 7 が本 Phase の L1〜L4 matrix を受け取り、`pnpm lint` clean PASS と intentional violation FAIL の両方を統合確認する。
