# 05b Magic Link / AuthGateState 実装教訓（2026-04）

## 対象

- workflow: `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/`
- implementation: `apps/api/src/routes/auth/`, `apps/api/src/use-cases/auth/`, `apps/web/app/api/auth/`, `packages/shared/src/types/auth.ts`
- canonical sync: `references/api-endpoints.md`, `references/environment-variables.md`

## Lessons

| ID | 教訓 | 再発防止 |
| --- | --- | --- |
| L-05B-001 | `ui_routes: []` の API/NON_VISUAL task でも、Phase 12 implementation guide は Phase 11 evidence を明示参照する必要がある。 | `implementation-guide.md` に `outputs/phase-11/*` evidence 表を必ず置く。screenshot 不要の理由も artifacts metadata と対応させる。 |
| L-05B-002 | public な `GET /auth/gate-state` は UX に有効だが email enumeration の入口になる。HTTP status 差ではなく JSON state と rate limit で制御する。 | GET は IP 60/h、POST は email 5/h + IP 30/h を初期値にし、response は memberId を含めない。 |
| L-05B-003 | mail provider 失敗後に token 行が残ると、送れていない Magic Link が後から使える状態になる。 | mail 送信失敗時は `magic_tokens.deleteByToken` で rollback してから 502 `MAIL_FAILED` を返す。development/test の no-op success と production の fail-closed を区別して記録する。 |
| L-05B-004 | `AuthGateState` は login UI の `input/sent/unregistered/rules_declined/deleted` と session の `active/rules_declined/deleted` が混同されやすい。 | shared type は `SessionUserAuthGateState` のように文脈を名前へ入れ、login gate state は API contract 側で別 union として扱う。 |
| L-05B-005 | 実装済み task の root `artifacts.json` が `pending` / `docs_only` のままだと Phase 11 NON_VISUAL 判定や Phase 12 compliance が false positive になる。 | 実装完了時は Phase 1〜12 を `completed`、Phase 13 のみ `pending`、`metadata.taskType=implementation`、`metadata.visualEvidence=NON_VISUAL` に同期し、`outputs/artifacts.json` と parity を取る。 |

## Follow-up Boundaries

- Auth.js provider 本体と login/profile UI は 06b の責務。
- rate limit の KV / Durable Object 昇格、mail monitoring、token admin 可視化は運用 wave の責務。
