# 2026-06-07 sentry-extension-noise-filter-spec

`sentry-extension-noise-filter-spec` を `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` として同期。

## 実装

- `apps/web/src/lib/sentry/extension-noise-filter.ts`
- `apps/web/src/instrumentation-client.ts`
- `apps/web/src/lib/sentry/index.ts`
- `apps/web/src/lib/sentry/extension-noise-filter.spec.ts`
- `apps/web/src/__tests__/instrumentation-client.runtime.spec.ts`

## 証跡

- focused Vitest 2 files / 14 tests PASS
- `pnpm --filter @ubm-hyogo/web typecheck` PASS
- `pnpm --filter @ubm-hyogo/web lint` PASS

## 境界

App errorはfail-openで保持し、mixed app/extension frameも保持する。到達不能な拡張隔離コンテキスト / Chrome本体 / 別SDKのconsole noiseはコードで除去できない。

External Sentry dashboard confirmation、commit、push、PRは user-gated。
