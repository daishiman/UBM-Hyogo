# Phase 1 outputs — Inventory

## A. `vitest.config.ts` の apps/web 関連 exclude (現状)

| Pattern | 取り戻し可能性 (unit test 化) |
|---------|--------------------|
| `apps/web/app/**/page.tsx` | ❌ Edge runtime / Next.js server component に依存。継続 exclude |
| `apps/web/app/**/layout.tsx` | ❌ 同上。継続 exclude |
| `apps/web/app/**/loading.tsx` | ✅ pure presentation component。**外す候補** |
| `apps/web/app/**/error.tsx` | △ Client Boundary だが getEnv throw 経路あり。慎重評価 |
| `apps/web/app/**/not-found.tsx` | ✅ static markup。**外す候補** |
| `apps/web/next.config.*` | ❌ config。継続 |
| `apps/web/middleware.ts` | ❌ Edge runtime。継続 |
| `apps/web/src/lib/api/me-types.ts` | △ type-only。継続 |
| `apps/web/src/__tests__/__fixtures__/**` | ❌ fixture。継続 |

→ 外す候補: `loading.tsx`, `not-found.tsx` (+ `error.tsx` は Phase 2 で再判定)

## B. 19-route smoke 一覧 (`apps/web/playwright/tests/full-smoke.spec.ts`)

| Auth | Routes |
|------|--------|
| public (6) | `/`, `/members`, `/members/sample-001`, `/register`, `/privacy`, `/terms`, `/login` (= 7 含む login) |
| member (1) | `/profile` |
| admin (8) | `/admin`, `/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit` |
| 共通 (1) | `/__not_found_canary` (404 検証) |

合計 **17 (公開) + canary = ROUTES 配列 17 件** (`full-smoke.spec.ts:13-31`)。"19-route" 表現は CLAUDE.md / workflow 命名の慣性で残るが、実体は 17 routes。SLA runbook では実数 (17) と慣用名 (19-route smoke) を両方記載する。

## C. apps/web/app 配下 .tsx ファイル数 (計測対象)

Phase 5 の measure script で `find apps/web/app -name "*.tsx" | wc -l` を集計し baseline JSON へ記録。本仕様書段階では未計測 (Phase 5 で実測)。
