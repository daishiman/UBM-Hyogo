---
Phase: 7
status: completed
task_id: issue-1017-public-member-sidebar-shell-integration
implementation_mode: verify_existing
---

`[実装区分: 実装仕様書]`

# Phase 7: カバレッジ（issue-1017, verify_existing）

## カバレッジ対象範囲（明示）

本タスクのカバレッジは **#1028 で変更した配線ブロックのみ**を対象とする。広域カバレッジ計測は行わない。

| 対象（カバレッジ計測する） | 範囲外（本タスクで計測しない） |
|------|------|
| `app/(public)/layout.tsx` の SidebarShell 配線・PublicFooter mount・routeKey 配信 | `SidebarShellServer` 内部 primitive（Task A #1015 でカバー済み） |
| `app/(member)/layout.tsx` の SidebarShell 配線・routeKey 配信 | `SidebarMobileTrigger` / `SidebarDrawer` 内部（Task E primitive でカバー済み） |
| `SidebarShell.server.tsx` の **layout から渡る props を消費する配線部** | `buildNavForRole` 純関数（Task A unit でカバー済み） |
| 各 page が header を持たない回帰（page.spec×2） | login session-redirect 等の別 issue 機能 |

> 理由: 本タスクの変更本体は「page → layout への shell 所有権移管」であり、
> primitive そのものは Task A/B/E で実装・テスト済み。重複計測を避け、**変更ブロック限定**で担保する。

## layout role 分岐のカバレッジ

`(public)/layout.tsx` / `(member)/layout.tsx` の role 分岐（PUBLIC / +MEMBERS / +ADMIN）は、
layout.spec が session mock を切替えて以下の line / branch を踏破する。

| 分岐 | line/branch | 担保 spec |
|------|-------------|-----------|
| session=null → viewer | viewer fallback 経路 | layout.spec（public/member） |
| role=member → PUBLIC+MEMBERS | member 分岐 | layout.spec |
| role=admin → PUBLIC+MEMBERS+ADMIN + badge | admin 分岐 | layout.spec |
| PublicFooter mount | footer slot line | `(public)/layout.spec.tsx` |

→ layout の役割分岐 line / branch は layout.spec で全踏破。`SidebarShellServer` 配線部の各 prop（`activePath` / `routeKey` / `sectionRhythm` / `mobileTriggerSlot`）の引き渡しも layout.spec の assertion 対象。

## 計測結果（landed 実装の回帰 run）

- focused 4 spec: 全 PASS
- 同一 run の apps/web 全体: 1385 passed | 1 skipped
- typecheck 6 packages green / lint exit 0

変更ブロック（2 layout + SidebarShell 配線消費部）の role 分岐 line/branch は layout.spec により担保され、未踏破の分岐は検出されない。

## 判定

変更ブロック限定カバレッジ: **充足**。広域 coverage 閾値判定は本タスクのスコープ外（primitive は親 Task で担保済み）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1017-public-member-sidebar-shell-integration |
| Phase | 7 |
| mode | verify_existing |

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 7 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 7 記録を正本として維持する。
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

- [x] Phase 7 の判断・証跡が本文に記録されている。
- [x] task-specification-creator の必須見出しを満たす。

## 統合テスト連携

- verify_existing のため新規統合テストは追加しない。
- #1028 landed 実装の focused specs / typecheck / lint / grep gate を Phase 11 証跡として参照する。
