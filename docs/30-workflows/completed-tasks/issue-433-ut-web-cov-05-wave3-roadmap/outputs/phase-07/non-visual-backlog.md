# NON_VISUAL Backlog

Status: `COMPLETED`

| layer | file/area | source-task | description | delegation-target | rationale |
| --- | --- | --- | --- | --- | --- |
| other (api 内部 jobs) | apps/api/src/jobs/sheets-fetcher.ts | Phase 6 G09 | line 13.6 / function 8.33。Sheets API クライアント呼び出しが主体。 | integration-test | 実 Sheets / OAuth 依存で単体 mock では網羅困難。 |
| other (api entry) | apps/api/src/index.ts | Phase 6 G10 | line 50.58 / function 14.28。Hono app entry。 | integration-test | route 全登録の通し検証は integration の方が適合。 |
| route handler | apps/api/src/routes/admin/sync-schema.ts | Phase 6 G11 | line 43.15 / function 16.66。schema sync trigger。 | integration-test | D1 + queue + mutex 副作用を実環境で検証する必要がある。 |
| other (sync) | apps/api/src/sync/sheets-client.ts | Phase 6 G13 | line 47.82 / function 33.33。Sheets API クライアント。 | integration-test | 実 API 依存。 |
| route handler | apps/api/src/routes/admin/sync.ts | Phase 6 G14 | line 61.53 / branch 33.33。manual sync endpoint。 | integration-test | queue / mutex 連動。 |
| other (sync) | apps/api/src/sync/manual.ts | Phase 6 G16 | line 48.57 / branch 37.5。manual sync workflow。 | integration-test | D1 + Sheets 同時依存。 |
| other (sync) | apps/api/src/sync/backfill.ts | Phase 6 G17 | line 53.33 / branch 44.44。backfill flow。 | integration-test | 実 D1 / Queue 必須。 |
| lib | apps/web/src/lib/oauth-client.ts (redirect 経路) | wave-2 inventory (ut-web-cov-03) | 単体で fallback / scheme 防止は網羅済だが redirect 動線は未検証。 | e2e | Browser redirect 動線は e2e で確認。 |
| admin component | admin component 群（VISUAL 回帰系） | wave-2 inventory (ut-web-cov-01) | NON_VISUAL governance 確立に伴い、screenshot 系は別 layer に切り出し。 | e2e | 視覚回帰は e2e (Playwright) で扱う。 |
| other (env) | apps/api/src/env.ts | Phase 6 G03 | bindings env。テスト構造上 mock 経由のみ。 | polish-only | 実行 coverage に貢献し難い。除外候補。 |
| other (type-only) | apps/api/src/sync/types.ts | Phase 6 G07 | type-only module。 | polish-only | 実行 coverage 不可。除外。 |
| other (type-only) | packages/.../repository/__tests__/memberTags.readonly.test-d.ts | Phase 6 G05 | `.test-d.ts`。 | polish-only | 実行 coverage 対象外。除外。 |
| lib (type-only) | apps/web/src/lib/api/me-types.test-d.ts | Phase 6 G08 | type-only。 | polish-only | 除外。 |
