# apps/web/src/auth.ts の env 参照を getEnv() 経由に統一 - タスク指示書

> **Consumed pointer（2026-05-24 追記）**: 本単一ファイル仕様は canonical workflow
> [`docs/30-workflows/fix-admin-scr-err-stg-fu-001-auth-env-via-getenv/`](../fix-admin-scr-err-stg-fu-001-auth-env-via-getenv/index.md)
> に Phase 1-13 として formalize 済み。local 実装・focused regression（75 tests green）・AC grep gate（AC-1/AC-2/AC-5）は完了。
> 残作業は staging runtime smoke（AC-7）/ commit / push / PR のみで user-gated。本ファイルは削除せず昇格 trace として live 位置に保持する。
> `workflow_state = consumed`（実体は canonical workflow の `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）。

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | fix-admin-scr-err-stg-followup-001-auth-env-via-getenv-migration                      |
| タスク名     | `apps/web/src/auth.ts` の env 参照を `getEnv()` 経由に統一                            |
| 分類         | 改善 / 不変条件整合化                                                                 |
| 対象機能     | apps/web 認証境界 (`auth.ts`) における env 参照経路                                   |
| 優先度       | 中                                                                                    |
| 見積もり規模 | 小規模                                                                                |
| ステータス   | 未実施                                                                                |
| 発見元       | TASK-FIX-ADMIN-SCR-ERR-STG-001 close-out review                                       |
| 発見日       | 2026-05-23                                                                            |
| 親 workflow  | `docs/30-workflows/fix-admin-server-components-render-error-stg/`                     |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク TASK-FIX-ADMIN-SCR-ERR-STG-001 では、Cloudflare Workers staging `/admin` で発生した Server Components render error (digest=167275886) の原因が、`apps/web/src/lib/admin/server-fetch.ts` の `process.env` 直接参照および `http://127.0.0.1:8787` localhost fallback にあることを特定し、`getEnv()` 経由の参照に統一する修正を PR #849 で実施した。

しかし、修正は `server-fetch.ts` のみに留まり、`apps/web/src/auth.ts` は依然として `getCloudflareContext().env` および `process.env` を混在して直接参照したまま残存している。

### 1.2 問題点・課題

- CLAUDE.md「`apps/web` env アクセス不変条件 (task-02 wrangler-env-injection)」に明記された「`apps/web` ランタイムでの env 参照は `getEnv()` / `getPublicEnv()` 経由のみ」と部分的に乖離している
- `auth.ts` は admin / member 双方の認証境界に位置するため、env parse 失敗時に zod throw → error boundary 補足の規約に乗らず、silent fail / undefined 起点の runtime crash を再発するリスクがある
- `EnvSchema` 拡張（親タスクで追加した `INTERNAL_AUTH_SECRET` を含む）の恩恵を auth boundary が受けられない

### 1.3 放置した場合の影響

- 同型 (digest 単位の Server Components render error) regression が認証境界で再発する
- `getEnv()` への一本化が partial migration のまま停滞し、後続開発者が `process.env` / `getCloudflareContext().env` / `getEnv()` の 3 経路を「どれを使うか」迷い続ける
- error boundary（`apps/web/src/app/error.tsx`）の throw 補足設計が auth 領域では機能せず、運用中の事故検知が遅れる

---

## 2. スコープ

### 2.1 含むもの

- `apps/web/src/auth.ts` 内の `process.env.*` および `getCloudflareContext().env.*` 直接参照を全て `getEnv()` 経由に置換
- `EnvSchema` (`apps/web/src/lib/env.ts`) に auth.ts が必要とする key（`AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `INTERNAL_AUTH_SECRET` 等）が網羅されていることを確認、不足分を追加
- zod parse 失敗時の throw を try/catch で握り潰さず error boundary に伝播させる設計を維持
- 関連 unit test の更新（mock env を `getEnv()` に統一）

### 2.2 含まないもの

- 新規 OAuth provider 追加・Auth.js バージョンアップ
- D1 schema 変更・新規 API endpoint 追加
- `apps/api` 側の env 参照経路（本タスクは `apps/web` 限定）

---

## 3. 実装ステップ概要

1. `apps/web/src/auth.ts` 内の env 参照箇所を grep で全て洗い出し（`process.env\.` / `getCloudflareContext().env\.`）
2. 各参照を `getEnv()` 戻り値経由に置換（top-level でなく request scope 内で取得する設計を維持）
3. `EnvSchema` の差分を補完し、`INTERNAL_AUTH_SECRET` 等 staging/production secrets が schema に揃っていることを確認
4. `mise exec -- pnpm typecheck && pnpm lint` で zod 型と lint 整合性を検証
5. 関連 `apps/web/src/auth.spec.ts` の mock を `getEnv` mock に統一
6. staging deploy 後の `/login` `/admin` で session 取得・admin gate 通過を runtime smoke 確認（followup-003 の CI gate と連携可能）

---

## 4. 受け入れ条件（DoD）

- **AC-1**: `apps/web/src/auth.ts` 配下に `process.env.` 直接参照が 0 件（grep gate）
- **AC-2**: `apps/web/src/auth.ts` 配下に `getCloudflareContext().env.` 直接参照が 0 件
- **AC-3**: 全 env 参照が `getEnv()` 戻り値経由
- **AC-4**: `EnvSchema` に auth.ts が要求する全 key が含まれ、zod parse が staging/production 双方で成功
- **AC-5**: `pnpm typecheck` / `pnpm lint` pass
- **AC-6**: staging `/login` → Google OAuth または Magic Link → `/admin` 到達まで runtime smoke pass
- **AC-7**: CLAUDE.md「apps/web env アクセス不変条件」と完全整合

---

## 5. 苦戦箇所メモ

Cloudflare Workers ランタイムでは env 参照経路が以下 3 層で混在しやすい:

1. `process.env.*` — Node 互換層。`@opennextjs/cloudflare` が一部 polyfill するが Workers runtime では undefined になる key が存在し silent fail を起こす
2. `getCloudflareContext().env.*` — `@opennextjs/cloudflare` の context API 経由。binding は取れるが zod 検証が無く型安全性が低い
3. `getEnv()` (`apps/web/src/lib/env.ts`) — zod schema で検証し parse 失敗時に throw。`apps/web/src/app/error.tsx` の error boundary で補足される設計

親タスクで判明したのは、(1) / (2) は **build 時には型が通り runtime で初めて undefined になる** ため pre-deploy 検知が困難という点。auth boundary でも同じ罠が再発するため、`getEnv()` への一本化と error boundary 連動 throw を auth 境界にも適用する必要がある。

`getEnv()` を top-level で評価すると Workers の module init 時に throw して module loading 自体が失敗するので、必ず request handler / function scope 内で呼び出すこと（親タスクの server-fetch.ts 修正で確立したパターン）。

---

## 6. 関連リソース

- `apps/web/src/auth.ts`（本タスクの修正対象）
- `apps/web/src/lib/env.ts`（`getEnv()` / `EnvSchema` 正本）
- `apps/web/src/lib/admin/server-fetch.ts`（親タスクで適用済みの修正パターン参考）
- `apps/web/src/app/error.tsx`（error boundary throw 補足先）
- `apps/web/wrangler.toml`（`[vars]` / `[env.staging.vars]` / `[env.production.vars]` 定義）
- `docs/30-workflows/fix-admin-server-components-render-error-stg/`（親 workflow）
- 関連 PR: #849
- CLAUDE.md「`apps/web` env アクセス不変条件（task-02 wrangler-env-injection）」セクション
- `docs/00-getting-started-manual/specs/02-auth.md`（認証設計正本）
