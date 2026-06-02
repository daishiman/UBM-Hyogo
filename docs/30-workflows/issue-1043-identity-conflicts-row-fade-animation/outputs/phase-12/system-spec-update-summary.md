# Phase 12 / Task 12-2: システム仕様書更新サマリ

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 本タスクは Phase 1-13 の実装仕様書を作成する implemented_local_evidence_captured タスクである。実コード差分は本 WF で発生している。Step 1-A〜1-C は implemented_local_evidence_captured の close-out として same-wave 同期し、Step 2 は新規インターフェース追加の有無で判定する。

---

## Step 1 — タスク完了記録 + 状況テーブル + 関連タスク

### Step 1-A: タスク完了記録（same-wave 更新対象）

| 更新対象 | 内容 |
| --- | --- |
| 本 workflow `index.md` | `workflow_state: implemented_local_evidence_captured` を維持。Phase 1-12 を completed (spec)、Phase 13 を pending_user_approval として記録 |
| 本 workflow `artifacts.json` / `outputs/artifacts.json` | `status: implemented_local_evidence_captured` を同期。Gate-A=passed（spec review）、Gate-B=passed/Gate-C=pending として記録 |
| `aiworkflow-requirements` LOGS / ledger | Issue #1043（FU-AIDC-007・implemented_local_evidence_captured）を current fact として登録（implemented_local_evidence_captured なので台帳は実装 fact 登録。実装 fact は本サイクルで更新） |
| `task-specification-creator` LOGS | merge optimistic exit fade の state machine（exiting 相 + timer/transitionend 二重化 + reduced-motion 3 重保証）設計知見を spec 知見として記録 |

> implemented_local_evidence_captured タスクのため、実装内容・focused Vitest・local Playwright・Phase 11 screenshot 3 PNG は本サイクルで確定済み。外部操作のみ user-gated。

### Step 1-B: 実装状況テーブル

| 機能 | 状況 |
| --- | --- |
| merge optimistic 退場（exiting 相 fade out → removed） | `implemented_local_evidence_captured`（設計確定・実装済み） |
| server error 時 rollback（exiting キャンセル + row 復元 + inline error） | `implemented_local_evidence_captured` |
| reduced-motion 抑制（globals.css + Tailwind variant + timeout fallback） | `implemented_local_evidence_captured` |
| dismiss 側挙動 | 不変（変更対象外） |

> implemented_local_evidence_captured のため focused Vitest 13/13 PASS、web typecheck PASS、web lint PASS、local Playwright desktop 8/8 PASS、Phase 11 screenshots 3 PNG captured。

### Step 1-C: 関連タスクテーブル（current facts へ更新）

| 関連タスク / Issue | ステータス | 関係 |
| --- | --- | --- |
| Issue #1043（FU-AIDC-007） | **CLOSED**（2026-06-02 close-out read-only 再確認） | 本ワークフローの起点。Issue mutation は実行しない |
| Issue #988（merge optimistic update） | completed-tasks 配下（implemented_local_evidence_captured） | 親ワークフロー。本タスクはその上に exiting fade を追加する差分。#988 で fade を意図的に scope 外分離 |
| Issue #1042（dismiss optimistic update） | 別タスク（独立） | 兄弟 followup。dismiss は本タスクの fade を巻き込まない（独立 boolean 設計） |
| `admin-identity-conflicts-followup-005-row-fade-animation`（発見元 unassigned spec） | 本 issue-1043 ワークフローへ昇格 | 発見元。PR/Issue close cycle で consumed trace 化する |

---

## Step 2 — システム仕様（新規インターフェース）更新判定

| 判定軸 | 結果 |
| --- | --- |
| 新規インターフェース / 型の追加 | なし（`isExiting: boolean` は component-local state、`RowPhase` は説明用の派生型で公開 IF ではない） |
| 既存インターフェースの変更 | なし（`useAdminMutation` の signature 不変、trigger payload 不変） |
| 新規定数 / 設定値の追加 | component-local 定数のみ（`EXIT_ANIMATION_MS` / `EXIT_FALLBACK_BUFFER_MS`）。公開 API・正本仕様には影響しない |
| API 仕様の変更 | なし（既存 endpoint・payload 不変） |
| design token / keyframes の追加 | なし（Tailwind 汎用 transition utility のみ。`tokens.css` / `globals.css` 不変） |

→ **Step 2 は N/A**。aiworkflow-requirements の interfaces / api-ipc 系正本仕様の更新は不要。design-tokens.md（OKLch 正本）の更新も不要。

### docs-only → code 再判定ルールの確認

本タスクは当初から code 変更を含む implementation task（docs-only ではない・CONST_004 判定で実装仕様書）。ただし本 WF は implemented_local_evidence_captured 段階であり、実コードは実装済み。実装後も新規公開 IF は発生せず component-local state + Tailwind utility のみで完了する設計のため、Step 2 は N/A のまま維持する。
