# ドキュメント更新履歴 — admin-sidebar-collapse-layout-fix

workflow_state: `implemented_local_evidence_captured` / 生成日: 2026-06-08

本タスクは `implemented_local_evidence_captured` の実装仕様書である。以下は本 wave で作成/更新したドキュメント、実装済み
`apps/web` ファイル一覧、各 Step の結果（「該当なし」も記録）、および検証結果を記録する。

## 本 wave で作成した Phase 12 strict 7

| ファイル | 種別 |
| --- | --- |
| `outputs/phase-12/main.md` | 新規 |
| `outputs/phase-12/implementation-guide.md` | 新規 |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 |
| `outputs/phase-12/documentation-changelog.md` | 新規（本ファイル） |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 |
| `outputs/phase-12/skill-feedback-report.md` | 新規 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 |

## 本 wave で作成した Phase 11 evidence

| ファイル | 種別 | 状態 |
| --- | --- | --- |
| `outputs/phase-11/screenshot-inventory.json` | 新規 | `status: "captured_local_fixture"`（PNG 3 件） |
| `outputs/phase-11/manual-test-result.md` | 新規 | local visual evidence 結果（取得済み screenshot 一覧） |

## 本 wave で変更した実装ファイル（apps/web のみ）

| # | パス | 種別 | AC |
| --- | --- | --- | --- |
| 1 | `apps/web/src/components/shell/SidebarNavItem.tsx` | 編集 | AC-1/2/3/4 |
| 2 | `apps/web/src/components/shell/SidebarUserMenu.tsx` | 編集 | AC-1/2/3/6 |
| 3 | `apps/web/src/components/shell/SidebarBrand.tsx` | 編集（collapsed 分岐新設） | AC-1/2/3 |
| 4 | `apps/web/src/components/shell/SidebarShell.tsx`（AdminPublicReturn） | 編集 | AC-1/2/3 |
| 5 | `apps/web/src/components/shell/SidebarNavGroup.tsx` | 編集（`ul` default margin/padding/list-style 除去） | AC-1/2/3 |
| 6 | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 更新 | AC-1/4 |
| 7 | `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | 更新 | AC-1/6 |
| 8 | `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | 更新 | AC-1/3 |

> CSS 正本 `globals.css` は原則触らない（Tailwind className 分岐で完結）。OOS-1（tooltip overflow clip）対応を本サイクルに含める判断になった場合のみ
> `globals.css` を編集対象に追加するが、本サイクルでは baseline 分離（起票しない）。

## 各 Step の結果（「該当なし」も記録）

### A. workflow-local 同期（本 workflow root）

| Step | 結果 |
| --- | --- |
| Step 1-A（完了タスク記録） | done。`index.md` / `phase-12-documentation.md` / `_shared-context.md` に Phase 1-13 を集約 |
| Step 1-B（実装状況テーブル） | done。`implemented_local_evidence_captured` を `index.md` / `artifacts.json` に記録 |
| Step 1-C（関連タスクテーブル） | done。current 未タスク 0 件 / baseline（OOS-1）を `unassigned-task-detection.md` に記録 |
| Step 1-H（skill-feedback routing） | done。SF-1/SF-2 を no-op に routing（owning skill 昇格 0 件） |
| Step 2（新規 interface / 型 / 定数） | **該当なし（N/A）**。Tailwind className 分岐のみ。詳細は `system-spec-update-summary.md` |

### B. global skill sync（aiworkflow-requirements の横断 ledger）

| 対象 | 結果 |
| --- | --- |
| workflow inventory（artifact inventory） | synced（`implemented_local_evidence_captured` の active workflow として追記） |
| quick-reference | synced |
| resource-map | synced |
| task-workflow-active | synced（先頭 prepend） |
| SKILL-changelog | synced |
| `indexes/*-map.md` / `keywords.json` | synced |

> workflow-local 同期（A）と global skill sync（B）を別ブロックで記録する（先例 BEFORE-QUIT-003 の混在防止）。
> workflow-local 同期（A）と global skill sync（B）を別ブロックで記録する（先例 BEFORE-QUIT-003 の混在防止）。

## 別タスク分離記録

- 本サイクルは 1 サイクル完結のため、別タスク分離（unassigned-task-specs/ への spec 配置）は **0 件**。
- OOS-1（collapsed tooltip overflow clip）は baseline として `unassigned-task-detection.md` に記録するのみで、本サイクルでは起票しない（CONST_007 例外: 回帰リスクの分離）。

## 仕様策定中に検出した観察事項（drift 観察 / 非ブロッキング）

| # | 観察 | 実測 | 扱い |
| --- | --- | --- | --- |
| D-1 | vitest 設定パスの drift | `apps/web/vitest.config.ts` は不在。実 SSOT はリポジトリルートの `vitest.config.ts` | `artifacts.json` / phase docs の focused vitest コマンドを `--root=. --config=vitest.config.ts` で記述。実行は実装サイクル |
| D-2 | aside の overflow 表現 | `_shared-context.md` §3.4 は `globals.css:1986` の `[data-shell="sidebar"]{overflow:hidden}` を参照するが、`SidebarShell.tsx:102` の `<aside>` className は `overflow-visible`。CSS rule とユーティリティ class が競合しうる | local screenshot で実描画を確認。OOS-1（tooltip clip）の判定材料として Phase 11 TC-11-3 に記録。本サイクルは観察のみ（非ブロッキング） |

## validator 結果

| 検証 | 状況 |
| --- | --- |
| focused vitest | PASS: `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__`（実行済み） |
| `git diff --name-only -- apps/api`（AC-8） | PASS（空） |
| `pnpm verify:phase12-compliance` | 本 wave で実行（canonical 9 見出し確認） |
| `pnpm gate-metadata:validate` | 本 wave で実行（Gate-A passed / Gate-B passed / Gate-C pending の整合確認） |
| `pnpm typecheck` / `pnpm lint` / `pnpm verify:tokens` | 実行済み |

> 実 screenshot は local fixture として取得済み（PNG 3 件）。`outputs/phase-11/screenshot-inventory.json` は `status: "captured_local_fixture"`、
> `outputs/phase-11/manual-test-result.md` は focused vitest と screenshot 結果の記録として present。
