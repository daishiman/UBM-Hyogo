# Issue #1036 follow-up 004: bulk tag result member labels

## メタ情報

```yaml
issue_number: 1080
task_id: task-issue-1036-followup-004-bulk-tag-result-member-labels
task_name: bulk tag 部分失敗結果の member/tag 表示名改善
category: 改善
target_feature: apps/web BulkActionBar result summary
priority: 低
scale: 小規模
status: formalized_as_issue_1080_implemented_local
source_phase: issue-1036-bulk-member-tag-assign Phase 10 MINOR result UX
created_date: 2026-06-01
dependencies: [issue-1036-bulk-member-tag-assign]
formalized_workflow: docs/30-workflows/completed-tasks/issue-1080-bulk-tag-result-member-labels/
implementation_state: implemented_local_evidence_captured
consumed_at: 2026-06-03
```

| 項目 | 内容 |
| --- | --- |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| 実装ガイド | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md` |
| 分類 | follow-up / UI improvement |
| 優先度 | 低 |

## 1. 概要

> **消費状態**: 本 unassigned task は `docs/30-workflows/completed-tasks/issue-1080-bulk-tag-result-member-labels/` として formalize され、同サイクルで apps/web 実装・focused component test まで完了した。Issue #1080 は OPEN のまま維持し、commit / PR / Issue mutation / staging visual は user-gated。

Issue #1036 の `BulkActionBar` は部分失敗時に `memberId` / `tagId` をそのまま表示する。これは contract としては十分だが、admin が実運用で「誰が skip されたか」「どの tag が未登録か」を判断するには表示名が不足する。本タスクは selected member の表示名・メール・tag label を使って、結果 summary を人間が読める形に改善する。

## 2. 目的

- 部分失敗結果を `memberId` / `tagId` だけでなく、member name / email / tag label で確認できる。
- API contract は member×tag status shape を維持し、UI 側の label 解決で改善する。
- 未登録 tag は tagId を残しつつ「未登録」と明示する。

## 3. 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | `skipped_deleted` の表示に member 表示名または email が出る |
| AC-2 | `tag_not_found` の表示に tag label 解決済みなら label、未解決なら tagId が出る |
| AC-3 | API response shape は #1036 の `{ memberId, tagId, status }` を維持する |
| AC-4 | selected member の表示名が手元に無い場合も fallback として memberId 表示で壊れない |
| AC-5 | component test が partial failure の label 表示と fallback を検証する |

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260601-060807-wt-11/apps/web/src/features/admin/components/_members/BulkActionBar.tsx`
- 症状: #1036 では `BulkActionBarProps` を既存 `{ selectedIds, onComplete }` のまま維持したため、結果表示コンポーネントは selected member の display name / email を知らない。API 側も部分失敗 shape を安定させるため label を載せていない。UX 改善には props 拡張または親 page 側の selected member map 注入が必要になる。
- 参照: `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md`, `apps/web/src/features/admin/components/_members/BulkActionBar.tsx`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| props 拡張で既存 publish/hide/soft-delete 呼び出しが壊れる | 中 | `selectedMembersById?` の optional prop として追加し、既存 call sites は fallback で維持する |
| API response に label を追加して contract が膨らむ | 低 | 初期実装は UI local map 解決に限定し、API shape は維持する |
| tag label が stale になる | 低 | `fetchTagMaster()` の `available` を label source とし、未解決時は tagId fallback を表示する |
| 個人情報表示が増えすぎる | 中 | member 表示名または email のどちらを出すか既存 members table の表示ポリシーに合わせる |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx
```

期待: partial failure summary が member label / tag label / fallback を表示し、既存 action tests が regression しない。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

期待: typecheck / lint が green。apps/api 差分なし。

## スコープ

### 含む

- `BulkActionBar` の result summary 表示改善
- optional props または parent selected map の最小追加
- component tests

### 含まない

- bulk endpoint response shape の破壊的変更
- audit payload 変更
- staging / production deploy、commit、push、PR 作成

## 参照

- `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md`
- `apps/web/src/features/admin/components/_members/BulkActionBar.tsx`
- `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`
