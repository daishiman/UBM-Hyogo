`[実装区分: 実装仕様書]`

# Documentation Changelog — admin-requests-queue-rename-and-publish-dependency

`taskType: implementation` / `visualEvidence: VISUAL` / `workflow_state: implemented_local_evidence_captured`

> 正本は [_shared-context.md](../../_shared-context.md)。本サイクルでは workflow docs だけでなく、実コード、実仕様書、aiworkflow-requirements discovery surface まで同 wave で更新した。

## 2026-06-09 — implemented_local_evidence_captured

| カテゴリ | ファイル | 変更 |
| --- | --- | --- |
| API seed | `apps/api/src/testing/test-accounts/catalog.ts`, `build-seed-sql.ts`, committed seed SQL | 既存 TEST-MEM 会員に pending 申請 3 件を追加し、seed/cleanup SQL を再生成。 |
| API projection | `apps/api/src/routes/admin/members.ts` | `pendingRequestTypes` を相関サブクエリで会員一覧へ追加。 |
| shared/contracts | `packages/shared/**`, `packages/contracts/src/admin.mjs` | Admin member item schema/type に `pendingRequestTypes` を追加。 |
| web requests UI | `apps/web/app/(admin)/admin/requests/page.tsx`, `RequestQueue*`, shell config | 表示名を「会員からの申請」へ変更し、申請一覧/申請詳細/説明文/会員管理リンクを追加。 |
| web members UI | `apps/web/app/(admin)/admin/members/page.tsx`, `MembersTable.tsx` | 会員本人発の申請説明と「申請中」リンクバッジを追加。 |
| tests | API/shared/web test files + Playwright admin route specs | seed generation、member projection、shared default、request labels、member pending badge、admin requests Playwright 期待文言を検証。 |
| system specs | `docs/00-getting-started-manual/specs/11-admin-management.md`, `01-api-schema.md`, `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | 表示名・2 軸役割・Admin Member List API shape・admin nav label 正本を反映。 |
| aiworkflow sync | `.claude/skills/aiworkflow-requirements/**` | artifact inventory、active workflow、quick-reference、resource-map、changelog、LOGS を同期。 |
| workflow artifacts | `_shared-context.md`, `artifacts.json`, `outputs/**` | state を `implemented_local_evidence_captured` に統一し、Phase 11 local evidence と Phase 13 user-gated boundary を記録。 |

## Verification summary

- API tests: PASS（86 files / 549 tests）
- shared tests: PASS（21 files / 257 tests）
- web tests: PASS（238 files passed, 1 skipped; 1752 tests passed, 1 skipped）
- API/web/shared typecheck: PASS
- seed drift guard: PASS
- lint: PASS
- HEX token grep: PASS（0 matches）

## Remaining user-gated items

- staging seed apply
- authenticated runtime screenshots
- commit / push / PR
