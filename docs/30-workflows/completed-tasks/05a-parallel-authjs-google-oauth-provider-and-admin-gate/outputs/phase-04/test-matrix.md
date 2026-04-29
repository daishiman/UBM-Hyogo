# test-matrix.md — AC × test ID × layer × tool

## session-resolve (R-XX)

| ID | 入力 email | DB 状態 | 期待 response | layer | 実装 |
| --- | --- | --- | --- | --- | --- |
| R-01 | unknown@example.com | identities 無し | gateReason="unregistered" | contract | session-resolve.test.ts |
| R-02 | deleted@example.com | is_deleted=1 | gateReason="deleted" | contract | 同上 |
| R-03 | declined@example.com | rules_consent != consented | gateReason="rules_declined" | contract | 同上 |
| R-04 | user@example.com | identities + status OK / admin 無し | memberId=m_001, isAdmin=false | contract | 同上 |
| R-05 | admin@example.com | + admin_users 登録 | isAdmin=true | contract | 同上 |
| R-06 | (email クエリ無し) | - | 400 | contract | 同上 |
| R-AUTH | INTERNAL_AUTH_SECRET 不一致 | - | 401 | contract | 同上 |
| R-NORM | User@Example.COM | identities 小文字あり | normalize されて hit | contract | 同上 |

## session 構造 / JWT (S-XX)

| ID | 入力 | 期待 | layer | 実装 |
| --- | --- | --- | --- | --- |
| S-01 | sign + verify (一般 member) | claims が対称復元 | unit | auth.test.ts |
| S-02 | sign + verify (admin, name 付き) | isAdmin=true / name 復元 | unit | 同上 |
| S-06 | payload 改ざん JWT | verify → null (AC-8) | unit | 同上 |
| S-EXP | 期限切れ JWT | null | unit | 同上 |
| S-SEC | 異なる secret | null | unit | 同上 |
| S-FMT | 不正形式 | null | unit | 同上 |
| S-07 | claims に responseId/profile/notes 不在 | 含まれない | unit | 同上 |

## admin gate 二段防御 (G-XX)

| ID | レイヤ | 入力 | 期待 | layer | 実装 |
| --- | --- | --- | --- | --- | --- |
| G-04 | requireAdmin | Authorization 無し | 401 | authz | require-admin.test.ts |
| G-05 | requireAdmin | 一般 member の JWT | 403 | authz | 同上 |
| G-06 | requireAdmin | admin の JWT | 200 | authz | 同上 |
| G-08 | requireAdmin | 改ざん JWT | 401 | authz | 同上 |
| G-CFG | requireAdmin | AUTH_SECRET 未設定 | 500 | authz | 同上 |
| G-CK1 | requireAdmin | Cookie `authjs.session-token` | 200 | authz | 同上 |
| G-CK2 | requireAdmin | Cookie `__Secure-authjs.session-token` | 200 | authz | 同上 |
| G-AUT | requireAuth | 一般 member の JWT | 200 (admin gate でない) | authz | 同上 |
| G-01〜G-03 | apps/web/middleware.ts | 未ログイン / 一般 / admin | 302 / 302 / next | E2E | 08b で Playwright |

## 認可境界 / lint (Z-XX)

| ID | シナリオ | 期待 | 実装 |
| --- | --- | --- | --- |
| Z-01 | 「apps/api」「@cloudflare/d1」「D1Database」を web から import | lint error | scripts/lint-boundaries.mjs（既存） |
| Z-02 | apps/web/src/lib/auth.ts が D1 binding を直接触らない | lint pass | 同上 |
| Z-04 | session callback の出力に responses/profile/notes 不在 | unit (S-07) | auth.test.ts |
| Z-05 | requireAdmin error response 統一 (`{error:"forbidden"}` / `{error:"unauthorized"}`) | unit | require-admin.test.ts |

## 05b 共有 contract (C-XX) — 統合は 08a

| ID | シナリオ | 担保方法 |
| --- | --- | --- |
| C-01 | 同一 email で provider が変わっても memberId 同一 | session-resolve は provider 不問。R-04/R-05 で email→memberId 一意性確認 |
| C-02 | isAdmin が provider 経由で変わらない | 同上 |
| C-03 | 両 provider が同一 endpoint を使う | api-contract.md (phase-02) で共有契約明文化 |
