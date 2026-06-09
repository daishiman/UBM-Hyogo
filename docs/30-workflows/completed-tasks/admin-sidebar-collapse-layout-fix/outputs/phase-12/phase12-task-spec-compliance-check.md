# Phase 12 Task Spec Compliance Check

Phase 12 Task 6。root evidence として残す準拠チェック（admin-sidebar-collapse-layout-fix）。canonical 9 見出しは
`phase12-compliance-check-template.md` の `Required Sections`（1..9）に逐語準拠する。

## 1. Summary verdict

総合判定: `implemented_local_evidence_captured / implementation / VISUAL / external ops user-gated`。

本タスクは `apps/web` の sidebar shell コンポーネント群の collapsed/expanded レイアウト是正である。実コード変更、focused Vitest、local Playwright screenshot は完了済み。commit / push / PR / staging 認証済み pixel screenshot は user-gated のため未実行とする。

## 2. Changed-files classification

本 wave のコード差分は `apps/web/src/components/shell` の実装・focused tests と workflow docs / evidence。`apps/api` diff は空。

| 分類 | 対象 |
| --- | --- |
| workflow docs（本 wave で新規作成） | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-11-manual-test.md`, `phase-12-documentation.md`, `phase-13-pr.md`, `outputs/phase-11/screenshot-inventory.json`, `outputs/phase-11/manual-test-result.md`, `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| apps/web 実コード | `SidebarBrand.tsx`, `SidebarNavGroup.tsx`, `SidebarNavItem.tsx`, `SidebarShell.tsx`, `SidebarUserMenu.tsx` |
| apps/web focused tests | `SidebarNavItem.spec.tsx`, `SidebarUserMenu.spec.tsx`, `SidebarShell.spec.tsx` |
| apps/web screenshot（PNG） | 3 件 present: TC-11-1 / TC-11-2 / TC-11-3 |
| apps/api | 変更なし（AC-8・不変条件 #1 #5）。`git diff --name-only -- apps/api` は空 |

## 3. `workflow_state` and phase status consistency

| Source | Value |
| --- | --- |
| `index.md` workflow_state | `implemented_local_evidence_captured` |
| `artifacts.json` metadata.workflow_state | `implemented_local_evidence_captured` |
| `artifacts.json` metadata.implementation_status | `implemented_local_evidence_captured` |
| `outputs/artifacts.json` | present（root mirror。metadata / gates を同期） |
| Phase 11 | completed_local_evidence_captured（focused Vitest PASS + PNG 3 件 present） |
| Phase 12 | completed（strict 7 spec 成果物を実体配置） |
| Phase 13 | pending_user_approval（commit / push / PR / staging 視覚 baseline は user-gated） |

drift なし: workflow root は `implemented_local_evidence_captured`、Phase 11 は local evidence captured、Phase 12 は strict 7 present、
Phase 13 は user approval pending で分離されている。gates も Gate-A=passed（spec authored）/ Gate-B=passed（実装済み）/ Gate-C=pending（user-gated）で整合。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| screenshot inventory | outputs/phase-11/screenshot-inventory.json | present |
| collapsed desktop screenshot | outputs/phase-11/screenshots/TC-11-1-sidebar-collapsed-desktop.png | present |
| expanded desktop screenshot | outputs/phase-11/screenshots/TC-11-2-sidebar-expanded-desktop.png | present |
| collapsed user-menu open screenshot | outputs/phase-11/screenshots/TC-11-3-sidebar-collapsed-user-menu-open.png | present |

> screenshot inventory（JSON）の `status` フィールド値は `captured_local_fixture`、各 PNG エントリは `status: "present"`。

## 5. Phase 12 strict 7 file inventory

| Classification | Path | Status |
| --- | --- | --- |
| Phase 12 本体 | outputs/phase-12/main.md | present |
| Task 1 実装ガイド | outputs/phase-12/implementation-guide.md | present |
| Task 2 仕様更新サマリ | outputs/phase-12/system-spec-update-summary.md | present |
| Task 3 更新履歴 | outputs/phase-12/documentation-changelog.md | present |
| Task 4 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | present |
| Task 5 skill feedback | outputs/phase-12/skill-feedback-report.md | present |
| Task 6 compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | present |

### implementation-guide.md heading-only reject gate 実測

