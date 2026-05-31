---
Phase: 6
status: completed
task_id: issue-1017-public-member-sidebar-shell-integration
implementation_mode: verify_existing
---

`[実装区分: 実装仕様書]`

# Phase 6: テスト追加（issue-1017, verify_existing）

## 方針

本タスクは `verify_existing`。対象実装は commit `278001606`（PR #1028）として landed 済みであり、
PR #1028 が **layout / page focused spec を同梱済み**である。
したがって Phase 6 は「新規テストの設計」ではなく、
**landed test が fail path（session=null・role 別分岐）と回帰 guard（旧 header import 撤去）を既にカバーしていること**を確認・記録する。

## landed test ファイル

| spec | 役割 | 対象 |
|------|------|------|
| `app/(public)/layout.spec.tsx` | 公開 route group layout の shell 配線 | `SidebarShellServer` mount / PublicFooter 維持 / routeKey 配信 |
| `app/(member)/layout.spec.tsx` | 会員 route group layout の shell 配線 | `SidebarShellServer` mount / `/profile` routeKey |
| `app/(public)/page.spec.tsx` | 公開トップ page が header を持たないこと | page 直 mount header の不在（layout 集約後の回帰 guard） |
| `app/(member)/profile/page.spec.tsx` | profile page が header を持たないこと | 同上（member 側回帰 guard） |

## fail path / role 分岐ケースの担保

| # | ケース | 入力 | 期待 | 担保 spec |
|---|--------|------|------|-----------|
| F1 | 未ログイン（viewer fallback） | `session = null` | nav は PUBLIC グループのみ。MEMBERS/ADMIN グループ非表示 | layout.spec（public/member 双方） |
| F2 | member ロール | `session.user.role = "member"` | PUBLIC + MEMBERS グループ表示。ADMIN 非表示 | layout.spec |
| F3 | admin ロール | `session.user.role = "admin"` | PUBLIC + MEMBERS + ADMIN グループ + admin badge 表示 | layout.spec |
| F4 | session 取得失敗（fail-closed） | `getSession()` reject/null | viewer 扱いへ fall back（ADMIN/MEMBERS 露出なし） | `SidebarShellServer` 側 spec（Task A 同梱・本タスクは配線確認） |
| F5 | PublicFooter 回帰 | 公開 layout render | footer が shell children 末尾に存在 | `(public)/layout.spec.tsx` |
| F6 | 旧 header 撤去回帰 | production source grep | `PublicHeader*` / `MemberHeader` import 0 件 | grep guard（Phase 9 で証跡化） |

> F1〜F3 は `session` mock を切替えて 1 spec 内で role マトリクスを検証する。
> session=null（F1）は明示ケースとして含まれ、viewer への安全側 fallback を保証する。

## 追加しなかったテストと理由

| 範囲 | 理由 |
|------|------|
| `SidebarShellServer` の role→nav 純関数（`buildNavForRole`）の単体 | Task A（#1015）で網羅済み。本タスクは layout からの配線のみ検証 |
| mobile drawer の開閉インタラクション | Task E（primitive）で担保。本タスクは mount 配線確認に限定 |
| staging visual screenshot | Gate-B / Task F（#1019）の execution wave で取得 |

## 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  "app/(public)/layout.spec.tsx" "app/(member)/layout.spec.tsx" \
  "app/(public)/page.spec.tsx" "app/(member)/profile/page.spec.tsx"
```

結果: 4 spec すべて PASS（`outputs/phase-11/regression-test.log` 参照）。同一 run で apps/web 全体 1385 passed | 1 skipped。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1017-public-member-sidebar-shell-integration |
| Phase | 6 |
| mode | verify_existing |

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 6 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 6 記録を正本として維持する。
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

- [x] Phase 6 の判断・証跡が本文に記録されている。
- [x] task-specification-creator の必須見出しを満たす。

## 統合テスト連携

- verify_existing のため新規統合テストは追加しない。
- #1028 landed 実装の focused specs / typecheck / lint / grep gate を Phase 11 証跡として参照する。
