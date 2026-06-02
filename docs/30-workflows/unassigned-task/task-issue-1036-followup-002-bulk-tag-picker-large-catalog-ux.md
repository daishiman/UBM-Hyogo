# Issue #1036 follow-up 002: bulk tag picker large catalog UX

## メタ情報

```yaml
issue_number: 1078
task_id: task-issue-1036-followup-002-bulk-tag-picker-large-catalog-ux
task_name: BulkActionBar tag picker の大規模 tag catalog UX 改善
category: 改善
target_feature: apps/web BulkActionBar tag picker / apps/api GET /admin/tags
priority: 低
scale: 中規模
status: 未実施
source_phase: issue-1036-bulk-member-tag-assign Phase 10 MINOR / Phase 12 scope-out
created_date: 2026-06-01
dependencies: [issue-1036-bulk-member-tag-assign, issue-1035]
```

| 項目 | 内容 |
| --- | --- |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| 実装ガイド | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md` |
| 関連 Issue | #1035 tag master write / pagination/search |
| 分類 | follow-up / UI improvement |
| 優先度 | 低 |

## 1. 概要

Issue #1036 の bulk tag picker は `GET /admin/tags` の active tag 全件を category ごとに表示する。現状の tag 数では十分だが、tag master が増えると sticky `BulkActionBar` が縦に伸び、member table の操作面積を圧迫する。本タスクは tag 数増加時の検索・折りたたみ・表示上限を設計し、#1035 の pagination/search と矛盾しない UI にする。

## 2. 目的

- tag 数が多い場合でも bulk assign/unassign 操作が破綻しない。
- #1035 の `GET /admin/tags` pagination/search 実装と接続できる client contract を決める。
- 既存の small catalog では現在の全件 category 表示を維持する。

## 3. 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | tag 数が一定数を超える場合、検索または category 折りたたみで UI 高さを制御できる |
| AC-2 | 既存 `TagPill` の keyboard 操作 / `aria-pressed` が維持される |
| AC-3 | `GET /admin/tags` が pagination/search 化された場合の client fallback が定義されている |
| AC-4 | selected tag が検索結果外に移動しても選択状態が失われない |
| AC-5 | desktop/mobile の visual sanity で sticky bar が table 操作を塞ぎすぎない |

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260601-060807-wt-11/apps/web/src/features/admin/components/_members/BulkActionBar.tsx`
- 症状: 現実装は `available` を全件 `category` grouping してそのまま描画するため、tag master が増えたときに sticky footer の高さが増え続ける。#1036 では AC 達成に不要なため先送りしたが、#1035 の pagination/search と接続する際に contract を再設計する必要がある。
- 参照: `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/phase-10-final-review.md`, `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/unassigned-task-detection.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 検索 UI 追加で bulk 操作が重くなる | 中 | small catalog では現行 UI を維持し、閾値超過時だけ検索/折りたたみを出す |
| paginated API で選択済み tag が画面外になり解除不能になる | 中 | selected set は response page と独立に保持し、選択済み chip を別行に固定表示する |
| #1035 の API contract と二重設計になる | 中 | Phase 1 で #1035 の `GET /admin/tags` contract を確認し、write CRUD とは分離して read UX だけ扱う |
| mobile で sticky bar が viewport を占有する | 中 | max-height + overflow-y、または drawer/popover 化を検討し Playwright mobile screenshot で確認する |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx
```

期待: tag search / collapse / selected persistence / keyboard interaction が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web playwright test playwright/tests/issue1036-bulk-member-tags.spec.ts --project=desktop-chromium
mise exec -- pnpm --filter @ubm-hyogo/web playwright test playwright/tests/issue1036-bulk-member-tags.spec.ts --project=mobile-chromium
```

期待: 大量 tag fixture でも text overlap が無く、sticky bar の高さが制御される。

## スコープ

### 含む

- `BulkActionBar` tag picker の large catalog UX
- 必要な `fetchTagMaster` query parameter / response handling
- component tests と visual sanity

### 含まない

- tag master write / CRUD の実装（#1035 系タスク）
- tag code rename / physical delete / reactivate requirements（既存 #1069/#1070）
- production deploy、commit、push、PR 作成

## 参照

- `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/phase-10-final-review.md`
- GitHub Issue #1035, #1068, #1069, #1070
