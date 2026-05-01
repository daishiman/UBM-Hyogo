# Phase 12 System Spec Update Summary

## Step 1-A: 完了記録

05b-B workflow を `implemented-local / implementation / NON_VISUAL` として正本索引に登録する。起票元 unassigned task を Phase 1-13 workflow へ昇格したうえで、`apps/web` の callback route、verify helper、Credentials Provider 配線、focused tests を実装済みとして扱う。

更新対象:

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md`
- `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/`

## Step 1-B: 実装状況

| Workflow | Status | Runtime |
| --- | --- | --- |
| 05b-B-magic-link-callback-credentials-provider | implemented-local | typecheck / focused tests / boundary check PASS; dev-server curl and staging smoke deferred |

`completed` へは昇格しない。commit / push / PR と staging smoke はユーザー明示承認後の後続 wave に残す。

## Step 1-C: 関連タスク

起票元 `docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md` は canonical workflow に昇格済みとして扱う。実装済み範囲は callback route / helper / Credentials Provider / focused tests であり、dev-server curl smoke と staging auth smoke は未完了として分離する。

## Step 2: 新規インターフェース追加

判定: 発火。

追加・更新した interface:

- Web route: `GET /api/auth/callback/email?token=&email=` / `POST` は 405。
- Auth.js provider: `CredentialsProvider({ id: "magic-link" })`。callback route は `signIn("magic-link", ...)` を呼ぶ。Auth.js `account.provider` は credentials provider family として `"credentials"` で判定する。
- Web helper: `apps/web/src/lib/auth/verify-magic-link.ts` が `POST /auth/magic-link/verify` を呼ぶ。verify endpoint は token/email public contract であり、`X-Internal-Auth` 必須の `/auth/session-resolve` とは別境界。
- Error mapping: `missing_token`, `missing_email`, `invalid_link`, `expired`, `already_used`, `resolve_failed`, `temporary_failure`。
- Test: `verify-magic-link.test.ts` 15 cases、`route.test.ts` 11 cases。

stale contract withdrawal:

- 旧 `signIn("credentials")` 記述を現行 `signIn("magic-link")` に補正。
- 旧 `apps/web/app/lib/auth/config.ts` 記述を現行 `apps/web/src/lib/auth.ts` に補正。
- 旧 `docs-only / runtime 未実行` 記述を `implemented-local / local evidence PASS / runtime smoke deferred` に補正。

## Artifacts Parity

root `artifacts.json` と `outputs/artifacts.json` は両方存在する。Phase status parity は `implemented-local / implementation / NON_VISUAL` で一致し、PASS とする。
