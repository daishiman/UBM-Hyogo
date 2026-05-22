# Phase 12 — documentation changelog

## 2026-05-17

| 対象 | 変更 |
| --- | --- |
| `apps/api/src/services/aliasRecommendation.ts` | `normalizeLabelForCompare` と normalized Levenshtein 入力を追加 |
| `apps/api/src/services/aliasRecommendation.spec.ts` | 日本語 / NFKC / whitespace / negative tests を追加 |
| `docs/30-workflows/ut-07b-alias-recommendation-i18n/` | Phase outputs、Phase 11 evidence、Phase 12 strict 7、artifacts を同期 |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `recommendedStableKeys` の比較前処理を正本化 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | API schema manual に helper 振る舞いを追記 |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | hardening task との責務境界を補正 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | quick/resource/topic/keywords を同期 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | close-out log を追記 |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | Phase 12 strict 7 / NON_VISUAL evidence 適用ログを追記 |

## Validator / command evidence

| Command | Exit code | Count / result |
| --- | --- | --- |
| `diff -q docs/30-workflows/ut-07b-alias-recommendation-i18n/artifacts.json docs/30-workflows/ut-07b-alias-recommendation-i18n/outputs/artifacts.json` | 0 | parity PASS |
| `find docs/30-workflows/ut-07b-alias-recommendation-i18n/outputs/phase-12 -maxdepth 1 -type f | wc -l` | 0 | strict 7 required files present |
| `ESBUILD_BINARY_PATH="$PWD/node_modules/@esbuild/darwin-arm64/bin/esbuild" mise exec -- pnpm --filter @ubm-hyogo/api test -- --run src/services/aliasRecommendation.spec.ts` | 0 | apps/api 48 files / 300 tests PASS; target spec 20 tests PASS |
| `ESBUILD_BINARY_PATH="$PWD/node_modules/@esbuild/darwin-arm64/bin/esbuild" pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/routes/admin/schema.contract.spec.ts` | 0 | route contract 16 tests PASS |
| `rg -n "UT-07B-schema-alias-hardening-001\\.md|unassigned-task/UT-07B-schema-alias-hardening-001|collision[ ]422|collision は[ ]422" docs/00-getting-started-manual/specs/01-api-schema.md .claude/skills/aiworkflow-requirements/references/api-endpoints.md apps/api/src/routes/admin/schema.ts apps/api/src/routes/admin/schema.contract.spec.ts` | 1 | stale current references 0 件 |
