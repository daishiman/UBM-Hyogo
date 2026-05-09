# Phase 10 — UT-GOV-001 系 drift check 再実行

## 状態

**EXECUTION_DEFERRED_TO_PHASE_13**（after snapshots は Phase 13 PUT 後に取得）。本 Phase では before snapshots に対する dry-run と、Phase 1 で発見した drift findings の再確認を行う。

## 10.1 before snapshots に対する dry-run

```
=== dev (pre-PUT) ===
OK: required_pull_request_reviews=null
DRIFT: lock_branch
DRIFT: enforce_admins
DRIFT: required_linear_history
OK: required_conversation_resolution=true
MISSING: audit-correlation-verify / verify (expected pre-PUT)

=== main (pre-PUT) ===
DRIFT: required_pull_request_reviews
DRIFT: lock_branch
DRIFT: enforce_admins
DRIFT: required_linear_history
OK: required_conversation_resolution=true
MISSING: audit-correlation-verify / verify (expected pre-PUT)
```

## 10.2 jq 仕様の落とし穴

仕様書 phase-04.md §4.2 の grep は `(.lock_branch.enabled // .lock_branch) == false` の形式だが、`//` 演算子は jq では **null/false に対して右辺評価**するため、`.lock_branch.enabled == false` の場合 `false // .lock_branch` → `.lock_branch`（object 全体）が返り `== false` 比較が常に false（DRIFT）と判定される。

`lock_branch` が実値 `false` であっても上記スクリプトでは DRIFT 扱いになる。Phase 13 で本グレップを使う場合は次の補正版を使用する:

```bash
jq -e '
  (if (.lock_branch | type) == "object" then .lock_branch.enabled else .lock_branch end) == false
' "$snap"
```

または明示的に:

```bash
jq -e '.lock_branch.enabled == false or .lock_branch == false' "$snap"
```

## 10.3 drift findings サマリ（Phase 1 と整合）

| 不変条件 | dev | main | 本タスクで修正 |
| --- | --- | --- | --- |
| `required_pull_request_reviews=null` | ✅ | ❌（object） | スコープ外 |
| `enforce_admins=true` | ❌（false） | ❌（false） | スコープ外 |
| `required_linear_history=true` | ❌（false） | ❌（false） | スコープ外 |
| `lock_branch=false` | ✅（jq 落とし穴除く） | ✅ | — |
| `required_conversation_resolution=true` | ✅ | ✅ | — |
| contexts に `audit-correlation-verify / verify` | 未追加 | 未追加 | **本タスクで追加（Phase 13）** |

## 10.4 drift 発生時の対応

- 不変条件 drift（`enforce_admins` / `required_linear_history` / main の reviews）は本タスクの責務外。Phase 13 ユーザー gate で:
  - (a) drift 受容のまま contexts のみ追加（推奨。本タスク純粋実行）
  - (b) drift 修正を別 issue / 別 PR で扱う（推奨）
  - (c) 本 PR に drift 修正同梱（CLAUDE.md governance との整合確認が必要）
- 期待差分（contexts 追加）が無い／既存 contexts 欠落の場合は Phase 5 / 6 のロールバック手順を実行しエスカレーション。

## DoD

- [x] before snapshot に対する dry-run grep 実行ログ記録
- [x] jq 落とし穴の補正版を文書化
- [x] drift findings を Phase 1 と整合的に再掲
- [ ] after snapshots 6 項目 OK 判定 → Phase 13
