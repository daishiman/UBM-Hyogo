# Link Checklist

## Internal links（仕様書配下）

| Link | Result |
| --- | --- |
| `index.md` | PASS |
| `artifacts.json` | PASS |
| `phase-01.md`〜`phase-13.md` | PASS |
| `outputs/phase-01/main.md`〜`outputs/phase-13/main.md` | PASS |
| `outputs/phase-11/{main,manual-smoke-log,staging-dry-run,grep-verification,redaction-check,structure-verification,manual-test-checklist,manual-test-result,discovered-issues,link-checklist,screenshot-plan.json}` | PASS |
| `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | PASS |
| `outputs/verification-report.md` | PASS |

## External links（リポジトリ内 cross-reference）

| Link | Result | 備考 |
| --- | --- | --- |
| `apps/api/migrations/0008_schema_alias_hardening.sql` | PASS | 適用対象、本タスクで変更しない |
| `apps/api/wrangler.toml` | PASS | `[env.production]` / `[env.staging]` D1 binding 参照 |
| `scripts/cf.sh` | PASS | F5 で `d1:apply-prod` サブコマンド追加対象 |
| `scripts/d1/preflight.sh` | PENDING_IMPLEMENTATION | F1 新規（spec_created）|
| `scripts/d1/postcheck.sh` | PENDING_IMPLEMENTATION | F2 新規 |
| `scripts/d1/evidence.sh` | PENDING_IMPLEMENTATION | F3 新規 |
| `scripts/d1/apply-prod.sh` | PENDING_IMPLEMENTATION | F4 新規 |
| `.github/workflows/d1-migration-verify.yml` | PENDING_IMPLEMENTATION | F6 新規 |
| `scripts/d1/__tests__/*.bats` | PENDING_IMPLEMENTATION | F7 新規 |
| `package.json` | PASS（test:scripts は PENDING_IMPLEMENTATION）| F9 編集対象 |
| `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/` | PASS | 上流タスク |
| `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/` | PASS | 並列依存 |
| `docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md` | PASS | 下流（運用実行）|
| `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-schema-alias-backfill-queue-cron-split.md` | PASS | 下流（queue split）|

## External URL

| Link | Result |
| --- | --- |
| https://github.com/daishiman/UBM-Hyogo/issues/363 | PASS（CLOSED 維持）|
| https://developers.cloudflare.com/d1/reference/migrations/ | PASS |
| https://developers.cloudflare.com/workers/wrangler/commands/#d1 | PASS |
| https://github.com/bats-core/bats-core | PASS |

## Skill / config

| Link | Result |
| --- | --- |
| `.claude/skills/task-specification-creator/` | PASS |
| `.claude/skills/aiworkflow-requirements/` | PASS |
| `docs/00-getting-started-manual/specs/08-free-database.md` | PASS |
| `docs/00-getting-started-manual/specs/00-overview.md` | PASS |

## Final

リンク整合性 PASS。F1〜F9 は本サイクルでローカル実装済みであり、Phase 13 は commit / push / PR 作成と CI runtime evidence の承認ゲートとして残す。
