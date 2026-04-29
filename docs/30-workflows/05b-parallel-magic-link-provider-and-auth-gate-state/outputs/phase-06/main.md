# Phase 6 — 失敗ケース総覧 F-01〜F-17

各失敗ケースについて、トリガー条件、観測点、期待 status / body、テスト ID を網羅する。すべて `/no-access` redirect を行わない (不変条件 #9)。

## 表

| ID | カテゴリ | トリガー | エンドポイント | 期待 status | 期待 body | カバー test |
|---|---|---|---|---|---|---|
| F-01 | input | email 不正 (zod 失敗) | POST /auth/magic-link | 400 | `{error:"INVALID_INPUT"}` | auth-routes.test F-01 |
| F-02 | gate | unregistered | POST /auth/magic-link | 200 | `{state:"unregistered"}` | auth-routes.test F-02 |
| F-03 | gate | rules_declined | POST /auth/magic-link | 200 | `{state:"rules_declined"}` | resolve-gate-state.test |
| F-04 | gate | deleted | POST /auth/magic-link | 200 | `{state:"deleted"}` | resolve-gate-state.test |
| F-05 | rate-limit | 同 email 5 回超 | POST /auth/magic-link | 429 | `{error:"RATE_LIMITED"}` + Retry-After | rate-limit.test R-01 |
| F-06 | rate-limit | 同 IP 30 回超 (POST) | POST /auth/magic-link | 429 | 同上 | (設計上) |
| F-07 | rate-limit | 同 IP 60 回超 (GET) | GET /auth/gate-state | 429 | `{error:"RATE_LIMITED"}` | rate-limit.test R-03 |
| F-08 | input | gate-state email 欠落 | GET /auth/gate-state | 400 | `{error:"INVALID_INPUT"}` | auth-routes.test |
| F-09 | input | verify token 形式違反 (64hex 以外) | POST /auth/magic-link/verify | 400 | `{error:"INVALID_INPUT"}` | auth-routes.test F-09 |
| F-10 | mail | MAIL_PROVIDER_KEY 未設定 | POST /auth/magic-link | 502 | `{code:"MAIL_FAILED"}` (token は rollback) | issue-magic-link.test |
| F-11 | mail | Resend API 4xx/5xx | POST /auth/magic-link | 502 | `{code:"MAIL_FAILED"}` (rollback) | auth-routes.test F-11 / issue-magic-link.test |
| F-12 | token | not found | POST /auth/magic-link/verify | 200 | `{ok:false, reason:"not_found"}` | verify-magic-link.test T-04 |
| F-13 | token | expired | POST /auth/magic-link/verify | 200 | `{ok:false, reason:"expired"}` | verify-magic-link.test T-02 |
| F-14 | token | already_used | POST /auth/magic-link/verify | 200 | `{ok:false, reason:"already_used"}` | verify-magic-link.test T-03 |
| F-15 | token | email mismatch | POST /auth/magic-link/verify | 200 | `{ok:false, reason:"resolve_failed"}` | verify-magic-link.test T-05 |
| F-16 | session | resolve-session 対象が unregistered/rules_declined/deleted | POST /auth/resolve-session | 200 | `{ok:false, reason:<state>}` | resolve-session.test RS-01〜03 |
| F-17 | method | GET /auth/magic-link 等 | (web proxy) | 405 | "Method Not Allowed" | (web 単体) |

## 設計ポリシー

- **2xx + state field**: gate 判定の想定内 state (unregistered/rules_declined/deleted) は 200 で返し、UI 側が state を解釈する。mail provider 失敗と token/session 検証失敗は運用検知と callback 制御のため 502/401 を返す。
- **400**: zod 入力検証失敗のみ。
- **429**: rate-limit 超過のみ。`Retry-After` header 付き。
- **500**: 未捕捉例外のみ (D1 障害等)。Hono default handler に委譲。

## 不変条件 cross-check

- #9 `/no-access` redirect なし → F-02〜F-04 は 2xx state、F-12〜F-16 は 401 reason を JSON 返却。
- #7 memberId/responseId 分離 → resolve-session の SessionUser に両方含む (F-16 反例 RS-04 で検証)。
