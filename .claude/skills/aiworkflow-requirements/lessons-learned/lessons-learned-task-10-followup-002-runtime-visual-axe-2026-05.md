# Lessons Learned — task-10 follow-up 002 runtime visual + axe evidence（2026-05-11）

> task: `task-10-followup-002-runtime-visual-axe-evidence`
> 関連 spec: `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/`（Phase 1-12 strict 7、Phase 13 readiness）
> 関連 source: `apps/web/app/(dev)/primitives-harness/page.tsx`、`apps/web/app/(dev)/layout.tsx`、`apps/web/playwright/tests/ui-primitives-visual.spec.ts`、`apps/web/playwright.config.ts`、`apps/web/src/components/ui/{Sidebar,Stat}.tsx`
> 関連 evidence: `outputs/phase-11/evidence/screenshots/`（37 PNG / 37 variants）、`outputs/phase-11/evidence/axe-report.json`（violations=0、38 passed）
> 関連 reference: `references/ui-ux-components.md` §task-10 follow-up 002 / `references/task-workflow-active.md`（task-10-followup-002 行）/ `lessons-learned/lessons-learned-task-10-ui-primitives-2026-05.md`（先行教訓 L-T10-001..004）

## 苦戦箇所サマリ

先行 task-10（UI primitives spec）が `IMPLEMENTED_LOCAL_BUILD_CLOUDFLARE_BLOCKED_RUNTIME_PENDING` 状態で close-out したため、runtime visual evidence と axe scan を別 wave で取得する必要があった。`build:cloudflare` blocker（OpenNext esbuild host/binary mismatch、task-10-followup-001 で追跡）は未解消のまま、Playwright + axe-core を local Next dev server に対して走らせる経路を確立した。dev-only route の prod bundle 流出防止には `ENABLE_PRIMITIVES_HARNESS=1` env flag gating を採用。Stat/Sidebar の semantic HTML 不足（`<aside>`/`<dl>/<dt>/<dd>` 欠落）で axe violations が初回 run で出ており、primitive 側の semantic 修正で 0 violations へ収束させた。

## 教訓一覧

### L-T10F002-001: VISUAL_ON_EXECUTION 境界 task は 2段階 workflow_state を設計する

- **背景**: task-10 本体は `implemented-local-build-blocked` で local gate PASS / runtime gate 未取得のまま close-out した。後続で runtime evidence を取得するとき、close-out vocabulary に「local evidence captured（build blocker 継続中でも runtime visual + axe は取得済み）」を表現する語彙が無く、Phase 12 detection が曖昧化した。
- **教訓**: `VISUAL_ON_EXECUTION` UI task は close-out enum を **2段階**で設計する。
  1. `implemented-local-build-blocked`（local typecheck/lint/build/test PASS、cloudflare bundle blocker、runtime evidence 未取得）
  2. `implemented_local_evidence_captured`（local dev server 上で Playwright + axe による runtime evidence 取得済み、cloudflare bundle blocker 継続中、production runtime evidence は別 wave）
- 本 follow-up 002 は (2) を確立した最初の事例。production runtime evidence は build blocker 解消後の wave で `runtime_pass` enum へ昇格する想定。
- **将来アクション**: `task-specification-creator` の Phase 12 detection 規約に「VISUAL_ON_EXECUTION の 2段階 workflow_state（build-blocked / local_evidence_captured / runtime_pass）」を正式に追加する。

### L-T10F002-002: dev-only route は env flag gating で prod bundle から除外する

- **背景**: `apps/web/app/(dev)/primitives-harness/` は Playwright が visit する harness route であり、production OpenNext bundle に流出すると attack surface 増加と CSP/route inventory 汚染になる。
- **教訓**: dev-only route は **`ENABLE_PRIMITIVES_HARNESS=1` env flag** で gating する。
  - `apps/web/app/(dev)/layout.tsx` の冒頭で `process.env.ENABLE_PRIMITIVES_HARNESS !== '1'` の場合 `notFound()` を return（route group `(dev)` 全体を 404 化）
  - `apps/web/playwright.config.ts` の `webServer.env` に `ENABLE_PRIMITIVES_HARNESS: '1'` を注入
  - production / staging の `wrangler.toml` には flag 未設定（default で route 無効）
