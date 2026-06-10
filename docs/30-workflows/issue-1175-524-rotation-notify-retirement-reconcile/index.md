# issue #1175 — issue #524 の CF rotation reminder 通知統合行の撤廃整合（実装仕様書）

> **実装区分: ドキュメントのみ**（CONST_004 例外該当）
> 成果物は GitHub issue #524 本文編集＋ローカルミラー `docs/30-workflows/issues/issue-524.md` 更新のみ。
> コード surface（`.ts/.tsx` / API / D1 / workflow YAML / scripts）への変更を一切伴わない（rotation reminder workflow は親タスクで削除済み）。
> 判定根拠の詳細は [outputs/phase-1/phase-1.md](outputs/phase-1/phase-1.md) §実装区分判定を参照。

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | `TASK-OPS-ISSUE-524-ROTATION-NOTIFY-RETIREMENT-RECONCILE-001` |
| ワークフロー名 | issue-1175-524-rotation-notify-retirement-reconcile |
| 起点 issue | #1175（**CLOSED** のまま・再オープンしない） |
| 整合対象 issue | #524（OPEN・本タスクで本文を current facts へ整合） |
| 親タスク | `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/` |
| 分類 | 整理（Issue hygiene / Governance reconciliation） |
| 実装区分 | ドキュメントのみ（CONST_004 例外） |
| implementation_mode | `completed_docs_reconcile`（#524 本文編集・ミラー整合済み） |
| visualEvidence | NON_VISUAL |
| 優先度 | 低（runtime blocker なし） |
| ステータス | implemented_local_evidence_captured |
| 作成日 | 2026-06-10 |

## このタスクの結論（調査サマリー）

issue #1175 は **CLOSED** だが、その実作業（issue #524 本文の整合）は未実施だった。
2026-06-10 の automation-30 改善サイクルで #524 本文とローカルミラーを current facts へ整合した。

| 確認項目 | 状態 | 根拠 |
|----------|------|------|
| 親タスクのコード削除（`cf-token-rotation-reminder.yml` / `check-cf-rotation-reminder.sh`） | ✅ 完了済み | ファイル不在を確認 |
| rotation runbook の tombstone 化 | ✅ 完了済み | `RETIRED: 2026-06-08` マーカー確認 |
| **issue #524 本文の整合** | ✅ **完了** | #524 は OPEN 維持・`updatedAt: 2026-06-10T03:58:10Z`・#407 行と dangling 2 パス 0 件 |
| ローカルミラー `docs/30-workflows/issues/issue-524.md` の整合 | ✅ **完了** | `updated_date: 2026-06-10`・#407 行と dangling 2 パス 0 件 |

→ **タスクは実施済み**。本仕様書は #1175（closed）のライフサイクル整合作業を、closed のまま formalize し、#524 の current facts 整合まで同一 cycle で完了した。

## ゴール（DoD 概要）

1. GitHub issue #524 本文から **CF rotation reminder 行（Issue #407）** を削除。
2. #524「参照」節から dangling 2 パス（`cf-token-rotation-reminder.yml` / `cf-token-rotation-runbook.md`）を除去。
3. #524 冒頭に rotation 撤廃の経緯注記を追加し、通知統合スコープを 2 件（post-release dashboard / analytics export）に縮小。
4. ローカルミラー `docs/30-workflows/issues/issue-524.md` を上記 1〜3 と同一内容へ整合（current-code 整合の追加要件）。

詳細は [outputs/phase-12/implementation-guide.md](outputs/phase-12/implementation-guide.md) を参照。

## Phase 構成

| Phase | 名称 | status | 成果物 |
|-------|------|--------|--------|
| 1 | 要件定義 | completed | [phase-1.md](outputs/phase-1/phase-1.md) |
| 2 | 設計 | completed | [phase-2.md](outputs/phase-2/phase-2.md) |
| 3 | 設計レビュー | completed | [phase-3.md](outputs/phase-3/phase-3.md) |
| 4 | テスト作成（検証手順設計） | completed | [phase-4.md](outputs/phase-4/phase-4.md) |
| 5 | 実装（編集手順） | completed | [phase-5.md](outputs/phase-5/phase-5.md) |
| 6 | テスト拡充（回帰 grep） | completed | [phase-6.md](outputs/phase-6/phase-6.md) |
| 7 | カバレッジ確認 | completed | [phase-7.md](outputs/phase-7/phase-7.md) |
| 8 | リファクタリング | completed | [phase-8.md](outputs/phase-8/phase-8.md) |
| 9 | 品質保証 | completed | [phase-9.md](outputs/phase-9/phase-9.md) |
| 10 | 最終レビュー | completed | [phase-10.md](outputs/phase-10/phase-10.md) |
| 11 | 手動テスト（NON_VISUAL） | completed | [phase-11.md](outputs/phase-11/phase-11.md) |
| 12 | ドキュメント更新 | completed | [phase-12.md](outputs/phase-12/phase-12.md) |
| 13 | PR作成 | pending_user_approval | [phase-13.md](outputs/phase-13/phase-13.md) |

> Phase 1-12 の status `completed` は「仕様書と docs-only 整合作業が完了した」ことを示す。
> commit / PR はユーザー指示まで実行しない。

## 不変条件

1. issue #1175 は **closed のまま**にする（再オープンしない）。本仕様書は closed issue のライフサイクル整合を formalize する目的。
2. #524 の残り 2 件（post-release dashboard / analytics export）の **スコープ・実装には触れない**（#524 本体スコープ）。
3. event-based revocation 通知の新規実装は YAGNI として本タスクに含めない。
4. rotation 撤廃の経緯は親タスクを正本としてリンク誘導し、#524 側に重複記述しすぎない。
5. コード surface（`.ts/.tsx` / API / D1 / workflow YAML / scripts）への変更を行わない。
