# Phase 11 — 自動化テスト evidence（手動 smoke 代替）

実環境 smoke が staging 接続まで BLOCKED のため、ローカルで実行可能な自動化テストを smoke の代理 evidence として記録する。

## 集計（2026-04-29 実測）

| コマンド | テスト種別 | 件数 | 結果 |
| --- | --- | --- | --- |
| `pnpm exec vitest run packages/shared/src/auth.test.ts apps/api/src/middleware/require-admin.test.ts apps/api/src/routes/auth/session-resolve.test.ts --root=. --config=vitest.config.ts` | 共有 HS256 JWT / API requireAdmin / session-resolve | 25 / 25 | pass |
| `pnpm exec vitest run apps/api/src/routes/admin/dashboard.test.ts apps/api/src/routes/admin/members.test.ts apps/api/src/routes/admin/member-status.test.ts apps/api/src/routes/admin/member-notes.test.ts apps/api/src/routes/admin/member-delete.test.ts apps/api/src/routes/admin/tags-queue.test.ts apps/api/src/routes/admin/schema.test.ts apps/api/src/routes/admin/meetings.test.ts apps/api/src/routes/admin/attendance.test.ts --root=. --config=vitest.config.ts` | 人間向け `/admin/*` 9 router の `requireAdmin` gate | 34 / 34 | pass |
| `pnpm --filter @ubm-hyogo/shared typecheck` / `pnpm --filter @ubm-hyogo/web typecheck` / `pnpm --filter @ubm-hyogo/api typecheck` | 型検証 | 3 / 3 | pass |

## smoke 観点との対応

| smoke 項目 | 自動化テストでの代替 | カバー範囲 |
| --- | --- | --- |
| M-01 unregistered redirect | session-resolve: identity 無し → `gateReason=unregistered` | URL redirect は staging で要確認 |
| M-02 rules_declined redirect | session-resolve: `rules_consent != consented` → `gateReason=rules_declined` | 不変条件 #2 のキー名検証含む |
| M-03 deleted redirect | session-resolve: `is_deleted=1` → `gateReason=deleted` | 不変条件 #4 |
| M-04 member session | shared auth test: JWT に `memberId` / `email` / `isAdmin=false` が含まれ、`responseId` / `profile` を含まない | 不変条件 #7 |
| M-05 admin session | shared auth test: Auth.js encode/decode adapter と API verifier が `isAdmin=true` を共有 | 不変条件 #7 |
| M-06 未ログイン admin gate | Phase 6 middleware unit: `no token → 302 /login?gate=admin_required` | 不変条件 #11（一段目） |
| M-07 non-admin admin gate | Phase 6 middleware unit: `isAdmin=false → 302 /login?gate=admin_required` | 不変条件 #11（一段目） |
| M-08 admin admin gate OK | Phase 6 middleware unit: `isAdmin=true → 200` | — |
| M-09 API non-admin | requireAdmin unit: `isAdmin=false → 403 forbidden` | 不変条件 #11（二段目） |
| M-10 API admin OK | requireAdmin unit + admin route tests: `isAdmin=true → 200` | — |
| M-11 API no auth | requireAdmin unit + admin route tests: `no Authorization → 401 unauthorized` | 不変条件 #11（二段目） |
| F-09 JWT 改ざん | requireAdmin unit / shared auth test: `signature mismatch → 401/null` | — |
| F-15 `?bypass=true` | Phase 6 middleware unit: bypass query が無視されること | — |
| F-16 偽造 cookie | Phase 6 middleware unit: verify fail で 302 | — |
| B-01 race condition | 未自動化。`05a-followup-003-admin-revoke-immediate-effect.md` に正式化 | 既知制約として明示 |

## staging で再確認すべき差分（自動化でカバーできない部分）

1. 実 Google OAuth provider への redirect（client_id/redirect_uri の整合性）
2. Cloudflare Workers ランタイム特有の挙動（`auth.js` の Edge runtime 互換性）
3. 実ブラウザ Cookie の SameSite/Secure 属性
4. `/profile` `/admin/dashboard` 実画面のレンダリング（06a/b/c 実装後）

これらは Phase 09a の staging smoke で `smoke-checklist.md` を実行して補完する。

## 結論

自動化テストは smoke の論理面（URL redirect / status code / session payload shape）を網羅的にカバー済み。実環境固有の挙動のみ staging で再確認する位置付けとし、本 Phase の **PARTIAL pass** を妥当と判定する。
