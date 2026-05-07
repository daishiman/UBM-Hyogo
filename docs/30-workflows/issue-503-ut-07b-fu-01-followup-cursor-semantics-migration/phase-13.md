# Phase 13: PR作成

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-13/phase-13.md` |
| 状態 | blocked_pending_user_approval |

## 目的
commit / push / PR 作成手順を定義する（実行はユーザー承認後）。G1-G4 multi-stage approval gate を満たした後に `gh pr create` を実行する。

## 実行タスク
詳細は `outputs/phase-13/phase-13.md` を正本とする。

## 参照資料
- `outputs/phase-13/phase-13.md`

## 成果物
- `outputs/phase-13/phase-13.md`

## 完了条件
- Phase 13 placeholder が `blocked_pending_user_approval` で存在し、G1（typecheck/lint PASS）/ G2（vitest PASS）/ G3（staging runtime evidence + 採用判断レコード）/ G4（user 明示承認）すべて満たした後に PR 作成完了で本タスク終了。
