---
task_id: issue-1017-public-member-sidebar-shell-integration
status: implemented_local_evidence_captured
task_type: implementation
visual_category: VISUAL
implementation_mode: verify_existing
workflow_state: implemented_local_evidence_captured
runtime_visual_state: visual_runtime_pending
issue: 1017
issue_state: CLOSED
implementation_source_commit: 278001606
implementation_source_pr: 1028
作成日: 2026-05-31
---

# issue-1017 公開 / 会員 layout を SidebarShell へ統合（verify_existing）

## 実装区分

| タスク種別 | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| runtime visual | visual_runtime_pending |


`[実装区分: 実装仕様書]`（`implementation_mode: verify_existing`）

本タスクはコード変更を伴う実装仕様書である。ただし P50 前提確認の結果、対象実装は
**現行ブランチ（`origin/dev`）に commit `278001606`（PR #1028, 2026-05-31 マージ）として既に landed 済み**であることが判明した。
したがって本仕様書は新規実装（`new`）ではなく **既実装確認（`verify_existing`）** として作成し、
Phase 5 を「差分確認 + 回帰確認」に、Phase 11 を「landed 実装の回帰証跡」に読み替える。
root workflow state は task-specification-creator の正本語彙に合わせ、
local deterministic evidence 済みを `implemented_local_evidence_captured`、staging visual baseline 未取得を
`visual_runtime_pending` として分離する。

> docs-only ではない理由（CONST_004）: #1017 の目的は「公開/会員 layout を SidebarShell へ統合し、
> 旧 `PublicHeader*` / `MemberHeader` を撤去する」というコード変更そのものである。よって実装仕様書区分とする。

## 背景

GitHub Issue #1017（CLOSED）は親 workflow `unified-sidebar-shell-public-and-admin` の Task C を formalize したもの。
当初 `unassigned` のまま CLOSED されていたが、最新コードを確認したところ
PR #1028 が Task C 本体（layout 統合 + 旧 header 撤去 + route group 移行）を
依存 primitive（Task A/B/E の `apps/web/src/components/shell/`）ごと実装・マージ済みであった。

本仕様書は「issue が古いかもしれない」前提でユーザーが調査を依頼し、
**SidebarShell 統合方針を正本として採用**する判断（2026-05-31）に基づき、
landed 実装を正本仕様として固定し、回帰検証を Phase で担保する。

## 目的

`(public)` route group（公開 6 route）と `(member)` route group（会員 `/profile`）の
shell 所有権を page から layout へ移管し、共通 `SidebarShellServer` を route group layout で
1 度だけ mount することで、role 別 navigation（PUBLIC / +MEMBERS / +ADMIN）を一箇所へ集約する。
旧 `PublicHeader*` / `MemberHeader` の production import を 0 件にする。

## スコープ

| 含む | 含まない |
|------|----------|
| `(public)/layout.tsx` / `(member)/layout.tsx` の SidebarShell 統合 | admin layout migration（Task D / 別 issue #1018） |
| 旧 `PublicHeader` / `MemberHeader` の production import 撤去（grep 0） | mobile drawer の新規実装そのもの（Task E primitive は #1028 同梱済み） |
| `/`,`/privacy`,`/terms`,`/login` の `(public)` route group 移行（URL 不変） | visual baseline CI 化（Task F / 別 issue #1019） |
| `PublicFooter` を shell 配下で保持 | 新 API endpoint 追加・D1 schema 変更・Google Form 仕様変更 |
| layout / page focused 回帰テスト | — |

## 受け入れ条件（#1017 原文）

1. `/`, `/members`, `/register`, `/privacy`, `/terms`, `/login`, `/profile` で同一 sidebar shell が描画される
2. 未ログインは PUBLIC のみ、member は PUBLIC+MEMBERS、admin は PUBLIC+MEMBERS+ADMIN を表示する
3. `PublicFooter` は維持される
4. 旧 `PublicHeader*` / `MemberHeader` の production import が 0 件になる

## 実装正本（landed）

- 正本コミット: `278001606`（PR #1028）`feat: 公開/会員 layout を SidebarShell へ統合 + D1 migration sequence guard`
- 親 workflow 参照: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/`
- 親 Task C 実装仕様: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-C-public-and-member-layout-integration.md`
- aiworkflow 正本: `task-c-public-member-sidebar-shell-integration` は既に
  `implemented_local_evidence_captured / implementation / VISUAL / runtime_visual_pending` として同期済み。
  本 issue-1017 root は CLOSED issue の verify_existing 追認仕様であり、同じ実装を二重の正本として登録しない。

## 不変条件（UI prototype alignment task-02..22 共通 + 本タスク固有）

1. **既存 API のみ接続**: layout/shell は API call を行わない。`session` は `SidebarShellServer` 内 `getSession()` に閉じる
2. **D1 直接アクセス禁止**: `apps/web` 側から D1 binding に触れない（CLAUDE.md 不変条件 #5）
3. **OKLch トークン正本化**: shell の色は `apps/web/src/styles/tokens.css` の `--shell-*` トークン経由。HEX 直書き禁止
4. **role 判定は SidebarShellServer に閉じる**: layout は `activePath` / `routeKey` / `sectionRhythm` / `mobileTriggerSlot` のみ渡す
5. **CONST_007 単一サイクル**: Task C は 1 サイクル完結（#1028 で完了済み）。Task D/E/F へのスピルオーバは別 issue #1018/#1019 へ分離済み

## Phase 12 strict 7 リスト

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## Phase 一覧

| Phase | 名称 | status | output |
|-------|------|--------|--------|
| 1 | 要件定義 | completed | phase-1-requirements.md |
| 2 | 設計 | completed | phase-2-design.md |
| 3 | 設計レビュー | completed | phase-3-design-review.md |
| 4 | テスト計画 | completed | phase-4-test-plan.md |
| 5 | 実装（差分確認） | completed | phase-5-implementation.md |
| 6 | テスト追加 | completed | phase-6-test-additions.md |
| 7 | カバレッジ | completed | phase-7-coverage.md |
| 8 | リファクタ | completed | phase-8-refactor.md |
| 9 | QA | completed | phase-9-qa.md |
| 10 | 最終レビュー | completed | phase-10-final-review.md |
| 11 | 手動テスト | runtime_pending | phase-11-manual-test.md |
| 12 | ドキュメント同期 | completed | phase-12-documentation.md |
| 13 | commit-pr-release | pending_user_approval | phase-13-pr.md |
