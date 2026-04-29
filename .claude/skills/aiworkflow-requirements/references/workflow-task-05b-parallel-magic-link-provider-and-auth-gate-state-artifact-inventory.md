# 05b-parallel-magic-link-provider-and-auth-gate-state Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | 05b-parallel-magic-link-provider-and-auth-gate-state |
| タスク種別 | impl（apps/api 認証 API + apps/web Auth Bridge / NON_VISUAL） |
| ワークフロー | Phase 1-12 completed / Phase 13 pending（user approval 待ち） |
| canonical task root | `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/` |
| wave | 05 認証 wave（同 wave: 05a observability/cost guardrails） |
| 実装日 | 2026-04-29 |
| owner | apps/api（認証ロジック / mail provider） + apps/web（API Bridge） + packages/shared（共有型） |
| domain | auth gate state / magic link issuance & verification / session resolution |
| visualEvidence | NON_VISUAL（UI は 06b の責務） |
| depends_on | 02a（member identity / status repository）、04b（`SessionUser.authGateState` 文脈分離・dev session header 経路） |
| follow-up wave | 06b（Auth.js provider 本体・login/profile UI） / 運用 wave（rate limit KV/DO 昇格・mail monitoring・token admin 可視化） |

## Acceptance Criteria

詳細は `outputs/phase-07/ac-matrix.md`（AC-1〜AC-10）を正本とする。要点:

- `GET /auth/gate-state` は email enumeration を抑制（HTTP status 差ではなく JSON state で表現、`memberId` は応答に含めない）。
- `POST /auth/magic-link` は token 発行 → mail 送信 → 失敗時 token rollback の順を厳守（mail provider 失敗時は `magic_tokens.deleteByToken` で巻き戻して 502 `MAIL_FAILED` を返す）。
- `POST /auth/magic-link/verify` は単発消費・期限切れ・改ざん検知を備え、検証成功時にのみ session 解決経路に進む。
- `POST /auth/resolve-session` は `SessionUserAuthGateState`（`active` / `rules_declined` / `deleted`）を返す。login UI 側 gate state（`input`/`sent`/`unregistered`/`rules_declined`/`deleted`）とは命名衝突回避済み。
- Rate limit: `GET /auth/gate-state` は IP 60/h、`POST /auth/magic-link` は email 5/h + IP 30/h。
- 不変条件 #5（D1 直接アクセスは use-case / repository に閉じる）を route 層が遵守。
- 不変条件 #9（`/no-access` への依存禁止 / 状態は body の `state` で表現）を遵守。

## Phase Outputs（current canonical set）

| Phase | 場所 | 主要成果物 |
|---|---|---|
| 1-10 | `outputs/phase-01/` 〜 `outputs/phase-10/` | 要件 / 設計 / 契約 / テスト / 実装サマリ（NON_VISUAL のため E2E は 06b へ移送判断） |
| 11 | `outputs/phase-11/` | NON_VISUAL manual evidence（screenshot 不要の理由を artifacts metadata と照合） |
| 12 | `outputs/phase-12/` | `implementation-guide.md`（Phase 11 evidence 表必須）/ `system-spec-update-summary.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` |

## 主要実装物

### API routes（apps/api）

| ファイル | 役割 |
|---|---|
| `apps/api/src/routes/auth/index.ts` | Hono router（`GET /gate-state`, `POST /magic-link`, `POST /magic-link/verify`, `POST /resolve-session`） |
| `apps/api/src/routes/auth/schemas.ts` | Zod schema（`MagicLinkRequestZ` / `GateStateResponseZ` / `VerifyMagicLinkRequestZ` / `ResolveSessionResponseZ` 等） |
| `apps/api/src/routes/auth/__tests__/` | 4 endpoint の route-level test |

`apps/api/src/index.ts` で `app.route("/auth", createAuthRouter(...))` として mount。

### Middleware（apps/api）

| ファイル | 役割 |
|---|---|
| `apps/api/src/middleware/rate-limit-magic-link.ts` | `rateLimitGetGateState`（IP 60/h）/ `rateLimitPostMagicLink`（email 5/h + IP 30/h）。MVP は in-memory 実装で運用 wave に KV/DO 昇格を委譲 |

### Use-cases（apps/api）

