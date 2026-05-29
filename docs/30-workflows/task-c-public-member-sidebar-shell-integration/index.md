---
task_id: task-c-public-member-sidebar-shell-integration
status: implemented_local_evidence_captured
task_type: implementation
visual_category: VISUAL
implementation_mode: new
workflow_state: implemented_local_evidence_captured
created_at: 2026-05-29
canonical_workflow: docs/30-workflows/task-c-public-member-sidebar-shell-integration/
parent_workflow: docs/30-workflows/unified-sidebar-shell-public-and-admin/
source_task: docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-C-public-and-member-layout-integration.md
---

# Task C — 公開 / 会員 layout を SidebarShell へ統合（Phase 1-13 実装仕様書）

[実装区分: 実装仕様書]

> 本ワークフローは親 workflow `unified-sidebar-shell-public-and-admin` の **Task C** を、
> 単独で実装着手できる Phase 1-13 実装仕様書へ展開したものである。元タスク（`task-C-...md`）の
> 2-file skeleton は実コードベースの route group 配置と乖離していたため、Phase 1 で実態を再調査し
> スコープを是正している（後述の「skeleton との乖離是正」を参照）。

## 目的

公開層（公開 6 route）と会員層（`/profile`）の shell を、Task A/B/E が新設する **共通 `SidebarShell`**
へ切替える。旧 `PublicHeader` / `MemberHeader` を全参照ごと削除し、`PublicFooter` は shell 内に保持する。
「ログイン → /profile → /admin」遷移で sidebar が継続表示（visual flash なし）となる公開・会員側を担保する
（admin 側は Task D の責務）。

## 実装区分の判定根拠（CONST_004）

- 本タスクは layout / page の編集・route の物理移動・component 削除・テスト改修を伴う **コード変更タスク**であり、
  「動作させる（同一 shell を描画する）」目的はコード変更なしでは達成不可能。よって **実装仕様書**（default）とする。
- docs-only 判定の例外条件には該当しない。

## skeleton との乖離是正（Phase 1 実態調査結果）

| 項目 | 元 skeleton の前提 | 実コードベースの実態 | 是正方針 |
| --- | --- | --- | --- |
| 公開 route の配置 | 6 route がすべて `(public)` group 配下 | `(public)` 配下は `/members` `/register` のみ。`/`（`app/page.tsx`）`/privacy` `/terms` `/login` は **group 外（root 直下）** | **ユーザー決定: `(public)` group へ URL 不変で `git mv` 集約**し、`(public)/layout.tsx` 1 箇所で shell mount |
| 削除対象 component | 4 ファイル（PublicHeader / SessionAwarePublicHeader / PublicHeaderWithPath / MemberHeader） | `SessionAwarePublicHeader.tsx` / `PublicHeaderWithPath.tsx` は **存在しない** | 削除対象は `PublicHeader.tsx` / `MemberHeader.tsx` の 2 ファイル + それぞれの spec |
| PublicHeader 参照 | layout のみ | `app/page.tsx` も直接 import | 移動後 `(public)/layout.tsx` 集約で解消 |
| MemberHeader 参照 | layout のみ | `(member)/profile/page.tsx` が **直接 2 回** render | profile/page.tsx の直接 mount を除去 |
| `x-pathname` header | `headers().get('x-pathname')` 取得可能前提 | middleware で **未配線** | `?? '/'` fallback + client `usePathname()` による graceful degradation（auth middleware は変更しない） |
| test 配置 | `__tests__/(public)-layout.spec.tsx` 新規 | co-location 規約で `(public)/layout.spec.tsx` が **既存** | 既存 spec を編集（新規ディレクトリは作らない） |
| package 名 | `@ubm/web` | 実態は `@ubm-hyogo/web` | 全コマンドで `@ubm-hyogo/web` を使用 |

## 前提（依存タスク・本サイクルで解消済み）

本タスクの実装着手には Task A/B/E の成果物（`apps/web/src/components/shell/`）が必要だった。
当初は未実装だったが、CONST_008/009 に従い、本サイクル内で Task A/B/E の shell primitive を先行実装してから
Task C の layout 統合まで完了した。

| 依存 | 必要成果物 | 状態 |
| --- | --- | --- |
| Task A | `SidebarShell.tsx` / `SidebarShell.server.tsx` / `shell-config.ts` / `useSidebarState.ts` | 実装済み |
| Task B | `SidebarUserMenu.tsx` | 実装済み |
| Task E | `SidebarMobileTrigger.tsx` | 実装済み |

> 依存は親 workflow のタスクグラフ由来の構造的前提であり、Task C を将来へ先送りする分割ではない（CONST_007）。
> 実装 wave では A/B/E → C の順で着手する。Task C の仕様自体は本サイクルで完結する。

