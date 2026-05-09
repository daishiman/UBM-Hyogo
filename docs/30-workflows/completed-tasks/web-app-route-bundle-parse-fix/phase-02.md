# Phase 2: スコープ・影響範囲

## 2.1 修正対象ファイル

| パス | 種別 | 内容 |
|------|------|------|
| `apps/web/package.json` | 編集 | `scripts.build` を `next build` から `next build --webpack` に変更 |
| `scripts/patch-next-standalone-instrumentation.mjs` | 編集 | webpack 経路で `.next/server/instrumentation.js` が未生成の場合は明示ログを出して skip し、OpenNext bundle 生成へ進める |
| `apps/web/app/(admin)/admin/audit/audit-query.ts` | 追加 | typecheck 再実行で検出された App Router page named export 制約に対応するため、既存 helper をページ外へ分離 |
| `apps/web/app/(admin)/admin/audit/page.tsx` | 編集 | `jstLocalToUtcIso` の named export を削除し、helper import に置換（UI/HTTP 契約は不変） |
| `apps/web/app/(admin)/admin/audit/page.test.ts` | 編集 | helper import 先を `audit-query.ts` へ変更 |

それ以外のソースコード（`apps/web/src/**`, `apps/api/**`）は **無編集**。admin audit helper 分離は、現行 `pnpm --filter @ubm-hyogo/web typecheck` を通すための隣接テスト実行可能性修正であり、App Route Handler parse fix の実行時仕様は変更しない。

## 2.2 影響を受ける範囲（実行時）

| ルート種別 | 修正前 | 修正後 |
|----------|--------|--------|
| Server Component (page) | 200 | 200（変化なし、回帰なし） |
| App Route Handler (`app/api/**/route.ts`) | 500（parse fail） | 200/302/404 等の正常応答 |
| Static asset (`/_next/static/...`) | 200 | 200（変化なし） |
| middleware | 動作中 | 動作中（webpack 経路で同等） |

## 2.3 影響を受ける App Route Handler 一覧（修正で復旧する候補）

ビルドログ ("ƒ") から確認:

```
apps/web/app/api/admin/[...path]/route.ts
apps/web/app/api/auth/[...nextauth]/route.ts
apps/web/app/api/auth/callback/email/route.ts
apps/web/app/api/auth/gate-state/route.ts
apps/web/app/api/auth/magic-link/route.ts
apps/web/app/api/auth/magic-link/verify/route.ts
apps/web/app/api/me/[...path]/route.ts
apps/web/app/api/me/delete-request/route.ts
apps/web/app/api/me/visibility-request/route.ts
```

> Auth.js が exposing する `/api/auth/error` は `app/api/auth/[...nextauth]/route.ts` の catch-all にマッチする。

## 2.4 スコープ外（本ワークフローでは扱わない）

| 項目 | 理由 |
|------|------|
| `next` / `@opennextjs/cloudflare` のバージョン変更 | 最小複雑性原則。webpack 切替で十分なら依存変更しない |
| OpenNext の patch (`scripts/patch-open-next-worker.mjs`) 修正 | `auth env bridge` 注入は今回の問題と無関係 |
| `next-auth` の設定変更 | 設定は影響を受けない（ビルダ層の問題） |
| Sentry browser-extension 警告等のノイズ消去 | 自社外 |
| favicon の追加 | 別タスク（軽微） |

## 2.5 参照する正本仕様

| 参照先 | 用途 |
|-------|------|
| `CLAUDE.md` | スタック / `apps/web` env アクセス不変条件 / ブランチ戦略 / `scripts/cf.sh` 経由ルール |
| `docs/00-getting-started-manual/specs/02-auth.md` | 認証経路（変更しない確認のみ） |
| `apps/web/wrangler.toml` | service binding 構成（変更しない） |
| `apps/web/next.config.ts` | `outputFileTracingRoot` / `turbopack.root` 設定（残置可能か確認） |
| `apps/web/open-next.config.ts` | `buildCommand` の経路確認（`pnpm build` を経由するため修正不要） |

## 2.6 リスク

| リスク | 評価 | 緩和策 |
|------|------|--------|
| webpack 切替で別の build error が出る | 低（webpack 経路は OpenNext 実績あり） | DoD-2/3 の検証ステップで検知 |
| `next.config.ts` 内の `turbopack.root` 設定が webpack 経路で害になる | 極低（Next は使われない側のフィールドを無視する） | DoD-4 の `pnpm typecheck` / `pnpm lint` で検知 |
| build 時間増加 | 中（webpack は Turbopack より遅い） | NFR-1 で +60s 以内に許容 |
| production deploy 失敗 | 中（過去 1 週間 deploy 履歴なし、未知の差分が混入する可能性） | staging deploy 後の DoD-2/3 通過を gate にして production に進む |
