# admin-shell-topbar-sidebar-integration

> Source task: `docs/30-workflows/admin-ui-prototype-alignment/tasks/task-A-admin-shell-integration.md`
> Branch: `feat/admin-ui-prototype-alignment`
> 実装区分: **実装仕様書** (CONST_004 デフォルト)
> 状態: `implemented_local_evidence_captured`
> 作成日: 2026-05-26
> taskType: `implementation`
> visualEvidence: `VISUAL_ON_EXECUTION`
> implementation_mode: `existing-admin-shell-alignment`

## 目的

`apps/web/app/(admin)/layout.tsx` の AdminAppShell を整流化し、

1. topbar から固定文字列「管理」と空 `aria-hidden` actions slot を撤去し、page-head (`AdminPageHeader`) に title/breadcrumb/actions 所有権を集約する
2. `AdminSidebar` をプロトタイプ準拠の 3 group (Public / Members / Admin) + active highlight + schema diff badge + user-chip footer 構成へ刷新する
3. `AdminSidebarNavItem` / `AdminBrandBlock` / `isActive` 純関数 + spec 一式を新設する

## 関連

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- 後続依存: Task B (404 + byZone), Task C (page-head 配線), Task D (出席分析 primitive), Task E (visual baseline)
- 既存 issue: #894 (AdminTopbar breadcrumb 統合・CLOSED 維持・再整流) / #895 (admin topbar actions client island・CLOSED 維持・slot 契約最終化)

## 不変条件

- CLAUDE.md #5 (D1 直接アクセス禁止)
- CLAUDE.md #8 (`.spec.{ts,tsx}` のみ)
- CLAUDE.md #11 (fail-closed auth)
- OKLch token 正本 (HEX 直書き禁止)
- 既存 API endpoint のみ接続 (新 endpoint 禁止)

## Phase 一覧

| Phase | 出力 | 概要 |
|------|------|------|
| 1 | `phase-1-requirements.md` | 要件定義 / AC / スコープ |
| 2 | `phase-2-design.md` | shell 構造・sidebar 設計・命名規則 |
| 3 | `phase-3-design-review.md` | 自己レビュー / 既存 issue 関係 / リスク |
| 4 | `phase-4-test-plan.md` | vitest / grep gate 計画 |
| 5 | `phase-5-implementation.md` | 変更ファイル一覧 / 型 / 疑似コード / コマンド |
| 6 | `phase-6-test-additions.md` | spec ケース定義 |
| 7 | `phase-7-coverage.md` | カバレッジ方針 |
| 8 | `phase-8-refactor.md` | Breadcrumb 直貼り削除リスト (Task C) |
| 9 | `phase-9-qa.md` | QA コマンド一式 |
| 10 | `phase-10-final-review.md` | セルフレビューチェック |
| 11 | `phase-11-manual-test.md` | 4 viewport / screenshot 一覧 / evidence path |
| 12 | `phase-12-documentation.md` | 親 workflow / aiworkflow 6 surfaces 反映 |
| 13 | `phase-13-pr.md` | PR title / body / base |

## DoD (Definition of Done)

`phase-13-pr.md` 末尾の DoD ブロック参照。
