# Documentation Changelog

| Path | Change |
| --- | --- |
| `docs/30-workflows/fix-admin-server-components-render-error-stg/artifacts.json` | `implementation / NON_VISUAL / implemented_local_runtime_pending` に分類を補正 |
| `docs/30-workflows/fix-admin-server-components-render-error-stg/outputs/artifacts.json` | root artifacts と同値 mirror を追加 |
| `docs/30-workflows/fix-admin-server-components-render-error-stg/index.md` | taskType と visualEvidence を2軸化 |
| `docs/30-workflows/fix-admin-server-components-render-error-stg/outputs/phase-1/phase-1.md` | Phase 1 必須メタ、aiworkflow 正本参照、scope 境界を補正 |
| `docs/30-workflows/fix-admin-server-components-render-error-stg/outputs/phase-11/manual-test-result.md` | NON_VISUAL 代替証跡を追加 |
| `docs/30-workflows/fix-admin-server-components-render-error-stg/outputs/phase-12/*` | strict 7 を物理配置 |
| `.claude/skills/aiworkflow-requirements/*` | quick-reference / resource-map / task-workflow-active / artifact inventory / changelog を同期 |
| `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | `fetchAdmin()` の base URL / internal auth 解決を `getEnv()` 経由・localhost fallback なしの契約へ同期 |

## Verification

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts apps/web/src/lib/__tests__/env.spec.ts
```

Result: PASS (`2 files / 13 tests`).
