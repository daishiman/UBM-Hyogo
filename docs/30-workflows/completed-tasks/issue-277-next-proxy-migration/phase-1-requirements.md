# Phase 1: 要件定義

## 背景

Next.js 16 で `middleware` file convention は deprecated になり、`proxy` にリネームされた。UBM-Hyogo は `next@16.2.4` を使用しており、`apps/web/middleware.ts` のまま運用すると将来のメジャーアップグレードで動作しなくなる。dev server / build 時の deprecation warning も継続発生する。

## 機能要件

| ID | 要件 | 出典 |
|---|---|---|
| FR-1 | `/admin/:path*` に対する gate 振る舞いを維持する（未ログイン → 307 `/login?gate=admin_required` redirect、認証済 non-admin → 403 Forbidden plain text、admin → next） | issue #277 AC、`apps/web/middleware.ts:56-68` |
| FR-2 | `/profile/:path*` に対する gate 振る舞いを維持する（未ログイン → 307 `/login?redirect=<元path>` redirect、認証済 → next） | issue #277 AC、`apps/web/middleware.ts:69-74` |
| FR-3 | JWT decode は引き続き `decodeAuthSessionJwt`（`@ubm-hyogo/shared`）を使用、D1 アクセスは行わない | 不変条件 #5 |
| FR-4 | session cookie 名の優先順位（`__Secure-authjs.session-token` → `authjs.session-token` → `__Secure-next-auth.session-token` → `next-auth.session-token`）を維持 | `apps/web/middleware.ts:17-22` |

## 非機能要件

| ID | 要件 |
|---|---|
| NFR-1 | `next build` / `next dev` の deprecation warning（`"middleware" file convention is deprecated. Please use "proxy" instead.`）が消えること |
| NFR-2 | Edge Runtime で実行されること（proxy も middleware と同じく Edge default） |
| NFR-3 | `apps/web` から D1 を直接参照しないという不変条件 #5 を維持 |

## 受入条件（issue #277 AC 写し）

- `/admin/:path*` と `/profile/:path*` の gate behavior が proxy convention に移行されている
- 未ログイン `/profile` が 307 で `/login?redirect=%2Fprofile` へ redirect する
- admin gate の `gate=admin_required` 挙動が維持される
- 既存 middleware/proxy 関連テストまたは smoke evidence が更新されている（→ Phase 6 で `apps/web/__tests__/proxy.spec.ts` を新設）

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 1 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Next.js 16 proxy convention 移行の要件を、既存 auth gate parity を壊さない単位で確定する。

## 実行タスク

- FR / NFR / 受入条件を確定する。
- redirect status を 307 に統一する。
- D1 直接アクセス禁止と cookie 優先順位を不変条件として固定する。

## 参照資料

- `apps/web/middleware.ts`
- `packages/shared/src/auth.ts`
- `docs/30-workflows/completed-tasks/UT-06B-NEXT-PROXY-MIGRATION.md`

## 成果物

- 本 Phase 1 要件定義。
- root `artifacts.json` の metadata と整合した taskType / visualEvidence。

## 完了条件

- 受入条件が Phase 4 / 6 / 11 / 13 に追跡可能である。
- 矛盾する redirect status 表記が残っていない。

## 統合テスト連携

Phase 6 の `apps/web/__tests__/proxy.spec.ts` で AC-1〜AC-7 を自動検証する。
