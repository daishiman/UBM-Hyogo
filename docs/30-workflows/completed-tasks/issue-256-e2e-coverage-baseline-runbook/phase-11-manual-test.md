# Phase 11 — 手動テスト (NON_VISUAL)

`[実装区分: 実装仕様書]`

## NON_VISUAL 宣言

本タスクは scripts / workflow / runbook / unit test の追加が中心で、UI 変更を一切含まない。Phase 11 スクリーンショットは不要。代替証跡として以下を `outputs/phase-11/manual-test-result.md` に記録する。

## 1. 手動確認項目

| # | 項目 | コマンド | 期待 |
|---|------|---------|------|
| MT-01 | exclude 比率計測 | `mise exec -- pnpm tsx scripts/measure-coverage-exclude-ratio.ts` | JSON 出力、ratio が現実的な値 (0..1) |
| MT-02 | unit test pass | `mise exec -- pnpm vitest run scripts/__tests__/measure-coverage-exclude-ratio.spec.ts apps/web/app/__tests__` | 全 GREEN |
| MT-03 | typecheck | `mise exec -- pnpm typecheck` | GREEN |
| MT-04 | lint | `mise exec -- pnpm lint` | GREEN |
| MT-05 | workflow yaml | `actionlint .github/workflows/verify-coverage-exclude-ratio.yml` | exit 0 |
| MT-06 | regression: playwright-smoke (ローカル subset) | `mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke -- --grep "/"` | smoke 一部 route で PASS |

## 2. 証跡メタ (FB-Feedback-4 準拠)

- 主ソース: 上記 6 自動コマンドの exit code + stdout 抜粋
- スクリーンショット作らない理由: UI 変更ゼロ。runbook / script 追加のみ
- 環境ブロッカーの可能性: なし (mise / pnpm が動く環境であれば実行可能)

## 3. 出力

`outputs/phase-11/manual-test-result.md`
