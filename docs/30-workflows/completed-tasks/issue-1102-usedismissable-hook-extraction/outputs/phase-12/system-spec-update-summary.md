---
phase: 12
task_id: issue-1102-usedismissable-hook-extraction
visual_category: NON_VISUAL
implementation_mode: new
status: completed
---

# Phase 12: システム仕様更新サマリ

本ファイルは Phase 12 の Step 判定（完了タスク記録 / 実装状況 / 関連タスク / 新規インターフェース追加判定 / skill 同期）を記録する。本タスクは **implemented_local_evidence_captured**（commit・PR は user-gated）。

## Step 1-A: 完了タスク記録（implemented_local_evidence_captured）

| 項目 | 値 |
| --- | --- |
| タスク | issue-1102-usedismissable-hook-extraction |
| 種別 | 実装仕様書（implementation_spec）/ implementation_mode=new / NON_VISUAL |
| 状態 | **implemented_local_evidence_captured**（実コード + focused vitest + Phase 12 strict 7 + aiworkflow discoverability を反映。commit/PR は user-gated） |
| 主題 | `<details>` popover の dismiss（外側 pointerdown / Escape 閉じ）重複ロジック 2 箇所を汎用 hook `apps/web/src/hooks/useDismissable.ts` へ抽出し、`SidebarUserMenu` / `DensityToggle` を移行 |
| issue | #1102（CLOSED 維持・reopen しない） |
| 成果 | 実装として完備（Phase 10 最終判定 = AC-1〜8 PASS / focused vitest 3 files / 35 tests PASS / blocker なし / 未タスク化 MINOR 0 件） |

> commit / push / PR / Issue mutation は user-gated。

## Step 1-B: 実装状況テーブル

| 対象ファイル | 種別 | 実装状況 |
| --- | --- | --- |
| `apps/web/src/hooks/useDismissable.ts` | 新規（hook 本体） | **implemented** |
| `apps/web/src/hooks/__tests__/useDismissable.spec.tsx` | 新規（hook 単体 spec） | **implemented**（12 tests PASS） |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | 編集（inline dismiss → hook 呼び出し） | **implemented**（既存 spec 8 tests PASS） |
| `apps/web/src/components/public/DensityToggle.client.tsx` | 編集（inline dismiss → hook 呼び出し） | **implemented**（既存 spec 15 tests PASS） |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | 無改修（回帰確認のみ） | 既存・変更なし |
| `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | 無改修（回帰確認のみ） | 既存・変更なし |

全体ステータス: **`implemented_local_evidence_captured`**。focused vitest 3 files / 35 tests PASS。

## Step 1-C: 関連タスクテーブル更新

| 関連タスク | 関係 | 更新 |
| --- | --- | --- |
| 親 `sidebar-footer-pinning-and-account-popover-ux`（completed-tasks 済） | 本タスクは親の followup-001（useDismissable hook 抽出）を実装として解決 | followup-001 を **implemented_local_evidence_captured** として扱う。元 unassigned-task spec は履歴として原位置に保持し、`source_unassigned_task` に記録 |
| `useFocusTrap`（既存 hook） | focus-trap modal 系は責務が異なり横展開対象外 | 変更なし（Phase 10 §10.3 M-1） |
| `useImeSafeInput` / `useSidebarState`（既存 cross-feature hook） | 配置・命名規則の参照元（`apps/web/src/hooks/` 同階層） | 変更なし（規則踏襲のみ） |

> 親 followup-001 は本 workflow で解決済み。物理移動はせず、正本索引と artifact inventory で消費関係を明示する。

## Step 2: 新規インターフェース追加判定 = **N/A**

| 判定軸 | 結果 | 理由 |
| --- | --- | --- |
| 新規 system interface（IPC / preload API / safeInvoke 等） | **追加なし** | `useDismissable` は apps/web ローカルの **UI util hook**。プロセス間通信・preload bridge を一切伴わない |
| 新規型の system 仕様登録要否 | **不要** | `DismissReason` / `UseDismissableOptions` は apps/web 内のローカル型。aiworkflow-requirements が管理する system interface（IPC/型/API/D1 schema）には該当しない |
| 新規 API endpoint（apps/api `routes/`） | **追加なし** | UI 内部リファクタのみ。`apps/api` 非接触 |
| D1 schema 変更 | **なし** | migration 追加なし |
| Google Form 仕様変更 | **なし** | フォーム schema 非接触 |

**結論: Step 2 = N/A。** useDismissable は apps/web ローカルの UI util hook であり、aiworkflow-requirements が管理する system interface の追加には当たらない。新規 IPC surface なし・D1 変更なし・Google Form 変更なし。したがって system 仕様（システムインターフェース定義）への追記は発生しない。

## Step 1-D: workflow-local 同期と global skill sync の分離（[BEFORE-QUIT-003]）

| 区分 | 対象 | 本 wave での扱い |
| --- | --- | --- |
| **workflow-local 同期** | 本 root（`docs/30-workflows/completed-tasks/issue-1102-usedismissable-hook-extraction/`）配下の index.md / artifacts.json / phase docs / outputs | 本 wave で完結（Phase 1-13 + 代替証跡 + Phase 12 成果物を生成） |
| **global skill sync** | aiworkflow-requirements discoverability | artifact inventory / quick-reference / resource-map / task-workflow-active を本 wave で同期。Step 2 = N/A は API/D1/system interface に限る |

> workflow-local（本 root 内の整合）と aiworkflow discoverability は本 wave で閉じる。skill 本体改変は発生しない。

## 総合

- 完了タスク記録: implemented_local_evidence_captured として記録（Step 1-A）。
- 実装状況: hook / hook spec / 2 consumer migration 実装済（Step 1-B）。
- 関連タスク: 親 followup-001 を実装済へ更新（Step 1-C）。
- 新規インターフェース追加: **N/A**（apps/web ローカル UI util hook・IPC/型/API/D1/Form すべて非該当）（Step 2）。
- 同期: workflow-local と aiworkflow discoverability は完結（Step 1-D）。
