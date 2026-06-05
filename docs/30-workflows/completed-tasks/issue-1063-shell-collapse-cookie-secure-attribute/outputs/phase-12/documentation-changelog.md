---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 12
作成日: 2026-06-03
task_id: issue-1063-shell-collapse-cookie-secure-attribute
issue: 1063
issue_state: CLOSED
---

# Documentation Changelog

## workflow-local 同期

| 対象 | 内容 | 状態 |
|------|------|------|
| `index.md` | task root（実装区分 / 調査サマリ / スコープ / 不変条件 / Phase 一覧） | 作成 |
| `artifacts.json` / `outputs/artifacts.json` | root metadata（`implemented_local_evidence_captured` / NON_VISUAL / gates / phases）byte parity | 更新（byte 一致） |
| `phase-1..13-*.md` | Phase 1-13 実装仕様 | 作成（13 ファイル） |
| `outputs/phase-11/manual-test-result.md` | NON_VISUAL evidence | 作成 |
| `outputs/phase-12/*.md` | strict 7 outputs | 作成 |
| `outputs/phase-13/*.md` | PR 関連（pending_user_approval） | 作成 |

## global skill sync

| 対象 | 判定 | 内容 |
|------|------|------|
| Step 1-A 完了タスク記録 | 記録 | 本タスク = implemented_local_evidence_captured。commit / PR は user-gated |
| Step 1-B 実装状況 | 記録 | `implemented_local_evidence_captured` / `local_code_and_focused_test_passed` |
| Step 1-C 関連タスク | 記録 | issue-1024（親・CLOSED 実装済み）/ #1065（別関心） |
| Step 2 system spec | N/A | 公開インターフェース/型/定数/API の追加・変更なし（system-spec-update-summary.md 参照） |
| aiworkflow-requirements quick-reference / resource-map / task-workflow-active / inventory / changelog / LOGS | 反映 | 同一 wave sync 済み |
| task-specification-creator template | 変更なし | テンプレート改変は不要 |

## 個別記録

- 本タスクは新規 workflow root と apps/web 2 ファイルの実装差分を含む。既存 workflow の archive / delete / completed-tasks 移動は**行わない**（commit / PR 後の close-out 境界）。
- issue #1063 は CLOSED 維持（reopen しない）。commit・PR・Issue 状態変更は本サイクルで行わない。
