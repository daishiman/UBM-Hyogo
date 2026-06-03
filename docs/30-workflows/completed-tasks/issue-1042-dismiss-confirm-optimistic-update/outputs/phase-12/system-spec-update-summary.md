**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 12 / Task 12-2: システム仕様書更新サマリ

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 本タスクは component-local state の dismiss optimistic 化を扱う。Step 1-A〜1-C は current facts として同一サイクルで同期した。Step 2 は新規インターフェース追加の有無で判定する。

---

## Step 1 — タスク完了記録 + 状況テーブル + 関連タスク

### Step 1-A: タスク完了記録

| 更新対象 | 内容 |
| --- | --- |
| 本 workflow `index.md` | `workflow_state` を `implemented_local_evidence_captured` へ更新し、Phase 11 に local evidence + visual screenshots captured を明示 |
| 本 workflow `artifacts.json` / `outputs/artifacts.json` | `status` と Gate-B を実体へ同期。Phase 13 は `pending_user_approval` のまま維持（user-gated） |
| `aiworkflow-requirements` LOGS / indexes / active ledger | Issue #1042 を current fact として登録 |
| `task-specification-creator` LOGS | merge optimistic の dismiss 側 mirror 実装完了例として記録 |

### Step 1-B: 実装状況テーブル

| 機能 | 状況 |
| --- | --- |
| dismiss optimistic（操作直後に row 非表示） | `implemented_local_evidence_captured` |
| server error 時 rollback（row 復元 + inline error + 理由保持） | `implemented_local_evidence_captured` |
| merge 側挙動（`optimisticMerged`） | 不変（#1046 で実装済み・変更対象外） |

> focused Vitest / Playwright / screenshot は本サイクルで取得済み。

### Step 1-C: 関連タスクテーブル

| 関連タスク / Issue | ステータス | 関係 |
| --- | --- | --- |
| Issue #1042（FU-AIDC-006） | **OPEN**（2026-06-01 調査時点） | 本ワークフローの起点。open/close は変更しない |
| Issue #988 / PR #1046（merge optimistic） | completed（commit `f6faeb005`） | 本タスクの mirror 元。merge 側はすでに `optimisticMerged` で実装済み |
| `admin-identity-conflicts-followup-005-row-fade-animation` | 分離済み（別 Issue） | row 消失時の fade animation は本タスクのスコープ外。formalize 0 件（`unassigned-task-detection.md`） |
| `#987` audit log medium（identity-conflicts 系） | 別タスク継続 | 監査ログ領域。dismiss optimistic とは別関心 |

---

## Step 2 — システム仕様（新規インターフェース）更新判定

| 判定軸 | 結果 |
| --- | --- |
| 新規インターフェース / 型の追加 | なし（`optimisticDismissed: boolean` は component-local state） |
| 既存インターフェースの変更 | なし（`useAdminMutation` の signature 不変、dismiss trigger payload `{ reason }` 不変、`onDismiss` シグネチャ不変） |
| 新規定数 / 設定値の追加 | なし |
| API 仕様の変更 | なし（既存 endpoint `/dismiss`・payload 不変） |

→ **Step 2 は N/A**。aiworkflow-requirements の interfaces / api-ipc 系正本仕様の更新は不要。

### docs-only → code 再判定ルールの確認

本タスクは当初から code 変更を含む implementation task（docs-only ではない）。dismiss optimistic 化は component-local state 追加 + render guard 統合のみで、新規 IF は発生しないため Step 2 は N/A のまま維持する。
