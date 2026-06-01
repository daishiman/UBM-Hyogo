# Issue #1016 — Unified Sidebar Shell Task E: Mobile drawer responsive

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | issue-1016-sidebar-mobile-drawer-responsive |
| 親 workflow | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/`（Task A〜D/F 実装済、Task E のみ未実装） |
| 元 unassigned-task spec | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-E-mobile-drawer-responsive.md` |
| GitHub Issue | [#1016](https://github.com/daishiman/UBM-Hyogo/issues/1016)（**CLOSED 維持**, Refs 運用） |
| ブランチ | `docs/issue-1016-sidebar-mobile-drawer-responsive-spec`（dev 起点） |
| 優先度 | High |
| 規模 | Medium |
| 実装区分 | 実装（本サイクルで実コード + focused tests まで完了） |
| implementation_mode | `new` |
| screenshot mode | VISUAL（375 / 768 / 1280 px の drawer/responsive 3 viewport） |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| workflow_state | `implemented_local_runtime_pending` |
| ステータス | `implemented_local_runtime_pending / implementation / VISUAL / focused Vitest PASS / Phase 11 screenshots present / staging visual pending` |

## なぜ docs-only ではなく実装仕様書か（CONST_004 根拠）

Issue #1016 の受入条件は明確に **新規 React コンポーネント追加 + 既存 hook/shell 編集を伴う UI 実装**:

- `SidebarMobileTrigger` クリックで drawer が開く / `SidebarDrawer` が `role="dialog"` `aria-modal="true"` を持つ / `<768px` で hamburger 表示 / `768〜1023px` で初期 collapsed / `>=1024px` で localStorage 優先

これは「動作させる」を目的とし、調査・合意では達成不可能。よって実装仕様書として作成（プロンプト CONST_004 / 実態優先）。

## 実装前現状調査（Issue 最適化の根拠 / 2026-05-30 HEAD `37134247b`）

Issue #1016 は親 workflow `unified-sidebar-shell-public-and-admin` 完了時に Task E として formalize されたが、実装前 HEAD では**コード実装は未着手**だった。以下を確認し、本サイクルで実装した:

| 受入条件 | 現状 | 判定 |
|---------|------|------|
| `SidebarMobileTrigger` で drawer open | `SidebarMobileTrigger.tsx` 不在。`mobileTriggerSlot` は素通し描画のみ | ❌ 未実装 |
| `SidebarDrawer` role=dialog/aria-modal、Esc/backdrop/route close | `SidebarDrawer.tsx` 不在。`drawerOpen`/`setDrawerOpen` state は `useSidebarState.ts` に存在するが**どこからも消費されていない** | ❌ 未実装 |
| `<768px` で sidebar hidden / hamburger visible | `<aside>` = `hidden md:flex` / mobile strip = `md:hidden` で breakpoint hide/show のみ成立 | ⚠️ 部分実装 |
| `768〜1023px` 初期 collapsed | `matchMedia` 判定なし。`readInitialCollapsed()` は localStorage のみ参照（既定 expanded） | ❌ 未実装 |
| `>=1024px` localStorage 優先 | localStorage 永続化は動くが breakpoint で gate していない | ⚠️ 部分実装 |
| body scroll lock / focus / route close | 未実装（`usePathname` import なし、`data-shell-drawer-open` 付与なし） | ❌ 未実装 |

**結論: Issue #1016 は依然として必要。** 別タスクで解決されていない。唯一の部分実装は CSS breakpoint hide/show のみ。

### Issue 最適化（古い前提 → 現コードへの再マッピング）

元 Task E spec は親 workflow 着手時点の前提で書かれており、以下を現コードに最適化する:

1. **`useSidebarState` は既に `drawerOpen`/`setDrawerOpen` を持つ** → 新規追加ではなく「既存 state の消費先（Trigger/Drawer）を実装 + route-close / md 初期 collapsed を追記」に再定義。
2. **storage 参照は `getBrowserStorage()`（`"local"+"Storage"` 経由、lint-boundaries 回避済）が既存** → matchMedia 追加もこの境界規約（`@/lib/is-browser` の `isBrowser()` / `browserDocument()` 経由）に従う。
3. **focus trap の DOM 参照は `browserDocument()`（`@/lib/is-browser`）を唯一の正規参照点とする** → 直接 `document` を書かない（task-04 ESLint 規約）。
4. **`mobileTriggerSlot` prop は維持**（後方互換）。hamburger 本体は `SidebarMobileTrigger`（context 消費 client）として `SidebarShell` 内部の mobile strip に描画する。

## スコープ

### 含む（本サイクルで完了）

| 種別 | ファイル | 役割 |
|------|---------|------|
| 新規 | `apps/web/src/components/shell/SidebarMobileTrigger.tsx` | hamburger button。`useSidebarShellContext()` で `setDrawerOpen(true)`。`md:hidden` |
| 新規 | `apps/web/src/components/shell/SidebarDrawer.tsx` | overlay dialog。`role="dialog"` `aria-modal="true"`、Esc/backdrop close、initial focus、body scroll lock |
| 新規 | `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx` | trigger click → `setDrawerOpen(true)` / `md:hidden` |
| 新規 | `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | open=true で dialog 表示 / Esc / backdrop / route close / scroll lock |
| 編集 | `apps/web/src/components/shell/useSidebarState.ts` | `usePathname()` で route 変化時 drawer auto-close / 初期 collapsed 判定（md のみ、matchMedia 1 回参照） |
| 編集 | `apps/web/src/components/shell/SidebarShell.tsx` | `SidebarDrawer` を mount、mobile strip に `SidebarMobileTrigger` 配置 |
| 編集 | `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx` | `next/navigation` mock 追加 + route-close / md 初期 collapsed のケース追加 |

### 含まない（理由付き・本サイクル先送りではない）

- public/member/admin layout の `SidebarShellServer` 置換（**Task C/D の責務**。親 workflow で別 Issue 管理）
- visual baseline snapshot の commit（**Task F の責務**。本タスクは local static screenshot のみ）
- shell nav contract の新規定義（**Task A の責務**。既存 `shell-config.ts` を利用）

> 上記は CONST_007 の「将来送り」ではなく、親 workflow で既に別 Task として責務分離済みの領域。本タスク（Task E = mobile drawer responsive）単独で 1 サイクル完了する。

## 不変条件（全 Phase で順守）

| ID | 条件 | 根拠 |
|----|------|------|
| INV-1 | 既存 API endpoint surface のみ。新 endpoint / D1 schema 変更なし（本タスクは UI のみ・API 非接触） | CLAUDE.md UI prototype alignment §不変条件 1 |
| INV-2 | OKLch トークン正本化（`apps/web/src/styles/tokens.css`）、HEX 直書き / `bg-[#xxx]` 禁止 | CLAUDE.md §不変条件 2 / `verify-design-tokens` |
| INV-3 | `window` / `document` / `localStorage` 直接参照禁止。`@/lib/is-browser`（`isBrowser` / `browserDocument`）と既存 `getBrowserStorage()` 経由のみ | task-04 ESLint `no-restricted-globals` / lint-boundaries |
| INV-4 | テストファイルは `*.spec.{ts,tsx}` のみ | CLAUDE.md §不変条件 8 |
| INV-5 | breakpoint 判定は CSS（Tailwind `md:` / `lg:`）を正とし、JS `matchMedia` は md 初期 collapsed の 1 点のみ・SSR 非参照 | 元 Task E spec / hydration mismatch 回避 |
| INV-6 | 新規 primitive を生やさず既存 shell 群（`SidebarNav` 等）で構成 | CLAUDE.md UI prototype alignment §不変条件 3 |

## 受入条件 (Acceptance Criteria)

| ID | 条件 | 検証方法 |
|----|------|---------|
| AC-1 | `SidebarMobileTrigger` クリックで context の `setDrawerOpen(true)` が呼ばれ drawer が開く | Phase 4 trigger spec |
| AC-2 | `SidebarMobileTrigger` は `md+` で `hidden`（`md:hidden`）、`aria-controls="shell-drawer"` / `aria-expanded` を持つ | Phase 4 trigger spec |
| AC-3 | `SidebarDrawer` が open=true で `role="dialog"` `aria-modal="true"` `id="shell-drawer"` を描画する | Phase 4 drawer spec + Phase 11 screenshot |
| AC-4 | Esc キー / backdrop クリックで `onClose` が呼ばれる | Phase 4 drawer spec |
| AC-5 | route（pathname）変化で drawer が auto-close する | Phase 4 useSidebarState spec |
| AC-6 | drawer open 時に `<body data-shell-drawer-open="true">` が付与され、close で除去される（CSS scroll lock） | Phase 4 drawer spec + Phase 11 manual |
| AC-7 | drawer open 時 initial focus が drawer 内最初の focusable へ移る | Phase 4 drawer spec |
| AC-8 | localStorage 未設定時、md（`>=768 && <1024`）初回マウントで初期 collapsed、lg（`>=1024`）で expanded。localStorage 値があれば常に優先 | Phase 4 useSidebarState spec |
| AC-9 | 全色 OKLch トークン経由（`verify-design-tokens` pass）、typecheck / lint / 追加 vitest green | Phase 7 / Phase 9 |
| AC-10 | 375 / 768 / 1280 px で期待挙動（drawer / collapsed / expanded）を screenshot で確認 | Phase 11 |

## 1 サイクル完了スコープ（CONST_005 / CONST_007 適合性）

コード見積:

| ファイル | 追加 LOC | 影響 LOC |
|---------|---------|---------|
| `SidebarMobileTrigger.tsx` | ~35 | 0 |
| `SidebarDrawer.tsx` | ~90 | 0 |
| `useSidebarState.ts` | ~30 | ~10 |
| `SidebarShell.tsx` | ~15 | ~10 |
| 4 spec files | ~180 | ~5（既存 spec への mock 追加） |

合計 ~350 LOC + tests。1 サイクル内完了。先送りタスクなし。

## 状態境界（skill 準拠 / 誠実性）

この workflow は **実コード実装 + focused Vitest + local Phase 11 screenshot まで完了**している。staging visual / commit / push / PR は**未実行**であり staging runtime PASS は主張しない。

| レイヤ | 状態 |
|--------|------|
| workflow root | `implemented_local_runtime_pending` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| 実装 | `apps/web/src/components/shell/SidebarMobileTrigger.tsx` / `SidebarDrawer.tsx` / `useSidebarState.ts` / `SidebarShell.tsx` / `is-browser.ts` / `globals.css` に反映済 |
| focused tests | `outputs/phase-11/evidence/focused-vitest.log`（4 files / 21 tests PASS） |
| Phase 11 | focused Vitest と 375 / 768 / 1280 px local screenshots は `present` |
| Gate-A（spec_review） | passed（本 spec 一式 + compliance-check） |
| Gate-B（implementation_review） | passed（実コード + focused Vitest 21/21 PASS） |
| Gate-C（external_ops / staging / PR） | pending（staging visual / commit / push / PR） |

## Phase 一覧

| Phase | ファイル | 状態 |
|-------|---------|------|
| 1 | [phase-01-requirements.md](phase-01-requirements.md) | spec_created |
| 2 | [phase-02-design.md](phase-02-design.md) | spec_created |
| 3 | [phase-03-design-review.md](phase-03-design-review.md) | spec_created |
| 4 | [phase-04-test-design.md](phase-04-test-design.md) | spec_created |
| 5 | [phase-05-implementation.md](phase-05-implementation.md) | implemented_local |
| 6 | [phase-06-test-expansion.md](phase-06-test-expansion.md) | spec_created |
| 7 | [phase-07-coverage.md](phase-07-coverage.md) | spec_created |
| 8 | [phase-08-refactor.md](phase-08-refactor.md) | spec_created |
| 9 | [phase-09-qa.md](phase-09-qa.md) | spec_created |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | spec_created |
| 11 | [phase-11-evidence-inventory.md](phase-11-evidence-inventory.md) | focused-test-present / screenshots-present |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | updated |
| 13 | [phase-13-pr.md](phase-13-pr.md) | spec_created |

## 参照

- 親 workflow: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/`
- 元 Task E spec: `.../tasks/task-E-mobile-drawer-responsive.md`
- 親 implementation-guide: `.../outputs/phase-12/implementation-guide.md`
- 現コード: `apps/web/src/components/shell/{SidebarShell,useSidebarState,SidebarShellContext}.tsx`
- `apps/web/src/lib/is-browser.ts`（`isBrowser` / `browserDocument` 正規参照点）
- CLAUDE.md §重要な不変条件 / §UI prototype alignment
- `docs/00-getting-started-manual/specs/09-ui-ux.md`（存在時）
</invoke>