- これにより runtime route inventory grep gate（task-18 想定）でも prod に harness が出ない。
- **将来アクション**: 他の dev-only / visual harness route（design-tokens preview など）も同 flag 群 pattern を踏襲し、`apps/web/src/lib/env.ts` の dev-only flag セクションに登録する。

### L-T10F002-003: Playwright + axe-core を同一 spec に同梱して evidence を一度の run で取得する

- **背景**: visual screenshot と a11y axe scan を別 spec / 別 run に分けると、variant 列挙の重複・evidence 出力 path の散逸・CI run time の倍増が起きる。
- **教訓**: `apps/web/playwright/tests/ui-primitives-visual.spec.ts` の 1 spec 内で **variant ループを 1 回**実施し、各 variant で以下を順に取得する。
  1. `page.goto('/primitives-harness?variant=<name>')`
  2. `page.screenshot({ path: 'outputs/phase-11/evidence/screenshots/<variant>.png' })`
  3. `injectAxe(page)` → `checkA11y(page, ...)` → 結果を `axe-report.json` に append
- 結果: 37 variants で screenshot 37 PNG + axe report 1 ファイル（violations=0 / 38 passed = 各 variant の検査セット）を 1 run で生成。evidence path も `outputs/phase-11/evidence/{screenshots,axe-report.json}` で一意化。
- **将来アクション**: 同パターンを `references/testing-playwright-e2e.md` の visual + a11y combined evidence セクションに正本化し、後続の UI task で再利用する。

### L-T10F002-004: primitive の semantic HTML（`<aside>`、`<dl>/<dt>/<dd>`）で axe violations を解消する

- **背景**: 初回 axe run で `Sidebar`（`<div role="navigation">`）と `Stat`（label/value を平な `<div>`）に違反候補が出た。`landmark-one-main` / `definition-list` 系の checks が望ましい semantic を要求していた。
- **教訓**: primitive 側で **HTML5 semantic element** を採用する。
  - `Sidebar.tsx`: ルートを `<aside aria-label="...">` に変更（`role="navigation"` は内部 `<nav>` 子要素で表現）
  - `Stat.tsx`: label/value 対を `<dl><dt>{label}</dt><dd>{value}</dd></dl>` 構造に変更
  - これにより axe violations が 0 に収束し、screen reader 上での意味的構造も向上した。
- 既存 consumer（`apps/web/src/app/(admin)/admin/page.tsx` など）は visual / API 互換を維持（props 不変）し、内部 DOM のみ更新したため migration 不要。
- **将来アクション**: `references/ui-ux-components.md` の task-10 integration contract セクションに「primitive は意味タグ優先（`<aside>`/`<dl>`/`<nav>`/`<section>`）」原則を追記し、後続 primitive 追加時の axe regression を予防する。

## 再発防止: Phase 12 detection 規約への組み込み

- task-10 本体 close-out 時点で「build blocker 継続中でも local runtime evidence を取得する後続 task」を予期した close-out enum が無かったため、follow-up 002 の workflow_state 命名で迷いが生じた。
- 今後は `task-specification-creator` の Phase 12 detection rubric に以下を組み込む:
  - VISUAL_ON_EXECUTION task は close-out enum 候補に必ず `implemented-local-build-blocked` と `implemented_local_evidence_captured` の **2段階** を提示する
  - follow-up wave での昇格経路（local_evidence_captured → runtime_pass）を Phase 1 dependency 表で明示する
  - dev-only harness route を伴う場合は env flag gating + production route inventory grep gate を Phase 12 strict files で必須化する

## 適用範囲

- 本 lessons は VISUAL_ON_EXECUTION UI task（primitive 拡張・harness route・visual + axe evidence 取得）に適用する。
- L-T10F002-002 は dev-only route 全般（design-tokens preview / storybook 相当 / fixture harness）に適用。
- L-T10F002-003 は Playwright + axe-core combined evidence 取得を伴う全 task に適用。
- L-T10F002-004 は primitive 追加 / 拡張時の semantic HTML 選定全般に適用。

## 追跡 / 未解放事項

- `build:cloudflare` blocker（OpenNext esbuild host `0.25.4` / binary `0.21.5` mismatch）は task-10-followup-001 で継続追跡。本 follow-up 002 は local dev server 経路で runtime evidence を確立したのみで、production-equivalent runtime evidence は blocker 解消後の wave に委譲する。
- commit / push / PR は user approval 後の execution operation で実行（本 wave は spec + 実装 + local evidence の同期まで）。
