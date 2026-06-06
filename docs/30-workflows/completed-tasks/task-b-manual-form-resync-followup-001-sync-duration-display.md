# Task B follow-up: 手動 Form 再取込 結果への取込所要時間 (durationMs) 表示

## メタ情報

```yaml
issue_number: 1088
source_workflow: docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/
task_id: task-b-manual-form-resync-followup-001-sync-duration-display
status: unassigned
priority: low
labels:
  - priority:low
  - type:followup
  - type:improvement
  - area:admin-ui
  - area:web
  - scale:small
  - wave:2-plus
governance_mutation_user_gate: false
```

| 項目 | 内容 |
| --- | --- |
| タスク名 | 手動 Form 再取込 結果テーブルへの取込所要時間 (`durationMs`) 表示 |
| 分類 | follow-up / UI improvement |
| 対象機能 | Admin 手動 Google Form 再取込パネル (`ManualFormResyncPanel`) |
| 優先度 | Low |
| 見積もり規模 | Small |
| 発見元 | Task B Phase 10/12 の将来UX改善候補-1 |
| 発見日 | 2026-06-01 |

---

## 1. 概要

Task B（手動 Google Form 再取込 管理UI・commit `745c95115` / PR #1064 で landed 済み）では、`ManualFormResyncPanel.client.tsx` が再取込実行後の結果を `<dl>` 表で `mode` / `status` / `jobId` / `processedCount` / `writeCount` / `cursor` として表示する。

この follow-up では、運用者が再取込の負荷感・進行状況を把握しやすくするため、結果表に取込所要時間 (`durationMs`) の表示行を追加する。Task B 本体機能は既に成立しているため、これは結果可視化の操作性改善に限定する。

## 2. 背景

Task B の Phase 10/12 では、結果テーブルに取込所要時間 (`durationMs`) を表示する案が「将来UX改善候補-1」として記録された。一方、Task B 本体は「`apps/api` 差分ゼロ」invariant を堅持する前提だったため、backend 拡張を伴う本案は本体実装からは除外された。

本タスクはその判断を維持しつつ、後続で UI + backend 改善として扱えるように独立仕様化する。

## 3. 目的

- `/admin` の手動 Form 再取込パネルで、再取込の取込所要時間 (`durationMs`) を運用者が確認できる。
- 既存の `mode` / `status` / `jobId` / `processedCount` / `writeCount` / `cursor` 表示、`SyncResultSchema` の `.strict()` 契約、409 skipped 系の表示を壊さない。
- 値の供給源が backend である事実を明示し、UI だけの見た目追加で終わらせない（後述の苦戦箇所参照）。

## 4. 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | `POST /admin/sync/responses`（apps/api 側）のレスポンス `result` に取込所要時間（`durationMs`、または開始/終了時刻）が含まれる |
| AC-2 | `apps/web/src/features/admin/diagnostics/manual-sync.ts` の `SyncResultSchema` に `durationMs` フィールドが追加され、`.strict()` 契約を満たす |
| AC-3 | `ManualFormResyncPanel.client.tsx` の結果 `<dl>` 表に `durationMs` 行が追加され、実際に backend から供給された値が表示される（常に undefined にならない） |
| AC-4 | 既存の `mode` / `status` / `jobId` / `processedCount` / `writeCount` / `cursor` 表示、409 skipped 系メッセージが退化しない |
| AC-5 | `ManualFormResyncPanel.spec.tsx`（TC-B1..B8）, `sync-schemas.spec.ts`（TC-S1..S7）が green |

## 苦戦箇所【記入必須】

- 対象（UI）: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260601-152351-wt-14/apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx`
- 対象（contract）: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260601-152351-wt-14/apps/web/src/features/admin/diagnostics/manual-sync.ts`
- 対象（backend producer）: `apps/api` 側 `POST /admin/sync/responses` の sync use-case / `SyncResult` 生成箇所
- 症状: `durationMs` の値の供給源は backend（`apps/api` の sync use-case / `SyncResult`）であり、UI 側で `SyncResultSchema` に optional `durationMs` を足して `<dl>` に表示行を追加するだけでは値が常に `undefined` になる。現状の `SyncResultSchema` は `status` / `jobId` / `processedCount` / `writeCount` / `cursor` / optional `skippedReason` のみで `durationMs` は存在せず、`POST /admin/sync/responses` も所要時間を返していない。実際に時間を可視化するには apps/api 側レスポンスに `durationMs`（または開始/終了時刻）を載せる backend 拡張が前提になる。これは Task B 本体が堅持した「`apps/api` 差分ゼロ」invariant を超えるため、本タスクは backend 拡張と UI 拡張が両輪で必要になる点が落とし穴。さらに `SyncResultSchema` は `.strict()` のため、backend が `durationMs` を返すのに schema 側で受けていないと parse エラーになり、両側の変更順序にも注意が要る。
- 参照: `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/phase-10.md`, `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| UI だけ `durationMs` 行を足し、backend が値を返さないため常に `undefined` になる | 高 | backend (`apps/api` の `POST /admin/sync/responses` / sync use-case) で `durationMs` を計測・返却する拡張を前提とし、UI と同一タスクで両輪実装する |
| `SyncResultSchema` の `.strict()` により backend 追加フィールドで parse エラーになる | 高 | schema 側に `durationMs` を追加してから backend 返却を有効化する（または optional で先行追加し順序差を吸収する） |
| Task B が堅持した「`apps/api` 差分ゼロ」invariant を踏み越える | 中 | 本タスクは backend 拡張を含む improvement として明示的に扱い、Task B 本体の NON_VISUAL/差分ゼロ判断とは分離して記録する |
| 結果 `<dl>` 表に行が増えてレイアウトが崩れる | 低 | 既存 `mode` / `status` 等と同じ `<dt>`/`<dd>` パターンを踏襲し、値欠落時は `-` フォールバックで描画する |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx \
  src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
```

期待: `durationMs` 表示行、既存 `mode`/`status`/`jobId`/`processedCount`/`writeCount`/`cursor` 表示、`SyncResultSchema` の `durationMs` 受理（`.strict()` 維持）、409 skipped 系メッセージがすべて PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
```

期待: web / api 双方の typecheck / lint が green。backend で `durationMs` を返す前提のため、本タスクでは `apps/api` 差分が発生する点が Task B 本体と異なる。

## スコープ

### 含む

- `apps/api` 側 `POST /admin/sync/responses` の sync use-case / `SyncResult` への `durationMs`（または開始/終了時刻）計測・返却の追加
- `apps/web/src/features/admin/diagnostics/manual-sync.ts` の `SyncResultSchema` への `durationMs` フィールド追加（`.strict()` 維持）
- `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` の結果 `<dl>` 表への `durationMs` 表示行追加
- `ManualFormResyncPanel.spec.tsx`（TC-B1..B8）/ `sync-schemas.spec.ts`（TC-S1..S7）への回帰テスト追加
- Task B Phase 12 実装ガイドとの参照関係記録

### 含まない

- apps/api を勝手に変えない場合、UI だけの `durationMs` 行追加は値が常に `undefined` になり無意味になる（=本タスクは backend 拡張を必須とする）
- D1 migration / `sync_jobs` 等の schema 変更、Google Form schema 変更
- `durationMs` 以外の新規メトリクス（writeRate 等）の追加
- staging / production deploy、commit、push、PR 作成（すべて user-gated）

## 参照

- `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/phase-10.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-task-b-manual-form-resync-admin-ui-spec-artifact-inventory.md`
