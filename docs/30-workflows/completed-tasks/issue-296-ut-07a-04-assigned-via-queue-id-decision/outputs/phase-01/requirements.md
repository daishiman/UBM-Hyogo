# Phase 1: スコープ・前提・既存実装の確認

## 判断対象

`member_tags.assigned_via_queue_id` 列の採否。07a workflow（tag assignment queue resolve）完了時点で、仕様文書側の想定（`tag_code, assigned_via_queue_id`）と実装側の正本（`tag_id, source, assigned_by`）が drift していた件について、列を「追加するか / しないか」を ADR で正本化する。

## evidence 1: `member_tags` 現行 schema（6 列）

`apps/api/migrations/0002_admin_managed.sql:43-52`

```sql
CREATE TABLE IF NOT EXISTS member_tags (
  member_id    TEXT NOT NULL,
  tag_id       TEXT NOT NULL,
  source       TEXT NOT NULL,
  confidence   REAL,
  assigned_at  TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_by  TEXT,
  PRIMARY KEY (member_id, tag_id)
);
```

→ 6 列構成。`assigned_via_queue_id` 列は **存在しない**。

## evidence 2: assigned_via_queue_id 参照ゼロ

```
$ rg -n "assigned_via_queue_id" apps/ packages/
(出力なし)
```

→ ヒット件数 = 0。コード側にも test 側にも当該列への参照は存在しない。

## evidence 3: audit_log での queue 追跡経路

```
apps/api/src/workflows/tagQueueResolve.ts:187  targetType: "tag_queue",
apps/api/src/workflows/tagQueueResolve.ts:210  targetType: "tag_queue",
apps/api/src/workflows/tagQueueRetryTick.contract.spec.ts:104  target_type: "tag_queue",
```

→ resolve（`admin.tag.queue_resolved` / `admin.tag.queue_rejected`）および DLQ 経路で `audit_log.target_type='tag_queue'` / `target_id=queueId` を発番。queue → member_tags 追跡は audit_log の SQL join で再構成可能。

## evidence 4: `source='admin_queue'` での queue 経由付与識別

`apps/api/src/repository/memberTags.ts:74`

```sql
VALUES (?1, ?2, 'admin_queue', 1.0, ?3)
```

→ queue 経由で確定した member_tags row は `source='admin_queue'` で判別できる。queueId が不要な業務 query は `WHERE source='admin_queue'` で完結。

## evidence 5: 親 07a の drift 記述

- `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md:10` に UT-07A-04 として「`assigned_via_queue_id` を member_tags に正式に追加するか検討」が unassigned task として残されている。本 ADR がその closure。

## 仕様文書側の現状

- `docs/00-getting-started-manual/specs/08-free-database.md` は line 120 で `member_tags` をテーブル一覧に載せているのみで、`CREATE TABLE` block を持たない。→ Phase 8 で schema 確定理由つきで追記する。
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md:229` は既に「列を追加せず、queue 追跡は audit_log で担保する」の一文を持つ。→ Phase 8 で ADR 0002 への明示リンクを追加する。

## Phase 2 への引き継ぎ

採用案 = 「列を追加しない」を確定する根拠と代替案評価を Phase 2 で文書化する。
