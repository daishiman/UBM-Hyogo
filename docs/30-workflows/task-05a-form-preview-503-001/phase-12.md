# Phase 12: ドキュメント更新 — task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 12 / 13 |
| wave | 05a-followup |
| mode | sequential |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

`/public/form-preview` 503 root cause と修復手順、運用 runbook、関連タスクを strict 7 files に分割して記録する。Phase 12 task-spec compliance check を root evidence として残す。

## 成果物（strict 7 files 必須）

| # | ファイル | 内容概要 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 index / strict 7 files inventory |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術詳細（schema_versions / UBM-5500 / env / runbook） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A 完了タスク記録 / Step 1-B 実装状況 / Step 1-C 関連タスク / Step 2 新規 interface 追加なし判定 |
| 4 | `outputs/phase-12/documentation-changelog.md` | 全 Step（1-A/1-B/1-C/2/3）結果を個別明記 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | **0 件でも出力必須**。検出ソース列挙 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | **改善点なしでも出力必須** |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | root evidence。CONST_005 / CONST_007 を含む compliance チェック |

## 実行タスク

1. strict 7 files すべての雛形を作成し、実装サイクルで埋める箇所を明示する。
2. `implementation-guide.md` は Part 1 / Part 2 の見出しを必ず両方持つ。
3. 未タスク化検出の検出ソース（artifacts.json / 他タスクの outputs / GitHub Issue / wrangler tail ログ）を列挙する。

## 参照資料

- `index.md`
- `outputs/phase-10/main.md`
- `outputs/phase-11/manual-test-result.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `packages/shared/src/errors.ts`

## 統合テスト連携

- 上流: Phase 11 evidence
- 下流: Phase 13 PR 作成

## 多角的チェック観点

- 不変条件 #1 / #5 / #14
- Part 1 が中学生レベル（専門用語回避）
- strict 7 files の parity チェック

## サブタスク管理

- [ ] main.md（Phase 12 index）
- [ ] implementation-guide.md（Part 1 + Part 2）
- [ ] system-spec-update-summary.md
- [ ] documentation-changelog.md
- [ ] unassigned-task-detection.md
- [ ] skill-feedback-report.md
- [ ] phase12-task-spec-compliance-check.md

## 完了条件

- strict 7 files すべて実在
- AC-5 / AC-6 充足

## タスク100%実行確認

- [ ] Part 1 が中学生レベルの例え話で書かれている
- [ ] Part 2 に schema_versions / UBM-5500 mapping / env vars / runbook が記載
- [ ] 0 件成果物（unassigned / feedback）も出力されている

## 次 Phase への引き渡し

Phase 13 へ、PR title 候補と関連 Issue #388（CLOSED, `Refs #388`）を渡す。
