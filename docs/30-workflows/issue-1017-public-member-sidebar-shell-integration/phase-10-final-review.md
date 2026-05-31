---
Phase: 10
status: completed
task_id: issue-1017-public-member-sidebar-shell-integration
implementation_mode: verify_existing
---

`[実装区分: 実装仕様書]`

# Phase 10: 最終レビュー（issue-1017, verify_existing）

## 受け入れ条件 MET 判定

| # | 受け入れ条件（#1017 原文） | 判定 | 証跡 |
|---|------|------|------|
| 1 | `/`,`/members`,`/register`,`/privacy`,`/terms`,`/login`,`/profile` で同一 sidebar shell が描画される | **MET** | layout.spec×2 で `SidebarShellServer` mount を assert。7 route が 2 route group layout 配下 |
| 2 | 未ログイン=PUBLIC のみ / member=PUBLIC+MEMBERS / admin=PUBLIC+MEMBERS+ADMIN | **MET** | layout.spec の role マトリクス（session=null / member / admin）PASS |
| 3 | `PublicFooter` は維持される | **MET** | `(public)/layout.tsx` で shell children 末尾に mount。layout.spec で確認 |
| 4 | 旧 `PublicHeader*` / `MemberHeader` の production import が 0 件 | **MET** | `git grep` = production import 0 件（コメント 1 件のみ） |

→ acceptance criteria 4/4 **MET**。

## 品質ゲート

| ゲート | 結果 |
|--------|------|
| typecheck（6 packages） | green |
| lint | exit 0 |
| focused 回帰 4 spec | PASS |
| apps/web 全体 | 1385 passed | 1 skipped |

## blocker 判定

**blocker なし**。実装は commit `278001606`（PR #1028）として dev へマージ済みで安定動作。

## MINOR 指摘と未タスク化判定

| 指摘 | 重大度 | 判定 | 分離先 |
|------|--------|------|--------|
| staging visual baseline（screenshot CI 化）が未取得 | MINOR | **未タスク化不要**（既存 OPEN issue に分離済み） | Task F #1019 |
| admin layout の SidebarShell 統合は本タスク範囲外 | MINOR | **未タスク化不要**（既存 OPEN issue に分離済み） | Task D #1018 |

→ いずれも親 workflow `unified-sidebar-shell-public-and-admin` の Task F / Task D として既に OPEN issue に分離済み。
**本タスク発の新規未タスク = 0 件**（詳細は `outputs/phase-12/unassigned-task-detection.md`）。

## 最終判定

acceptance criteria 全 MET / blocker なし / 新規未タスク 0 件。
**承認可（実装は landed 済み・docs commit/PR は Gate-C で user-gated）**。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1017-public-member-sidebar-shell-integration |
| Phase | 10 |
| mode | verify_existing |

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 10 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 10 記録を正本として維持する。
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

- [x] Phase 10 の判断・証跡が本文に記録されている。
- [x] task-specification-creator の必須見出しを満たす。

## 統合テスト連携

- verify_existing のため新規統合テストは追加しない。
- #1028 landed 実装の focused specs / typecheck / lint / grep gate を Phase 11 証跡として参照する。
