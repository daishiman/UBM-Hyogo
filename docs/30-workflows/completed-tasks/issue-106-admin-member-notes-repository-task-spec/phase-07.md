# Phase 7: AC トレース

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 対象 AC | AC-1〜AC-11 |

## 目的

受入条件、実装箇所、検証方法、関連 invariant を 1:1 で追跡する。

## 実行タスク

1. index の AC を再掲する。
2. 各 AC に実装 anchor と test anchor を割り当てる。
3. 未検証 AC を Phase 9 までに潰す計画を立てる。
4. 各 AC を Core / Handoff / Guardrail に分類し、本タスクで実測 PASS が必須か、委譲明記で足りるかを分離する。

## 参照資料

- `index.md`
- `phase-04.md`
- `phase-06.md`

## 実行手順

| AC | 分類 | owner | 実装 anchor | 検証 anchor | gate |
| --- | --- | --- | --- | --- | --- |
| AC-1 | Core | 02a repository | `adminNotes.ts` | typecheck | 本タスクで PASS evidence 必須 |
| AC-2 | Guardrail | 02a / public view | view model 型 | builder / public tests | 本タスクで非混入 evidence 必須 |
| AC-3 | Core | 02a repository | `_shared/*` import | code review | 本タスクで確認 |
| AC-4 | Core | 02a repository | SQL `WHERE member_id` | repository test | 本タスクで PASS evidence 必須 |
| AC-5 | Core | 02a repository | SQL `ORDER BY created_at DESC` | repository test | 本タスクで PASS evidence 必須 |
| AC-6 | Core | 02a repository | empty result mapping | repository test | 本タスクで PASS evidence 必須 |
| AC-7 | Guardrail | 02a repository | no update to response tables | grep/static check | 本タスクで確認 |
| AC-8 | Core | 02a repository | unit tests | vitest | 本タスクで PASS evidence 必須 |
| AC-9 | Handoff | 04c consumer | 04c handoff | docs / route design | 委譲先と参照点を明記 |
| AC-10 | Handoff | 04c mutation route | admin note mutations | route contract / auditLog test | 本タスク単体の PASS 条件ではなく 04c 同一 workflow で確認 |
| AC-11 | Guardrail | 04c admin detail | audit DTO separation | admin members route review | audit_log と admin_member_notes の混同禁止を確認 |

## 統合テスト連携

Phase 9 の quality gate はこの matrix を使い、未検証 AC が 0 件であることを確認する。

## 多角的チェック観点（AIが判断）

- AC が実装成果物だけでなく、検証成果物にも接続されている。
- 04c に委譲する内容と本タスクで閉じる内容が Core / Handoff / Guardrail で分離されている。

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P7-1 | AC matrix | AC-1〜AC-11 が全て登録済み |
| P7-2 | gap check | 未検証 AC が明示済み |

## 成果物

- ac-matrix.md 相当

## 完了条件

- [ ] 全 AC が実装 anchor と検証 anchor を持つ。

## タスク100%実行確認【必須】

- [ ] 04c handoff が記録されている。

## 次Phase

Phase 8: DRY / 命名整理。
