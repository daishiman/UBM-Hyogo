# Phase 12 / Task 12-2: システム仕様書更新サマリ

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 本タスクは component-local state の実装完了まで同一サイクルで反映した。Step 1-A〜1-C は current facts として同期し、Step 2 は新規インターフェース追加の有無で判定する。

---

## Step 1 — タスク完了記録 + 状況テーブル + 関連タスク

### Step 1-A: タスク完了記録（same-wave 更新対象）

| 更新対象 | 内容 |
| --- | --- |
| 本 workflow `index.md` | `workflow_state: implemented_local_evidence_captured` へ更新。Phase 11 は local evidence + visual screenshots captured を明示 |
| 本 workflow `artifacts.json` / `outputs/artifacts.json` | `status` を実体へ同期。Phase 13 は `pending_user_approval` のまま維持（user-gated） |
| `aiworkflow-requirements` LOGS / indexes / active ledger | Issue #988 を current fact として登録 |
| `task-specification-creator` LOGS | spec-only close-out から implementation wave へ再分類した知見を記録 |

### Step 1-B: 実装状況テーブル

| 機能 | 状況 |
| --- | --- |
| merge optimistic（操作直後に row 非表示） | `implemented_local_evidence_captured` |
| server error 時 rollback（row 復元 + inline error） | `implemented_local_evidence_captured` |
| dismiss 側挙動 | 不変（変更対象外） |

> focused Vitest 1 file / 10 tests PASS。Playwright desktop 8 tests PASS。visual screenshot は `VISUAL_ON_EXECUTION` evidence として 3 枚取得済み。

### Step 1-C: 関連タスクテーブル（current facts へ更新）

| 関連タスク / Issue | ステータス | 関係 |
| --- | --- | --- |
| Issue #988 | **OPEN**（2026-05-29 調査時点） | 本ワークフローの起点。open/close は変更しない |
| `admin-identity-conflicts-followup-002-merge-confirm-optimistic-update` | 本 issue-988 ワークフローへ昇格・実装済み | 発見元 unassigned spec。本サイクルで consumed trace 化 |
| `admin-identity-conflicts-prototype-alignment-and-404-fix`（親サイクル） | completed | optimistic 化は本サイクルへ分離済み |
| `#990` identity-conflicts prototype alignment | completed | UI primitives 整合のみ。optimistic 化は含まず |

---

## Step 2 — システム仕様（新規インターフェース）更新判定

| 判定軸 | 結果 |
| --- | --- |
| 新規インターフェース / 型の追加 | なし（`optimisticMerged: boolean` は component-local state） |
| 既存インターフェースの変更 | なし（`useAdminMutation` の signature 不変、trigger payload 不変） |
| 新規定数 / 設定値の追加 | なし |
| API 仕様の変更 | なし（既存 endpoint・payload 不変） |

→ **Step 2 は N/A**。aiworkflow-requirements の interfaces / api-ipc 系正本仕様の更新は不要。

### docs-only → code 再判定ルールの確認

本タスクは当初から code 変更を含む implementation task（docs-only ではない）。実装後も新規 IF は発生せず、component-local state のみで完了したため Step 2 は N/A のまま維持する。
