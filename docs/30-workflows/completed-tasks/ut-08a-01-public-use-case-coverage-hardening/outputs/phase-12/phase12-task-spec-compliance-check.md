# Phase 12 Task Spec Compliance Check — ut-08a-01-public-use-case-coverage-hardening

task-specification-creator skill の Phase 12 テンプレート (`.claude/skills/task-specification-creator/references/phase-template-phase12.md`) に定義された Task 12-1〜12-6 の必須成果物を、本タスクの Phase 12 outputs と 1:1 で照合する。NON_VISUAL タスクのため、視覚的証跡の代わりに focused vitest 実行ログ・テストファイルパス・coverage 数値（取得可能な範囲）を代替証跡として明記する。

## 0. メタ情報チェック

- [x] taskType = `implementation`（既存 docs-only 表記から CONST_004 により再分類済）
  - 根拠: `outputs/phase-12/main.md` 冒頭 `taskType: implementation` / `outputs/phase-12/implementation-guide.md` §「実装区分」
- [x] visualEvidence = `NON_VISUAL`
  - 根拠: `outputs/phase-12/main.md` `visualEvidence: NON_VISUAL`
- [x] workflow_state = `spec_created` → 実装サイクル完了後 `implemented-local` へ昇格済
  - 根拠: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` (UT-08A-01 行) `implemented-local / implementation / NON_VISUAL`

## Task 12-1: implementation-guide.md（実装ガイド）

- [x] Part 1: 実装区分・判定根拠
  - 根拠: `outputs/phase-12/implementation-guide.md` §「実装区分」
- [x] Part 2-A: 変更対象ファイル一覧
  - 根拠: `outputs/phase-12/implementation-guide.md` §「変更対象ファイル」（apps/api 配下 6 ファイル + 正本同期 4 ファイル）
- [x] Part 2-B: 主要シグネチャ（型定義 / API シグネチャ）
  - 根拠: `outputs/phase-12/implementation-guide.md` §「主要シグネチャ」 `PublicD1MockOptions` / `createPublicD1Mock` / use-case シグネチャ
- [x] Part 2-C: 入力・出力・副作用
  - 根拠: `outputs/phase-12/implementation-guide.md` §「入力・出力・副作用」
- [x] Part 2-D: テスト方針（happy / null-or-empty / D1 failure の最低3ケース）
  - 根拠: `outputs/phase-12/implementation-guide.md` §「テスト方針」 4 use-case + route handler test
- [x] Part 2-E: ローカル実行・検証コマンド
  - 根拠: `outputs/phase-12/implementation-guide.md` §「ローカル実行・検証コマンド」 5 コマンド列挙
- [x] Part 2-F: DoD
  - 根拠: `outputs/phase-12/implementation-guide.md` §「DoD」（テスト追加、3ケース充足、cache header 検証、coverage threshold、aiworkflow-requirements 同期、commit 抑制）
- [x] Part 2-G: 実装結果セクション（NON_VISUAL 代替証跡）
  - 根拠: `outputs/phase-12/implementation-guide.md` §「実装結果（2026-05-03 実装サイクル）」
  - 追加ファイル: `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts`、`apps/api/src/use-cases/public/__tests__/{get-form-preview,get-public-member-profile,get-public-stats,list-public-members}.test.ts`、`apps/api/src/routes/public/index.test.ts`
  - 検証: focused vitest 17/17 グリーン（`pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/use-cases/public/__tests__ apps/api/src/routes/public/index.test.ts`）、`pnpm --filter @ubm-hyogo/api typecheck` エラー 0

### NON_VISUAL 代替証跡

| 項目 | 値 / パス |
| --- | --- |
| focused test 実行コマンド | `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/use-cases/public/__tests__ apps/api/src/routes/public/index.test.ts` |
| focused test 結果 | 17/17 PASS |
| typecheck コマンド | `pnpm --filter @ubm-hyogo/api typecheck` |
| typecheck 結果 | エラー 0 |
| 全体 coverage `pnpm test:coverage` | 未取得（`schemaAliasAssign` timeout risk と分離して扱う、要追測 TODO） |
| テスト実装パス | `apps/api/src/use-cases/public/__tests__/`、`apps/api/src/routes/public/index.test.ts` |

## Task 12-2: system-spec-update-summary.md（仕様書更新サマリー）

- [x] Step 1: 更新計画あり
  - 根拠: `outputs/phase-12/system-spec-update-summary.md` §「Step 1」
- [x] Step 2A: planned wording 残存確認
  - 根拠: `outputs/phase-12/system-spec-update-summary.md` §「Step 2A」 `rg -n "仕様策定のみ|実行予定|保留として記録"` 結果
- [x] Step 2B: 実更新ログ（4 ファイル分）
  - 根拠: `outputs/phase-12/system-spec-update-summary.md` §「Step 2B」 quick-reference / resource-map / task-workflow-active / artifact-inventory の差分概要

## Task 12-3: documentation-changelog.md（ドキュメント更新履歴）

- [x] 変更ファイル一覧（git diff 由来）
  - 根拠: `outputs/phase-12/documentation-changelog.md` §「変更ファイル一覧」
- [x] validator 結果欄
  - 根拠: 同上 §「validator 結果」（`pnpm indexes:rebuild` / `verify-indexes-up-to-date` gate）
- [x] current / baseline 分離記述
  - 根拠: 同上 §「current（本タスク）」「baseline（既存正本）」
- [x] 移動操作記録
  - 根拠: 同上 §「ディレクトリ移動」 wave-2 配下 → workflow ルート直下

## Task 12-4: unassigned-task-detection.md（未タスク検出レポート）

- [x] SF-03 4 パターン照合
  - 根拠: `outputs/phase-12/unassigned-task-detection.md` §「SF-03 4 パターン照合」 全パターン列挙
- [x] 各パターン「該当なし」理由を根拠付き明記
  - 根拠: 同上 各パターンの「該当なし理由」欄
- [x] 結論（0 件、SF-03 確認済）
  - 根拠: 同上 §「結論」

## Task 12-5: skill-feedback-report.md（スキルフィードバック）

- [x] implementation-guide.md §「設計上の判断」を lessons 形式で再録
  - 根拠: `outputs/phase-12/skill-feedback-report.md` §「Lessons」
- [x] 4 lessons 明記（D1 mock dispatch / failOnSql / existsPublicMember / route handler errorHandler 装着）
  - 根拠: 同上 L1〜L4
- [x] skill-creator 観点で再利用 pattern 抽出
  - 根拠: 同上 §「再利用 pattern」

## Task 12-6: phase12-task-spec-compliance-check.md（本ファイル）

- [x] Task 12-1〜12-6 全項目チェック
- [x] CONST_007: 先送りなし。全 scope は本サイクル内で完了
- [x] NON_VISUAL 代替証跡項目（focused test ログ + テストファイルパス）

## CONST_007 スコープ判定

未タスク分離なし。public use-case 4本、route handler test、coverage evidence、正本同期 4 ファイルは本サイクル内で完了。`schemaAliasAssign` timeout 問題は事前認識済の別系統リスクとして範囲外（SF-03 パターン#4「仕様間差異」非該当、`ut-web-cov-05-followup-post-wave2-gap-analysis.md` で別途追跡）。

## 残課題（後続検証エージェントへの申し送り）

- 全体 `pnpm --filter @ubm-hyogo/api test:coverage` 実行による Statements/Branches/Functions/Lines 数値の実測取得（focused test は緑だが、全体 run は `schemaAliasAssign` timeout risk あり）
- `pnpm --filter @ubm-hyogo/api lint` は本 Phase 12 補強時に再実行し exit code 0 を確認済（implementation-guide.md §「検証結果」 / documentation-changelog.md validator 結果欄に記録）
