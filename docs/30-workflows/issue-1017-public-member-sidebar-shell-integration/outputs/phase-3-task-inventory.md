`[実装区分: 実装仕様書]`

# outputs/phase-3: タスク棚卸し（issue-1017 / verify_existing）

親 workflow `unified-sidebar-shell-public-and-admin` の Task 群と本タスク（Task C）の関係を棚卸しする。

## Task 一覧と状態

| Task | 内容 | issue | 状態 | 本タスクとの関係 |
| --- | --- | --- | --- | --- |
| **C（本体）** | 公開/会員 layout の SidebarShell 統合・旧 header 撤去・route group 移行 | **#1017** | **landed**（commit `278001606` / PR #1028, dev マージ） | 本仕様書の対象 |
| A | SidebarShell primitive（`SidebarShell` / `SidebarShell.server` / `shell-config` / `useSidebarState`） | #1015 系 | **landed**（#1028 同梱） | 依存（再利用・新規実装ゼロ） |
| B | user menu / role handling（`SidebarUserMenu` / `user-menu-config`） | #1022 系 | **landed**（#1028 同梱） | 依存（再利用） |
| E | mobile drawer / responsive（`SidebarMobileTrigger` / `SidebarDrawer`） | 内包 | **landed**（#1028 同梱） | 依存（再利用） |
| D | admin layout migration | **#1018** | 分離（別 issue） | スコープ外（CONST_007） |
| F | visual baseline CI 化 / staging visual evidence | **#1019** | 分離（別 issue・user-gated） | スコープ外（Gate-C 相当） |

## 依存関係

```
Task A (shell primitive) ─┐
Task B (user menu)        ─┼─► Task C (#1017, layout 統合) ── landed (#1028)
Task E (mobile drawer)   ─┘

Task D (#1018 admin layout)   … 別サイクル
Task F (#1019 visual baseline)… 別サイクル / user-gated
```

- A/B/E は Task C の前提 primitive。#1028 で C 本体と同一 PR に先行同梱され、Task C 完了時点で揃っている。
- D（admin layout）と F（visual baseline）は CONST_007 単一サイクル方針に従い別 issue（#1018 / #1019）へスピルオーバ分離済み。本タスクは扱わない。

## 本タスクの作業棚卸し（verify_existing）

| # | 作業 | 種別 | 状態 |
| --- | --- | --- | --- |
| 1 | `git show --stat 278001606` で変更ファイル確認 | 差分確認 | 完了 |
| 2 | layout / page の before→after 差分要点整理 | 差分確認 | 完了（Phase 5） |
| 3 | typecheck / lint / targeted 4 spec の回帰実行 | 回帰確認 | 完了（1385 passed） |
| 4 | 旧 header production import grep = 0 確認 | 回帰確認 | 完了（0 件） |
| 5 | docs（Phase 1-13 + outputs）整備 | spec | 本サイクル |
| 6 | 実装 commit / push / PR / staging visual baseline | external_ops | user-gated（Gate-C / #1019） |

## 未割当タスク（detection）

- 新規追加が必要な未割当タスクは検出されない。admin layout（#1018）/ visual baseline（#1019）は既起票・分離済み。
