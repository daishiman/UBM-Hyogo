# Lessons Learned: task-12 member detail / register / legal (2026-05)

> Workflow: `docs/30-workflows/task-12-member-detail-register-legal/`
> Date: 2026-05-09
> State: `implemented-local / implementation / VISUAL_ON_EXECUTION / runtime evidence pending_user_approval`

## L-TASK12-001: Playwright evidence path 多重ルーティング

`apps/web/playwright.config.ts` の `EVIDENCE_DIR` は staging-smoke (task-05) と default e2e (08b) の二択だったが、task-12 を加える際に CI 起動経路によっては argv に spec パスが乗らない呼び出しが存在し、heuristic 単独では evidence routing が崩れた。

- **Why:** task-specific evidence directory を確実に切り替えないと、後続 task-18 regression が他タスクの phase-11 evidence を上書きするリスクがある。
- **How to apply:** spec 名 heuristic (`isTask12PublicSmoke`) と env 上書き (`PLAYWRIGHT_EVIDENCE_TASK`) の二段構成を採る。CI 起動経路が argv に spec を載せない場合でも env で確実に指定できるようにする。今後の task でも同パターンを再利用する。

## L-TASK12-002: Playwright `webServer.env.PORT` の URL 由来同期

`PLAYWRIGHT_BASE_URL` を非 3000 に上書きしても `pnpm --filter @ubm-hyogo/web dev` は Next dev 既定の 3000 で起動し、baseURL とポートが乖離して接続失敗となった。

- **Why:** Playwright の `baseURL` と dev server の listen port は別レイヤなので、URL 側の port を `webServer.env.PORT` に伝播させる必要がある。
- **How to apply:** `localPort = new URL(localBaseURL).port || '3000'` を一度導出し、`webServer.env: { PORT: localPort }` で必ず渡す。dev コマンド側を書き換えない（dev 側の責務を増やさない）。

## L-TASK12-003: legacy public CSS のコンポーネント拡張は selector list join

`[data-component="member-activity"]` は timeline と視覚仕様が同一だが、新規ルールを別ブロックで追加すると 30+ 行の重複と token 同期事故の温床になる。

- **Why:** legacy-public.css は `--ubm-*` token を媒介に primitive を表現しているため、視覚的等価コンポーネントは同じ rule set を共有させると drift しない。
- **How to apply:** 新コンポーネントが既存コンポーネントと視覚的に等価なら、`[data-component="timeline"] ol, [data-component="timeline"] li` の selector list に comma-join で追加する。新規ブロックでコピーしない。

## L-TASK12-004: task-10 primitive (`.ui-card`) と legacy-public.css の境界

`register-callout` は task-10 の `.ui-card` primitive を再利用しつつ、register page 固有の余白・ボーダー・shadow を持たせる必要があった。primitive 側を書き換えると再利用箇所すべてに波及する。

- **Why:** primitive は再利用前提で安定維持し、ページ固有の調整は scope された ancestor selector でのみ行うのが prototype alignment の鉄則。
- **How to apply:** `[data-component="register-callout"] .ui-card { ... }` のように `data-component` ancestor で scope し、内部は `--ubm-*` token のみを参照する。HEX 直書き / `bg-[#xxx]` は CI gate (`verify-design-tokens`) で fail する。

## L-TASK12-005: `responder-link` と `register-cta` の dual-role CSS

既存の Google Form 直接リンク (`[data-role="responder-link"]`) と新設の consent-gated CTA (`[data-role="register-cta"]`) は視覚仕様が同一。別 selector でコピーすると button 高さ・色 token・hover 状態の同期が破綻しやすい。

- **Why:** 視覚的に等価な role は selector list を共有させるのが最も drift しない実装。
- **How to apply:** `[data-page="register"] [data-role="responder-link"], [data-page="register"] [data-role="register-cta"]` のように comma-join で同じ rule set を適用する。role 側は意味論を表すだけにして、視覚は selector list に集約する。