| ファイル | 役割 |
|---|---|
| `apps/api/src/use-cases/auth/resolve-gate-state.ts` | email から login gate 判定（unregistered/sent/rules_declined/deleted/input） |
| `apps/api/src/use-cases/auth/issue-magic-link.ts` | token 発行 → mail 送信 → 失敗時 rollback の orchestrator |
| `apps/api/src/use-cases/auth/verify-magic-link.ts` | token 検証 / 単発消費 / 期限切れハンドリング |
| `apps/api/src/use-cases/auth/resolve-session.ts` | 検証成功 token から `SessionUser` を解決し `authGateState` 算出 |

### Services（apps/api）

| ファイル | 役割 |
|---|---|
| `apps/api/src/services/mail/magic-link-mailer.ts` | `MailSender` interface と magic link 送信実装。development/test では no-op success、production は fail-closed（502 `MAIL_FAILED`） |

### Repository（apps/api）

| ファイル | 役割 |
|---|---|
| `apps/api/src/repository/magicTokens.ts` | `magic_tokens` テーブルへの `insertToken` / `consumeByToken` / `deleteByToken`。`deleteByToken` は mail 失敗時 rollback 専用 |

### Web Auth Bridge（apps/web）

| ファイル | 役割 |
|---|---|
| `apps/web/app/lib/auth/config.ts` | Auth.js 用設定の足場（06b で Provider 本体差し替え予定） |
| `apps/web/app/api/auth/gate-state/route.ts` | apps/api `/auth/gate-state` への bridge route |
| `apps/web/app/api/auth/magic-link/route.ts` | apps/api `/auth/magic-link` への bridge route |
| `apps/web/app/api/auth/magic-link/verify/route.ts` | apps/api `/auth/magic-link/verify` への bridge route |

### Shared types（packages/shared）

| ファイル | 役割 |
|---|---|
| `packages/shared/src/types/auth.ts` | `SessionUserAuthGateState`（`active`/`rules_declined`/`deleted`）と login gate state union。文脈分離は L-04B-001 / L-05B-004 由来 |

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | §認証 API 05b（4 endpoint・rate limit・error code・FORBIDDEN response keys） |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `AUTH_URL` / `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS`（development no-op / production fail-closed） |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-05b-magic-link-auth-gate-2026-04.md` | L-05B-001〜005 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 05b Phase 1-12 完了・Phase 13 user approval 待ち |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | §UBM-Hyogo Magic Link / AuthGateState API 早見（05b） |

## 実装で確定した値

- Rate limit: `GET /auth/gate-state` IP 60/h、`POST /auth/magic-link` email 5/h + IP 30/h
- Mail provider 失敗時の挙動: `magic_tokens.deleteByToken` で rollback → HTTP 502 `MAIL_FAILED`
- `AuthGateState`: `SessionUserAuthGateState`（session 文脈、`active`/`rules_declined`/`deleted`）と login gate state（`input`/`sent`/`unregistered`/`rules_declined`/`deleted`）を別 union で扱う
- `GET /auth/gate-state` 応答に `memberId` を含めない（email enumeration 抑止）

## Follow-up 未タスク（formalize 済み）

| 未タスク ID | ファイル | 概要 |
|---|---|---|
| task-05b-followup-001 | `docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md` | Auth.js Credentials Provider と callback route の 06b 実装 |
| task-05b-followup-002 | `docs/30-workflows/unassigned-task/task-05b-magic-link-mail-i18n-a11y-001.md` | Magic Link mail テンプレの i18n / a11y 強化 |
| task-05b-followup-003 | `docs/30-workflows/unassigned-task/task-05b-magic-token-admin-operations-001.md` | magic_tokens の admin 可視化・運用操作 |
| task-05b-followup-004 | `docs/30-workflows/unassigned-task/task-05b-mail-provider-monitoring-alerting-001.md` | Mail provider monitoring / alerting 整備 |

## Validation Chain

| 検証項目 | 結果 |
|---|---|
| unit test（routes/auth, use-cases/auth, middleware/rate-limit-magic-link） | PASS |
| mail rollback シナリオ（送信失敗時 token 削除） | PASS（use-case test でカバー） |
| `SessionUserAuthGateState` と login gate state の文脈分離 | PASS（shared type 名で衝突回避） |
| 不変条件 #5（D1 直接アクセス禁止）trace | PASS |
| 不変条件 #9（`/no-access` 非依存）trace | PASS |
| Phase 11 NON_VISUAL evidence と artifacts.json metadata の parity | PASS |
| Phase 13（ユーザー承認 / PR 作成） | PENDING |
