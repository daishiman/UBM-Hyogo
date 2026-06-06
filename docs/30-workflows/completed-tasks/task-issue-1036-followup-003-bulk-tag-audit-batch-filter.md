# Issue #1036 follow-up 003: bulk tag audit batch filter

## メタ情報

```yaml
issue_number: 1079
task_id: task-issue-1036-followup-003-bulk-tag-audit-batch-filter
task_name: bulk tag audit の batchId 検索・表示導線追加
category: 改善
target_feature: apps/api audit_log / apps/web admin audit browser
priority: 低
scale: 中規模
status: 未実施
source_phase: issue-1036-bulk-member-tag-assign audit batchId scope-out
created_date: 2026-06-01
dependencies: [issue-1036-bulk-member-tag-assign]
```

| 項目 | 内容 |
| --- | --- |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| 実装ガイド | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md` |
| 分類 | follow-up / audit UX |
| 優先度 | 低 |

## 1. 概要

Issue #1036 は実 mutation した member×tag 単位で audit を記録し、`before_json` / `after_json` に `batchId` を埋めて bulk 相関を残した。ただし `/admin/audit` から batchId で一括操作単位を検索・表示する導線は未実装である。本タスクは audit viewer 側に batchId filter / copy / grouping を追加し、bulk 操作の追跡性を高める。

## 2. 目的

- 1 回の bulk 操作に紐づく audit rows を admin が追跡できる。
- `admin.member.tag_assigned` / `admin.member.tag_unassigned` の既存 action filter と共存する。
- `audit_log` schema に `correlation_id` 列を追加せず、既存 JSON payload の batchId を利用する。

## 3. 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | `/admin/audit` で batchId を入力して bulk tag audit rows を絞り込める |
| AC-2 | audit row detail に batchId が表示され、copy できる |
| AC-3 | `admin.member.tag_assigned` / `admin.member.tag_unassigned` action filter と batchId filter を併用できる |
| AC-4 | cursor pagination の next URL が batchId query を保持する |
| AC-5 | JSON body filter が D1 full scan になりすぎる場合の制限または index 方針が明記されている |

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260601-060807-wt-11/apps/api/src/repository/memberTags.ts`
- 症状: #1036 では `audit_log` に `correlation_id` 列が無いため schema 変更を避け、`after_json` / `before_json` に `batchId` を埋める設計にした。記録はできるが、既存 `/admin/audit` が JSON 内 batchId を検索する UI/contract を持たないため、運用時に batch 単位で追うには手作業の JSON inspection が必要になる。
- 参照: `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md`, `apps/api/src/repository/memberTags.ts`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| JSON LIKE 検索で audit_log が full scan になる | 中 | batchId filter は action/date filter 併用を推奨し、必要なら generated column / future migration を別途検討する |
| batchId が before_json と after_json のどちらに入るかで検索漏れする | 中 | assign/unassign 両方の payload 位置を contract test で固定し、repository helper で抽出する |
| audit UI に bulk 専用概念が増えて通常 audit が複雑になる | 低 | advanced filter として畳み込み、既存 action free text を維持する |
| schema 変更に踏み込み #1036 の軽量 batchId 方針と矛盾する | 中 | 本タスク初期版は schema 変更なし。migration が必要なら別 task として切り出す |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @repo/api test --run src/routes/admin/audit.contract.spec.ts src/routes/admin/members-tags-bulk.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
```

期待: batchId filter、action 併用、pagination query 維持、row detail 表示が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

期待: API / web typecheck が green。D1 migration は発生しない。

## スコープ

### 含む

- audit API の batchId query filter
- `/admin/audit` UI の batchId input / row detail表示
- contract / component tests

### 含まない

- `audit_log` schema 変更
- bulk tag write 実装の変更
- production deploy、commit、push、PR 作成

## 参照

- `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md`
- `apps/api/src/repository/memberTags.ts`
- `apps/api/src/routes/admin/audit.contract.spec.ts`
