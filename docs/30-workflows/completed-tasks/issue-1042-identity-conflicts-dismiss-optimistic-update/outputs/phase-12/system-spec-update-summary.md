# Phase 12 / Task 12-2: システム仕様書更新サマリ

`[実装区分: 実装]` / `workflow_state: implemented_local_evidence_captured`

> 本タスクは automation-30 改善により **同一サイクルで実装済み**へ再分類した。Step 1-A〜1-C は実装完了の現状として記録し、Step 2 は新規インターフェース追加の有無で判定する（= N/A）。commit / push / PR は user-gated。

---

## Step 1 — タスク完了記録 + 状況テーブル + 関連タスク

### Step 1-A: タスク完了記録（implemented_local_evidence_captured・同期済み）

| 更新対象 | 内容 |
| --- | --- |
| 本 workflow `index.md` | `workflow_state: implemented_local_evidence_captured`。Phase 1-12 = completed、Phase 13 = `pending_user_approval` |
| 本 workflow `artifacts.json` / `outputs/artifacts.json` | `status: implemented_local_evidence_captured`。Gate-A / Gate-B passed、Gate-C pending |
| 関連ドキュメントリンク | 親 `issue-988-identity-conflicts-merge-optimistic-update`（merge 側・実装済み）/ 発見元 followup `admin-identity-conflicts-followup-006`（dismiss optimistic）を相互参照 |
| `aiworkflow-requirements` task ledger / artifact inventory / changelog / LOGS | Issue #1042 implemented local evidence を current fact として同期 |
| `task-specification-creator` feedback | 新規 rule は不要。既存「implementation target 明確時は同一 wave でコード・tests・Phase 11・Phase 12 を揃える」ルールで吸収 |

> LOGS は workflow-local（本 workflow `outputs`）と global skill（`.claude/skills/.../LOGS`）の 2 系統に記録する（BEFORE-QUIT-003）。topic-map は `pnpm indexes:rebuild` で冪等同期する。

### Step 1-B: 実装状況テーブル

| 機能 | 状況 |
| --- | --- |
| dismiss optimistic（操作直後に row 非表示） | `implemented_local_evidence_captured` |
| server error 時 rollback（row 復元 + `dismissReason` 保持 + inline error） | `implemented_local_evidence_captured` |
| render guard 統合（`optimisticMerged || optimisticDismissed`） | `implemented_local_evidence_captured`（state は分離・合流は guard のみ） |
| merge 側挙動（#988） | 不変（非回帰確認のみ対象） |

> 本ワークフローは `implemented_local_evidence_captured`。focused vitest / Playwright / screenshot 取得は完了。commit / push / PR は user-gated。

### Step 1-C: 関連タスクテーブル（current facts）

| 関連タスク / Issue | ステータス | 関係 |
| --- | --- | --- |
| Issue #1042（FU-AIDC-006） | **CLOSED**（2026-06-01 調査時点） | 本ワークフローの起点。open/close は変更しない（CLOSED 維持） |
| Issue #988（merge 側） | `implemented`（merge optimistic 実装済み） | 親 workflow。本タスクは dismiss 経路を対称追加 |
| `admin-identity-conflicts-followup-005-row-fade-animation` | 別 followup（未起票候補） | row fade animation は issue 本文が明示的に別 followup へ分離宣言。本サイクル対象外 |
| `admin-identity-conflicts-prototype-alignment-and-404-fix`（祖先サイクル） | completed | UI primitives 整合のみ。optimistic 化は子サイクルへ分離済み |

---

## Step 2 — システム仕様（新規インターフェース）更新判定

| 判定軸 | 結果 |
| --- | --- |
| 新規インターフェース / 型の追加 | なし（`optimisticDismissed: boolean` は component-local state） |
| 既存インターフェースの変更 | なし（`useAdminMutation` の signature 不変、dismiss trigger payload 不変） |
| 新規定数 / 設定値の追加 | なし |
| API 仕様の変更 | なし（既存 dismiss endpoint・payload 不変） |

→ **Step 2 は N/A**。aiworkflow-requirements の interfaces / api-ipc 系正本仕様の更新は不要。

### docs-only → code 再判定ルールの確認

本タスクは当初から code 変更を伴う implementation task（docs-only ではない）。automation-30 改善で実コード差分を同一サイクルに反映した。新規 IF は発生せず component-local state のみで完了したため、Step 2 は N/A のまま維持する。

## 完了条件

- Step 1-A / 1-B / 1-C / Step 2 の各テーブルが記載されていること。
- Step 2 が N/A（新規 IF なし = component-local state のみ）と判定されていること。
- `workflow_state` が `implemented_local_evidence_captured` として一貫していること。