## 消費する依存 interface（Task A/B 確定 contract）

```tsx
// SidebarShell.server.tsx（Task A）— Task C はこれを mount するだけ
export async function SidebarShellServer(props: {
  activePath: string
  children: ReactNode
  mobileTriggerSlot: ReactNode
}): Promise<JSX.Element>
// 内部で getSession() → role 判定 → buildNavForRole() → <SidebarUserMenu /> を注入
// → Task C 側で role 判定・UserMenu 組み立てを再実装しない
```

## スコープ（適用 route）

| 層 | route | shell mount 経路 |
| --- | --- | --- |
| 公開 | `/`, `/privacy`, `/terms`, `/login` | `(public)` group へ移動 → `(public)/layout.tsx` |
| 公開 | `/members`, `/register` | 既に `(public)` group 配下 → `(public)/layout.tsx` |
| 会員 | `/profile`（segment states 含む） | `(member)/layout.tsx` |

## 不変条件（親 workflow 継承 + 本タスク固有）

1. デザイントークンは `apps/web/src/styles/tokens.css` の OKLch 正本のみ（HEX 直書き禁止）
2. ロール判定は `SidebarShellServer` 内部の `getSession()`（`SessionUser.isAdmin`）経由のみ。Task C は role を再判定しない
3. ログアウト等の auth 挙動は Task B の `SidebarUserMenu` 経由。Task C で新設しない
4. D1 / API / Google Form schema / **auth middleware** は変更しない（AC-6）。`x-pathname` の middleware 注入は行わない
5. route の物理移動は **URL を変えない**（route group `()` は URL に影響しない）。移動で colocated test / smoke route / 相対 import の整合を同 wave で保つ
6. `PublicFooter` は削除せず shell 配下に保持する
7. admin route（`/admin/*`）の shell 切替は Task D の責務。Task C は触れない

## 正本順位（衝突時の優先度）

1. `index.md`（本ファイル）
2. `artifacts.json` / `outputs/artifacts.json`（workflow state / gates / Phase 1-13）
3. `phase-1-requirements.md` → `phase-13-pr.md`
4. 親 `unified-sidebar-shell-public-and-admin/` の `outputs/phase-{1,2,3}` と `tasks/task-{A,B,E}-*.md`
5. CLAUDE.md / `docs/00-getting-started-manual/specs/*.md`

## Phase 一覧

| Phase | 名称 | 成果物 |
| --- | --- | --- |
| 1 | 要件定義 | `phase-1-requirements.md` |
| 2 | 設計 | `phase-2-design.md` |
| 3 | 設計レビュー | `phase-3-design-review.md` |
| 4 | テスト計画 | `phase-4-test-plan.md` |
| 5 | 実装手順 | `phase-5-implementation.md` |
| 6 | テスト追加 | `phase-6-test-additions.md` |
| 7 | カバレッジ | `phase-7-coverage.md` |
| 8 | リファクタ | `phase-8-refactor.md` |
| 9 | QA | `phase-9-qa.md` |
| 10 | 最終レビュー | `phase-10-final-review.md` |
| 11 | 手動テスト | `phase-11-manual-test.md` + `outputs/phase-11/manual-test-result.md` |
| 12 | ドキュメント同期 | `phase-12-documentation.md` + `outputs/phase-12/`（strict 7） |
| 13 | PR 作成 | `phase-13-pr.md` |

## Phase 12 strict 7

| 成果物 | Path |
| --- | --- |
| main | `outputs/phase-12/main.md` |
| implementation-guide | `outputs/phase-12/implementation-guide.md` |
| system-spec-update-summary | `outputs/phase-12/system-spec-update-summary.md` |
| documentation-changelog | `outputs/phase-12/documentation-changelog.md` |
| unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` |
| skill-feedback-report | `outputs/phase-12/skill-feedback-report.md` |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## サイクル方針

本 workflow は当初 `spec_created / implementation / VISUAL` として Phase 1-13 仕様作成までを範囲としていたが、
実装プロンプト（CONST_006/009）に従い、**依存 Task A/B/E の primitive 群を先行新規実装したうえで Task C を実装完了**
させた（`apps/web/src/components/shell/` 新規 23 file + layout/page 編集 + route group 集約 git mv + 旧 header 4 file 削除
 + `tokens.css` shell トークン追加）。実態は `implemented_local_evidence_captured`。

local 証跡: focused vitest 39 files / 199 tests PASS、全 apps/web suite 1321 passed（回帰 0）、typecheck / lint green。
残る user-gated wave（Gate-C）: 実 pixel screenshot capture（running stack 依存）・staging visual baseline・commit・push・PR。
未タスクへの分離は行わない（CONST_007）。
