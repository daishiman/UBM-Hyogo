# Lessons Learned: issue-1016 unified-sidebar-shell Task E (mobile drawer responsive) — 2026-05-31

## Scope

`docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/` — 親 workflow `unified-sidebar-shell-public-and-admin` の Task E（モバイルドロワーレスポンシブ）を Phase 1-13 サブworkflow として単独サイクル化。

実装本体: `apps/web/src/components/shell/` の `SidebarMobileTrigger.tsx` / `SidebarDrawer.tsx`（新規）+ `useSidebarState.ts` / `SidebarShell.tsx`（編集）+ `is-browser.ts` に `browserMatchMedia()` 追加 + `globals.css` scroll-lock。focused Vitest 4 files / 21 tests PASS、local screenshot 4 枚（375 / 768 / 1280）。

workflow_state は `implemented_local_runtime_pending`（Gate-A/B passed、Gate-C = staging visual / commit / push / PR は user-gated）。親 Task A 系の `lessons-learned-unified-sidebar-shell-task-a-2026-05.md`（L-USS-001..005）を踏襲する。

## Lessons

### L-I1016-001: Implementation Target Physical Existence Gate を CLOSED Issue follow-up でも適用する

- **Rule**: workflow が具体的な `apps/` implementation target を列挙していて、当該ワークツリーで実装が可能な場合、`spec_created` の散文だけで close-out してはならない。実コード + focused test = Gate-B を成立させてから close する。
- **Why**: 本タスクは当初 `implementation / VISUAL` でありながら implementation target を列挙したまま `spec_created` で残っていた。spec_created の「誠実性」を盾に実装を後回しにすると、先行実装された state（後述 L-I1016-002）が宙ぶらりんのまま放置され、knowledge / coverage drift の温床になる。
- **How to apply**: automation-30 close-out で `taskType=implementation` かつ target が物理的に実装可能なら、Implementation Target Physical Existence Gate を spec_created 誠実性より優先する。同一 wave で global skill（aiworkflow-requirements / task-specification-creator）反映も行う。

### L-I1016-002: 先行未消費 state は同一 feature surface で消費先を実装してから close する

- **Rule**: 親タスク（Task A）が `useSidebarState` に `drawerOpen` / `setDrawerOpen` を先行実装したが消費先（Trigger / Drawer）が存在しない「宙ぶらりん state」がある場合、後続タスクは新しい抽象や別 backlog を増やさず、その state の消費先（`SidebarMobileTrigger` / `SidebarDrawer`）を実装して閉じる。
- **Why**: 消費先のない state は dead code 同然で、別 backlog 化すると親 Task A の意図（後続消費前提の slot 設計、L-USS-002 / L-USS-005）が分断される。
- **How to apply**: 後続タスク着手時に親 workflow の state / prop surface を grep し、未消費の `setX` / slot があれば「消費先実装」を優先 scope に組み込む。新規 unassigned-task は立てない。

### L-I1016-003: client-only responsive helper は既存 browser boundary module に集約する

- **Rule**: `window.matchMedia` 等の client-only API は feature component から直接呼ばず、既存の browser boundary module（`apps/web/src/lib/is-browser.ts`）に `browserMatchMedia(query)` として helper を追加して経由する。jsdom / SSR で `window.matchMedia` 不在の場合の fallback も helper 側に閉じる。
- **Why**: feature component で `window.*` を直呼びすると SSR / Cloudflare Workers で hydration / runtime エラーになり、`scripts/lint-boundaries.mjs` の forbidden token substring 検出（L-USS-003b 参照）にも引っかかりやすい。boundary に集約すると focused test で fallback を 1 箇所網羅できる。
- **How to apply**: responsive / media-query 由来の分岐は boundary helper（`browserMatchMedia()`）を 1 件追加し、jsdom で `window.matchMedia` 不在時の fallback を focused test で確認する。Phase 3 MINOR（M-3）として検出した場合も新規 token / module を増やさず既存 boundary を拡張する（baseline 解消）。

### L-I1016-004: VISUAL タスクの status は二段階（local present / staging pending）で分離追跡する

