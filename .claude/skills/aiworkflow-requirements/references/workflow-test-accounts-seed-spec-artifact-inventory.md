# workflow-test-accounts-seed-spec Artifact Inventory

## Summary

`test-accounts-seed-spec` is `implemented_local_evidence_captured / implementation / NON_VISUAL`.
It implements deterministic test account seed infrastructure for 10 member accounts and 3 admin accounts.

## Workflow

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/test-accounts-seed-spec/` |
| root artifacts | `docs/30-workflows/test-accounts-seed-spec/artifacts.json` |
| output artifacts | `docs/30-workflows/test-accounts-seed-spec/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/test-accounts-seed-spec/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/test-accounts-seed-spec/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Implementation Artifacts

| Artifact | Role |
| --- | --- |
| `apps/api/src/testing/test-accounts/catalog.ts` | SSOT catalog for TEST member/admin accounts |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | Pure generator for seed SQL, cleanup SQL, and manifest JSON |
| `apps/api/src/testing/test-accounts/index.ts` | Local barrel for generator/catalog |
| `apps/api/migrations/seed/test-accounts-seed.sql` | Generated idempotent seed SQL |
| `apps/api/migrations/seed/test-accounts-cleanup.sql` | Generated cleanup SQL |
| `apps/api/migrations/seed/test-accounts.manifest.json` | Generated manifest consumed by Playwright mint helper |
| `scripts/gen-test-accounts-seed.mjs` | Generator CLI with `--check` drift mode |
| `scripts/seed-test-accounts.sh` | local/staging D1 apply/cleanup CLI; production refused |
| `apps/web/playwright/scripts/mint-test-account-storage-state.ts` | Manifest-driven JWT storage-state helper |
| `vitest.d1.config.ts` | D1 focused test include for test-account seed contract |

## Evidence

| Command | Result |
| --- | --- |
| `node --import tsx scripts/gen-test-accounts-seed.mjs --check` | PASS |
| `pnpm exec vitest run apps/api/src/testing/test-accounts --config=vitest.config.ts` | PASS: 2 files / 6 tests |
| `pnpm exec vitest run apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=vitest.d1.config.ts` | PASS: 1 file / 4 tests |
| `pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/api lint` | PASS |
| `pnpm --filter @ubm-hyogo/web lint` | PASS |

## User-Gated Boundary

Actual local/staging D1 mutation, storage-state generation against a real target, commit, push, and PR are user-gated. Production seed apply is rejected by `scripts/seed-test-accounts.sh`.

## Lessons Learned

詳細は `.claude/skills/aiworkflow-requirements/references/lessons-learned-test-accounts-seed-spec-2026-06.md`（L-TAS-001..008）を参照。

| ID | 要点 |
| --- | --- |
| L-TAS-001 | 生成物 + drift guard 型 NON_VISUAL のカバレッジは行/分岐ではなく drift guard PASS + ゲーティング期待値 spec PASS と読み替える |
| L-TAS-002 | seed/fixture の Phase 11 代替証跡 = committed 生成物 + drift spec + in-memory D1 適用 spec の 3 点 |
| L-TAS-003 | テスト判別は `TEST-` prefix / `.invalid` email / `seed:test-accounts` actor の 3 層で誤削除を構造排除 |
| L-TAS-004 | SQL 生成器は `buildInsert` + `sqlString`/`sqlJson` + `TEST_SEED_TABLES`(seed=親→子 / cleanup=reverse) に集約し AC-4 を 1 関数保証 |
| L-TAS-005 | web↔api 疎結合は shared barrel 型公開ではなく manifest JSON 経由。web は manifest + `signSessionJwt` のみで D1 非接触 |
| L-TAS-006 | `.ts` import の生成 CLI に `allowImportingTsExtensions:true`、D1 contract spec は `vitest.d1.config.ts` の `D1_INCLUDE` へ明示追加が必須 |
| L-TAS-007 | 実装完結 + production apply は CLI 拒否、commit/push/PR/実 seed apply は user-gated（Gate-B passed / Gate-C pending） |
| L-TAS-008 | 同期 wave で lessons ファイルと inventory `## Lessons Learned` 節が漏れやすい。lessons は `references/` 直下へ置き二重保持 |
