# Phase 12 / Task 12-2: システム仕様書更新サマリ

`[実装区分: 実装完了]` / `workflow_state: implemented_local_evidence_captured`

> 本タスクは apps/web の実コード差分と focused component evidence まで同一サイクルで完了した。Step 1-A〜1-C は implemented local close-out として same-wave 同期し、Step 2 は新規公開インターフェース追加の有無で判定する。

---

## Step 1 — タスク完了記録 + 状況テーブル + 関連タスク

### Step 1-A: タスク完了記録（same-wave 更新対象）

| 更新対象 | 内容 |
| --- | --- |
| 本 workflow `index.md` | `workflow_state: implemented_local_evidence_captured`。Phase 1-12 を completed、Phase 13 を blocked として記録 |
| 本 workflow `artifacts.json` / `outputs/artifacts.json` | `status: implemented_local_evidence_captured` を同期。Gate-A=passed（spec authoring）、Gate-B=passed（local implementation + focused test）、Gate-C=pending（PR ゲート）として記録 |
| `aiworkflow-requirements` LOGS / ledger | Issue #1080（= `task-issue-1036-followup-004`）を implemented local fact として登録 |
| `task-specification-creator` LOGS | bulk result summary の表示名解決（親保持 list から `membersById` optional 注入 + UI 側 `tagLabelById` 解決 + nullish fallback）実装知見を記録 |

> local fixture screenshot は保存済み。staging authenticated screenshot、commit、PR、Issue mutation は user-gated。

### Step 1-B: 実装状況テーブル

| 機能 | 状況 |
| --- | --- |
| skipped 行の member 表示名（fullName）表示（AC-1） | implemented（`membersById?.[memberId]?.fullName ?? memberId`） |
| notFound 行の tag label 表示 / 未解決時 `{tagId}（未登録）`（AC-2） | implemented（`tagLabelById.get(tagId) ?? ...`） |
| API response shape `{memberId,tagId,status}` 維持（AC-3） | implemented（apps/api 非接触） |
| 表示名なし memberId fallback（AC-4） | implemented |
| component test（AC-5） | PASS（`BulkActionBar.spec.tsx` 12 tests） |

> typecheck / lint は Phase 12 close-out で実行結果を記録する。local screenshot は Phase 11 に保存済み。staging screenshot は optional user-gated。

### Step 1-C: 関連タスクテーブル（current facts へ更新）

| 関連タスク / Issue | ステータス | 関係 |
| --- | --- | --- |
| Issue #1080（= `task-issue-1036-followup-004`） | **OPEN**（調査時点で実状態 OPEN・状態変更しない） | 本ワークフローの起点。Issue mutation は実行しない |
| Issue #1036（bulk member tag assign・親） | completed-tasks 配下 | 親ワークフロー。本タスクはその result summary 表示を表示名化する差分 |
| `#1077`（= followup-001・staging 認証付き visual baseline） | 別タスク（独立） | 兄弟 followup。staging 認証付き visual 基盤を提供。本タスクの optional staging baseline 取得時に将来流用するが新規起票しない |
| `#1078`（= followup-002・large catalog UX） | 別タスク（独立） | tag picker 側 UX。result summary 非接触で重複なし |
| `#1079`（= followup-003・audit batch filter） | 別タスク（独立） | audit viewer / API 側。本タスクと別関心で重複なし |
| `task-issue-1036-followup-004-bulk-tag-result-member-labels`（発見元 unassigned spec） | 本 issue-1080 ワークフローへ昇格 | 発見元。PR/Issue close cycle で consumed trace 化する |

---

## Step 2 — システム仕様（新規インターフェース）更新判定

| 判定軸 | 結果 |
| --- | --- |
| 新規公開インターフェース / 型の追加 | なし（`membersById?` は `BulkActionBarProps` の **component-local props 契約**であり、公開 system interface ではない） |
| 既存インターフェースの変更 | なし（`BulkApplyMemberTagsResult` / `BulkTagResultItem` / `AdminTagRef` / `fetchTagMaster` シグネチャ不変） |
| 新規定数 / 設定値の追加 | なし（`tagLabelById` / `membersById` は component-local 派生値） |
| API 仕様の変更 | なし（既存 endpoint `POST /api/admin/members/tags/bulk`・payload・result shape `{memberId,tagId,status}` 不変・AC-3） |
| design token / keyframes の追加 | なし（表示テキストのみ変更・既存 `var(--ubm-color-*)` 維持） |

→ **Step 2 は N/A**。`membersById?` は optional prop（**破壊的でない型拡張**・既存呼び出し側は未注入で従来どおり動作）であり、aiworkflow-requirements の interfaces / api-ipc 系正本仕様の更新は不要。design-tokens.md（OKLch 正本）の更新も不要。

### docs-only → code 再判定ルールの確認

本タスクは当初から code 変更を含む implementation task（docs-only ではない・CONST_004 判定）。実装後も新規公開 IF は発生せず、component-local props 拡張 + UI 表示変更のみで完了したため、Step 2 は N/A のまま維持する。
