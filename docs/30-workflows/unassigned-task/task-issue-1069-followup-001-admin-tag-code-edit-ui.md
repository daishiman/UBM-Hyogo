# Issue #1069 follow-up: admin tag code edit UI

## メタ情報

```yaml
issue_number: 1069
task_id: task-issue-1069-followup-001-admin-tag-code-edit-ui
task_name: Admin tag master code edit UI
category: UI
target_feature: admin tag master code rename
priority: 中
scale: 中規模
status: 未実施
source_phase: issue-1069 Phase 12 unassigned-task-detection U-1
created_date: 2026-06-03
dependencies: [issue-1069-tag-code-rename]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-1069-followup-001-admin-tag-code-edit-ui |
| タスク名 | Admin tag master code edit UI |
| 分類 | UI |
| 対象機能 | admin tag master code rename |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/outputs/phase-12/unassigned-task-detection.md` U-1 |
| 関連 Issue | #1069（API 本体） / #1116（本タスク） |

## 1. なぜこのタスクが必要か

Issue #1069 では admin API の `PATCH /admin/tags/:tagId` が `code` / `expectedCode` を受け付け、409 `tag_code_conflict` と 409 `tag_stale_conflict` を分離して返せるようになった。一方、apps/web には admin tag master 専用 CRUD ページがまだ無く、operator が UI から code rename を実行する導線は未整備である。

API 実装と UI 実装を同一サイクルに混ぜると、admin navigation、tag master 一覧/編集フォーム、CAS 用 `expectedCode` 保持、conflict error 表示、visual evidence までスコープが拡大する。したがって API rename の local deterministic evidence を完了させたうえで、UI 導線は独立タスクとして formalize する。

## 2. 何を達成するか

admin tag master の code を UI から安全に編集できる導線を作る。

### 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | admin tag master 一覧から対象 tag を選び、`code` / `label` / `category` の編集 UI に到達できる |
| AC-2 | code rename 時は現在の code を `expectedCode` として送信し、stale conflict を検出できる |
| AC-3 | 409 `tag_code_conflict` と 409 `tag_stale_conflict` を別メッセージで表示する |
| AC-4 | label/category の既存更新と code rename の両方が後方互換に動く |
| AC-5 | focused component/API client tests と authenticated visual evidence を取得する |

## 3. 実行方針

1. 既存 admin navigation と tag master read surface を確認する。
2. API client に `code?` / `expectedCode?` を含む update contract を追加する。
3. 編集フォームで `expectedCode` を current row から保持し、submit 時に PATCH へ渡す。
4. 409 `tag_code_conflict` / `tag_stale_conflict` を分離表示する。
5. focused tests と authenticated visual evidence を取得する。

## 苦戦箇所【記入必須】

- 対象: apps/web admin UI
- 症状: admin tag master 専用 CRUD ページが未整備のため、既存 member tag assignment UI と混同しやすい。tag assignment UI は member_tags の付与/解除が責務で、tag_definitions の code rename とは別境界である。
- 対象: `expectedCode`
- 症状: stale detection は UI が current code を保持して送る必要がある。単純な PATCH form では最新値競合を表現できない。

## リスクと対策【記入必須】

| リスク | 影響 | 対策 |
| --- | --- | --- |
| member tag assignment UI と tag master CRUD UI を混同する | 高 | route / page 名 / copy で tag master 管理に限定する |
| stale conflict を code conflict と同じ UI 表示にしてしまう | 中 | error code 別の unit/component test を追加する |
| rename 後の一覧 cache が古い code を表示する | 中 | mutation success 後に row refresh または optimistic replacement を行う |

## 検証方法【記入必須】

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:run
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
```

authenticated runtime visual evidence は staging deploy 後の user approval で取得する。

## スコープ【記入必須】

### 含む

- admin tag master code edit UI
- API client update contract
- conflict error display
- focused tests / visual evidence

### 含まない

- API rename implementation（Issue #1069 本体で完了）
- tag physical delete / reactivate
- member drawer inline-create UI

## 参照

- `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `apps/api/src/routes/admin/tags.ts`

---

```yaml
status: consumed
consumed_at: 2026-06-06
canonical_workflow: docs/30-workflows/completed-tasks/issue-1116-admin-tag-master-code-edit-ui/
recovery_note: |
  Issue #1116 (= task-issue-1069-followup-001) was CLOSED before a canonical
  workflow root existed. This unassigned-task file is preserved for backward
  link integrity (Issue #1116 body links to this path). All Phase 1-13
  implementation specs have been migrated to the canonical workflow root above
  (spec_created). The CLOSED issue was optimized to the current codebase:
  /admin/tags is now the tag QUEUE, so the tag master CRUD uses a NEW sibling
  route /admin/tag-master (a child route would collide with the tag-queue nav
  item via isNavItemActive prefix matching). Future PR uses Refs #1116 only;
  the issue is NOT reopened.
```
