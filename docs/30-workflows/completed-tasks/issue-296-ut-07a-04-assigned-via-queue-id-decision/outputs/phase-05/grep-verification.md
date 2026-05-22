# Phase 5: コード変更不要の grep verification

本タスクは docs-only。CONST_004 例外条件のもと、関数シグネチャ・テスト・実行コマンドの代わりに
以下の grep verification を evidence として記録する。

## (1) `assigned_via_queue_id` 参照ゼロ（期待: 0 件）

```
$ rg -n "assigned_via_queue_id" apps/ packages/
(出力なし) → OK: 0 hits
```

→ コード側に当該列への参照は存在しない。列を追加しない判断と現行コードは整合している。

## (2) audit_log での queue 追跡（期待: implementation 3 件 + contract/type 2 件）

```
$ rg -n "target_type.*tag_queue|targetType.*tag_queue" apps/api/src/
apps/api/src/workflows/tagQueueResolve.ts:187      targetType: "tag_queue",
apps/api/src/workflows/tagQueueResolve.ts:210      targetType: "tag_queue",
apps/api/src/workflows/tagQueueRetryTick.contract.spec.ts:104      target_type: "tag_queue",
```

追加で DLQ repository bind と audit target type union を確認する。

```
$ rg -n '"tag_queue"' apps/api/src/repository/tagQueue.ts apps/api/src/repository/auditLog.ts
apps/api/src/repository/auditLog.ts:11:  | "tag_queue"
apps/api/src/repository/tagQueue.ts:412:      "tag_queue",
```

→ implementation は resolve / reject / DLQ の 3 経路、contract/type は retry DLQ contract spec + `AuditTargetType` union で確認済み。

## (3) `source='admin_queue'` での queue 経由付与識別（期待: ≥ 1 件）

```
$ rg -n "'admin_queue'" apps/api/src/
apps/api/src/repository/memberTags.ts:74         VALUES (?1, ?2, 'admin_queue', 1.0, ?3)
```

→ 1 ヒット。queue 経由付与は `source='admin_queue'` で識別される。

## (4) `member_tags` 現行 schema（6 列）

```
$ rg -n "CREATE TABLE.*member_tags" apps/api/migrations/
apps/api/migrations/0002_admin_managed.sql:43:CREATE TABLE IF NOT EXISTS member_tags (
```

`apps/api/migrations/0002_admin_managed.sql:43-52`:

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

→ 6 列構成。`assigned_via_queue_id` 列は存在しない。

## 結論

現行コードは ADR 0002 Decision（列を追加しない）と完全に整合している。コード変更は不要。
Phase 6 でテストコード側も同じ整合性が成立することを確認する。
