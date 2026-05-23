# Phase 5: 実装サマリ

Status: `implemented_local_runtime_pending` (Lane A-E コード変更完了 / authenticated Phase 11 視覚検証は user-gated)

## 実施内容

### Lane A: 共通コンポーネント (新規)

| ファイル | 行数 | 種別 |
| --- | --- | --- |
| `apps/web/src/lib/result.ts` | 18 | type |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | 39 | helper |
| `apps/web/src/features/admin/components/_shared/AdminSectionCard.tsx` | 60 | component |
| `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx` | 51 | component |
| `apps/web/src/features/admin/components/_shared/AdminEmptyState.tsx` | 73 | component |
| `apps/web/src/features/admin/components/_shared/AdminStat.tsx` | 43 | component |
| `apps/web/src/features/admin/components/_shared/AdminTable.tsx` | 144 | component |
| `apps/web/src/features/admin/components/_shared/AdminQueuePanel.tsx` | 78 | component |
| `apps/web/src/features/admin/components/_shared/index.ts` | 26 | barrel |
| `apps/web/src/styles/globals.css` | +281 | css tokens-based styles |

### Lane B-E: admin pages の per-section degrade 適用

| Route | page.tsx 差分 | 適用パターン |
| --- | --- | --- |
| `/admin` (Dashboard) | safeServerFetch + AdminSectionError | fetch 1 本 |
| `/admin/dashboard/attendance` | 3 fetch を全て safeServerFetch 化、ブロック単位 degrade | per-section degrade |
| `/admin/members` | safeServerFetch + AdminSectionError | fetch 1 本 |
| `/admin/tags` | safeServerFetch + AdminSectionError | fetch 1 本 |
| `/admin/meetings` | meetings/members 2 fetch を safeServerFetch 化、いずれか fail で AdminSectionError | per-page degrade |
| `/admin/meetings/[id]` | safeServerFetch + AdminSectionError | fetch 1 本 |
| `/admin/schema` | safeServerFetch + AdminSectionError | fetch 1 本 |
| `/admin/requests` | safeServerFetch + AdminSectionError | fetch 1 本 |
| `/admin/identity-conflicts` | safeServerFetch + AdminSectionError | fetch 1 本 |
| `/admin/audit` | try/catch を safeServerFetch ベースへ移行 | API contract 維持 |

### スコープ調整

Phase 5 仕様書には `TagsClientShell` / `RequestsClientShell` 新設・既存 `*Panel.tsx` の共通 component 差し替えも含まれていたが、本サイクルでは error degrade と _shared 基盤導入を優先し、既存 Panel の内部実装差し替えは持ち越し（既存 API surface は不変、テストは全件 pass）。

## 検証コマンド

| コマンド | 結果 |
| --- | --- |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web lint` | PASS |
| `pnpm --filter @ubm-hyogo/web test -- --run` | 127 files / 897 passed / 1 skipped |
| `pnpm --filter @ubm-hyogo/web verify-design-tokens` | 9/9 PASS (HEX 直書き 0 件) |

## DoD 充足

- [x] `/admin` 配下 page.tsx は fetch 失敗時に AdminSectionError へ degrade（page 全体 throw を廃止）
- [x] `_shared/` 6 component + barrel + safeServerFetch helper 新設
- [x] 既存テストスイート全件 PASS (regression なし)
- [x] verify-design-tokens PASS (CI gate ベース)
- [ ] Phase 11 視覚検証 (4 viewport × 5 screen = 20 screenshot) — authenticated runtime が必要なため user-gated
