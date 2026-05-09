# Phase 13: PR作成

> **CONST_004 / CONST_005 準拠の実装仕様書**。spec 段階ではアクションを起こさず、G1-G4 multi-stage approval gate と PR 本文テンプレを確定する。

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-13/phase-13.md` |
| 状態 | blocked_pending_user_approval |
| ブランチ | `docs/issue-572-attendance-provider-production-runtime-smoke` |
| 親 Issue | #572（CLOSED） |

## 目的
commit / push / PR 作成手順を定義する（実行はユーザー承認後）。G1（typecheck/lint/test/build PASS）/ G2（grep-gate redact zero-hit）/ G3（production smoke evidence + 親 Issue #371 昇格 commit）/ G4（user 明示承認）を満たした後に `gh pr create` を実行する。

## 実行タスク
詳細は `outputs/phase-13/phase-13.md` を正本とする。

## 参照資料
- `outputs/phase-13/phase-13.md`
- `outputs/phase-11/production-smoke-summary.md`
- `outputs/phase-12/implementation-guide.md`

## 成果物
- `outputs/phase-13/phase-13.md`

## 完了条件
- Phase 13 placeholder が `blocked_pending_user_approval` で存在し、G1-G4 すべて満たした後に PR 作成完了で本タスク終了。
- PR title: `docs(issue-572): production runtime smoke spec for attendanceProvider DI completion`
- PR labels: `priority:high` / `type:workflow` / `scale:small`
- PR body に `Refs: #572` と issue-371 完了化 commit hash を含む。
