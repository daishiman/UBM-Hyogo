# 手動テスト結果サマリ

| 項目 | 値 |
|------|------|
| 証跡の主ソース | `gh api` JSON (dev-/main-protection-{before,after}.json.md) |
| スクリーンショット非作成理由 | UI/UX 変更なし。branch protection 設定のみの governance 変更 |
| 状態 | `completed` (runtime mutation executed under user approval) |
| 実施日時 | 2026-05-17 21:49 JST (UTC 2026-05-17T12:49:39Z) |
| 承認 marker | `outputs/phase-13/user-approval-task-761-visual-full-required-status-check-20260517T124939Z.md` |

## 1. Phase 5 実装結果

| step | 内容 | 結果 |
|------|------|------|
| 1 | dev before GET | OK (contexts=5: ci, Validate Build, coverage-gate, lighthouse-ci, e2e-tests-coverage-gate) |
| 2 | main before GET | OK (同上) |
| 3 | user 承認確認 | OK (AskUserQuestion 単一選択「承認する（dev → main の順で実行）」) |
| 4-7 | dev POST + after GET + diff | OK (contexts 3 件追加のみ、不変条件保持) |
| 8-11 | main POST + after GET + diff | OK (同上) |

## 2. Phase 6 テスト拡充結果

| テスト | 結果 |
|--------|------|
| rollback dry-run | DELETE payload は `rollback-put-payload.md` で確定済（必要時に実行） |
| drift 検知 grep | `jq -r '.required_status_checks.contexts[]'` で 8 件確認 |
| 重複追加防止 | POST API は set 動作で副作用なし。再実行しても 8 件のまま |
| governance 不変条件 7 項目 | 全保持（後述 §3） |

## 3. Phase 9 QA 結果

| 項目 | 結果 |
|------|------|
| PUT payload schema 妥当性 | OK (`{"contexts":[...]}` 形式、`/branches/{b}/protection/required_status_checks/contexts` POST) |
| drift 0 件 (added=3, removed=0) | OK (dev/main 共に diff は 3 件追加のみ) |
| governance 不変条件 | `required_pull_request_reviews=null` / `enforce_admins=true` / `lock_branch=false` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history=true` / `required_conversation_resolution=true` 全保持 |
| evidence ファイル存在 | dev/main × before/after の 4 件 + user-approval-marker / manual-test-result / rollback-put-payload / pull-request-trigger-natural-firing / ui-sanity-visual-review = 9 件 |

## 4. 最終 contexts

| branch | before count | after count | added |
|--------|-------------|------------|-------|
| dev | 5 | 8 | `visual-full (desktop)`, `visual-full (tablet)`, `visual-full (mobile)` |
| main | 5 | 8 | 同上 |

## 5. 仕様書からの逸脱事項（fresh evidence で上書き）

仕様書例示の `visual-full (...)` 形式ではなく、check-runs API で
実測した `visual-full (...)` 形式（workflow prefix なし）で登録した。これは GitHub の
check run 命名仕様および既存 5 contexts と整合する。

## 6. 残課題

なし。runtime mutation は完了。本 evidence と承認 marker をもって task-761 の Phase 5/6/9/11
が closed。
