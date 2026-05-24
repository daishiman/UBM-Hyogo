# Phase 11 — RAC-3: SchemaDiffPanel recompute UI visual baseline

[実装区分: 実装仕様書]

> 目的: `apps/web/src/components/admin/SchemaDiffPanel.tsx` に新設する recompute 実行ボタン + status バッジの Playwright visual baseline を追加し、task-18 visual-full の broad regression gate に整合させる（RAC-3 / AC-6 / AC-10）。
> 実行区分: local（dev server + Playwright `--update-snapshots`）。本番 D1 / staging は不要。

## 撮影対象の状態（`outputs/phase-02/ui-state-machine.md` の `RecomputeUiStatus` 準拠）

| # | 状態 | canonical filename | data-role / 表示 | 撮影トリガー（mock 応答） |
| --- | --- | --- | --- | --- |
| S-01 | idle | `schema-diff-panel-recompute-idle.png` | `recompute-action` 表示 + `recompute-trigger`「再集計を実行」 | rollback 完了 impact `recomputeRequired=true`・recompute 未実行 |
| S-02 | running | `schema-diff-panel-recompute-running.png` | `recompute-status[data-status="running"]`「再集計中」+「再集計を続行」 | POST recompute 200 `status:"running"`（CPU budget 跨ぎ） |
| S-03 | completed | `schema-diff-panel-recompute-completed.png` | `recompute-status[data-status="completed"]`「再集計済み」+ processedCount | POST recompute 200 `status:"completed"` |
| S-04 | failed | `schema-diff-panel-recompute-failed.png` | `recompute-status[data-status="failed"]`「失敗」+ `recompute-error` +「再試行」 | POST recompute error |

> `<component>-<state>.png` 規約。TC 番号はファイル名へ埋め込まない（FB-LLM-MOD-05-001。TC は `phase11-capture-metadata.json` の `tc` のみ）。

## 撮影方式の選択（既存 playwright 慣習との整合）

リポジトリには 2 系統の visual 経路がある:

1. **`apps/web/playwright/tests/visual/admin-schema-diff.spec.ts`**（project `visual-chromium`）: `paneRegion.screenshot({ path })` で evidence dir へ書き出す runtime evidence 系。本タスクの 4 状態 baseline はこの慣習を踏襲し、`SchemaDiffPanel` の `[data-role="recompute-action"]` region を `mock route` で 4 状態に切り替えて撮影する。
2. **`apps/web/playwright/tests/visual-full/full-visual.spec.ts`**（project `visual-full-chromium-{desktop,tablet,mobile}` / `VISUAL_ROUTES`）: `toHaveScreenshot()` による broad regression baseline。`/admin/schema`（slug `admin-schema`）が既に対象 route に含まれる。

本タスクは **(1) の admin-schema-diff visual spec に recompute 4 状態を追加** することを正本とする。理由: recompute UI は impact パネル内の局所要素で、状態遷移（mock route 切替）を必要とするため、route 全体を撮る (2) では idle 以外の状態を固定できない。(2) 側は `/admin/schema` の idle 状態が `full-visual-admin-schema-{viewport}.png` に自動で含まれるため、recompute idle の broad regression は (2) が carry する。

## baseline 撮影手順（local・user-gated でない）

`apps/web/playwright.config.ts` の `visual-chromium` project（`testMatch: /visual\/.*\.spec\.ts$/`・viewport 1280x800）を使う。evidence dir は `admin-schema-diff.spec.ts` 既存実装に倣い `ADMIN_SCHEMA_DIFF_EVIDENCE_DIR` で本タスク配下へ向ける。

```bash
# dev server は webServer 設定が自動起動（reuseExistingServer: !CI）
# recompute 4 状態を mock route で切り替える test を visual spec に追加した上で:
ADMIN_SCHEMA_DIFF_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/outputs/phase-11/screenshots \
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/visual/admin-schema-diff.spec.ts \
  --project=visual-chromium
```

`toHaveScreenshot` baseline（visual-full 経路）を更新する場合のみ `--update-snapshots` を付ける:

```bash
# /admin/schema の idle baseline を visual-full snapshot として更新（recompute idle を broad gate に取り込む）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/visual-full/full-visual.spec.ts \
  --project=visual-full-chromium-desktop \
  --grep "admin-schema" \
  --update-snapshots
```

> snapshot 出力先: `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/`（既存 `*-snapshots` dir 慣習）。
> region screenshot 出力先: 上記 `ADMIN_SCHEMA_DIFF_EVIDENCE_DIR/screenshots/`。

## task-18 visual-full required check との整合方針

- `playwright-smoke / visual (chromium, 4 screens)` および task-18 visual-full は `dev` / `main` の required status check 候補（CLAUDE.md task-18 / Issue #554）。recompute UI を `/admin/schema` に追加すると `full-visual-admin-schema-desktop.png` 等の既存 baseline が差分化する。
- そのため **recompute UI を含む `/admin/schema` の visual-full baseline を `--update-snapshots` で更新し、同一 PR に snapshot 更新をコミットする**（baseline 追加忘れで `visual-full` CI fail を防ぐ・index.md リスク表「Playwright visual baseline 追加忘れ」緩和策）。
- `expect.toHaveScreenshot.maxDiffPixelRatio: 0.02`（`playwright.config.ts:125`）の許容内に収まるよう、status バッジは既存 token utility のみ使用し font / アニメーションは `animations: 'disabled'` で固定（full-visual spec が `transition:none` を注入済み）。

## 確認項目（DoD）

- [ ] S-01〜S-04 の 4 canonical filename が撮影され、`phase11-capture-metadata.json` の `file` と一致
- [ ] visual-full `/admin/schema` baseline を recompute UI 込みで更新し同一 PR にコミット
- [ ] status バッジに HEX 直書き / `bg-[#xxx]` がない（AC-10 / `verify-design-tokens` pass）
- [ ] `data-role="recompute-warning"`（旧 248-250）が撮影画像から消えている

## 既知の制限

- recompute running / failed 状態は server の実 job 状態に依存するため、(1) の baseline は mock route で状態を固定して撮影する（runtime の真実は RAC-2 `recompute-runtime.md` で別途確認）。
