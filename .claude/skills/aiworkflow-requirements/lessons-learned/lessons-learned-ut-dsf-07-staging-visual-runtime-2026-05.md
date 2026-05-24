# Lessons Learned: UT-DSF-07 staging visual runtime evidence

`ui-prototype-design-system-foundation` root workflow の Gate-B / Gate-C が要求する production-equivalent runtime（Cloudflare Workers staging）visual evidence を確立するため、staging 専用 Playwright project（`staging-visual`）・4 spec（public-top / login / profile / admin-dashboard）・`playwright-smoke.yml` への ops dispatch job までを実装し、staging deploy・baseline 生成・親 gate 解除・PR を user-gated boundary に分離した。本タスクは GitHub Issue #829（CLOSED）を再オープンせず現コードに最適化して根本解決する位置づけ。本 lessons-learned は次回類似タスクで同じ苦戦を最短で抜けるための知見集。

## L-DSF07-001: staging の SSR データは `page.route()` で差し替え不可 — visual の検証対象を「design system 描画」に絞り直す

local visual spec は `mockApi` fixture（ローカル HTTP サーバー）を Next dev server の SSR fetch 経路（`INTERNAL_API_BASE_URL`）に注入して描画を固定する。だが Cloudflare Workers staging では Worker サーバー側 fetch を Playwright が intercept できず（`page.route()` はブラウザ発行 fetch のみ）、SSR でレンダリングされる内容は実 staging API レスポンス（空状態含む）になる。

**Why:** issue 原文の前提「Playwright config を staging URL に向ければ済む」は現コードで成立しない。SSR データ内容の一致を検証目的にすると、データ揺れで永久に flake する。本タスクの真の目的は「OpenNext Workers bundle が design system（CSS `@layer` / OKLch token / rhythm / primitives）を local と等価に描画するか」であり、レイアウト・配色・余白・タイポグラフィは bundle 由来でデータに依存しない。

**How to apply:** staging runtime の visual を新設するときは Phase 1 で「検証対象は design system 描画であってデータ内容ではない」を明文化し、(a) baseURL を staging に向けた専用 project、(b) `page.route()` はクライアント動的 fetch の安定化のみに限定、(c) SSR データは staging 実値を許容、の 3 点を spec とコメントに固定する。`page.route` を「SSR を stub できる」と誤読すると R-07 を踏む。

## L-DSF07-002: staging baseline は local visual baseline と「別 testDir + 別 snapshot 名（-staging-visual-chromium-linux）」で物理分離する

local visual project（`visual/*.spec.ts` / `-visual-chromium-linux.png`）を流用せず、`visual-staging/*.spec.ts` と `-staging-visual-chromium-linux.png` という別 testDir・別 snapshot サフィックスで baseline を切り出した。既存 `desktop-chromium` / `desktop-firefox` / `mobile-webkit` の `testIgnore` にも `visual-staging` spec を追加し、通常 smoke project に staging spec が混入しないようにした。

**Why:** local baseline を staging baseline に流用すると「OpenNext bundle 描画と dev server 描画の等価性」という検証目的そのものが無効化される。snapshot 名を分けないと local CI と staging CI で同一 PNG を奪い合い、どちらの runtime の証跡か判別不能になる。

**How to apply:** runtime 別の visual baseline を足すときは必ず project name・testDir・snapshot サフィックスの 3 つを同時に分離し、新 project を全既存 project の `testIgnore` に登録する。既存 `visual/` spec と `visual-chromium` project は触らない（既存 baseline の取り直しはスコープ外）。

## L-DSF07-003: baseline 正本は CI ubuntu-latest 生成のみ — macOS local 生成 PNG はコミットしない

baseline は CI（ubuntu-latest）が生成する `-staging-visual-chromium-linux.png` を正本とし、macOS local 生成（`-darwin.png`）は緊急時のみ・コミット禁止とした。`playwright-smoke.yml` の `staging-visual` job が `staging_visual_update_snapshots=true` で初回生成し、artifact `staging-visual-baselines` から取得して spec の snapshots ディレクトリに配置する経路を正規化した。

**Why:** macOS local と CI ubuntu では font hinting / antialias 差で「local pass / CI fail」が必ず起きる。baseline を CI 環境に一本化しないと runner 差で永続的に diff fail する。

