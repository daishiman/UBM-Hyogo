# Phase 1: 要件定義

## メタ情報

- task_id: `task-c-public-member-sidebar-shell-integration`
- parent: `unified-sidebar-shell-public-and-admin`（Task C）
- taskType: `implementation`
- visualEvidence: `VISUAL`（公開・会員 shell の見た目が変わる）
- implementation_mode: `new`
- spec_classification: `implementation_spec`
- workflow_state: `implemented_local_evidence_captured`（Phase 12 final sync。Phase 1 作成時は `spec_created`）

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No（`apps/web/src/components/shell/` 不在） | 通常の実装 Phase とする |
| upstream（main/dev）にマージ済み | No | 未マージとして扱う |
| 前提タスク（A/B/E）完了済み | Yes（本サイクルで先行実装済み） | CONST_008/009 に従い A/B/E → C を同一サイクルで完了 |

→ `implementation_mode: "new"`。RED/GREEN サイクルで layout / page 移動 + shell 配線を新規実装した。

## 既存コードベースの命名規則（FB-01 / FB-SDK-07-4）

| 対象 | 規則 | 実例 |
| --- | --- | --- |
| route group ディレクトリ | `(group-name)` kebab | `(public)` / `(member)` / `(admin)` |
| layout / page ファイル | Next.js 規約固定 | `layout.tsx` / `page.tsx` |
| component ファイル | PascalCase | `PublicHeader.tsx` / `PublicFooter.tsx` |
| test ファイル | co-location `*.spec.tsx`（CLAUDE.md 不変条件 #8: `*.test.*` 禁止） | `layout.spec.tsx` / `page.spec.tsx` |
| layout 関数 | `PascalCase + Layout` | `PublicLayout` / `MemberLayout` |
| data 属性 | `data-route-group` / `data-shell` / `data-theme` | `data-route-group="public"` |
| package 名 | scope 付き | `@ubm-hyogo/web`（※ skeleton の `@ubm/web` は誤り） |

## 要件

公開 6 route と会員 `/profile` の shell を、Task A/B/E の `SidebarShell` へ統一する。
旧 `PublicHeader` / `MemberHeader` を全参照ごと削除し、`PublicFooter` は shell 配下に保持する。
`(public)` group 外の `/`・`/privacy`・`/terms`・`/login` は URL 不変で `(public)` group へ集約移動し、
`(public)/layout.tsx` 1 箇所で shell を mount する（DRY・真の単一 shell・flash なしを構造で担保）。

## Acceptance Criteria

| ID | 条件 | 検証 Phase |
| --- | --- | --- |
| AC-C1 | `/` `/members` `/register` `/privacy` `/terms` `/login` `/profile` の 7 route が同一 `SidebarShell` DOM 契約（`data-shell-mode="sidebar"`）を共有する | Phase 4/9/11 |
| AC-C2 | `PublicHeader` / `MemberHeader` の参照が **grep ヒット 0**（本ワークフロー doc とアーカイブ除く） | Phase 9 |
| AC-C3 | `PublicHeader.tsx` / `MemberHeader.tsx` 本体 + spec が **git delete** されている | Phase 9 |
| AC-C4 | `PublicFooter` が shell 配下で描画され続ける | Phase 4/11 |
| AC-C5 | `(public)/layout.tsx` / `(member)/layout.tsx` が `async` で `SidebarShellServer` を mount し、role 判定を**再実装しない** | Phase 5 |
| AC-C6 | `(member)/profile/page.tsx` 内の `MemberHeader` 直接 mount（2 箇所）が除去されている | Phase 5/9 |
| AC-C7 | route 移動後も `/` `/privacy` `/terms` `/login` の **URL が不変**で 200 応答 | Phase 11 |
| AC-C8 | API / D1 / Google Form schema / auth middleware が変更されていない | Phase 9 |
| AC-C9 | `pnpm typecheck && pnpm lint && pnpm --filter @ubm-hyogo/web test --run` が green | Phase 9/10 |
| AC-C10 | 移動した page の相対 import / colocated test / smoke route 参照が壊れていない | Phase 5/9 |

## タスク分類（Feedback 3 / Phase 11 判定の固定）

- **UI task（VISUAL）**。公開・会員 shell の見た目が header → sidebar へ変わるため、Phase 11 は screenshot 取得対象。
- `screenshot-plan.json` の `mode` は **`VISUAL`** をデフォルトとする（Feedback W1-02b-1）。
- ただし実 pixel screenshot capture / staging visual baseline は production-equivalent running stack 依存の user-gated wave（Gate-C）。本サイクルでは source-level evidence と capture 計画 / canonical ファイル名を確定する。

## targeted test ファイルリスト（FB-UI-02-2 / 全件 run 回避）

実装 wave で focused run する対象（メモリ制約回避のため事前列挙）:

```
apps/web/app/(public)/layout.spec.tsx
apps/web/app/(member)/layout.spec.tsx
apps/web/app/(public)/page.spec.tsx          # app/page.spec.tsx の移動 or 新規
apps/web/app/(member)/profile/page.spec.tsx
apps/web/app/(public)/login/page.spec.tsx    # 移動後（既存 login spec 群）
```

## carry-over 確認（git log -5）

直近コミット（`742323e4e` 他）は login redirect / admin prototype 整合系。shell 統合の先行実装は本ブランチに**ない**。
親 workflow `unified-sidebar-shell-public-and-admin` は `spec_created` 状態だったが、本 Task C サイクルでは必要な A/B/E shell primitive を先行実装したうえで新規実装として扱う。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 元タスク | `unified-sidebar-shell-public-and-admin/tasks/task-C-public-and-member-layout-integration.md` | スコープ起点 |
| 依存 A | `unified-sidebar-shell-public-and-admin/tasks/task-A-sidebar-shell-primitive.md` | `SidebarShellServer` contract |
| 依存 B | `unified-sidebar-shell-public-and-admin/tasks/task-B-user-menu-and-role-handling.md` | `SidebarUserMenu` contract |
| 依存 E | `unified-sidebar-shell-public-and-admin/tasks/task-E-mobile-drawer-responsive.md` | `SidebarMobileTrigger` contract |
| current public layout | `apps/web/app/(public)/layout.tsx` | 編集対象 |
| current member layout | `apps/web/app/(member)/layout.tsx` | 編集対象 |
| session | `apps/web/src/lib/session.ts` | `getSession()` / `SessionUser.isAdmin`（shell 内部が消費） |
| footer | `apps/web/src/components/public/PublicFooter.tsx` | 保持対象 |
| system spec | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | navigation 正本 |

## 完了条件

AC-C1..AC-C10 が Phase 2 以降へ trace され、`artifacts.json` に `taskType` / `visualEvidence` / gates が記録されている。
