# ADR-0002: `member_tags.assigned_via_queue_id` 列を追加しない

## Status

Accepted — 2026-05-16

本 ADR は `07a-parallel-tag-assignment-queue-resolve-workflow` の closure 時点で
`unassigned-task-detection.md` に残された UT-07A-04（GitHub Issue #296、既に CLOSED）の判断を
正本化するものである。

## Context

UBM 兵庫支部会 admin tag assignment queue（`tag_assignment_queue` → `member_tags`）の
07a workflow 完了時点で、仕様文書と実装の間に schema drift が残った。

| 系統 | `member_tags` の列構成 |
| --- | --- |
| 仕様文書（旧 draft） | `member_id, tag_code, source, assigned_via_queue_id, assigned_at` |
| 実装（migration `apps/api/migrations/0002_admin_managed.sql:43-52`） | `member_id, tag_id, source, confidence, assigned_at, assigned_by` |

drift の主因は次の 2 点である。

1. 実装は `tag_definitions.tag_id` を FK として参照しており、仕様文書側の `tag_code`
   とは別レイヤ（tag_code は `tag_definitions.code`、tag_id は同テーブルの surrogate key）。
2. queue 経由付与の trace を仕様文書は `assigned_via_queue_id` 列で表現していたが、
   実装は `audit_log (target_type='tag_queue', target_id=queueId)` で代替実装した。

07a closure 時点で UT-07A-04 として「列を正式に追加するか検討」が unassigned task
（`docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md:10`）
に残っていたが、その後 closure 判断が ADR 化されないままになっていた。本 ADR がその closure である。

関連する不変条件:

- Google Form schema 外のデータは admin-managed data として分離する（CLAUDE.md 不変条件 #4）。
- D1 への直接アクセスは `apps/api` に閉じる（CLAUDE.md 不変条件 #5）。

## Decision

1. **`member_tags.assigned_via_queue_id` 列は追加しない**。
   `member_tags` の現行 6 列構成（`member_id, tag_id, source, confidence, assigned_at, assigned_by`）を
   D1 schema の正本として確定する。
2. queue → member_tags の trace は `audit_log` で担保する。
   - `target_type = 'tag_queue'`
   - `target_id = queueId`
   - `action IN ('admin.tag.queue_resolved', 'admin.tag.queue_rejected', 'admin.tag.queue_dlq_moved')`
3. queue 経由で確定した member_tags row の識別子として `member_tags.source = 'admin_queue'` を継続使用する。
   `apps/api/src/repository/memberTags.ts` の `VALUES (?1, ?2, 'admin_queue', 1.0, ?3)` がこの正本実装。
4. `apps/api/src/workflows/tagQueueResolve.ts:187,210` と
   `apps/api/src/workflows/tagQueueRetryTick.ts` の `target_type='tag_queue'` audit append を
   queue ↔ member 追跡の正規経路として明文化する。

## Consequences

### Positive

- migration ファイル追加が不要（D1 ALTER と既存行への backfill を回避）。
- API schema（`packages/shared/src/schemas/admin/*`）の breaking 判定が不要。
- repository / workflow / test fixture / contract spec が現行のまま不変。
- D1 row size / index 増分ゼロ（free plan 容量への影響なし）。
- 列追加方針は将来も可逆。再評価トリガが発生した時点で superseding ADR を起票して migrate できる。

### Negative / Trade-off

- queue → member_tags の追跡は audit_log を経由する 2 段 join となる（FK 直結より 1 段重い）。
  - 緩和策: `audit_log(target_type, target_id)` の既存 index で十分に絞り込めること、
    および `member_tags.source='admin_queue'` で 1 段で絞り込める query パターンが
    admin UI の現要件に整合していることを確認済み。
- audit_log の保持・物理削除ポリシーに依存する。保持期間が queue 追跡要件を満たせない水準へ短縮される、または物理削除が導入される場合は queue 追跡が失われる。
  - 緩和策: 再評価トリガ (b) として明示。保持・物理削除ポリシー変更判断時に本 ADR を再評価する。
- 仕様文書側の旧 draft（`tag_code, assigned_via_queue_id`）と実装は当面不一致のまま運用される。
  - 緩和策: Phase 8 で `docs/00-getting-started-manual/specs/08-free-database.md` と
    `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` を本 ADR に同期する。

## Alternatives considered

### 案 A: `member_tags.assigned_via_queue_id TEXT NULL` を追加する

却下。波及範囲が広く、コストが現時点の便益に見合わない。具体的な波及:

| レイヤ | 影響 |
| --- | --- |
| migration | 新規 `00NN_member_tags_assigned_via_queue_id.sql` を追加し `ALTER TABLE` を投入。rollback は D1 では非自明。 |
| backfill | 07a 完了前に付与された既存行は queueId が存在せず backfill 不能。NULL 許容で運用するなら列の意味が薄れる。 |
| repository | `apps/api/src/repository/memberTags.ts` の insert / select 全箇所を更新。 |
| workflow | `apps/api/src/workflows/tagQueueResolve.ts` の insert 呼び出しに queueId を追加。 |
| schema | `packages/shared/src/schemas/admin/*` の `MemberTag` 型に `assignedViaQueueId` を追加。全 admin endpoint response の互換性判定。 |
| test | `tagQueueResolve.contract.spec.ts` / `tagQueueRetryTick.contract.spec.ts` の fixture / expectation 更新。 |
| 性能 | row size 軽微増。index 追加するなら write コスト増。 |

これらは「監査画面で `WHERE assigned_via_queue_id = ?` の 1 クエリが必要」という業務要件が
顕在化して初めて正味便益を生む。現時点で当該要件は存在せず、`source='admin_queue'` + audit_log
で全 admin UI 要件は満たせている。

### 案 C: 仕様文書側を `tag_code` 表記に戻し、列追加を棚上げで放置

却下。schema drift を「ADR 化されない unassigned task」として持ち越すと、後続 workflow で
同じ判断を再びゼロから議論する必要が出る。Schema Drift ADR Gate
（`.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` "Schema Drift ADR Gate"）
の趣旨に反する。

## Re-evaluation triggers

以下のいずれかが発生した時点で本 ADR を再評価し、必要なら superseding ADR を起票して列追加 migration を企画する。

- (a) 監査 UI で「特定 queue から確定したタグ一覧」を 1 クエリで表示する要件が発生する。
- (b) `audit_log` の保持期間短縮または物理削除方針により、queue 追跡に必要な履歴が保持できなくなる。
- (c) D1 read で audit join 性能問題が顕在化する（query plan で full scan / N+1 が出る等）。

## References

- 原典タスク仕様: `docs/30-workflows/unassigned-task/UT-07A-04-member-tags-assigned-via-queue-id-decision.md`
- 親 workflow: `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/`
- 親 closure 記述: `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md:10`
- 現行 schema: `apps/api/migrations/0002_admin_managed.sql:43-52`
- queue trace 実装: `apps/api/src/workflows/tagQueueResolve.ts:187,210`, `apps/api/src/workflows/tagQueueRetryTick.ts`
- queue 経由 source: `apps/api/src/repository/memberTags.ts:74`
- D1 schema 正本: `docs/00-getting-started-manual/specs/08-free-database.md`
- DB 実装 SSOT: `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- Schema Drift ADR Gate: 同上 "Schema Drift ADR Gate" 節
- GitHub Issue: #296（CLOSED — docs-only follow-up）
- Workflow ディレクトリ: `docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/`
