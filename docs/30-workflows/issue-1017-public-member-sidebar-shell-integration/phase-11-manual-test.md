---
Phase: 11
status: runtime_pending
task_id: issue-1017-public-member-sidebar-shell-integration
implementation_mode: verify_existing
visual_category: VISUAL
---

`[実装区分: 実装仕様書]`

# Phase 11: 手動テスト仕様（issue-1017, verify_existing）

## 状態

`runtime_pending`。コード実装は landed 済み（commit `278001606` / PR #1028）。
source-level 回帰（typecheck / lint / focused specs / grep）は本ブランチで PASS 確認済み。
staging screenshot 取得のみ Gate-B execution wave（Task F #1019）で実施するため pending。

## VISUAL 区分の証跡方針

本タスクは **VISUAL** 区分（公開/会員 layout の shell 統合＝視覚的変更）。
ただし `verify_existing` のため、Phase 11 の **主証跡は回帰テスト + 旧 header 撤去 grep** とする
（`outputs/phase-11/regression-test.log` / `outputs/phase-11/manual-test-result.md`）。
staging screenshot は Gate-B（Task F #1019）で別途取得する。

## 主成果物

- **主証跡**: `outputs/phase-11/manual-test-result.md`（受け入れ条件の回帰確認表）
- 回帰ログ: `outputs/phase-11/regression-test.log`
- screenshot plan: `outputs/phase-11/screenshot-plan.json`

## 実機確認手順（Gate-B / staging で実施）

| # | 手順 | 期待 |
|---|------|------|
| 1 | guest（未ログイン）で `/` を開く | sidebar nav が PUBLIC グループのみ |
| 2 | member でログインし `/` を開く | nav が PUBLIC + MEMBERS に切替わる |
| 3 | admin でログインし `/` を開く | nav が PUBLIC + MEMBERS + ADMIN + admin badge |
| 4 | `/` → `/profile` → `/admin` と遷移 | sidebar が継続表示（visual flash / 再マウントなし） |
| 5 | mobile 幅に縮小 | `SidebarMobileTrigger` 表示 → タップで `SidebarDrawer` が開く |
| 6 | collapse toggle を操作後リロード | `aria-expanded` / `sr-only` 反転、`ubm:shell:collapsed` 永続化が維持 |
| 7 | 公開 route で footer 確認 | `PublicFooter` が表示される |

## 受け入れ条件の回帰確認（source-level・確認済み）

| # | 条件 | 結果 |
|---|------|------|
| 1 | 7 route で同一 shell | PASS（layout.spec） |
| 2 | role 別 nav | PASS（layout.spec role マトリクス） |
| 3 | PublicFooter 維持 | PASS（layout.spec） |
| 4 | 旧 header import 0 件 | PASS（git grep = 0） |

→ source-level 主証跡は全 PASS。実機 screenshot は Gate-B（Task F #1019）で取得して baseline 化する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1017-public-member-sidebar-shell-integration |
| Phase | 11 |
| mode | verify_existing |

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 11 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 11 記録を正本として維持する。
- #1028 の landed 実装と本 Phase の境界を確認する。

## 参照資料

- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-C-public-and-member-layout-integration.md`
- `docs/30-workflows/task-c-public-member-sidebar-shell-integration/`
- commit `278001606` / PR #1028

## 成果物

- 本ファイル
- `artifacts.json` / `outputs/artifacts.json` parity
- Phase 11/12 outputs

## 完了条件

- [x] Phase 11 の判断・証跡が本文に記録されている。
- [x] task-specification-creator の必須見出しを満たす。

## 統合テスト連携

- verify_existing のため新規統合テストは追加しない。
- #1028 landed 実装の focused specs / typecheck / lint / grep gate を Phase 11 証跡として参照する。
