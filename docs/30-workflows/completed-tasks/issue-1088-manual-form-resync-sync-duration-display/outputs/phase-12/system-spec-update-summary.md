# System Spec Update Summary — issue-1088 manual form resync durationMs

**[実装区分: 実装仕様書 / implementation_mode: new / VISUAL_ON_EXECUTION]**

issue #1088（管理パネル「フォーム回答の再取込」結果テーブルに取込所要時間 `durationMs` 表示行を追加）。本サイクルで local 実装・focused tests・typecheck/lint は完了。commit・PR・runtime screenshot・issue 状態変更は user-gated。

---

## Step 1-A — 完了タスクの記録（same-wave 更新手順）

- **完了タスク記録**: aiworkflow-requirements の task-workflow-active / quick-reference / resource-map / artifact inventory に本 workflow を `implemented_local_evidence_captured` で登録する。
- **関連ドキュメントリンク**:
  - 親仕様: `docs/30-workflows/completed-tasks/task-b-manual-form-resync-followup-001-sync-duration-display.md`
  - 元 issue: GitHub #1088（OPEN）
  - producer 実体: `apps/api/src/jobs/sync-forms-responses.ts`
  - UI schema: `apps/web/src/features/admin/diagnostics/manual-sync.ts`
  - UI 表示: `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx`
- **変更履歴**: aiworkflow-requirements / task-specification-creator の changelog と workflow LOGS へ issue-1088 エントリを追加する。
- **topic-map**: aiworkflow-requirements `indexes/topic-map.md` を `pnpm indexes:rebuild` で再生成し、新規 term（durationMs / manual form resync）を反映する。

## Step 1-B — 実装状況テーブル

| 項目 | 状態 |
|---|---|
| workflow_state | `implemented_local_evidence_captured` |
| Gate-A（設計レビュー） | passed |
| Gate-B（実装） | passed（local） |
| Gate-C（PR） | pending（user-gated） |
| code 変更 | 実施済み（`apps/api` / `apps/web`） |
| issue #1088 | OPEN（変更しない） |

> Runtime screenshot / commit / PR / Issue mutation は Gate-C user-gated として分離する。

## Step 1-C — 関連タスク

- 親: `task-b-manual-form-resync-admin-ui-spec`（manual form resync 管理 UI）の followup-001。
- 元 issue: #1088。
- 上流依存: なし（durationMs は新規・未実装で他タスクでも未解決）。

---

## Step 2 — system spec 更新（**更新要**）

新規フィールド 2 件を追加する。endpoint path・認証境界・既存フィールドは **不変**。

### 追加フィールド 1: `ResponseSyncResult.durationMs`

| 属性 | 値 |
|---|---|
| 配置 | `apps/api/src/jobs/sync-forms-responses.ts`（公開戻り値型 `ResponseSyncResult`） |
| 型 | `readonly durationMs: number;`（必須） |
| 意味 | `runResponseSync` の経過時間（ミリ秒）。`now().getTime()` 差分。 |
| 経路 | succeeded / failed / skipped の 3 return すべてで返却 |

### 追加フィールド 2: `SyncResult` / `SyncResultSchema.durationMs`

| 属性 | 値 |
|---|---|
| 配置 | `apps/web/src/features/admin/diagnostics/manual-sync.ts`（UI zod schema） |
| 型 | `durationMs: z.number().int().nonnegative().optional()` |
| 意味 | UI 受信用。後方互換のため optional。`.strict()` 維持。 |
| 表示 | `ManualFormResyncPanel.client.tsx` `resultRows()` に `["durationMs", result.durationMs ?? "-"]` 行追加 |

### 不変項目（変更しない）

- endpoint path（`POST /admin/responses/sync`・route pass-through）
- 認証境界（admin 認証要件）
- 既存フィールド（status / jobId / processedCount / writeCount / cursor / skippedReason / error）
- D1 schema（migration なし）
- Google Form schema
