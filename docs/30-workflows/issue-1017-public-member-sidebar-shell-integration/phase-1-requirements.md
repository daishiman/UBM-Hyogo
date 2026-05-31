`[実装区分: 実装仕様書]`

# Phase 1: 要件定義（issue-1017 / verify_existing）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | `issue-1017-public-member-sidebar-shell-integration` |
| parent workflow | `unified-sidebar-shell-public-and-admin`（Task C） |
| 分類（taskType） | `implementation` |
| implementation_mode | `verify_existing` |
| visualEvidence | `VISUAL`（公開・会員 shell の見た目が header → sidebar へ変わる） |
| spec_classification | `implementation_spec` |
| GitHub issue | `#1017`（`CLOSED`） |
| 正本コミット | `278001606`（PR `#1028`, 2026-05-31 dev マージ） |
| workflow_state | `implemented_local_evidence_captured`（local deterministic evidence 済み。staging visual は `visual_runtime_pending`） |

> docs-only ではない理由（CONST_004）: #1017 の目的は「公開/会員 layout を SidebarShell へ統合し、旧
> `PublicHeader*` / `MemberHeader` を撤去する」コード変更そのもの。よって `implementation_spec` 区分とする。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | **Yes**（`apps/web/app/(public)/layout.tsx` / `(member)/layout.tsx` が `SidebarShellServer` を mount 済み・`apps/web/src/components/shell/` 一式存在） | `implementation_mode: verify_existing`。Phase 5 を「差分確認 + 回帰確認」へ読み替える |
| upstream（dev）にマージ済み | **Yes**（commit `278001606` / PR `#1028` が `origin/dev` に landed） | 新規 RED/GREEN サイクルは行わず、landed 実装を正本仕様として固定する |
| 前提タスク A / B / E 完了済み | **Yes**（依存 primitive `SidebarShell.server.tsx` / `SidebarMobileTrigger.tsx` / `SidebarDrawer.tsx` が #1028 に同梱） | CONST_008/009 に従い A/B/E → C を同一 PR で完了済みとして扱う |

→ 結論: `implementation_mode = verify_existing`。本 Phase 群は「既実装のカバレッジ確認 + 回帰確認」を担保する。
root state は `completed` ではなく `implemented_local_evidence_captured` に固定する。理由は、Phase 11 の
staging visual baseline と Phase 13 docs commit / PR が user-gated であり、task-specification-creator の
`workflow_state` 語彙では `completed` が terminal state だからである。

## 既存コードベースの命名規則（FB-01）

| 対象 | 規則 | 実例 |
| --- | --- | --- |
| route group ディレクトリ | `(group-name)` kebab-case | `(public)` / `(member)` / `(admin)` |
| layout / page ファイル | Next.js 規約固定 | `layout.tsx` / `page.tsx` |
| component ファイル | PascalCase | `SidebarShell.tsx` / `PublicFooter.tsx` |
| layout 関数 | PascalCase + `Layout` | `PublicLayout` / `MemberLayout` |
| 純関数（nav 構築） | camelCase | `buildNavForRole` |
| client hook | camelCase + `use` prefix | `useSidebarState` |
| test ファイル | co-location `*.spec.tsx`（不変条件 #8: `*.test.*` 禁止） | `layout.spec.tsx` / `page.spec.tsx` |
| data 属性 | `data-route-group` / `data-shell-mode` / `data-theme` / `data-testid` | `data-route-group="public"` |
| package 名 | scope 付き | `@ubm-hyogo/web` |

## 要件

`(public)` route group（公開 6 route: `/`, `/members`, `/register`, `/privacy`, `/terms`, `/login`）と
`(member)` route group（会員 `/profile`）の shell 所有権を **page から layout へ移管**し、
共通 `SidebarShellServer` を route group layout で **1 度だけ mount** する。
これにより role 別 navigation（PUBLIC / +MEMBERS / +ADMIN）を 1 箇所へ集約し、page 遷移時の shell チラつきを構造で排除する。
旧 `PublicHeader*` / `MemberHeader` の production import を **0 件**にする。

## スコープ

