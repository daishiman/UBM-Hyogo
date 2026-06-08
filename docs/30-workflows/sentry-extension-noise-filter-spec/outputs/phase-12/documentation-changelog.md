# ドキュメント変更ログ

## workflow-local 同期

| Step | 結果 |
|------|------|
| Phase 1-13 root | `spec_created` から `implemented_local_evidence_captured` へ再分類 |
| artifacts parity | `artifacts.json` / `outputs/artifacts.json` を同一状態へ更新 |
| Phase 11 | focused vitest / typecheck / lint のPASS証跡を記録 |
| Phase 12 | strict 7を実装済み状態へ更新 |
| Phase 13 | commit / push / PRのみuser-gatedとして更新 |

## code 同期

| ファイル | 変更 |
|----------|------|
| `apps/web/src/lib/sentry/extension-noise-filter.ts` | 拡張URL判定、extension-only event drop、fail-open filterを追加 |
| `apps/web/src/instrumentation-client.ts` | `beforeSend` / `denyUrls` / `ignoreErrors` を `Sentry.init` に配線 |
| `apps/web/src/lib/sentry/extension-noise-filter.spec.ts` | 12 tests追加 |
| `apps/web/src/__tests__/instrumentation-client.runtime.spec.ts` | init wiring期待値を更新 |
| `apps/web/src/lib/sentry/index.ts` | filter exportsをbarrelへ追加 |

## global skill sync

| 対象 | 結果 |
|------|------|
| aiworkflow task ledger | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` へエントリ追加 |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-sentry-extension-noise-filter-spec-artifact-inventory.md` を追加 |
| quick reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` へ追加 |
| resource map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` へ追加 |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260607-sentry-extension-noise-filter-spec.md` を追加 |
| task-spec skill feedback | `skill-feedback-report.md` で3観点固定フォーマットへ整理し、promotion/no-op routingを記録 |

## verify

- `pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/sentry/extension-noise-filter.spec.ts apps/web/src/__tests__/instrumentation-client.runtime.spec.ts`: PASS（2 files / 14 tests）
- `pnpm --filter @ubm-hyogo/web typecheck`: PASS
- `pnpm --filter @ubm-hyogo/web lint`: PASS
