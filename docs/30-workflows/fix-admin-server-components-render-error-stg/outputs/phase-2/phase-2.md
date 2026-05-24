# Phase 2: 設計

## 2.1 原因仮説と検証手順（必須）

### 仮説 H1（最有力）: `apps/web/src/lib/admin/server-fetch.ts` の env 参照経路違反

**根拠**:

- L15: `const v = process.env["INTERNAL_API_BASE_URL"]` — CLAUDE.md 不変条件「`apps/web` ランタイムの env 参照は `getEnv()` 経由のみ・`process.env.*` 直接禁止」に違反
- L12: `const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787"` — CLAUDE.md「127.0.0.1 など localhost endpoint の `apps/web/src` 配下への焼き込み禁止」に違反
- Cloudflare Workers + `@opennextjs/cloudflare` runtime では `[vars]` バインディングは `getCloudflareContext().env` 経由でのみ参照可能。`process.env` 経由は **空** または **undefined** になる構成が現行 OpenNext 仕様
- 結果: `resolveApiBase()` が fallback の `127.0.0.1:8787` を返す → Cloudflare Worker から到達不能 → `fetch` 例外 → Server Component 例外 → digest 化されて表示

### 仮説 H2: `apps/web/src/lib/auth.ts` の同型違反による `getSession()` 失敗

- L59-66 にて同様に `process.env["AUTH_SECRET"]` 等を直接参照
- `layout.tsx` の `getSession()` が先に呼ばれるため、こちらが投げると `page.tsx` に到達せず同じ digest が出る可能性
- → 必ず Phase 2.2 stack trace で確認、原因なら同 PR でスコープ拡張

### 仮説 H3: env binding ミス（`INTERNAL_API_BASE_URL` が staging に未投入）

- 反証: `apps/web/wrangler.toml` L32 で `[env.staging.vars]` に存在
- → 低確率だが Phase 2.2 で `wrangler secret list --env staging` で全 secret 在席を確認

### 仮説 H4: API 呼び出し先 (`apps/api` staging) からの 4xx/5xx 応答

- `fetchAdmin` は `!res.ok` で throw する。`/admin/dashboard` API が 500 ならここで例外
- → Phase 2.2 で `apps/api` 側のログも `wrangler tail` で確認

## 2.2 stack trace 取得手順（Phase 5 着手前に必須実行）

```bash
# 1. 認証
bash scripts/cf.sh whoami

# 2. apps/web staging の tail を起動（別 terminal）
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging --format pretty

# 3. apps/api staging の tail も並行で起動
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty

# 4. ブラウザで再現
#    https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin

# 5. tail 出力から digest=167275886 に該当する例外 stack を抽出
#    （または最新の同型例外。本番ビルドのため再現直前のものを採用）
```

> `scripts/cf.sh` が `tail` サブコマンドを未サポートの場合は内部で `wrangler tail` を `op run` 経由実行できるように Phase 5 で軽微拡張する（spec のみここで宣言、実装は最小差分）。

## 2.3 設計判断

| 項目                                                                              | 採用                                                                                                 | 不採用                                                                              |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| env 参照経路                                                                      | `getEnv()` 経由                                                                                       | `process.env` 直接、独自 helper                                                     |
| INTERNAL_AUTH_SECRET の取り扱い                                                   | `EnvSchema` に `.optional()` で追加（local では不要、staging/production では secret 必須）            | schema 外で `getCloudflareContext().env` を生参照                                   |
| `127.0.0.1:8787` fallback                                                         | 完全削除（schema parse 失敗時は throw、`error.tsx` で digest 表示）                                   | local 用 fallback を残す                                                            |
| fixture branch (`PLAYWRIGHT_*`) の env 参照                                       | 既存どおり `process.env` を残置（Node runtime test contextのみで有効・Workers では未到達）            | これも `getEnv()` 化（test fixture pathway を破壊するため不採用）                   |
| `NODE_ENV` チェック                                                               | 既存どおり `process.env["NODE_ENV"]` を残置（Next.js 内部で build 時 inline される、Worker runtime に焼き込まれる）| `getEnv()` 化（EnvSchema 対象外、build-time inline 値）                          |
| `auth.ts` の同型違反                                                              | stack trace で証跡を得た場合のみ同 PR で `getEnv()` 化（最小差分）                                    | 証跡なしでも投機的に修正                                                            |

## 2.4 ターゲット I/F 設計

### `server-fetch.ts`

```ts
// before
const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787"; // 削除

const resolveApiBase = (): string => {
  const v = process.env["INTERNAL_API_BASE_URL"];
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};

const resolveInternalSecret = (): string =>
  process.env["INTERNAL_AUTH_SECRET"] ?? "";

// after
import { getEnv } from "../env";

const resolveApiBase = (): string => {
  const env = getEnv();
  return env.INTERNAL_API_BASE_URL.replace(/\/$/, "");
};

const resolveInternalSecret = (): string => {
  const env = getEnv();
  return env.INTERNAL_AUTH_SECRET ?? "";
};
```

### `env.ts`（差分）

```ts
export const EnvSchema = z.object({
  // ...既存...
  INTERNAL_API_BASE_URL: z.string().url(),
  INTERNAL_AUTH_SECRET: z.string().min(1).optional(), // 追加
  // ...
});
```

> `INTERNAL_AUTH_SECRET` は staging/production では Cloudflare Secret として投入済みである前提（要 Phase 2.2 確認）。未投入なら Phase 5 で `bash scripts/cf.sh secret put INTERNAL_AUTH_SECRET --config apps/web/wrangler.toml --env staging` を実行する手順を Phase 5 に含める。

## 2.5 ステップ間 state ownership（NON_VISUAL のため簡略）

| 関数              | 入力                            | 出力                                | 副作用                            |
| ----------------- | ------------------------------- | ----------------------------------- | --------------------------------- |
| `resolveApiBase`  | （内部で `getEnv()` 呼び出し）  | URL 文字列（末尾 `/` 除去済み）     | EnvSchema parse 失敗時 throw      |
| `fetchAdmin<T>`   | `path` / `opts`                 | `T`（API 応答）                     | EnvSchema parse 失敗 / fetch 失敗 / `!res.ok` 時 throw |

## 2.6 既存テスト・smoke 再利用

- 既存: `apps/web/src/lib/admin/__tests__/dashboard-ui.spec.ts`（UI mapper の単体）
- 既存: Playwright admin dashboard runtime smoke（#849, `apps/web/playwright.admin-schema-diff.config.ts` または近接 config）— Phase 6 で動作確認、staging プレビューでの pass を Phase 11 evidence とする
- broad grep guard は fixture branch と衝突するため採用しない。runtime env 解決は focused Vitest で固定する

## 2.7 ライブラリ選定

| ライブラリ        | 既存採用 | 今タスクでの利用       |
| ----------------- | -------- | ---------------------- |
| zod               | 既存     | EnvSchema 拡張のみ     |
| @opennextjs/cloudflare | 既存 | `getCloudflareContext` を `env.ts` で利用済み |
| vitest            | 既存     | regression spec 実行   |
| Playwright        | 既存     | runtime smoke 再利用   |

新規ライブラリ追加なし。
