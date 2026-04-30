# UT-07A-04: assigned_via_queue_id schema decision

## メタ情報

```yaml
issue_number: 296
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07A-04 |
| タスク名 | assigned_via_queue_id schema decision |
| 分類 | 要件 |
| 対象機能 | `member_tags` audit traceability / database schema |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | 07a Phase 12 unassigned-task-detection |
| 発見日 | 2026-04-30 |

## 概要

`member_tags` に `assigned_via_queue_id` を正式追加するか、既存 schema の `source='admin_queue'` + `audit_log.target_id=queueId` で十分とするかを判断する。

## 背景

07a は既存 schema を維持し、queueId は audit に残す方針で実装した。検索・監査・運用要件が強くなる場合は `member_tags` から queue へ直接辿れる列が有効になる可能性がある。

## 受入条件

- 監査要件として `member_tags -> tag_assignment_queue` の直接 join が必要か判断する
- 追加する場合は migration、repository、backfill、API response 影響を設計する
- 追加しない場合は audit_log 参照で十分な理由を仕様に明記する

## 関連

- `docs/00-getting-started-manual/specs/08-free-database.md`
- 07a Phase 12 system-spec update summary

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-090915-wt-3/docs/00-getting-started-manual/specs/08-free-database.md`
- 症状: 07a では schema 追加を避けて `audit_log.target_id=queueId` に寄せたが、監査検索で `member_tags` から queue を直接 join したい要件が出ると migration / backfill / API response 影響が広がる判断点が残った。
- 参照: `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/system-spec-update-summary.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 安易に列追加して migration / backfill / response 契約が肥大化する | Phase 1 で監査 query 要件を確認し、audit_log 参照で足りる場合は追加しない ADR を残す |
| 追加しない判断の理由が失われ、後続で同じ議論を繰り返す | `docs/00-getting-started-manual/specs/08-free-database.md` と aiworkflow-requirements に判断理由を同期する |

## 検証方法

### 要件検証

```bash
rg "assigned_via_queue_id|admin_queue|tag_assignment_queue|member_tags" docs .claude/skills/aiworkflow-requirements/references apps/api/src
```

期待: 直接 join が必要な要件の有無と、現行 `audit_log.target_id` 方針の記述箇所が確認できる。

### migration 影響確認

```bash
find apps/api/migrations -type f | sort
rg "member_tags" apps/api/migrations apps/api/src
```

期待: 追加判断をする場合、migration / repository / response / tests の影響範囲が列挙されている。

## スコープ

### 含む

- `assigned_via_queue_id` 追加要否の ADR
- 追加する場合の migration / backfill / API response 影響整理
- 追加しない場合の audit_log 参照方針の正本同期

### 含まない

- 07a の resolve workflow 本体変更
- staging race smoke（UT-07A-03 で対応）
