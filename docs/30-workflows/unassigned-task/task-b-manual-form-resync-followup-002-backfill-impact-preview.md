# Task B follow-up: 全件 backfill 実行前の影響件数プレビュー

## メタ情報

```yaml
issue_number: 1089
source_workflow: docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/
task_id: task-b-manual-form-resync-followup-002-backfill-impact-preview
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
| タスク名 | 全件 backfill 実行前の影響件数プレビュー |
| 分類 | follow-up / UI improvement |
| 対象機能 | Admin 手動 Google Form 再取込パネル (`ManualFormResyncPanel`) |
| 優先度 | Low |
| 見積もり規模 | Small |
| 発見元 | Task B Phase 10/12 の将来UX改善候補-2 |
| 発見日 | 2026-06-01 |

---

## 1. 概要

Task B（手動 Google Form 再取込 管理UI・commit `745c95115` / PR #1064 で landed 済み）では、管理者が `ManualFormResyncPanel.client.tsx` から差分 sync（`?fullSync=false`）と全件 backfill（`?fullSync=true`）を起動できる。全件 backfill ボタンは `variant=danger` / `data-testid="manual-sync-backfill"` であり、実行時は `globalThis.confirm` のブラウザ標準ダイアログで承認を取ってから `POST /admin/sync/responses` を呼ぶ。

この follow-up では、その確認ステップを「これから何件が影響を受けるか」を提示した上での承認に強化する操作性改善を独立仕様化する。根本機能（再取込そのもの）は既に成立しているため、本タスクは confirm 前のプレビュー UX に限定する。

## 2. 背景

Task B の Phase 10/12 で、全件 backfill は破壊的になりうる操作（`variant=danger`）でありながら、実行前に管理者へ提示できるのは標準 confirm ダイアログの固定文言（「Google Forms 回答を fullSync=true で再取込します。実行しますか?」）だけで、件数の事前提示が無いことが「将来UX改善候補-2」として記録された。

一方 Phase 3 §5 の設計判断 D7（confirm）では、`globalThis.confirm` 直接採用・自前 dialog は over-scope のため不採用、と確定している。本タスクはその判断との整合を取りつつ、後続で件数プレビューを追加できるように分離仕様化する。

## 3. 目的

- 管理者が全件 backfill を承認する前に、影響を受ける見込み件数を確認できる。
- 既存の差分 sync（`?fullSync=false`）/ 全件 backfill（`?fullSync=true`）の実行契約と `SyncResultSchema` を壊さない。
- Task B 本体の「apps/api 差分ゼロ」invariant および D7（自前 dialog 不採用）判断との衝突点を、本タスク着手時に明示的に再評価する。

## 4. 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | 全件 backfill 承認フローの前段に、影響を受ける見込み件数（または「件数取得不可」明示）が表示される |
| AC-2 | プレビューに表示する件数は backend の dry-run / count-only 経路から取得した実数であり、UI 側の推定値ではない |
| AC-3 | 既存の差分 sync（`?fullSync=false`）/ 全件 backfill（`?fullSync=true`）→ `POST /admin/sync/responses` 呼び出しと `SyncResultSchema`（status/jobId/processedCount/writeCount/cursor + optional skippedReason）が退化しない |
| AC-4 | confirm キャンセル相当の操作で backfill が実行されない（現 TC-B3 相当の不実行保証を維持） |
| AC-5 | `ManualFormResyncPanel.spec.tsx`（TC-B1..B8、特に全件 confirm 承認を検証する TC-B2）が green、または件数プレビュー導入に合わせて TC-B2 が更新されても等価の承認保証を担保する |

## 苦戦箇所【記入必須】

- 対象:
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260601-152351-wt-14/apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx`
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260601-152351-wt-14/apps/web/src/features/admin/diagnostics/manual-sync.ts`
  - `apps/api` 側 `POST /admin/sync/responses` ハンドラ（dry-run / count 経路の有無調査対象）
- 症状（核心の制約）: 「実行前に影響件数を出す」には backend 側に dry-run / count-only 経路（例 `?dryRun=true` か別 count endpoint）が必要だが、現 `POST /admin/sync/responses` にはそれが提供されていない。UI 側だけで件数を推定すると実数と乖離し、`variant=danger` の confirm の信頼性をかえって損なう。また現状の確認は `globalThis.confirm` の標準ダイアログ（固定文言）で、件数付きプレビューにするには自前 dialog コンポーネント化が必要になり、Task B 本体が Phase 3 §5 D7 で「自前 dialog は over-scope のため不採用」とした判断と衝突する。
- したがって本タスクの落とし穴は次の3点で、着手時に必ず順に評価する:
  - (a) backend dry-run / count-only 経路の有無調査（`POST /admin/sync/responses` の現実装を確認し、件数のみ返す経路が無いことを再確認する）。
  - (b) 採用する場合の apps/api 拡張。これは Task B 本体の「apps/api 差分ゼロ」invariant を超えるため、本タスクは apps/api 変更を伴う改善として明示的に切り出す必要がある。
  - (c) `globalThis.confirm` 置換範囲。件数プレビューを confirm 文言に埋め込む（最小・D7 整合）か、自前 dialog 化する（D7 と衝突・要再判断）かの選択。
- 参照: `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/phase-3.md`（§5 設計判断 D7）, `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/phase-10.md`, `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| backend に count / dry-run 経路が無いまま UI 側で件数を推定する | 高 | UI 推定値を表示しない。実数を返す backend 経路が無い場合は「件数取得不可」を明示し、件数プレビューは backend 拡張完了後に限る（AC-2） |
| apps/api 拡張が Task B の「apps/api 差分ゼロ」invariant を破る | 中 | 本タスクを apps/api 変更を含む改善として独立スコープ化し、`POST /admin/sync/responses` の既存 request/response 契約を後方互換に保つ（`?dryRun=true` 等の opt-in 経路として追加） |
| 自前 dialog 化が Phase 3 §5 D7（dialog 不採用）と衝突する | 中 | まず confirm 文言への件数埋め込み（最小・D7 整合）を第一候補とし、自前 dialog 化が必要な場合は D7 を本タスクで明示的に再判断してから採用する |
| 差分 sync / 全件 backfill の実行契約退化 | 高 | `?fullSync=false` / `?fullSync=true` の URL 契約と `SyncResultSchema` を不変に保ち、TC-B1..B8 を回帰として維持する（AC-3/AC-4/AC-5） |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx
```

期待: TC-B1..B8 が PASS。特に TC-B2（全件 confirm 承認後に `?fullSync=true` で実行）と confirm キャンセル時の不実行保証が、件数プレビュー導入後も等価に担保される。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

期待: typecheck / lint が green。backend count / dry-run 経路を追加する場合は `apps/api` の差分が発生するため、その差分は本タスクのスコープとして許容する（Task B 本体の apps/api 差分ゼロ invariant とは分離）。

## スコープ

### 含む

- `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` の全件 backfill 承認フローへの件数プレビュー追加
- `apps/web/src/features/admin/diagnostics/manual-sync.ts` の count / dry-run レスポンス契約（必要な場合の追加・既存 `SyncResultSchema` は不変）
- backend dry-run / count-only 経路の有無調査と、採用時の `apps/api` `POST /admin/sync/responses` への opt-in 経路追加
- `ManualFormResyncPanel.spec.tsx` の回帰・追加テスト
- Phase 3 §5 D7（自前 dialog 不採用）の本タスク内での再判断記録

### 含まない

- D1 migration / Google Form schema 変更
- 差分 sync / 全件 backfill の既存 URL 契約（`?fullSync=false` / `?fullSync=true`）と `SyncResultSchema` の破壊的変更
- `apps/web/app/api/admin/[...path]/route.ts` の `SYNC_ADMIN_TOKEN` server-only 注入経路の変更
- commit / push / PR 作成 / staging / production deploy（すべて user-gated）

## 参照

- `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/phase-10.md`
- `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/phase-3.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-task-b-manual-form-resync-admin-ui-spec-artifact-inventory.md`
