# Phase 1: 要件定義

## 結論

07c は `member_attendance` の重複登録不可、削除済み会員の候補除外、attendance 操作の `audit_log` 残置を実装対象とする。採用方針は DB PRIMARY KEY/UNIQUE 相当の物理制約と API 409 応答の二重防御。

## AC 定量化

| AC | 定量基準 | 実装/検証 |
| --- | --- | --- |
| AC-1 | 同一 `(sessionId, memberId)` 2 回目 POST は 409、既存 row を返す | route/repository test |
| AC-2 | `member_status.is_deleted=1` は candidates 応答 0 件 | candidates test |
| AC-3 | attendance add/remove 成功ごとに audit 1 row | route test |
| AC-4 | audit payload は before/after JSON として復元可能 | route test |
| AC-5 | DELETE 成功でも `attendance.remove` を残す | route test |
| AC-6 | profile 直接編集 endpoint は追加しない | 実装範囲外維持 |
| AC-7 | DB 制約 + API gate の二重防御 | repository + route |

## 4 条件

価値性、実現性、整合性、運用性はいずれも PASS。新規 secret は不要で、対象は `apps/api` の attendance repository/route とテストに限定する。

## Handoff

Phase 2 へ、endpoint 3 件、audit action `attendance.add` / `attendance.remove`、actor は `requireAdmin` の `authUser` 由来とする方針を引き渡す。
