# Phase 2.1 — Auth Session Policy

## TTL / 戦略

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| session strategy | JWT (HS256 + AUTH_SECRET) | `apps/web/src/lib/auth.ts` 先頭コメント |
| TTL | 24h (`SESSION_JWT_TTL_SECONDS`) | `@ubm-hyogo/shared` の正本値 |
| Silent refresh | **不採用** | Auth.js refresh token は Google OAuth scope 拡張に依存。MVP では 401 → `/login?redirect=` で吸収する方が UX/実装コスト共に有利 |

## 採用 / 不採用 / 根拠

| 項目 | 採用 | 根拠 |
| --- | --- | --- |
| 401 → `toLoginRedirect(currentPath)` redirect | 採用 | session 切れの確実な再認証 + 元 path への自動復帰 |
| 403 → `"権限がありません"` toast (alert role) | 採用 | 操作続行不可だがログイン状態は維持 |
| silent refresh / refresh token | **不採用** | MVP スコープ外。Workers Paid + refresh token 取得・scope 拡張時に再検討 |
| 401 中の form state 保全 | スコープ外 | redirect 後の form 復帰は本サイクル外（明示的にスコープから除外） |

## 後日導入条件（silent refresh）

- Workers Paid / Google OAuth scope 拡張で refresh token 取得が可能
- Auth.js v5 の `events.session.update` で renew 可能
- UX 指標（401 redirect 発生率）が許容値を超えた場合
