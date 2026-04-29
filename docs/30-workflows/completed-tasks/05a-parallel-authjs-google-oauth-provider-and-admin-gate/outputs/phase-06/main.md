# Phase 6 — 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 状態 | completed |
| 上流 | phase-05 |
| 下流 | phase-07 (AC マトリクス) |

## カバー済み異常系（実 test に組み込み済）

| # | シナリオ | 期待 | test 配置 |
| --- | --- | --- | --- |
| F-01 | session-resolve に INTERNAL_AUTH_SECRET 不一致 header | 401 | session-resolve.test.ts |
| F-02 | session-resolve の INTERNAL_AUTH_SECRET 未設定 | 500 | 同上 |
| F-03 | session-resolve email クエリ無し | 400 | 同上 |
| F-04 | session-resolve 未登録 email | 200 + gateReason="unregistered" (fail-closed) | 同上 |
| F-05 | session-resolve is_deleted=1 | 200 + gateReason="deleted" | 同上 |
| F-06 | session-resolve rules_consent != consented | 200 + gateReason="rules_declined" | 同上 |
| F-07 | requireAdmin AUTH_SECRET 未設定 | 500 | require-admin.test.ts |
| F-08 | requireAdmin token 無し | 401 | 同上 |
| F-09 | requireAdmin JWT 改ざん | 401 | 同上 |
| F-10 | requireAdmin 一般 member token | 403 | 同上 |
| F-11 | verifySessionJwt 期限切れ JWT | null (→ 401) | auth.test.ts |
| F-12 | verifySessionJwt 異 secret | null | 同上 |
| F-13 | verifySessionJwt 不正形式 | null | 同上 |
| F-14 | session.user.isAdmin が undefined | middleware で `!== true` 判定 → redirect | apps/web/middleware.ts |

## fail-closed 原則

- session-resolve fetch 失敗時、apps/web の `fetchSessionResolve` は `unregistered` を返す（catch + non-2xx）。500 で session を発行しない。
- middleware は `auth?.user?.isAdmin === true` 限定で next。`undefined` / `null` / `false` 全て `/login` redirect。

## 既知の残課題（次タスクで対応）

| # | 内容 | 担当 |
| --- | --- | --- |
| Q-A | OAuth state / CSRF token 検証 | Auth.js v5 既定で OK（GoogleProvider が自動）。E2E (08b) で Playwright の callback flow に組み込む |
| Q-B | replay attack（同一 JWT の再利用）対策 | JWT 24h TTL + AUTH_SECRET rotate のみ（spec で固定） |
| Q-C | revoke 即時性 | 24h TTL で許容（phase-03 ADR の trade-off） |
| Q-D | admin 権限剥奪後 24h まで JWT 残存 | AUTH_SECRET rotate で全 session 無効化、緊急時運用フローを doc 化（運用 task で対応） |
| Q-E | apps/api `/admin/*` への requireAdmin 適用 | UI (06) + admin_users seed 整備後の別タスク。本タスクでは middleware 構造のみ用意 |

## 不変条件再チェック

| # | 状態 |
| --- | --- |
| #5 | apps/web は D1 を一切 import していない（lint pass） |
| #7 | JWT に `responseId` 不在（auth.test.ts の S-07 で検証） |
| #9 | `/no-access` 不在、`/login?gate=...` のみ |
| #10 | `sessions` テーブル追加無し、JWT のみ |
| #11 | requireAdmin / middleware の二段防御で UI と API 両方 fail-closed |
