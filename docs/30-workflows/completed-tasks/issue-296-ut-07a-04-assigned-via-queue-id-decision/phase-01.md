# Phase 1: スコープ・前提・既存実装の確認

## 目的

UT-07A-04 の docs-only ADR 起票に必要な前提（07a 完了時点での `member_tags` schema、tagQueueResolve / tagQueueRetryTick の audit 経路、仕様文書の現状）を grep evidence で確認し、Phase 2 以降の判断材料として確定する。

## 入力

- `docs/30-workflows/unassigned-task/UT-07A-04-member-tags-assigned-via-queue-id-decision.md`（原典）
- `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/index.md`（親タスク AC）
- `apps/api/migrations/0002_admin_managed.sql`（`member_tags` 現行 schema）
- `apps/api/src/workflows/tagQueueResolve.ts`（audit append 実装）
- `apps/api/src/workflows/tagQueueRetryTick.ts`（DLQ audit 実装）
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 schema 正本）
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`（DB 実装 SSOT）

## 作業手順

1. 原典 task spec を読み、判断対象（assigned_via_queue_id 列の採否）と背景（07a で仕様 drift が発生したまま closure された経緯）を整理する。
2. 親 07a タスクの `outputs/phase-12/unassigned-task-detection.md` 行 10 と `outputs/phase-12/system-spec-update-summary.md` 行 16 を引用し、drift の正本記述を確認する。
3. `apps/api/migrations/0002_admin_managed.sql` から `member_tags` の現行列定義を grep し、`assigned_via_queue_id` が存在しないことを確認する。
4. `apps/api/src/workflows/tagQueueResolve.ts` / `tagQueueRetryTick.ts` の audit append 箇所を grep し、`target_type='tag_queue', target_id=queueId` で queue ↔ member 追跡が成立していることを確認する。
5. 既存 spec / skill reference で `assigned_via_queue_id` への言及が無いことを確認し、Phase 8 で追記すべき箇所（schema 確定理由セクション）を特定する。
6. Phase 2 の判断材料として、上記 evidence を `outputs/phase-01/requirements.md` に集約する。

## 出力成果物

- `outputs/phase-01/requirements.md`
  - 判断対象の確認
  - 07a 完了時 schema の確認結果
  - audit_log 追跡経路の現状
  - 仕様文書側の現状（追記対象セクション特定）

## 検証コマンド

```bash
# member_tags 現行 schema 確認
rg -n "CREATE TABLE.*member_tags|member_tags.*\(" apps/api/migrations/

# assigned_via_queue_id がコードに存在しないこと（期待: 0 件）
rg -n "assigned_via_queue_id" apps/ packages/

# audit_log での queue 追跡確認
rg -n "target_type.*tag_queue|targetType.*tag_queue" apps/api/src/workflows/
rg -n '"tag_queue"' apps/api/src/repository/tagQueue.ts apps/api/src/repository/auditLog.ts

# 親タスクの drift 記述確認
rg -n "assigned_via_queue_id" docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/
```

## DoD

- [ ] `member_tags` の現行列構成（6 列）を確認した
- [ ] `rg "assigned_via_queue_id" apps/ packages/` のヒット件数 = 0 を記録した
- [ ] `target_type='tag_queue'` の audit append 箇所を 2 件（resolve + retry/dlq）以上特定した
- [ ] 07a 親タスクの drift 記述 2 箇所（unassigned-task-detection 行 10 / system-spec-update-summary 行 16）を引用した
- [ ] Phase 8 で追記すべき spec / skill reference のセクションを特定した
- [ ] `outputs/phase-01/requirements.md` を作成した