| 含む | 含まない |
| --- | --- |
| `(public)/layout.tsx` / `(member)/layout.tsx` の `SidebarShellServer` 統合確認 | admin layout migration（Task D / 別 issue #1018） |
| 旧 `PublicHeader` / `MemberHeader` の production import 撤去（grep 0）確認 | mobile drawer の新規実装そのもの（Task E primitive は #1028 同梱済み） |
| `/`,`/privacy`,`/terms`,`/login` の `(public)` route group 移行（URL 不変）確認 | visual baseline CI 化（Task F / 別 issue #1019） |
| `PublicFooter` を shell 配下で保持していることの確認 | 新 API endpoint 追加・D1 schema 変更・Google Form 仕様変更 |
| layout / page focused 回帰テストの実行 | shell primitive（A/B/E）の再実装 |

## 受け入れ条件（#1017 原文・4 件）

| ID | 条件 | 検証 Phase |
| --- | --- | --- |
| AC-1 | `/`, `/members`, `/register`, `/privacy`, `/terms`, `/login`, `/profile` の 7 route で同一 sidebar shell（`data-shell-mode="sidebar"`）が描画される | Phase 4 / 5 |
| AC-2 | 未ログインは PUBLIC のみ、member は PUBLIC+MEMBERS、admin は PUBLIC+MEMBERS+ADMIN（schemaDiff badge 含む）を表示する | Phase 4 |
| AC-3 | `PublicFooter` は shell 配下で維持される | Phase 4 / 5 |
| AC-4 | 旧 `PublicHeader*` / `MemberHeader` の production import が **0 件**になる | Phase 4 / 5 |

## タスク分類（Phase 11 判定の固定）

- **UI task（VISUAL）**。公開・会員 shell の見た目が header → sidebar へ変わるため、Phase 11 は screenshot 取得対象。
- ただし verify_existing のため、実 pixel screenshot capture / staging visual baseline は production-equivalent running stack 依存の user-gated wave（Gate-C / Task F #1019）。本サイクルでは landed 実装の source-level 回帰証跡を確定する。

## targeted test ファイルリスト（FB-UI-02-2 / 全件 run 回避）

verify_existing で focused run する対象（landed 実装に同梱済みの spec）:

```
apps/web/app/(public)/layout.spec.tsx
apps/web/app/(member)/layout.spec.tsx
apps/web/app/(public)/page.spec.tsx
apps/web/app/(member)/profile/page.spec.tsx
```

各 spec は `vi.mock("next/headers")`（`x-pathname` 注入）+ `vi.mock("@/lib/session")`（role 差替）で
external props を制御し、role → nav group の対応と footer / shell DOM 契約を検証する。

## 不変条件

1. **既存 API のみ接続**: layout/shell は API を直接呼ばない。`session` は `SidebarShellServer` 内 `getSession()` に閉じる
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding に触れない（CLAUDE.md 不変条件 #5）
3. **OKLch トークン正本化**: shell の色は `apps/web/src/styles/tokens.css` の `--shell-*` トークン経由。HEX 直書き禁止
4. **role 判定は SidebarShellServer に閉じる**: layout は `activePath` / `routeKey` / `sectionRhythm` / `mobileTriggerSlot` のみ渡す
5. **CONST_007 単一サイクル**: Task C は 1 サイクル完結（#1028 で完了済み）。Task D/E/F は別 issue #1018/#1019 へ分離済み

## 完了条件

AC-1..AC-4 が Phase 2 以降へ trace され、`artifacts.json` に `implementation_mode: verify_existing` /
`implementation_source_commit: 278001606` / gates が記録されていること。

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 1 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 1 記録を正本として維持する。
- #1028 の landed 実装と本 Phase の境界を確認する。

## 参照資料

- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-C-public-and-member-layout-integration.md`
- `docs/30-workflows/task-c-public-member-sidebar-shell-integration/`
- commit `278001606` / PR #1028

## 成果物

- 本ファイル
- `artifacts.json` / `outputs/artifacts.json` parity
- Phase 11/12 outputs

## 統合テスト連携

- verify_existing のため新規統合テストは追加しない。
- #1028 landed 実装の focused specs / typecheck / lint / grep gate を Phase 11 証跡として参照する。
