# task-08b-visual-regression-baseline-scope-001

## 概要

Playwright `toHaveScreenshot()` による pixel diff baseline をどの cell まで拡張するかを決定し、attendance UI に限定された現行 baseline を 09a staging 後に scoped で拡大する。全 44 cell に baseline を張ると UI 微変更で false positive が増えるため、scope と更新フローを正本化する。

## 苦戦箇所【記入必須】

- 対象: `apps/web/playwright/tests/**/*.spec.ts` および `apps/web/playwright.config.ts`
- 症状: 08b 時点では visual regression は attendance UI 1 画面のみで baseline 確立。残り 43 cell に拡大する判断が `scaffolding-only` 境界では出来ず、09a staging baseline 確立まで延期されたまま判断者が未指名
- 参照: `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-12/unassigned-task-detection.md` の U-2

## スコープ（含む/含まない）

含む:

- visual regression baseline 適用 cell 一覧の確定（公開 / login / profile / admin / search / density 各画面）
- baseline 更新オペレーション（`--update-snapshots` 実行権限と PR レビュー基準）の runbook 化
- false positive 抑制ポリシー（`maxDiffPixels` / `threshold` / `animations: 'disabled'` の標準値）
- baseline 画像の保存先（`apps/web/playwright/tests/__screenshots__/`）と Git LFS 要否判定

含まない:

- staging 環境における実 baseline 撮影（09a staging-deploy-smoke のスコープ）
- UI ライブラリ全面差し替えなど baseline 全更新を伴う改修
- production URL を対象とした baseline

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 全 44 cell baseline 化で UI 微修正のたびに大量 false positive | scope を user-facing critical path に限定し、ADR で対象 cell を明示する |
| baseline 画像のリポジトリ肥大 | PNG を `__screenshots__/` に集約し、サイズ閾値 (e.g. 200KB/file) を CI gate に追加 |
| baseline 更新権限の曖昧化で古い snapshot が残存 | `--update-snapshots` PR は `visual-regression` ラベル必須化と CODEOWNERS 追加 |
| OS / browser version 差で baseline drift | CI の Playwright Docker image を pin し、ローカル更新を禁止する |

## 検証方法

```bash
# baseline 適用 cell の自動検出
rg -l "toHaveScreenshot" apps/web/playwright/tests | wc -l

# baseline 更新時の差分検査
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --update-snapshots
git diff --stat apps/web/playwright/tests/__screenshots__/

# CI gate 確認
gh workflow view e2e-tests.yml
```

期待: 対象 cell 数が ADR 記載値と一致、baseline 更新は labeled PR でのみ可能。

## 参照

- `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-12/unassigned-task-detection.md` (U-2)
- `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md`
- 09a staging-deploy-smoke の Phase 11 evidence runbook
