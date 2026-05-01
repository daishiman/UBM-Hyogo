# Phase 2: 設計 - 05b-B-magic-link-callback-credentials-provider

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-B-magic-link-callback-credentials-provider |
| phase | 2 / 13 |
| status | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 目的

apps/web の責務を callback route と Auth.js config に限定し、apps/api verify 契約を再利用する設計にする。

## コンポーネント設計

| 領域 | 追加/更新対象 | 責務 |
| --- | --- | --- |
| Callback route | `apps/web/app/api/auth/callback/email/route.ts` | query validation、API verify helper 呼び出し、`signIn("magic-link")` 呼び出し、redirect |
| Auth.js route | `apps/web/app/api/auth/[...nextauth]/route.ts` | Auth.js handler export |
| Auth config | `apps/web/src/lib/auth.ts` | Credentials Provider、JWT/session callbacks |
| API boundary | `apps/web/src/lib/auth/verify-magic-link.ts` | `POST /auth/magic-link/verify` 呼び出し |
| Shared types | existing `SessionUser` / `SessionUserAuthGateState` | session shape の既存契約を再利用 |

## Data Flow

1. User clicks `/api/auth/callback/email?token=<token>&email=<email>`.
2. callback route validates query.
3. callback route calls `verifyMagicLink({ token, email })`.
4. verify helper calls apps/api magic-link verify endpoint through the web API boundary.
5. verify success returns user data; JWT callback stores minimal session fields.
6. callback route calls `signIn("magic-link", { verifiedUser, redirect: true, redirectTo: "/" })`; session callback exposes `SessionUser`; success redirects to safe default.
7. failure returns no user and redirects to `/login?error=<reason>`.

## Error Contract

| Source reason | Redirect error | Session |
| --- | --- | --- |
| missing_token | `missing_token` | not created |
| missing_email | `missing_email` | not created |
| expired | `expired` | not created |
| already_used | `already_used` | not created |
| not_found | `invalid_link` | not created |
| resolve_failed | `resolve_failed` | not created |
| API unavailable / network / non-JSON | `temporary_failure` | not created |

## Current Repo Layout Discovery

実装前に次を `rg --files` で再確認する。存在しない慣用パスを仮置きしない。

- `apps/web/src/lib/auth.ts`
- `apps/web/app/api/auth/`
- `apps/api/src/routes/auth/index.ts`
- shared auth/session type export の実在パス

## 実行タスク

1. Phase固有の判断と成果物を確認する。
2. `index.md`、`artifacts.json`、Phase 12成果物との整合を確認する。
3. 実装・deploy・commit・push・PRを実行しない境界を確認する。

## 参照資料

- `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/index.md`
- `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/artifacts.json`
- `docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 実行手順

- Current canonical root is `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/`.
- Old root `docs/30-workflows/02-application-implementation/05b-B-magic-link-callback-credentials-provider/` is legacy path only.
- Runtime implementation evidence is separated into Phase 11 reserved paths.

## 統合テスト連携

- Upstream: 05b-A auth mail env, 05b Magic Link verify API, 06b login UI.
- Downstream: 06b-C logged-in profile evidence, 08b auth E2E, 09a staging auth smoke.
- Boundary: apps/web must not access D1 directly.

## 成果物

- `outputs/phase-02/main.md`

## 完了条件

- [ ] 実装対象ファイル、API boundary、error mapping、shared type 再利用方針が確定している。
- 仕様語と実装語の drift を増やしていない。
