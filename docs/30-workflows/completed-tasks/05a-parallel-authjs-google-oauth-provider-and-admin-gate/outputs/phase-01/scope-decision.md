# scope-decision.md — scope in/out の根拠記録

## scope in 一覧と根拠

| # | 項目 | 根拠 spec | 根拠 |
| --- | --- | --- | --- |
| 1 | Auth.js v5 GoogleProvider 設定 | spec 02-auth, 13-mvp-auth | MVP 主導線 |
| 2 | `signIn` / `jwt` / `session` callback で memberId/isAdmin 解決 | spec 06-member-auth | session 構造の確定 |
| 3 | `apps/api` `GET /auth/session-resolve` endpoint contract | 不変条件 #5（apps/web から D1 直接禁止） | apps/web の callback から D1 lookup を切り離す |
| 4 | `apps/web/middleware.ts` admin gate（edge） | spec 11-admin-management | UI 構造の漏洩防止（不変条件 #11） |
| 5 | `apps/api/src/middleware/requireAdmin.ts` | spec 11 + index.md AC-5 | API レベルの最終防衛線 |
| 6 | `SessionUser` / `SessionJwtClaims` 型定義 | spec 06-member-auth | Wave 6/8 の前提 |
| 7 | secrets 配線 (`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL`) | spec 08-free-database 表 | infra 04 体系準拠 |
| 8 | JWT session strategy（24h TTL, HS256） | 不変条件 #10 | D1 row 増回避 |
| 9 | 05b との session 共有 ADR | index.md 並列依存 | 同一 email で同一 memberId 解決 |

## scope out 一覧と根拠

| # | 項目 | 担当 / spec | 根拠 |
| --- | --- | --- | --- |
| 1 | Magic Link provider | 05b | 並列タスクで分担、independent |
| 2 | `AuthGateState` 5 状態（input/sent/unregistered/rules_declined/deleted） | 05b | spec 06 で `/me` 状態として 05b が定義 |
| 3 | `/login` `/profile` UI | 06b | UI 層は Wave 6 |
| 4 | `/admin/*` UI | 06c | UI 層は Wave 6 |
| 5 | `/me/*` API 本体 | 04b | 既に Phase 13 完了、本タスクは利用側 |
| 6 | `/admin/*` API 本体 | 04c | 既に Phase 13 完了、本タスクは gate のみ |
| 7 | `/admin/users` 管理者追加削除 UI | spec 11 「明示的に採用しないもの」 | 永久 scope out |
| 8 | プロフィール本文編集 | 不変条件 #4/#11 | 永久 scope out（Google Form 再回答が正本） |
| 9 | session DB strategy（database session） | 不変条件 #10 | JWT 採用で D1 row 増を回避 |
| 10 | `/no-access` 専用画面 | 不変条件 #9 | `/login?gate=...` に吸収 |
| 11 | `responseId` を JWT に載せる | 不変条件 #7 | memberId のみ |
| 12 | hosted domain (`hd`) 強制 | spec 06 + 13 | 個人 Gmail の会員もいるため OFF |

## 境界判定（紛らわしいケース）

### Q: session callback で `responseId` も解決すべきか？

**A: NO**。不変条件 #7（responseId と memberId の混同禁止）。`responseId` は `member_identities.current_response_id` に保持され、必要時は `/me` API で取得する。JWT に載せると revoke 困難。

### Q: `/auth/session-resolve` を public 公開すべきか？

**A: NO**。public 公開すると email 列挙が可能。Worker-to-Worker 認証 header（例: `X-Internal-Auth: <SHARED_SECRET>`）で保護。Phase 4/5 で詳細決定。

### Q: 既存 `admin-gate.ts`（Bearer SYNC_ADMIN_TOKEN）はどうする？

**A: 隔離して残す**。sync 系 endpoint（schema sync / response sync の cron 起動）は引き続き `SYNC_ADMIN_TOKEN` で保護し、人間の admin 操作は `requireAdmin`（JWT + admin_users）に分離。命名は `requireSyncAdmin` 等にリネーム検討（Phase 5 ランブックで確定）。

### Q: `member_status.publish_state` を session に載せるか？

**A: NO**。公開条件は session 不要（公開ページは認証不要）。ログイン条件のみ session-resolve で確認。

## 4 条件再評価（scope 確定後）

| 条件 | 判定 | scope 確定後の根拠 |
| --- | --- | --- |
| 価値性 | PASS | scope は MVP の最小単位 |
| 実現性 | PASS | scope out した項目（Magic Link / UI / API 本体）は既に他タスクで実装済 or 実装中 |
| 整合性 | PASS | session-resolve を中央集権化することで 05b との分担境界が明確 |
| 運用性 | PASS | secrets / JWT / Cloudflare Edge 互換性すべて infra 04 と整合 |
