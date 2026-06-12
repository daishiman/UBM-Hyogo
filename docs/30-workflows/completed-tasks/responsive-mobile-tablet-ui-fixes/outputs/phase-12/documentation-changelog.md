# ドキュメント更新履歴 — responsive-mobile-tablet-ui-fixes

workflow_state: `implemented_local_visual_present_staging_pending` / 生成日: 2026-06-12

本タスクは `implemented_local_visual_present_staging_pending` の実装仕様書である。以下は本 wave で作成したドキュメント、本サイクルで変更した
`apps/web` ファイル一覧、および検証結果を記録する。本サイクルでは apps/web 実装・focused vitest・token/type/lint・local runtime smoke・local physical PNG capture を実行した。

## 本 wave で作成した仕様書 + Phase 12 strict 7

### workflow-local（本 workflow root 配下）

| ファイル | 種別 |
| --- | --- |
| `shared-context.md` | 新規（19 ルート inventory / viewport / breakpoint / RC→AC trace の SSOT） |
| `phase-1-requirements.md` 〜 `phase-13-pr.md` | 新規（Phase 1-13 実装仕様書） |
| `index.md` / `artifacts.json` | 新規（タスク索引 / metadata・gates） |
| `outputs/phase-11/manual-test-result.md` | 新規（local evidence PASS 記録） |
| `outputs/phase-11/runtime-smoke-result.json` | 新規（local runtime smoke PASS 記録） |
| `outputs/phase-11/screenshot-inventory.json` | 新規（local physical PNG present / authenticated admin staging baseline user-gated 記録） |
| `outputs/phase-11/screenshot-coverage.md` | 新規（local PNG 5 files の coverage 表） |
| `outputs/phase-11/screenshots/*.png` | 新規（local physical PNG 5 files） |
| `outputs/phase-12/main.md` | 新規 |
| `outputs/phase-12/implementation-guide.md` | 新規（Part 1 + Part 2） |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 |
| `outputs/phase-12/documentation-changelog.md` | 新規（本ファイル） |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 |
| `outputs/phase-12/skill-feedback-report.md` | 新規 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 |
| `outputs/artifacts.json` | 新規（root artifacts.json の mirror） |

### global skill sync（aiworkflow-requirements 横断正本）

> workflow-local（上記）と global skill sync（下記）は別ブロックで管理する（BEFORE-QUIT-003）。

| Target | 同期内容 | 状況 |
| --- | --- | --- |
| workflow inventory | `responsive-mobile-tablet-ui-fixes`（`implemented_local_visual_present_staging_pending`）を active workflow として登録 | done |
| quick-reference / resource-map | task 概要・参照パスを追記 | done |
| task-workflow-active | active workflow テーブルに追加（local implementation evidence captured / staging user-gated を明記） | done |
| changelog / LOGS | 本 wave の spec 作成を 1 行記録 | done |

## 本サイクルで変更した実装ファイル（apps/web 表現層のみ）

| # | パス | 種別 | AC |
| --- | --- | --- | --- |
| 1 | `apps/web/src/styles/tokens.css` | 編集 | AC-1 |
| 2 | `apps/web/src/styles/globals.css` | 編集 | AC-1/2/4/6/7/8 |
| 3 | `apps/web/src/styles/legacy-public.css` | 編集 | AC-2/6 |
| 4 | `apps/web/src/styles/auth.css` | 編集 | AC-3/5 |
| 5 | `apps/web/src/components/shell/SidebarDrawer.tsx` | 編集 | AC-8 |
| 6 | `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | 編集 | AC-8 |
| 7 | `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | 編集 | AC-2..AC-10 |
| 8 | `apps/web/playwright/fixtures/viewports.ts` | 編集（2026-06-12 gap fix） | AC-2..AC-5 |

> 上記は Phase 2 設計の変更対象ファイル一覧と一致する。実コード変更・focused vitest・token/type/lint・local runtime smoke は本サイクルで実施済み。authenticated staging screenshot は user-gated。
> 2026-06-12 gap fix: Phase 5 仕様突合で `globals.css` の `max-width: 720px` 残存（→ `767.98px` 統一）と `viewports.ts` `mobileNarrow` 未追加（→ additive 追加）を是正。全 gate 再実行 PASS（詳細: `outputs/phase-11/manual-test-result.md`）。

## 別タスク分離記録（AC-9 関連）

- 本タスクは 1 サイクル完結（CONST_007）であり、別タスク分離は **なし**。崩れの根本が共通 CSS 層に集中するため、
  route 個別改修は限定的で全 19 ルートを 1 実装サイクルで是正できる。「分量が多い」を理由とした別 PR / Phase 2 分離は行わない。
- スコープ外項目（API endpoint 追加 / D1 schema 変更 / Form 仕様変更 / 配色再設計 / 新規 primitive）は不変条件による禁止であって
  「先送りタスク」ではない。よって `unassigned-task-specs/` への分離仕様は作成しない（未タスク検出 0 件）。

## 仕様策定中に検出した観察事項（drift 観察 / 非ブロッキング）

| # | 観察 | 実測 | 扱い |
| --- | --- | --- | --- |
| D-1 | vitest 設定パスの drift | `apps/web/vitest.config.ts` は不在。実 SSOT はリポジトリルートの `vitest.config.ts` | phase docs / artifacts の focused vitest コマンドを `--root=. --config=vitest.config.ts` で統一記載 |
| D-2 | screenshot 二層 evidence の区別 | local runtime smoke と physical PNG は取得済み、authenticated admin staging baseline は user-gated | `manual-test-result.md` / `runtime-smoke-result.json` / `screenshot-inventory.json` / `screenshot-coverage.md` で present と pending を分離 |

## validator 結果（implemented_local_visual_present_staging_pending）

| 検証 | 状況 |
| --- | --- |
| focused vitest | PASS（`SidebarDrawer.spec.tsx` 5 tests） |
| token gate | PASS（`tokens.runtime.spec.ts` 9 tests） |
| typecheck / lint | PASS（`@ubm-hyogo/web typecheck` / `@ubm-hyogo/web lint` exit 0） |
| local runtime smoke | PASS（2026-06-12 post-gap-fix 再実行: 9 routes × 4 viewports = 36 checks overflow false） |
| local physical PNG | PASS（`outputs/phase-11/screenshots/*.png` 5 files present、全 captured route `overflowX=false`） |
| `git diff --name-only -- apps/api`（AC-9） | PASS（空） |
| `pnpm verify:phase12-compliance` / `pnpm gate-metadata:validate` | 最終検証で実行（spec 成果物の構造 gate） |
| `pnpm verify:phase12-compliance` / `pnpm gate-metadata:validate` | 最終検証で実行 |

> authenticated admin staging screenshot は user-gated runtime artifact のため未生成。local physical PNG は `outputs/phase-11/screenshots/` に 5 files present。
