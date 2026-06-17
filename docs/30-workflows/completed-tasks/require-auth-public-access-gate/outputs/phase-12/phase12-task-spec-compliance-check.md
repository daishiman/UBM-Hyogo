# Phase 12 Task Spec Compliance Check

Phase 12 Task 6。root evidence として残す準拠チェック（require-auth-public-access-gate）。

## Summary verdict

判定: `implemented_local_evidence_captured / implementation / VISUAL / runtime_screenshot_pending_user_gate`。

C1（web UI 認証ゲート）と C2（API アクセスゲート + サーバー間内部認証）を実コードへ反映し、TDD Red→Green を 6 spec で確認。typecheck（web/api/og）・lint（web/api/og）・対象 spec targeted run を全 PASS で取得した。authenticated staging screenshot は user-gated のため `pending`。

## Changed-files classification

| 分類 | 対象 |
| --- | --- |
| apps/web 実装 | `apps/web/src/components/auth/LoginRequiredNotice.tsx`（新規）, `apps/web/app/(public)/layout.tsx`, `apps/web/src/lib/fetch/public.ts`, `apps/web/app/sitemap.ts`, `apps/web/src/lib/env.ts` |
| apps/api 実装 | `apps/api/src/middleware/require-public-access.ts`（新規）, `apps/api/src/routes/public/index.ts` |
| apps/og 実装 | `apps/og/src/member-source.ts` |
| focused tests | `LoginRequiredNotice.spec.tsx`（新規）, `apps/web/app/__tests__/sitemap.spec.ts`（新規）, `(public)/layout.spec.tsx`, `apps/web/src/lib/fetch/public.spec.ts`, `require-public-access.authz.spec.ts`（新規）, `index.contract.spec.ts`, `apps/og/src/__tests__/member-source.spec.ts` |
| manual specs | `00-overview.md`, `02-auth.md`, `06-member-auth.md`, `01-api-schema.md` |
| workflow docs | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/**` |

## `workflow_state` and phase status consistency

| Source | Value |
| --- | --- |
| `index.md` status | `implemented_local_evidence_captured` |
| `artifacts.json` metadata.workflow_state | `implemented_local_evidence_captured` |
| Phase 11 | local deterministic evidence present / runtime screenshots pending（user-gated） |
| Phase 12 | completed |
| Phase 13 | pending_user_approval |

## Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| manual test report | outputs/phase-11/manual-test-report.md | present |
| ui visual review | outputs/phase-11/ui-sanity-visual-review.md | present |
| screenshot | outputs/phase-11/screenshots/login-required-notice-unauthenticated.png | pending |
| screenshot | outputs/phase-11/screenshots/public-members-authenticated.png | pending |

## Phase 12 strict 7 file inventory

| Path | Status |
| --- | --- |
| outputs/phase-12/implementation-guide.md | present |
| outputs/phase-12/system-spec-update-summary.md | present |
| outputs/phase-12/documentation-changelog.md | present |
| outputs/phase-12/unassigned-task-detection.md | present |
| outputs/phase-12/skill-feedback-report.md | present |
| outputs/phase-12/phase12-task-spec-compliance-check.md | present |

> 注: 本 workflow の strict セットは main.md を含まず 6 ファイル構成（spec の Phase 12 定義に準拠）。implementation-guide.md は Part1（例え話）+ Part2（型/API/テスト/検証）の本文を各 3 行以上で保持。

## Skill/reference/system spec same-wave sync

| Target | Status |
| --- | --- |
| task-specification-creator Phase 12 必須 6 成果物 | done |
| manual specs 00 / 02 / 06 / 01 更新（AC-11） | done |
| aiworkflow-requirements references（security-api / api-endpoints / environment-variables）+ ledgers + index 再生成 | done |

## Runtime or user-gated boundary

authenticated runtime screenshot（notice 未認証 / members 認証済み）、staging deploy/smoke、`INTERNAL_AUTH_SECRET` の Cloudflare Secrets 投入、commit、push、PR は user 明示承認後に行う。ローカルの typecheck / lint / focused spec は実行済み（manual-test-result.md に記録）。

## Archive/delete stale-reference gate

| Item | Status |
| --- | --- |
| completed-tasks move | not performed; Phase 13 remains pending_user_approval |
| deleted/moved root | none（本 workflow root は live・移動なし） |
| stale reference | none |

## Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | implementation task に実コード差分 + focused tests + spec 同期が伴い、wording と evidence が一致 |
| 漏れなし | PASS | Phase 12 必須 6 成果物 present、specs4 更新済、Phase 11 local evidence 記録済 |
| 整合性あり | PASS | 命名規則（`requirePublicAccess` / `LoginRequiredNotice`）・401 形（`{ error }`）・`X-Internal-Auth` を既存 `require-admin` / `internal-auth` と対称化 |
| 依存関係整合 | PASS | 既存 `INTERNAL_AUTH_SECRET` 内部認証機構を再利用し、新規 endpoint / D1 schema / Google Form schema 依存を追加しない。`/profile`・`/admin/*` 既存ゲート不変 |
