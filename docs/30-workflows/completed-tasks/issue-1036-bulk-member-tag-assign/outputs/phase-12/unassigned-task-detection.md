# Unassigned task detection

## Current cycle result

New unassigned tasks required for #1036 scope: **0**.

No detected #1036 acceptance criterion is moved to backlog or another PR. Task A/B/C keep the
required bulk endpoint, repository helper, tag master read endpoint, member×tag audit (batchId
correlation), web BulkActionBar tag UI, partial-failure report, type-level gate, visual baseline,
and invariant #13 documentation in one implementation cycle (CONST_007: no escape / no backlog).

AC-1〜AC-7 はすべて task-A/B/C に写像済みで、本タスク内で完結する。AC-5（再送冪等）は #913
（server idempotency store）に依存させず、`member_tags` 複合 PK + INSERT OR IGNORE / DELETE
meta.changes の DB 自然冪等で代替しているため、別タスク待ちの未タスクは生じない。

## Baseline vs current 分離

| 区分 | 件数 | 内容 |
| --- | --- | --- |
| baseline（親 issue-982 で既に scope-out 記録済み） | 3 | #913 idempotency store / #1035 tag master write / tag master pagination。いずれも本 #1036 AC の達成に不要な別タスクとして親 workflow に記録済み |
| current cycle（#1036 で新規に検出された必須未タスク） | 0 | AC-1〜AC-7 はすべて task-A/B/C 内で完結 |

## Scope-out candidates（本 AC 達成に不要な別タスク）

| Candidate | Classification | Reason |
| --- | --- | --- |
| #913 server idempotency middleware（Idempotency-Key store） | 別タスク（CLOSED / 未実装） | 本タスクは DB 自然冪等（複合 PK + INSERT OR IGNORE / DELETE meta.changes）で AC-5 を実現するため非依存。server-side idempotency store は不要 |
| #1035 tag master write / CRUD | 別タスク（OPEN） | 本タスクは tag master の **read のみ**（`GET /admin/tags`）。tag 定義の write/CRUD は #1035 の責務で read/write 分離 |
| tag master pagination / search | future consideration（未起票） | tag picker は active tag 全件を category グルーピングで表示。tag 数が大規模化した場合の将来課題。本 MVP では不要 |

> いずれも「将来の独立した別タスク」であり、本タスク AC の達成には不要。1 サイクル完結を阻害しない。

## CONST_005 check

No current-cycle improvement is left as a TODO comment, backlog note, or separate PR. If future
implementation discovers one of the above candidates is required for AC fulfillment, it must be
completed in that same implementation cycle or escalated before being formalized.

## Notes

- 本 wave は spec 作成のみ。新規 Issue の起票・既存 Issue の mutation は行わない（user-gated）。
- 上記 scope-out 候補は記録のみ。formalize（spec / Issue 化）は user 指示時に 2x 検証（CONST_002）で行う。
