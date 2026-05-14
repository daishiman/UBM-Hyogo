# Phase 12: ドキュメント更新

## 必須タスク（6 タスク）

| Task | 名称 | 成果物 |
|------|------|--------|
| 12-1 | 実装ガイド作成（Part 1 + Part 2） | `outputs/phase-12/implementation-guide.md` |
| 12-2 | システム仕様書更新サマリ（Step 1-A〜1-C + 条件付き Step 2） | `outputs/phase-12/system-spec-update-summary.md` |
| 12-3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| 12-4 | 未タスク検出レポート（0 件でも必須） | `outputs/phase-12/unassigned-task-detection.md` |
| 12-5 | スキルフィードバックレポート（改善点なしでも必須） | `outputs/phase-12/skill-feedback-report.md` |
| 12-6 | Phase 12 task-spec 準拠チェック | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Task 12-1: 実装ガイド構造

### Part 1（中学生レベル）

- 例え話: 「テストの coverage matrix は、検査表のようなもの。19 個の窓があるビルで、それぞれの窓に対して、ガラスが割れていないか・鍵がかかっているか・電気がついているか・人が出入りできるかを 1 行ずつ書いた表」
- 目的: なぜ matrix が必要か → CI が green でも何を見ているかを人間が把握するため

### Part 2（技術者レベル）

- matrix の構造（19 行 × 5 軸 + visual / spec）
- Playwright API 対応マップ
- task-18 CI gate との接続
- 既存 4 baseline / 残り 15 routes の関係
- 視覚証跡: `UI/UX変更なしのため Phase 11 スクリーンショット不要`

## Task 12-2: システム仕様書更新

| Step | 必須 | 内容 |
|------|------|------|
| 1-A | ✓ | `ui-prototype-alignment-mvp-recovery/SCOPE.md` の関連リンク table に `SMOKE-COVERAGE-MATRIX.md` を追加。`docs/30-workflows/LOGS.md` に task-25 完了を追記 |
| 1-B | ✓ | 親 workflow `EXECUTION-ORDER.md` の task-25 行を `spec_created` に更新 |
| 1-C | ✓ | 関連タスク（task-18 / task-23 / task-24 / task-26）テーブルにて本タスクのステータスを current facts に反映 |
| Step 2 | **N/A** | 新規インターフェース / 型 / API 追加なし（docs-only） |

## Task 12-3: documentation-changelog

各 Step（1-A / 1-B / 1-C / Step 2）の結果を「該当 / 該当なし」も含めて個別に明記する。

## Task 12-4: 未タスク検出（0 件でも出力必須）

Phase 10 で識別済み 3 件を current として登録:

| ID | 内容 | 関連タスク差分確認 |
|----|------|---------------------|
| U1 | 残り 15 routes の visual baseline 採取 | task-18 §2.2 で MVP 後と明記済み（新規） |
| U2 | `error.tsx` の Playwright observable trigger / fixture 整備 | 既存タスクなし（新規） |
| U3 | `loading.tsx` の network throttle 観測戦略 standardize | 既存タスクなし（新規） |

baseline: 0 件（過去タスク由来の積み残しなし）

## Task 12-5: skill-feedback

- テンプレート改善: docs-only / verify_existing / NON_VISUAL の 3 軸タスクで Phase 5 が「diff check」になる場合、phase-template 側に "docs-only Phase 5" 専用テンプレ候補がない（要検討）
- ワークフロー改善: matrix の T1〜T11 lint を `scripts/verify-smoke-coverage-matrix.js` として工程化する案
- ドキュメント改善: SMOKE-COVERAGE-MATRIX.md を `references/` に格上げして横断 SSOT 化する案

## Task 12-6: phase12 compliance check

- 6 成果物の存在確認
- `artifacts.json` / `outputs/artifacts.json` parity（本タスクでは `outputs/artifacts.json` は生成しないため、root `artifacts.json` のみで完結）
- mirror parity: N/A（`.claude/skills/` への変更なし）
- root evidence として `phase12-task-spec-compliance-check.md` を残す
