# 05b-B-magic-link-callback-credentials-provider Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | 05b-B-magic-link-callback-credentials-provider |
| タスク種別 | implementation（apps/web Auth.js callback route + Credentials Provider / NON_VISUAL） |
| ワークフロー | Phase 1-12 completed / Phase 13 blocked_pending_user_approval |
| canonical task root | `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/` |
| wave | 05b 認証 wave 後段（05b 本体 API の `apps/web` 側 callback / Provider 配線担当） |
| 実装日 | 2026-05-01 |
| owner | apps/web（Auth.js 設定 / callback route / verify helper） |
| domain | Auth.js Credentials Provider / Magic Link callback / session 確立 |
| visualEvidence | NON_VISUAL（UI 表示は 06b の責務、本タスクは route + provider 配線まで） |
| depends_on | 05b-parallel-magic-link-provider-and-auth-gate-state（apps/api `POST /auth/magic-link/verify` を委譲先として使用）、04b（`SessionUser` / `authGateState` 型） |
| follow-up | 06b-C-profile-logged-in-visual-evidence（logged-in profile capture）/ 08b-A-playwright-e2e-full-execution（auth E2E）/ 09a-A-staging-deploy-smoke-execution（staging auth smoke） |
| 旧 path | `docs/30-workflows/02-application-implementation/05b-B-magic-link-callback-credentials-provider/`（legacy-ordinal-family-register.md に登録済み） |

## Acceptance Criteria

詳細は `outputs/phase-07/ac-matrix.md`。要点:

- `GET /api/auth/callback/email?token=&email=` が成功時に `signIn("magic-link", { verifiedUser: <SessionUser-JSON> })` を経由して session を確立する。
- 同 endpoint は `POST` を 405 Method Not Allowed で拒否する。
- 失敗時は `?error=<reason>` redirect で `missing_token` / `missing_email` / `invalid_link` / `expired` / `already_used` / `resolve_failed` / `temporary_failure` を返す。
- Auth.js `CredentialsProvider({ id: "magic-link" })` の `authorize()` は `verifiedUser` JSON を厳格 validate し、`memberId`/`email`/`responseId` 必須・`isAdmin` boolean を確認する。
- `signIn` callback で `account?.provider === "credentials"` のとき D1 を再度引かず、`memberId` の存在のみ確認する（verify は API worker 側で完了済み）。
- 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）/ 不変条件 #6（apps/web から D1 直参照禁止）/ 不変条件 #15（session 確立は `signIn()` 経由のみ）を全て維持。

## Phase Outputs（current canonical set）

| Phase | 場所 | 主要成果物 |
|---|---|---|
| 1-10 | `outputs/phase-01/` 〜 `outputs/phase-10/` | 要件 / 設計 / 契約 / テスト / 実装サマリ（NON_VISUAL のため visual evidence は 06b へ委譲） |
| 11 | `outputs/phase-11/` | NON_VISUAL evidence（typecheck / focused tests / boundary check / manual-test-result）。dev-server curl / staging smoke は 09a に委譲 |
| 12 | `outputs/phase-12/` | `main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`（Phase 12 必須 7 成果物 完備） |
| 13 | (pending) | commit / push / PR は user approval 待ち |

## 主要実装物

### Web routes（apps/web）

| ファイル | 役割 |
|---|---|
| `apps/web/app/api/auth/callback/email/route.ts` | `GET` で token/email を受け、`verifyMagicLink()` 委譲 → 成功時 `signIn("magic-link", ...)`、失敗時 `?error=<reason>` redirect。`POST` は 405。 |
| `apps/web/app/api/auth/callback/email/route.test.ts` | route-level test 11 case（success / 4xx / 405 / error mapping） |

### Helpers（apps/web）

