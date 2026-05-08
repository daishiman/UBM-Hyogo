# Phase 11 Evidence Index

判定: IMPLEMENTED_LOCAL_RUNTIME_PENDING / WORKFLOW_SWITCH_PENDING_GATE

本サイクルでは observation scripts (`post-switch-monitor.ts` / `fallback-rate-alert.ts`) と focused unit test を実コードベースに追加し、focused vitest を pass させた。`.github/workflows/cf-audit-log-monitor.yml` の `CF_AUDIT_CLASSIFIER=ml` への切替および production model artifact 配布は Gate-A〜C 通過後の別 PR で扱う（Phase 6 ステップ 2）。NON_VISUAL のため screenshot は生成しない。

## 必須 outputs

| file | status | 内容 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | present | 本 index |
| `outputs/phase-11/manual-smoke-log.md` | present | spec walkthrough / rollback 境界確認 |
| `outputs/phase-11/link-checklist.md` | present | 参照リンクの実在確認 |
| `outputs/phase-11/evidence/test.log` | present | focused vitest（26 tests passed） |
| `outputs/phase-11/evidence/dry-run-ml.log` | present | post-switch-monitor.ts の skeleton snapshot dry-run JSON |
| `outputs/phase-11/evidence/grep-gate.log` | present | secret-leakage-grep.ts --exit-on-detect 動作確認（clean） |
| `outputs/phase-11/evidence/typecheck.log` | present | `pnpm typecheck` 出力（既存 apps/web Sentry dependency missing で exit 1。本タスク追加コード由来エラー 0 件） |
| `outputs/phase-11/evidence/lint.log` | present | `pnpm lint` 出力（lint-boundaries / dependency-cruiser / stablekey-literal pass。既存 Sentry dependency missing で exit 1） |

## 実装結果サマリ

- 新規実装: `scripts/cf-audit-log/observation/post-switch-monitor.ts`（snapshot 生成 + 集計 CLI）
- 新規実装: `scripts/cf-audit-log/observation/fallback-rate-alert.ts`（連続 N hour 閾値判定 + GitHub Issue 起票 contract）
- 新規実装: `__tests__/post-switch-monitor.test.ts`（10 cases）/ `__tests__/fallback-rate-alert.test.ts`（12 cases）/ `evaluation.test.ts` leakage CLI 追加（4 cases）
- 編集: `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` に `--exit-on-detect` / `--stdin` / `--count-only` / directory scan を追加（既定の hit 時 exit 1 は互換維持）
- focused vitest: 26/26 pass（`outputs/phase-11/evidence/test.log`）

## Gate 通過後の実装サイクルで追加取得する evidence path

| evidence | path | 実行タイミング |
| --- | --- | --- |
| 7 day observation | `outputs/phase-11/evidence/hourly-run-7day.md` | production switch merge 後 |
| build | `outputs/phase-11/evidence/build.log` | workflow YAML PR 前 |

## AC 境界

AC-3 / AC-4 の local script 契約、AC-8 の focused test、AC-10 の skeleton dry-run は本サイクルで evidence を取得済み。AC-1 / AC-5 の workflow YAML への post-step 注入と env=ml 切替、実 ML artifact load、7 日 observation、PR 本文 `Refs #549` は Gate-0〜C 通過後の別 PR で完了させる。global typecheck / lint は既存 Sentry dependency missing により known-failure として扱う。