| Part | 本文行数（非空・見出し除く・概算） | key sections | 判定 |
| --- | --- | --- | --- |
| Part 1: やさしい説明（中学生レベル） | 35+ | なぜ必要か / 何が壊れているか（3 困りごと） / 何をするか（棚の例え話） / やること・やらないこと / 専門用語セルフチェック（6 用語） | PASS（3 行以上 + 例え話 + 用語表 5 件以上） |
| Part 2: 技術詳細（開発者レベル） | 60+ | 全体方針 / 変更 4 コンポーネント Before→After（実コード className 引用） / className 設計 / active styling 維持 / トークン使用 / エッジケース・既知制限 / 検証コマンド / 視覚証跡 | PASS（3 行以上 + 検証コマンド + 既知制限） |

両 Part とも本文 3 行以上かつ必須 key section を充足。className 断片は実コード（`SidebarNavItem.tsx:30` / `SidebarUserMenu.tsx:54` / `SidebarBrand.tsx:16` / `SidebarShell.tsx:32`）を Read して引用しており、手書き推測ではない。見出し存在のみの strict PASS ではない。

## 6. Skill/reference/system spec same-wave sync

| Target | Status |
| --- | --- |
| task-specification-creator Phase 12 strict 7 outputs | done（本 wave で 7 ファイル実体配置） |
| system spec Step 2（新規 interface / API / 型 / 定数） | N/A（Tailwind className 分岐のみ。新規 export / 型 / 定数 0 件。詳細は system-spec-update-summary.md） |
| aiworkflow-requirements indexes / LOGS / artifact inventory | same-wave sync 対象。artifact inventory / quick-reference / resource-map / task-workflow-active / changelog / LOGS を更新し、`indexes:rebuild` で drift 0 確認する |
| 別タスク分離 spec | 0 件（1 サイクル完結。OOS-1 は baseline 記録のみで起票しない） |
| skill-feedback routing | SF-1/SF-2 を no-op、SF-3 を reject に routing（owning skill 昇格 0 件。理由を skill-feedback-report.md に明記） |

`outputs/artifacts.json` は root `artifacts.json` の mirror として存在する。workflow_state / implementation_status / gates（Gate-A passed / Gate-B passed / Gate-C pending）を同期する。

## 7. Runtime or user-gated boundary

authenticated staging screenshot / staging 視覚 baseline / commit / push / PR は user 明示承認後に行う。
focused vitest と local fixture screenshot は取得済み。staging 認証済み screenshot / staging 視覚 baseline / commit / push / PR は user 明示承認後に行う。

## 8. Archive/delete stale-reference gate

| Item | Status |
| --- | --- |
| 削除 / 移動した workflow root | close-out で `docs/30-workflows/admin-sidebar-collapse-layout-fix/` を `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/` へ移動（Phase 12 完了・strict 7 配置済みのため未タスク close-out フローで move 実施） |
| 別タスク分離 spec の配置 | なし（1 サイクル完結。`unassigned-task-specs/` への配置 0 件） |
| stale 参照 | dir 内自己フルパス参照および外部 skill 参照（task-workflow-active.md / artifact-inventory.md / LOGS/_legacy.md / quick-reference.md）を新パスへ冪等書換済み。旧パス残存 0 件。実装コード（apps/）からの workflow path 参照は元々 0 件 |
| completed-tasks move | 実施済み（plain mv + 自己/外部参照書換 + `indexes:rebuild`）。Phase 13（commit / push / PR / staging visual）は pending_user_approval のまま |

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | `implemented_local_evidence_captured` と「focused test PASS / screenshot present / staging visual pending」が index / artifacts / Phase 11 / Phase 12 / gates（Gate-A passed・Gate-B passed / Gate-C pending）で整合 |
| 漏れなし | PASS | strict 7 成果物を実体配置（§5）。Phase 11 evidence（manual-test-result.md / inventory）present。current 未タスク 0 件 + baseline（OOS-1）分離、skill-feedback routing、Step 2 N/A を記録 |
| 整合性あり | PASS | canonical 9 見出しが template `Required Sections` に逐語一致。変更対象ファイル・AC・className 断片・命名規則が `_shared-context.md` / phase-1/2/3 と一致。className は実コード Read 引用 |
| 依存関係整合 | PASS | `depends_on` 空の独立タスク。OOS-1 を baseline として分離し本サイクルを単一関心で完結。`apps/api` 非変更（AC-8）。新 API / D1 schema 依存を追加しない |
