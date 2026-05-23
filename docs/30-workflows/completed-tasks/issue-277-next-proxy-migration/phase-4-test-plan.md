# Phase 4: テスト計画

## 自動テスト

### apps/web/__tests__/proxy.spec.ts（新規）

vitest + `next/server` の `NextRequest` を直接 instantiate して proxy function を呼び出す。session cookie の有無で振る舞いを検証。

| ケース ID | 入力 | 期待結果 |
|---|---|---|
| AC-1 | `GET /admin/dashboard`、cookie なし | 307 redirect、`location` が `/login?gate=admin_required` |
| AC-2 | `GET /admin/dashboard`、`isAdmin=false` の valid JWT cookie | 403、body `Forbidden` |
| AC-3 | `GET /admin/dashboard`、`isAdmin=true` の valid JWT cookie | `NextResponse.next()` 相当（status 200 / `x-middleware-next: 1` header） |
| AC-4 | `GET /profile`、cookie なし | 307 redirect、`location` が `/login?redirect=%2Fprofile` |
| AC-5 | `GET /profile/edit?tab=tags`、cookie なし | 307 redirect、`location` が `/login?redirect=%2Fprofile%2Fedit%3Ftab%3Dtags` |
| AC-6 | `GET /profile`、valid JWT cookie | `NextResponse.next()` 相当 |
| AC-7 | `export const config.matcher` | 配列が `["/admin/:path*", "/profile/:path*"]` と一致 |

### JWT 生成ヘルパ

`@ubm-hyogo/shared` の JWT 発行 helper を呼ぶか、`x-ubm-auth-secret` header に test secret を渡して `decodeAuthSessionJwt` を通す。テスト fixture 既存パターンは `apps/api/src/__tests__/authz-matrix.authz.spec.ts` を参照。

## 静的検証

- `pnpm typecheck` — proxy.ts の型整合
- `pnpm lint` — eslint 警告ゼロ
- `pnpm --filter @ubm-hyogo/web build` — deprecation warning が出ないことを stdout で grep 検証
  - 期待: `"middleware" file convention is deprecated` 文字列が build log に**出現しない**

## 手動テスト（Phase 11 で詳細）

| シナリオ | 手順 | 期待 |
|---|---|---|
| 未ログイン `/profile` | logged-out browser で `http://localhost:3000/profile` を開く | 307 で `/login?redirect=%2Fprofile` にリダイレクトされる |
| 未ログイン `/admin` | logged-out browser で `http://localhost:3000/admin` を開く | 307 で `/login?gate=admin_required` にリダイレクトされる |
| 認証済 non-admin `/admin` | `manju.manju.03.28@gmail.com` でログイン後 `/admin` | 403 Forbidden plain text |
| 認証済 admin `/admin` | `manjumoto.daishi@senpai-lab.com` でログイン後 `/admin` | 画面描画 |

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 4 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

proxy 移行後も admin/profile gate parity が自動テストと手動 smoke の両方で証明できる計画にする。

## 実行タスク

- AC-1〜AC-7 の自動テストを定義する。
- JWT fixture 生成方針を定義する。
- Phase 11 manual smoke の対象を定義する。

## 参照資料

- Phase 2 behavior matrix。
- `packages/shared/src/auth.ts`
- `apps/api/src/__tests__/authz-matrix.authz.spec.ts`

## 成果物

- 本 Phase 4 テスト計画。
- Phase 6 に渡す AC-1〜AC-7 matrix。

## 完了条件

- 認証済 branch が optional / TODO になっていない。
- redirect status が 307 で統一されている。

## 統合テスト連携

Phase 6 の Vitest と Phase 11 の curl / browser smoke へ連携する。