- **Rule**: VISUAL タスクでは focused component test が Gate-B を満たし、視覚証跡は「local screenshot `present`」と「staging visual `pending`」を分けて追跡する。workflow_state / Phase 11 evidence で `focused tests present` / `local screenshot present` / `staging visual pending` を区別する。
- **Why**: local capture を「VISUAL 完了」と一括表記すると、user-gated な staging 確認を済ませたかのような誠実性 drift が出る。逆に spec_created 段階では screenshot を `pending` 表記にしないと、未撮影を「撮影済」と誤読される。
- **How to apply**: VISUAL の Phase 11 evidence は status 列を `present`（local capture 後）/ `pending`（staging）で分け、`implemented_local_runtime_pending` を Gate-C 前の正規 state とする。

### L-I1016-005: Phase 3 MINOR は current（横展開未タスク）と baseline（本サイクル解消）に分離する

- **Rule**: Phase 3 / Phase 10 の MINOR 指摘を Phase 12 unassigned-task-detection で扱う際、「本サイクル内で解消した（baseline）」と「横展開のため別レーンに切り出す（current 未タスク化候補）」を明確に分離する。baseline は未タスク化しない。
- **Why**: 解消済みの MINOR を誤って current 未タスク化すると、不要な backlog が増え discovery が肥大化する。本タスクでは M-1（drawer/aside 重複は差分ありで helper 抽出不要）/ M-2（既存 token + opacity で scrim 解消）/ M-3（`browserMatchMedia()` 追加で解消）を全て baseline に分類し current = 0 件とした。
- **How to apply**: unassigned-task-detection.md に current / baseline の 2 区分テーブルを必須化し、各 MINOR の解消手段（実コード / 既存スコープ）を 1 行で根拠付けする。

### L-I1016-006: 識別子は implementation-guide で phase-02-design から逐語引用し drift を防ぐ

- **Rule**: implementation-guide Part 2（技術者向け）で型定義・`data-*` 属性・breakpoint・storage key・dialog id を `phase-02-design.md` から逐語引用し、手書き drift を禁止する。
- **Why**: 識別子を手書きで再記述すると `shell-drawer` id と `aria-controls` / `aria-labelledby` の不一致、breakpoint（768px / 1024px）や storage key（`ubm:shell:collapsed`）の表記揺れが構造的に発生する。
- **How to apply**: guide テンプレ冒頭に「識別子は phase-02-design から逐語引用」注記を置く。`SidebarDrawerProps`（`open` / `onClose` / `children`）・`data-shell-drawer-open`・dialog id `shell-drawer` を design 正本から転記し、突合で drift 0 を確認する。

### L-I1016-007: modal/drawer scrim は sibling backdrop + token + opacity で新 token を増やさない

- **Rule**: drawer の暗幕（scrim）は panel の子に opacity をかけず、sibling backdrop 要素に既存 token color + `opacity-40` を当てる。新規 `--ubm-color-overlay-scrim` token は増やさない。
- **Why**: panel 自身に opacity をかけると中身（nav / close button）まで透過する。sibling backdrop に分離すれば panel は不透明のまま、新 token も不要で design token 正本を汚さない。
- **How to apply**: overlay 系 UI は backdrop と panel を兄弟要素に分け、backdrop に `bg-[var(--ubm-color-text-primary)] opacity-40` を限定適用する。INV-2（OKLch token 正本 / HEX 直書き禁止）と整合する。

## Evidence

- Workflow root: `docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/`
- Focused Vitest: `outputs/phase-11/evidence/focused-vitest.log`（4 files / 21 tests PASS）
- Local screenshots: `outputs/phase-11/screenshots/*.png`（375 / 768 / 1280）
- Phase 12 strict 7: `outputs/phase-12/`
- Artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-issue-1016-sidebar-mobile-drawer-responsive-artifact-inventory.md`
- task-specification-creator lesson: `.claude/skills/task-specification-creator/lessons-learned/sidebar-mobile-drawer-responsive.md`
- 親 Task A lesson: `lessons-learned-unified-sidebar-shell-task-a-2026-05.md`（L-USS-001..005）
