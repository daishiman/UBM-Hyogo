# Phase 4 — テスト戦略サマリ

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 状態 | completed |
| 上流 | phase-03 (採用案 A) |
| 下流 | phase-05 (実装ランブック / 実コード) |

## verify suite

| layer | tool | 対象 | 件数目安 |
| --- | --- | --- | --- |
| unit | vitest | `signSessionJwt` / `verifySessionJwt` (HS256) | 7 |
| contract | vitest + miniflare D1 | `GET /auth/session-resolve` 4 状態 + auth | 8 |
| authz | vitest + Hono | `requireAuth` / `requireAdmin` 二段防御 (G-04〜G-08) | 8 |
| security | vitest | JWT 改ざん / 期限切れ / 異 secret | unit に同梱 |
| lint | scripts/lint-boundaries.mjs | apps/web → D1 直接 import 阻止 (Z-01/Z-02) | 既存 |

## AC × test ID

| AC | 紐付け |
| --- | --- |
| AC-1 | session-resolve R-04/R-05 + signSessionJwt unit |
| AC-2 | session-resolve R-01 (unregistered) |
| AC-3 | session-resolve R-05 + requireAdmin G-06 |
| AC-4 | apps/web/middleware.ts (E2E は 08b に委譲) + setUser 設計 |
| AC-5 | requireAdmin G-04 (401) / G-05 (403) / G-06 (200) |
| AC-6 | secrets.md の wrangler secret put 手順 (実値不在) |
| AC-7 | secrets.md (1Password / Cloudflare Secrets / GitHub Secrets) |
| AC-8 | verifySessionJwt unit (改ざん) + requireAdmin G-08 |
| AC-9 | session-resolve は provider 不変、05b と統合 test |
| AC-10 | middleware は Web Crypto + getToken のみ → edge 互換 |

## 実装 → test の対応

- `packages/shared/src/auth.ts` → `auth.test.ts` (7 ケース)
- `apps/api/src/routes/auth/session-resolve.ts` → `session-resolve.test.ts` (8 ケース)
- `apps/api/src/middleware/require-admin.ts` → `require-admin.test.ts` (8 ケース)

## 既存テストの維持

| テスト | 対応 |
| --- | --- |
| `apps/api/src/routes/admin/*.test.ts` | `adminGate` を `requireSyncAdmin` の alias として残し、Bearer SYNC_ADMIN_TOKEN 経路を変更しない（既存 13 endpoint 分の test green 維持） |
| `apps/api/src/middleware/admin-gate.ts` | リネーム済 (`requireSyncAdmin` export + `adminGate` deprecated alias) |

## 次 Phase 引き継ぎ

- runbook (phase-05) に test ID を完了条件として埋め込み済
- phase-06 で異常系 (CSRF / state mismatch / replay) を追加
