---
Phase: 8
status: completed
task_id: issue-1017-public-member-sidebar-shell-integration
implementation_mode: verify_existing
---

`[実装区分: 実装仕様書]`

# Phase 8: リファクタ（issue-1017, verify_existing）

## 方針

`verify_existing` のため、本 Phase は #1028 で**実施済みのリファクタを記録**する。
中心テーマは「navigation drift（重複 header）の解消」と「shell 所有権の layout 集約」。

## リファクタ一覧

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| 公開 6 route の header | 各 page / 旧 layout が `PublicHeader*` を個別 mount | `(public)/layout.tsx` が `SidebarShellServer` を 1 度だけ mount | navigation drift（route ごとに header 配線がばらつくリスク）を解消し、role 別 nav を一箇所に集約 |
| 会員 `/profile` の header | page / 旧 layout が `MemberHeader` を mount | `(member)/layout.tsx` が `SidebarShellServer` を 1 度だけ mount | 公開側と同一の shell へ統一。member 専用 header の二重保守を排除 |
| `/`,`/privacy`,`/terms`,`/login` の配置 | `(public)` route group 外に配置（または個別 header） | `git mv` で `(public)` route group 配下へ移動（URL 不変） | route group layout の shell 配下に取り込み、7 route 全てで同一 shell を保証 |
| 旧 header component | `PublicHeader.tsx` / `MemberHeader.tsx`（+ 各 `__tests__`） | git delete（production import 0 件） | layout 集約で不要化。dead component を残さず import drift を構造的に排除 |
| PublicFooter | page 直 mount | shell children 末尾に mount（layout 配下で維持） | footer の表示要件（受け入れ条件 ③）を保持しつつ shell 構造へ統合 |

## navigation drift 解消の説明

リファクタ前は「公開側 `PublicHeader*`」「会員側 `MemberHeader`」が別々に存在し、
role 別 nav の表示ロジックが 2 箇所に分散していた（= header 実装が route group ごとに drift する構造）。
リファクタ後は **両 route group が同一 `SidebarShellServer` を mount** し、
role→nav の判定が SidebarShellServer 1 箇所へ収束。layout は `activePath` / `routeKey` / `sectionRhythm` / `mobileTriggerSlot` のみ渡す薄い配線層となり、drift の発生源を構造的に除去した。

## route group 移行（URL 不変）の保証

`(public)` は route group（括弧付きディレクトリ）であり URL segment を生成しない。
`git mv` による `/`,`/privacy`,`/terms`,`/login` の移動は **公開 URL を変えない**。
回帰は page.spec / layout.spec で同一 shell mount を assert して担保する。

## 検証

typecheck 6 packages green / lint exit 0 / focused 4 spec PASS（`outputs/phase-11/regression-test.log`）。
旧 header の production import = 0 件（Phase 9 で grep 証跡化）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1017-public-member-sidebar-shell-integration |
| Phase | 8 |
| mode | verify_existing |

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 8 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 8 記録を正本として維持する。
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

- [x] Phase 8 の判断・証跡が本文に記録されている。
- [x] task-specification-creator の必須見出しを満たす。

## 統合テスト連携

- verify_existing のため新規統合テストは追加しない。
- #1028 landed 実装の focused specs / typecheck / lint / grep gate を Phase 11 証跡として参照する。
