# Phase 12 — ドキュメント更新（概要）

- **taskId**: `TASK-SENTRY-EXTENSION-NOISE-FILTER-001`
- **実装区分**: implementation / NON_VISUAL
- **implementation_mode**: new
- **workflow_state**: `implemented_local_evidence_captured`
- **implementation_status**: `implementation_complete_pending_pr`

## 概要

ブラウザ拡張（`chrome-extension://` / `moz-extension://` / `safari-web-extension://` / `safari-extension://`）由来のerror eventを、自分たちのSentry監視から除外するクライアント側ノイズフィルタを実装した。対象は私たちのSDKに到達したeventのみであり、拡張隔離コンテキスト・Chrome本体・別SDKが出す到達不能なconsole noiseはコードで除去できない。

最重要不変条件: **アプリの実エラーは絶対に握り潰さない（fail-open）**。判断不能、混在frame、判定例外時はeventを残す。

## Phase 12 strict 7 成果物一覧

| # | ファイル | 状態 |
|---|----------|------|
| 1 | `outputs/phase-12/main.md` | present |
| 2 | `outputs/phase-12/implementation-guide.md` | present |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | present |
| 4 | `outputs/phase-12/documentation-changelog.md` | present |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | present |
| 6 | `outputs/phase-12/skill-feedback-report.md` | present |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## 実装スコープ

| 種別 | パス |
|------|------|
| 新規（pure module） | `apps/web/src/lib/sentry/extension-noise-filter.ts` |
| 編集（Sentry.init 配線） | `apps/web/src/instrumentation-client.ts` |
| 新規（unit test） | `apps/web/src/lib/sentry/extension-noise-filter.spec.ts` |
| 編集（runtime wiring test） | `apps/web/src/__tests__/instrumentation-client.runtime.spec.ts` |
| 編集（barrel） | `apps/web/src/lib/sentry/index.ts` |

## verify 結果

```bash
pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/sentry/extension-noise-filter.spec.ts apps/web/src/__tests__/instrumentation-client.runtime.spec.ts
# PASS: 2 files / 14 tests

pnpm --filter @ubm-hyogo/web typecheck
# PASS

pnpm --filter @ubm-hyogo/web lint
# PASS
```

## 境界

- `apps/api` / D1 / Google Form / UI / design tokens は変更なし。
- 外部Sentry dashboardでの実受信確認、commit、push、PRは user-gated。
