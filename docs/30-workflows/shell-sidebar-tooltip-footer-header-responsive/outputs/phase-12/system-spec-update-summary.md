---
phase: 12
phase_name: ドキュメント同期 / system-spec-update-summary
task: shell-sidebar-tooltip-footer-header-responsive
状態: implemented_local_evidence_captured
作成日: 2026-06-03
parent_workflow: null
---

# システム仕様更新サマリ（Step 1 / Step 2）

## Step 1 — タスク完了記録

| 項目 | 値 |
| --- | --- |
| task_id | `shell-sidebar-tooltip-footer-header-responsive` |
| 状態 | `implemented_local_evidence_captured` |
| カテゴリ | VISUAL / implementation / implementation_mode: new |
| 親 workflow | なし（独立 root） |
| スコープ | 新規 3 + 編集 11（コード 6 / テスト 5 / CSS 2）。すべて `apps/web`。`apps/api` 差分 0 |
| 完了範囲 | Phase 1-13 仕様書 + 実コード + focused shell Vitest 5 files / 33 tests PASS + Phase 12 strict 7 + aiworkflow 正本同期 |
| user-gated | staging visual screenshot、commit、push、PR |

## Step 2 — システム仕様（API / IPC / DB）更新要否

### 判定: API / IPC / DB の正本仕様改訂は不要

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| API endpoint 変更 | 不要 | `apps/api` 非接触。新 endpoint / D1 schema / Google Form 仕様変更なし |
| IPC / preload 契約変更 | 不要 | Electron IPC 層は対象外 |
| D1 schema 変更 | 不要 | DB 非接触 |
| auth middleware 変更 | 不要 | 認証境界に触れない |
| aiworkflow-requirements | index / ledger 同期のみ | workflow discoverability と artifact inventory を同期 |

### 記録: 新規公開 surface

| 公開 surface | 種別 | 内容 |
| --- | --- | --- |
| `SidebarTooltip` | 新規 Client component（shell 固有） | `apps/web/src/components/shell/SidebarTooltip.tsx` |
| `SidebarTooltipProps` | TypeScript interface | `label: string` / `collapsed: boolean` / `children: ReactElement` |

`SidebarTooltip` は `apps/web/src/components/shell/` 配下に閉じる shell 固有 chrome であり、`apps/web/src/components/ui/` の汎用 primitive 体系には昇格しない。API/IPC/DB の正本仕様は不変だが、workflow discoverability は aiworkflow-requirements ledgers に同期する。
