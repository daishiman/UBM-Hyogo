# Artifact Inventory: responsive-mobile-tablet-ui-fixes

## Metadata

| Field | Value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes/` |
| state | `implemented_local_visual_present_staging_pending` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| date | 2026-06-12 |

## Workflow Artifacts

| Artifact | Path |
| --- | --- |
| index | `docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes/index.md` |
| root artifacts | `docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes/outputs/artifacts.json` |
| shared context | `docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes/shared-context.md` |
| Phase 11 result | `docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes/outputs/phase-11/manual-test-result.md` |
| Phase 11 screenshot coverage | `docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes/outputs/phase-11/screenshot-coverage.md` |
| Phase 11 screenshot metadata | `docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes/outputs/phase-11/screenshots/phase11-capture-metadata.json` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Implementation Targets

| Path | Purpose |
| --- | --- |
| `apps/web/src/styles/tokens.css` | responsive breakpoint anchors |
| `apps/web/src/styles/globals.css` | breakpoint boundary, grid, table, overlay responsive fixes |
| `apps/web/src/styles/legacy-public.css` | public main width and grid fluidization |
| `apps/web/src/styles/auth.css` | narrow viewport auth shell/card padding |
| `apps/web/src/components/shell/SidebarDrawer.tsx` | viewport-safe drawer width |
| `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | drawer width regression test |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | horizontal overflow guard |
| `apps/web/playwright/fixtures/viewports.ts` | mobileNarrow viewport fixture |

## Evidence

| Evidence | Result |
| --- | --- |
| focused Vitest | SidebarDrawer 5 tests PASS |
| design-token gate | tokens runtime 9 tests PASS |
| typecheck / lint | PASS |
| local runtime smoke | 9 routes x 4 viewports = 36 checks, overflow false |
| local screenshots | 5 PNG present under `outputs/phase-11/screenshots/` |
| apps/api diff | empty |

## Boundaries

- API endpoint, D1 schema, Google Form schema, shared API contract, and design token color contract are unchanged.
- Authenticated admin staging screenshots, commit, push, and PR remain user-gated.
- No unassigned follow-up is created because the responsive fixes are closed in the same cycle and out-of-scope items are invariant prohibitions, not deferred work.

## Lessons Learned

実装 diff から抽出した再発防止知見。レスポンシブ崩れの根本は CSS 層に集中するため、route 個別改修ではなく共通 CSS 層の以下パターンを正本とする。

- **L-RMTUF-001（breakpoint 境界 drift を半画素境界へ統一）**: 既存 media query が `max-width: 767px / 768px / 720px / 900px` と不揃いで、ちょうど境界幅で query が二重適用・非適用になる 1px gap を生んでいた。`max-width: 767.98px` / `1023.98px` の半画素境界へ統一し、必要箇所は `@media (min-width: 768px)` の companion query を足して mobile-first と desktop-grid を排他化する。新規 breakpoint 値は `tokens.css` の `--bp-md/--bp-lg/--bp-xl` を documentation anchor として置くが、**CSS media query は custom property を受け付けない**ため query 本体は px リテラルのままにする（anchor と inline 値の二重管理を許容し、anchor 側で意図を明示）。
- **L-RMTUF-002（固定 minmax 下限が狭幅で横はみ出しの主因）**: `grid-template-columns: minmax(18rem, …)` / `minmax(22rem, …)` の固定下限は viewport が下限合計を割ると track が縮まずオーバーフローする。下限を `minmax(0, …)` に置換すると flex 的に潰れて横スクロールが消える。狭幅 collapse 時の `grid-template-columns: 1fr` も `minmax(0, 1fr)` に揃えて子要素 `min-width: auto` の暗黙はみ出しを断つ。
- **L-RMTUF-003（固定 calc 幅より min() + padding-inline clamp）**: `width: min(1120px, calc(100vw - var(--space)))` や `width: min(1120px, calc(100% - 40px))` は viewport 由来の固定差し引きで端が切れる。`width: min(1120px, 100%)` + `padding-inline: clamp(1rem, 4vw, …)` に分離すると、最大幅制約と内側余白を独立に効かせられ狭幅でも安全。auth 系の `padding` も `clamp(1rem, 5vw, var(--space))` で最狭時に詰める。
- **L-RMTUF-004（広テーブルは min-width + scroll container + cell wrap の三点で封じ込め）**: admin audit のような列数の多いテーブルはレイアウトを割るので、`overflow-x: auto`（+ `-webkit-overflow-scrolling: touch`）の scroll container に入れ、table に `min-width: 48rem` を与えて潰れ過ぎを防ぎつつ、cell に `min-width: 7rem` / `white-space: normal` / `overflow-wrap: anywhere` を足して長文セルを折り返す。table を狭幅で 1 列化しない（情報密度を保つ）。
- **L-RMTUF-005（overlay/tooltip/popover は viewport 上限で cap）**: 絶対配置の tooltip/popover は `max-width: 240px` 等の固定上限だと collapsed sidebar の右隣で画面外へ出る。`max-width: min(240px, calc(100vw - var(--shell-bar-w-collapsed) - 1.5rem))` のように viewport から実占有を引いた上限へ置換し、`overflow-wrap: anywhere` で内容も折り返す。
- **L-RMTUF-006（drawer 幅は 2 class より単一 fluid token）**: `w-[17rem] max-w-[85vw]` の 2 class 併用より `w-[min(17rem,88vw)]` の単一 fluid token が意図明示的で、回帰テストも class 文字列 1 つの contain assertion で済む。実 class を Vitest で assert（jsdom は CSS 評価しないため構造検証に限定）。
- **L-RMTUF-007（visual guard は新規 spec を増やさず既存 spec に最小追加）**: 横スクロール検出は新規 Playwright spec を作らず、既存 `full-visual.spec.ts` のループ内に `scrollWidth <= clientWidth + 1` の `expect.poll` guard を 1 ブロック追加する最小差分にする。viewport fixture も `mobileNarrow`（375px）を additive に足すだけで既存 viewport を壊さない。

> いずれも apps/web 表現層のみで完結し、apps/api / D1 / Google Form / shared API contract / color token は不変（不変条件 #1 #2 #3 #5）。route 個別 follow-up は発生しない（CONST_007・1 サイクル完結）。
