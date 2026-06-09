# Phase 12 — ドキュメント同期サマリ

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1125-bulk-tag-result-staging-mutation-visual-baseline` |
| task_id | `TASK-ISSUE-1125-BULK-TAG-RESULT-STAGING-MUTATION-VISUAL-001` |
| workflow_state | `implemented_local_evidence_captured` / implementation / `VISUAL_ON_EXECUTION` / `staging_runtime_pending_user_gate` |
| GitHub issue | [#1125](https://github.com/daishiman/UBM-Hyogo/issues/1125)（CLOSED 維持） |
| 作成日 | 2026-06-06 |

## 1. このフェーズで完了したこと

本 wave は **タスク仕様書（Phase 1-13）と Phase 12 strict-7 出力の整備** に加え、新規 Playwright spec / seed・cleanup SQL / capture runner shell / runner shell test を実コードとして追加した。apps の本番ソース / apps/api の本体ソース / D1 schema table 定義 / Google Form は変更していない。runtime 証跡（認証付き staging baseline）の生成だけは staging D1 mutation を伴うため user 承認後に実施する。

issue #1125（= `task-issue-1036-followup-001` の残スコープ）を現行コードに最適化し、「手動 user-gated screenshot 取得」前提から「認証付き staging Playwright 基盤（issue-901 / issue-1077 系）+ staging D1 seed/cleanup + redact 基盤（issue-1081 / #1144）に乗せた **mutation interaction-gated authenticated staging spec + trap 付き seed/cleanup runner**」へと根本解を更新した。機能本体（`BulkActionBar` の tag bulk / `POST /admin/members/tags/bulk` / `bulkApplyMemberTagsByAdmin`）は既に dev に landed 済みである。

## 2. 実装スコープ（implemented_local_evidence_captured）

| 区分 | 内容 |
| --- | --- |
| 実装ファイル（追加済み） | Playwright spec 1 + seed SQL 1 + cleanup SQL 1 + capture runner shell 1 + runner shell test 1 + `smoke:test` wiring |
| 取得 baseline | `bulk-tag-result-all-success.png` / `bulk-tag-result-partial-failure.png`（result 2 状態） |
| partial-failure 主シナリオ | 退会済み member（`member_status.is_deleted=1`）による `skipped`（実 mutation + UI 操作で再現可能） |
| スコープ外（代替担保あり） | `notFound`（未登録 tag）の staging runtime 視覚網羅 = tag picker が登録済みのみ描画ゆえ UI 再現不可。親 local fixture + `BulkActionBar.spec.tsx` TC-BAB-TAG-03 が継続担保 |
| config 編集 | 不要（既存 `staging-visual-authenticated` project / admin storageState を再利用。`testDir` 自動登録） |
| 副作用境界 | synthetic prefix `e2e_test_issue1125_` 限定 + `trap ... EXIT` による確実な cleanup + staging guard（production 拒否） |

## 3. strict-7 出力一覧

| ファイル | 役割 |
| --- | --- |
| `main.md` | 本サマリ |
| `implementation-guide.md` | 中学生 / 開発者 2 部構成の実装ガイド + 視覚証跡 |
| `system-spec-update-summary.md` | Step 1-A/1-B/1-C / Step 2 の記録 |
| `documentation-changelog.md` | workflow-local / global skill 同期記録 |
| `unassigned-task-detection.md` | current / baseline 未タスク検出 |
| `skill-feedback-report.md` | skill 改善フィードバック |
| `phase12-task-spec-compliance-check.md` | canonical 9 見出しでの compliance 判定 |

## 4. runtime 境界

認証付き staging への seed → mutation 実行 → baseline 生成 / cleanup、staging deploy・push・PR は user-gated。本 wave で追加した実コードは local runner shell test まで検証する。GitHub issue #1125 は CLOSED 維持・reopen しない（recovered_from_unassigned / refs_only）。
