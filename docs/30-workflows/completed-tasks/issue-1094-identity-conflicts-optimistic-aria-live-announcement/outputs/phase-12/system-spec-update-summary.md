# Phase 12 / Task 12-2: システム仕様書更新サマリ

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 本タスクは Phase 1-13 の実装仕様書として作成後、automation-30 改善で local 実装・focused evidence・aiworkflow 正本同期まで完了した。Step 1-A〜1-C は implemented local evidence として same-wave 同期し、Step 2 は新規インターフェース追加として反映した。

---

## Step 1 — タスク完了記録 + 状況テーブル + 関連タスク

### Step 1-A: タスク完了記録（same-wave 更新対象）

| 更新対象 | 内容 | implemented local evidence の扱い |
| --- | --- | --- |
| 本 workflow `index.md` | `workflow_state: implemented_local_evidence_captured`。Phase 1-12 を完了、Phase 13 を external ops pending として記録 | 本サイクルで同期済み |
| 本 workflow `artifacts.json` / `outputs/artifacts.json` | `status: implemented_local_evidence_captured` を同期。Gate-A=passed / Gate-B=passed / Gate-C=pending として記録 | 本サイクルで同期 |
| `aiworkflow-requirements` changelog / task-workflow-active / quick-reference / resource-map / artifact inventory | Issue #1094（FU-AIDC-008）を implemented local evidence として登録 | 本サイクルで同期 |
| `task-specification-creator` feedback | page-level live region 集約（row-local → 単一 region・append-children）の a11y spec 知見を記録 | 本 workflow の skill-feedback に記録。即時 skill 本体更新は不要 |

> focused Vitest / typecheck / lint / token gate / 撤去 grep は本サイクルで取得済み。commit / push / PR / Issue mutation / staging 手動 SR 検証のみ user-gated。

### Step 1-B: 実装状況テーブル（`implemented_local_evidence_captured`）

| 機能 | 状況 |
| --- | --- |
| ページレベル単一 live region（`IdentityConflictAnnouncer`・append-children） | 実装済み |
| 文言の単一導出（`identityConflictAnnouncements.ts` / `announcementFor`） | 実装済み |
| row 側 focus 奪取撤去 + `hasAnnouncedRef` 1回固定 / rollback reset | 実装済み |
| `page.tsx` の `IdentityConflictAnnouncer` ラップ（Server→client children） | 実装済み |
| rollback error（`role="alert"`）非回帰 | 不変（変更対象外） |
| dismiss 側挙動 | merge と共通の announce 経路を使い、文言は `announcementFor("dismiss")` から導出 |

> Local evidence: focused Vitest 2 files / 26 tests PASS、web typecheck PASS、web lint PASS、verify:tokens PASS、撤去 grep 0 件。

### Step 1-C: 関連タスクテーブル（current facts へ更新）

| 関連タスク / Issue | ステータス | 関係 |
| --- | --- | --- |
| Issue #1094（FU-AIDC-008） | **CLOSED**（closed 2026-06-04T22:10:15Z） | 本ワークフローの起点。Issue mutation は実行しない（CLOSED のまま） |
| Issue #1042（dismiss optimistic update） | completed-tasks 配下 | 親ワークフロー（dismiss optimistic）。本タスクの dismiss announce はこの上に乗る a11y 差分 |
| Issue #988（merge optimistic update） | completed-tasks 配下 | 親ワークフロー（merge optimistic）。本タスクの merge announce はこの上に乗る a11y 差分 |
| Issue #1043（row fade animation・FU-AIDC-007） | 別タスク（独立・構成 reference） | 兄弟 followup。row 退場 fade と本タスク（aria-live 集約）は別関心。本タスクの phase-12 構成 reference |
| `admin-identity-conflicts-followup-006-optimistic-aria-live-announcement`（発見元 unassigned spec） | 本 issue-1094 ワークフローへ昇格 | 発見元。PR/Issue close cycle で consumed trace 化する（実装 close-out 時） |

---

## Step 2 — システム仕様（新規インターフェース）更新判定

| 判定軸 | 結果 |
| --- | --- |
| 新規インターフェース / 型の追加 | **あり**。`IdentityConflictAction`（export 型）、`IDENTITY_CONFLICT_ANNOUNCEMENTS`（export const）、`announcementFor`（export 関数）、`IdentityConflictAnnouncer`（公開 component）、`useIdentityConflictAnnounce`（公開 hook）、`ANNOUNCE_TTL_MS`（export 定数） |
| 既存インターフェースの変更 | なし（`useAdminMutation` の signature 不変、trigger payload 不変、API 不変） |
| 新規定数 / 設定値の追加 | `ANNOUNCE_TTL_MS = 1000`（component module-local だが export される定数） |
| API 仕様の変更 | なし（既存 endpoint・payload 不変） |
| design token / keyframes の追加 | なし（live region は sr-only。`tokens.css` / `globals.css` 不変） |

→ **Step 2 は「新規インターフェース追加に該当」し、本サイクルで aiworkflow-requirements へ同期済み**。

### Step 2 の同期結果

- 本タスクは新規 export 型 `IdentityConflictAction` と公開 component `IdentityConflictAnnouncer` / hook `useIdentityConflictAnnounce`（+ `announcementFor` / `ANNOUNCE_TTL_MS`）を追加するため、**新規インターフェース追加に該当する**。
- aiworkflow-requirements の task-workflow-active / quick-reference / resource-map / artifact inventory / changelog へ以下を反映済み:
  - `IdentityConflictAnnouncer` / `useIdentityConflictAnnounce` の公開シグネチャと「row-local → page-level 単一 region 集約 + append-children」パターン
  - `IdentityConflictAction` / `announcementFor` による文言単一導出（`Record` キー網羅性の型保証）
  - `ANNOUNCE_TTL_MS` の TTL 自動除去設計と provider 外 no-op fallback
- FormField / IPC / API / D1 正本は本タスクで変更しない。

### docs-only → code 再判定ルールの確認

本タスクは当初から code 変更を含む implementation task（docs-only ではない・CONST_004 判定で実装仕様書）。今回の automation-30 改善で、実コード・focused tests・Phase 11/12・aiworkflow 正本同期まで完了したため、`spec_created` のまま閉じる不整合は解消済み。