**How to apply:** CI 環境依存の baseline は「どの OS / chromium で生成したか」を正本として固定し、ローカル生成 PNG をコミットしない規約を runbook に明記する。chromium bump 時は同一更新サイクルで baseline 更新する。

## L-DSF07-004: profile / admin は「未認証 guard / redirect 描画」を design system evidence とし、認証後画面は別タスクに切る

profile / admin spec は staging に session を張らず、未認証時の middleware redirect / guard 画面の design system 描画を検証対象にした。認証後の実画面取得は「secrets / 認証フロー / seed を伴い、新規 fixture/seed 追加なしスコープと衝突」するためフォロー候補として残留リスクに記録した（タスク化はしない判定）。

**Why:** 認証後画面を staging で撮るには seed / 認証フロー注入が必要で、本タスクの「新規 mock fixture / seed の追加なし」スコープを破る。未認証 guard 描画でも design system shell（token / primitives）の production-equivalent 検証は成立する。

**How to apply:** 認証ゲート配下画面の staging visual は、未認証 guard 描画で shell を担保し、認証後 runtime visual は独立フォローに切る。残留リスクは Phase 9 に「受容理由 / フォロー」として明記し、Phase 12 unassigned-task-detection で「実行ステップであって backlog ではない」判定を残す。

## L-DSF07-005: 検証は `gate-metadata:validate` + `verify:phase12-compliance` の 2 本に閉じ、`verify-all-specs.js` は使わない

Phase 12 compliance 検証は `mise exec -- pnpm gate-metadata:validate`（artifacts.json zod schema: status enum / passed_at ISO 8601 / evidence_path 相対パス）と `mise exec -- pnpm verify:phase12-compliance`（canonical 9 headings / evidence 存在）の 2 本に閉じ、`verify-all-specs.js` は本タスクの検証経路に含めなかった。

**Why:** issue #829 最適化タスクの検証は gate-metadata 系で必要十分。`verify-all-specs.js` を混ぜると検証スコープが workflow 単位を超えて全 spec 走査になり、本タスクと無関係な drift で fail し原因切り分けが鈍る。`bash scripts/verify-pr-ready.sh` がこの 2 本 + indexes drift を束ねる pre-flight になっている。

**How to apply:** UT-DSF / issue 最適化系の Phase 10/12 検証は `gate-metadata:validate` → `verify:phase12-compliance` → `verify-pr-ready.sh` の順を正規経路とし、`verify-all-specs.js` を新規参照に足さない。fail 時は `pr-pre-flight-ci-gate-checklist.md` を参照。

## L-DSF07-006: CLOSED issue #829 は再オープンせず `Refs #829` のみ、staging-visual は PR 毎 required check に昇格しない

source issue #829 は CLOSED のまま運用し（再オープン禁止）、PR wording は `Refs #829` のみとした。`staging-visual` job は手動 deploy 後の `workflow_dispatch` 前提（`staging_visual_base_url` が空でないときのみ走る）のため、PR 毎の required status check には含めず ops gate 扱いに留めた。

**Why:** CLOSED issue を最適化で根本解決する場合の規約は「再オープンしない / Refs のみ」。staging-visual は manual deploy が前提で、PR 毎に走らせると deploy 未済の旧 bundle を撮影するため required check に不適。新規 workflow ファイルも作らず既存 `playwright-smoke.yml` 拡張に留めた。

**How to apply:** CLOSED issue 起点の最適化タスクは workflow root に「issue は CLOSED のまま運用」を明記し PR は `Refs` のみ。deploy 前提の visual job は required check ではなく `workflow_dispatch` ops gate として配線し、required check 昇格は別フォローに切る（task-709 L-709-005 と同方針）。

## 関連 promotion / sync

- aiworkflow-requirements 同一 wave 同期: `indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` / `references/workflow-ut-dsf-07-staging-visual-runtime-evidence-artifact-inventory.md` / `changelog/20260523-ut-dsf-07-staging-visual-runtime-evidence.md` / 本 lessons-learned / `indexes/topic-map.md`（`indexes:rebuild` で再生成）/ LOGS（skill `LOGS/_legacy.md` + `docs/30-workflows/LOGS.md`）。
- 同系統先行知見: `lessons-learned-task-709-visual-baseline-runtime-capture-2026-05.md`（L-709-001..005）/ `_legacy-ui-ux-visual-baseline-drift.md`。
