# members-not-displaying-form-sync-investigation artifact inventory

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |
| purpose | Staging `/members` shows zero public members despite Google Form responses; diagnose H1 ingest, H2 identity, H3 publish_state visibility, H4 alias drift and define same-cycle repair tasks. |
| implementation targets | `apps/api/src/diagnostics/{forms-pipeline,schema}.ts`, `apps/api/src/routes/admin/{sync-diagnostics,sync-backfill-publish-state}.ts`, `apps/api/src/jobs/sync-forms-responses.ts`, `apps/api/wrangler.toml`, `scripts/{diagnose-members-pipeline,backfill-publish-state}.sh` |
| tests | `apps/api/src/diagnostics/{forms-pipeline.spec,forms-pipeline.contract.spec}.ts`, `apps/api/src/lib/policies/auto-publish.spec.ts`, `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`, `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts` |
| local evidence | `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-11/local-verification.md` |
| Phase 12 | strict 7 files present under `outputs/phase-12/`; root/output artifacts parity present |
| runtime boundary | implementation, staging deploy, diagnostics run, backfill apply, browser smoke, commit, push, and PR are user-gated |
| related workflow | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/` |
| related issues | #956, #957, #958, #959, #998 (FU-001 staging runtime backfill browser smoke) |
| unassigned tasks | `docs/30-workflows/unassigned-task/members-not-displaying-form-sync-investigation-followup-001-staging-runtime-backfill-browser-smoke.md` (FU-001 / Issue #998 / Gate-C runtime) |

## Correctness Notes

- Existing diagnostics schema is `apps/api/src/diagnostics/schema.ts`; do not create a duplicate `forms-pipeline.schema.ts`.
- Existing hypothesis keys are `H2_identityMismatchSuspected` and `H4_aliasPendingNonZero`.
- Canonical publish state is `public | member_only | hidden`; legacy `published/private` is diagnostic compatibility only.
- `member_status_history` does not exist; admin override detection uses `member_status.updated_by` and `publish_state='hidden'`.
- CLI diagnostics must use a sync-token endpoint, not the human-admin JWT diagnostics route.

## Lessons Learned

- **L-MNDFS-001 (schema reuse over re-creation)**: 既存 diagnostics schema `apps/api/src/diagnostics/schema.ts` を新規 `forms-pipeline.schema.ts` として複製しかけた。先に該当ディレクトリの zod schema 全 export を grep してから新規定義の要否を判定する。`rg "export const \w+Schema" apps/api/src/diagnostics/` で 1 度確認するだけで複製を防げる。
- **L-MNDFS-002 (hypothesisFlags key fidelity)**: H2/H4 hypothesis flag key を独自命名 (`H2_identityMismatch` / `H4_aliasPending`) で導入しかけたが正本は `H2_identityMismatchSuspected` / `H4_aliasPendingNonZero`。新規 hypothesis 追加前に既存 schema の `hypothesisFlags` object literal を読み、命名規約 (`H{n}_<camelDescriptor>Suspected|NonZero|...`) を継承する。
- **L-MNDFS-003 (publish_state canonical vs legacy)**: `public | member_only | hidden` が正本、`published | private` は diagnostic 互換専用。新規実装で legacy 値を canonical 扱いしない (D1 column / API contract / UI mapper のいずれでも)。判別は `apps/api/src/lib/policies/visibility.ts` 系の type literal を grep して 1 次情報を取る。
- **L-MNDFS-004 (member_status_history は存在しない)**: 管理者上書きを `member_status_history` table から検出しかけたが table 自体が無い。実装は `member_status.updated_by IS NOT NULL AND publish_state='hidden'` の単一 SELECT。schema を仮定する前に `apps/api/migrations/*.sql` の `CREATE TABLE` 一覧を grep する。
- **L-MNDFS-005 (sync-token CLI vs human-admin JWT)**: CLI 経路の diagnostics endpoint を `/admin/diagnostics/*` (human JWT) で叩く設計にしかけたが、CLI は header `X-Sync-Token` で `SYNC_ADMIN_TOKEN` を渡す sync-token endpoint (`/admin/sync-*`) を経由する。新規 admin endpoint 設計時は consumer (human browser vs CLI script vs Cron) を 3 軸で分けて auth boundary を先に決める。
- **L-MNDFS-006 (unit + D1 Vitest config split)**: focused verification を unit Vitest 単独で走らせると無関係な D1 suite を巻き込んで hook timeout になる。`apps/api` では unit (`vitest.config.ts`) と D1 (`vitest.d1.config.ts`) を別々に明示指定する必要がある。`mise exec -- pnpm --filter @ubm/api test:unit -- <focused>` と `test:d1 -- <focused>` を分けて実行。
