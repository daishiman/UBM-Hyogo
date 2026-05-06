# Phase 12: ドキュメント更新 — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-A-production-deploy-execution |
| phase | 12 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 状態 | spec_created（root `metadata.workflow_state` を `completed` に書き換えない） |

## 目的

Phase 11 で確定した evidence manifest の運用結果を踏まえ、システム仕様書（specs/15）と aiworkflow-requirements indexes、ドキュメント更新履歴、未タスク検出、スキルフィードバック、コンプライアンスチェックの **6 必須タスク** を `outputs/phase-12/` 配下に揃える。

本タスクは `metadata.workflow_state: spec_created` のため、Phase 12 close-out で root を `completed` / `verified` に昇格させない。`phases[].status` のみ `pending → completed` に更新する（13 phase ぶん）。実 production execution operation の完了は別運用（follow-up）で root を `verified` / `implementation_complete_pending_pr` に変更する。

## 6 必須タスク（Index）

| # | task | 出力 | 必須 | 由来 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル） | `outputs/phase-12/implementation-guide.md` | ✅ | phase-12-spec.md Task 1 |
| 2 | システム仕様書更新（spec 15 への反映項目） | `outputs/phase-12/system-spec-update-summary.md` | ✅ | Task 2（Step 1-A〜1-C / Step 2 / Step 1-H） |
| 3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` | ✅ | Task 3 |
| 4 | 未タスク検出（0 件でも出力必須） | `outputs/phase-12/unassigned-task-detection.md` | ✅ | Task 4 |
| 5 | スキルフィードバック（テンプレ / ワークフロー / ドキュメント の 3 観点固定） | `outputs/phase-12/skill-feedback-report.md` | ✅ | Task 5 |
| 6 | タスク仕様書コンプライアンスチェック | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ | Task 6 |

加えて Phase 12 のトップ index として `outputs/phase-12/main.md` を配置し、上記 6 ファイルの概要と各チェック項目をまとめる（合計 7 ファイル）。

## aiworkflow-requirements indexes 同時更新の差分項目

`spec_created` 状態でも以下を **same-wave sync** する:

| 対象 | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | production deploy 13 ステップの本タスク参照リンク（`docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/`）を追記 / D1 database 名 `ubm-hyogo-db-prod` を正本として明示 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | release tag フォーマット `vYYYYMMDD-HHMM` / 24h verification 取得タイミング（T+0 / T+1h / T+6h / T+24h）/ free-tier 閾値（Workers 5k / D1 reads 500k / D1 writes 10k）を spec へ昇格候補として列挙 |
| `.claude/skills/aiworkflow-requirements/indexes/` | `pnpm indexes:rebuild` の対象に本タスク outputs を追加（CI `verify-indexes-up-to-date` gate を pass させる） |
| `task-workflow-active.md` | 9c-fu wave のエントリに本タスクを追加 |

実 spec 反映は本タスクのスコープ外。`system-spec-update-summary.md` で **反映候補として列挙** することが Phase 12 の責務。

## 実行タスク（サブタスク）

| # | サブタスク | 完了条件 |
| --- | --- | --- |
| T1 | implementation-guide.md を Part 1 / Part 2 構成で作成 | Part 1 に日常生活の例え話 1 つ以上 / 専門用語表 5 行以上 / Part 2 に TypeScript 型定義 + コマンド例 |
| T2 | system-spec-update-summary.md を Step 1-A〜1-C / Step 2 / Step 1-H で構成 | 反映候補が spec 15 / aiworkflow indexes / task-workflow / legacy mapping ぶん網羅 |
| T3 | documentation-changelog.md（追加 / 変更 / 削除）を作成 | 09c-A タスク dir 配下 14 ファイル + index 同期対象が列挙 |
| T4 | unassigned-task-detection.md を 0 件でも出力 | 0 件の場合は明示文言、follow-up（FU-1〜FU-3）を unassigned ではなく execution-time として明記 |
| T5 | skill-feedback-report.md を 3 観点で構成 | テンプレ改善 / ワークフロー改善 / ドキュメント改善 各 1 件以上 or 「改善点なし」明記 |
| T6 | phase12-task-spec-compliance-check.md で不変条件 #5 / #6 / #14 + 仕様書 7 ファイル parity を判定 | 総合判定行 = `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（runtime evidence pending を明示）|
| T7 | outputs/phase-12/main.md を index として配置 | 6 必須タスクの概要 + 各チェック項目 + workflow_state = spec_created 維持 |

## 完了条件

- [ ] `outputs/phase-12/` に 7 ファイル（main.md + 6 必須タスク）が揃う
- [ ] root `artifacts.json.metadata.workflow_state` が `spec_created` のまま（書き換え禁止）
- [ ] `phases[].status` のみが `pending → completed` に更新される（実装記録）
- [ ] `phase12-task-spec-compliance-check.md` の総合判定行が `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
- [ ] `unassigned-task-detection.md` は 0 件でも明示記載
- [ ] `skill-feedback-report.md` は改善点なしでも明示記載
- [ ] secret 値が出力ファイルに含まれない

## タスク 100% 実行確認

- [ ] 6 必須タスクすべての出力が `outputs/phase-12/` に配置
- [ ] `metadata.workflow_state` の書き換え禁止ルールに違反していない
- [ ] aiworkflow-requirements indexes / spec 15 への反映候補が `system-spec-update-summary.md` に列挙
- [ ] runtime evidence pending と spec completeness が分離されている

## 次 Phase への引き渡し

Phase 13 へ次を渡す:

- 6 必須タスクの成果物 path（PR body に link）
- runtime evidence pending 境界（PR body の Test plan で blocked placeholder として表示）
- system-spec-update-summary.md（spec 15 への反映候補）
- unassigned-task-detection.md（follow-up execution の境界）