| ファイル | 役割 |
|---|---|
| `apps/web/src/lib/auth/verify-magic-link.ts` | `apps/api` `POST /auth/magic-link/verify` を呼ぶ HTTP client。token/email を渡し、`SessionUser` または error code を返す。`X-Internal-Auth` 必須の `/auth/session-resolve` とは別境界。 |
| `apps/web/src/lib/auth/verify-magic-link.test.ts` | helper unit test 15 case（success / network failure / 4xx / 5xx / shape validation） |

### Auth.js 設定（apps/web）

| ファイル | 役割 |
|---|---|
| `apps/web/src/lib/auth.ts` | `buildAuthConfig` に `CredentialsProvider({ id: "magic-link" })` を追加。`authorize()` で `verifiedUser` JSON を strict validate。`signIn` callback は credentials provider 判定で D1 access せず通す。 |

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/SKILL.md`（changelog） | wave entry `v2026.05.01-05b-b-magic-link-callback-credentials-sync` |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 05b-B 行（implementation / NON_VISUAL / 必要参照 path） |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 05b-B callback / Credentials Provider 早見セクション（05b 本体と分離） |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 05b-B 行（status / Phase 状況 / 委譲先） |
| `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md` | 旧 `02-application-implementation/05b-B-...` → 現行 path drift mapping |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | §Auth.js callback / Credentials Provider 章（GET callback / verify helper / Provider id） |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | Auth.js callback route 導入後の `AUTH_URL` / `INTERNAL_API_BASE_URL` 境界 |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-05b-B-callback-credentials-provider-2026-05.md` | L-05B-B-001〜005（provider id / boundary / status sync / path drift / runtime smoke 委譲） |

## 実装で確定した値

- Auth.js provider id: `"magic-link"`（user-defined）。Auth.js 内部 family 名は `"credentials"` で、`signIn` callback の `account?.provider` 判定はこちらを使う。
- Callback route path: `GET /api/auth/callback/email?token=&email=`。`POST` は 405。
- Error code 集合: `missing_token` / `missing_email` / `invalid_link` / `expired` / `already_used` / `resolve_failed` / `temporary_failure`。
- Verify endpoint 委譲先: `apps/api` `POST /auth/magic-link/verify`（token/email public contract、`X-Internal-Auth` 不要）。
- session 確立経路: callback route → `verifyMagicLink()` → `signIn("magic-link", { verifiedUser: JSON })` → Credentials Provider `authorize()` → `signIn` callback（credentials family は memberId だけ確認）。

## Follow-up 未タスク（formalize 済み）

| 未タスク | 状態 | path | 備考 |
|---|---|---|---|
| Auth.js Credentials Provider / callback route | transferred_to_workflow / implemented-local | `docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md` | 起票元タスク。本ワークフローへ昇格・実装済み |
| Dev-server callback curl smoke | delegated_to_09a_or_runtime_smoke | (新規 task 起票なし) | route contract test で local contract は固定済み。実 browser/session cookie smoke は staging smoke で取得 |
| Staging auth smoke | delegated_to_09a | (新規 task 起票なし) | 09a-A staging deploy smoke の auth flow に 05b-B callback を含める |
| Cloudflare Workers runtime verify | delegated_to_09a | (新規 task 起票なし) | deployed env / `AUTH_URL` / `INTERNAL_API_BASE_URL` 前提のため staging evidence で取得 |

新規 open unassigned task は 0 件（不要起票回避）。

## Validation Chain

| 検証項目 | 結果 |
|---|---|
| typecheck（apps/web） | PASS |
| focused tests（route.test.ts 11 case / verify-magic-link.test.ts 15 case） | PASS |
| boundary check（apps/web 配下の D1 import 0 件） | PASS |
| 不変条件 #5 / #6 / #15 trace | PASS |
| Phase 12 7 成果物 parity（root artifacts.json / outputs/artifacts.json） | PASS |
| dev-server curl smoke | DEFERRED（09a 系 runtime evidence へ） |
| Auth.js real Set-Cookie smoke | DEFERRED（09a 系 runtime evidence へ） |
| staging deploy smoke | DEFERRED（09a-A） |
| Phase 13（commit / push / PR） | PENDING（user approval 待ち） |
