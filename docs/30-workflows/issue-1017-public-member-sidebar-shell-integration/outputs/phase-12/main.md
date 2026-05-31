---
Phase: 12
status: completed
task_id: issue-1017-public-member-sidebar-shell-integration
implementation_mode: verify_existing
visual_category: VISUAL
---

# Phase 12 — ドキュメント同期 概要（issue-1017）

## 1. このフェーズの目的

issue-1017（Task C: 公開/会員 layout を SidebarShell へ統合）の `verify_existing` 仕様書について、
Phase 12 のドキュメント同期成果物（strict 7）を確定する。実装は commit `278001606`（PR #1028, 2026-05-31 dev マージ）として
**既に landed 済み**であるため、本フェーズは「新規実装の記録」ではなく「landed 実装の確認結果の記録」として実施する。

## 2. verify_existing 方針サマリ

| 項目 | 値 |
|------|-----|
| 実装区分 | 実装仕様書（`implementation_mode: verify_existing`） |
| workflow_state | `implemented_local_evidence_captured` |
| runtime visual | local screenshot captured / `visual_runtime_pending`（staging は Task F #1019 で取得） |
| 正本コミット | `278001606`（PR #1028） |
| issue 状態 | #1017 CLOSED |
| 視覚区分 | VISUAL（主証跡は回帰テスト + grep + local screenshot、staging screenshot は Task F #1019 で取得予定） |
| Phase 5 読み替え | 「差分確認 + 回帰確認」 |
| Phase 11 読み替え | 「landed 実装の回帰証跡」 |

- 目的: `(public)`（公開 6 route: `/`, `/members`, `/register`, `/privacy`, `/terms`, `/login`）と
  `(member)`（`/profile`）の shell 所有権を page から layout へ移管し、共通 `SidebarShellServer` を
  route group layout で 1 度だけ mount する。
- 旧 `PublicHeader*` / `MemberHeader` の production import を 0 件にし、`PublicFooter` は shell 配下で維持する。
- `/`, `/privacy`, `/terms`, `/login` を `(public)` route group へ git mv（URL 不変）。

## 3. Phase 12 strict 7 一覧と完了状態

| # | ファイル | 役割 | 状態 |
|---|---------|------|------|
| 1 | `outputs/phase-12/main.md` | Phase 12 概要（本ファイル） | completed |
| 2 | `outputs/phase-12/implementation-guide.md` | 実装ガイド（中学生レベル + 技術者レベル） | completed |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | システム仕様更新サマリ（Step 1-A/1-B/1-C/Step 2） | completed |
| 4 | `outputs/phase-12/documentation-changelog.md` | ドキュメント変更ログ | completed |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 未割当タスク検出（0 件） | completed |
| 6 | `outputs/phase-12/skill-feedback-report.md` | スキルフィードバック | completed |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | コンプライアンスチェック | completed（既存） |

## 4. 受け入れ条件と回帰結果（要約）

| # | 受け入れ条件 | 結果 |
|---|------|------|
| 1 | 7 route で同一 sidebar shell | PASS（layout.spec で `SidebarShellServer` mount assert） |
| 2 | role 別 nav（PUBLIC / +MEMBERS / +ADMIN） | PASS（`buildNavForRole` + layout spec） |
| 3 | PublicFooter 維持 | PASS（`(public)/layout.tsx` shell children 末尾） |
| 4 | 旧 header import 0 件 | PASS（`git grep` production import = 0） |

## 5. 検証実績

- typecheck: 6 packages green
- lint: exit 0
- apps/web focused + 全体: 1385 tests passed | 1 skipped
- 旧 header production import grep: 0 件
- local runtime screenshot: `outputs/phase-11/screenshots/public-shell-guest-local.png` / `outputs/phase-11/screenshots/member-shell-profile-local.png`

## 6. 境界

apps/web 実装・typecheck・lint・focused specs・local screenshot は landed #1028 として確認済み。
staging visual baseline（screenshot）は Task F（#1019）で取得予定。本 docs の commit / push / PR は Gate-C user-gated。
aiworkflow-requirements の正本同期は既存 `task-c-public-member-sidebar-shell-integration` の ledgers を参照し、
本 issue-1017 root では二重登録しない。
