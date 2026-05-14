# task-02 wrangler-env-injection

> 02-runtime / 実装タスク仕様書
> 改訂日: 2026-05-07
> 関連 phase-3: §4.2「task-02 wrangler-env-injection」(`outputs/phase-3/phase-3.md` L290-L295)
> 関連 phase-2: §1 task-02 行 / §3 DAG / §4.3 競合ファイル早見表
> 関連 phase-1: §5.1 技術制約・§3 既存バックエンド接続マッピング

---

## 0. 自己完結コンテキスト

このセクションは **task-02 を単独で読んでも実装に必要な前提が揃う**ことを保証するための自己完結ブロックである。phase-1〜3 / CLAUDE.md / 既存コードを横断参照しなくても、本タスクの境界・依存・成果物が判断できる粒度で記述する。

### 0.1 上位ゴール（phase-1 要約）

UBM 兵庫支部会メンバーサイト（公開 6 / 会員 2 / 管理 8 / 共通 3 ＝ 19 routes）を Cloudflare Workers + Next.js App Router (`@opennextjs/cloudflare`) 上で全画面・全状態・全トークンが破綻なく動作する状態に揃え直す。Phase 1 §1.1 のゴール表に従い、**ランタイム面では Sentry production / staging エラー 0**、**API 接続面では `apps/api/` 既存 endpoint の現行 surface 外を触らない**ことを満たす。本タスクはその基盤として **Cloudflare Workers の env 注入経路を 3 環境（local / staging / production）で完全に確定**させる役割を持つ。

### 0.2 本タスクの DAG 座標

- **依存元**: なし（02-runtime wave の最上流。task-01 の scope-gate を gate 通過後、即着手可能）
- **依存先**: task-04 (window-guard-and-logger), task-05 (error-boundary-and-staging-smoke), task-18 (regression smoke)
- **並列性**: **task-03 (sentry-workers-sdk-unify) と並列実行可能**。両者とも `wrangler.toml` を触る可能性があるが、本 task が `[vars]` セクションを集約担当し、task-03 は instrumentation 層のみ触ることで競合を回避する。

### 0.3 触れるファイル群（再掲）

| path | 種別 | 概要 |
|------|------|------|
| `apps/web/wrangler.toml` | M | `[vars]` `[env.staging.vars]` `[env.production.vars]` の env キー整理 |
| `apps/web/.dev.vars.example` | C | local 開発用 env キー一覧（`op://...` 参照例） |
| `apps/web/src/lib/env.ts` | C | zod 検証付き env アクセサ `getEnv(ctx)` |
| `apps/web/src/lib/__tests__/env.test.ts` | C | env 検証ロジック単体テスト |
| `apps/web/next.config.ts` | M（最小） | NEXT_PUBLIC_* 公開キー許可リスト調整 |

### 0.4 既存 API endpoint（不変条件）

`apps/api/src/routes/{auth,me,public,admin}/*` — **新規追加禁止**。本タスクは `NEXT_PUBLIC_API_BASE_URL` を通じて既存 surface に接続するための env 配線のみを行い、endpoint の追加・改変は一切行わない（phase-1 §1.2 非ゴール）。

### 0.5 重要な不変条件（CLAUDE.md より該当抜粋）

1. **D1 への直接アクセスは `apps/api` に閉じる**。本タスクで導入する env キーから D1 binding 名や直接接続情報を `apps/web` に漏らしてはならない。
2. **平文 `.env` はリポジトリにコミットしない**。`.dev.vars.example` には実値を書かず、`op://Vault/Item/Field` 参照のみを記述する。
3. **GAS prototype は本番バックエンド仕様に昇格させない**。env キー名・接続先 URL の選定で GAS 仕様を引きずらない。
4. **Cloudflare 系 CLI は `scripts/cf.sh` 経由のみ**。本タスク内で wrangler を直接呼ぶ手順を書かない。
5. **`NEXT_PUBLIC_*` で漏らしてよいのは公開可能値のみ**。`SENTRY_DSN`（Browser DSN）・`STAGING_BASE_URL` 等を `NEXT_PUBLIC_` に格上げする際は、Cloudflare Secrets ではなく `[vars]` 経由で注入することを明記する。

### 0.6 上流タスクから受け取るシグネチャ（あれば）

- なし（本タスクは 02-runtime wave 最上流）。
- ただし phase-3 §5 で確定した依存パッケージ（`zod` は既存、`@opennextjs/cloudflare` の `getCloudflareContext()` 経路）を前提とする。

### 0.7 下流タスクへ渡すシグネチャ

本タスクが **`apps/web/src/lib/env.ts`** から export する公開 API：

```ts
// apps/web/src/lib/env.ts
import { z } from 'zod';

export const EnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'staging', 'production']),
  STAGING_BASE_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(['local', 'staging', 'production']).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  // ... 詳細は §4 環境別キー一覧
});
export type EnvSchema = z.infer<typeof EnvSchema>;

/** Workers / Node / Browser いずれの runtime からも安全に env を取得する */
export function getEnv(ctx?: { env?: unknown }): EnvSchema;
```

下流（task-04, task-05, task-18）はこの `getEnv()` のみを通じて env にアクセスし、`process.env.*` の直接参照は禁止する（CI gate で grep 検出）。

### 0.8 用語

- **env binding**: Cloudflare Workers の `[vars]` / Secrets を Worker 実行時に `env` 引数として注入する仕組み。
- **`getCloudflareContext()`**: `@opennextjs/cloudflare` が提供する、Next.js App Router 内から Workers `env` にアクセスするためのアクセサ。
- **NEXT_PUBLIC_***: Next.js 規約で client bundle に焼き込まれる prefix。Workers 環境では `[vars]` 経由で注入し、build 時 fallback には依存しない。

---

## 1. ヘッダー

| 項目 | 値 |
|------|-----|
| 実装区分 | Platform（Cloudflare Workers ランタイム整備） |
| 推定工数 | 0.5 人日 |
| 直前依存 | task-01 scope-gate-all-screens（gate） |
| 直後依存 | task-09 tailwind-v4-setup, task-03 sentry-workers-sdk-unify（env 参照） |
| wave | W2（task-03/04/05/06/07/08 と並列実行可能。`apps/web/wrangler.toml` を最初に触るのは本タスク） |
| 並列可否 | wrangler.toml 編集競合に注意。task-03 と直列推奨（本 task 先行） |
| 関連 phase-3 行 | `outputs/phase-3/phase-3.md` 4.2 / §1.2 task-02 行 / §5 依存パッケージ |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. `apps/web/wrangler.toml` の env 別 `[vars]` に `NEXT_PUBLIC_API_BASE_URL` ほか実行時環境変数を **local / staging / production の 3 環境で完全注入**する。
2. ビルド時 fallback `127.0.0.1:8888` の焼き込みを完全に撲滅する（grep で 0 件であること）。
3. `apps/web/src/lib/env.ts` を新設し、**zod による env 検証**でランタイムにスキーマ違反を検出する。
4. `@opennextjs/cloudflare` のビルド時 env 取扱いを明示し、process.env に依存しない API 経由のアクセサを提供する。
5. `.dev.vars.example` を新設し、ローカル開発で必要な env キーを文書化する（実値は 1Password 参照）。

### 2.2 非ゴール

- Cloudflare secrets（`SENTRY_DSN`, `AUTH_SECRET`）の値そのものをリポジトリに記入すること（→ Cloudflare Secrets / 1Password に保管）。
- `apps/api` 側の wrangler.toml 変更（本タスクは `apps/web` のみ）。
- Sentry / logger の実装（task-03 / task-04）。
- 新 endpoint 追加（phase-1 §1.2）。

---

## 3. 変更対象ファイル表

| path | 種別 | 概要 |
|------|------|------|
| `apps/web/wrangler.toml` | M | `[vars]` `[env.staging.vars]` `[env.production.vars]` に env キーを整理。`NEXT_PUBLIC_API_BASE_URL` など public env を追加 |
| `apps/web/.dev.vars.example` | C | local 開発で必要な env キーの一覧（実値なし、`op://...` 参照例） |
| `apps/web/src/lib/env.ts` | C | zod 検証付き env アクセサ。`getEnv(ctx)` を提供 |
| `apps/web/src/lib/__tests__/env.test.ts` | C | env 検証ロジックの単体テスト |
| `apps/web/src/lib/api/public.ts` | R | task-11 で新設予定。本 task では参照のみ（`NEXT_PUBLIC_API_BASE_URL` を使う先） |
| `apps/web/next.config.ts` | M（最小） | `env` 公開キー（NEXT_PUBLIC_*）の許可リストを必要に応じ追記 |

> 注: `127.0.0.1:8888` 焼き込みが現存する場合は `apps/web/src/**` 全 grep し、対象ファイルを M として加算する。検出箇所は `pnpm --filter @repo/web exec rg '127\.0\.0\.1:8888'` で機械的に列挙する。

---

## 4. 環境別キー一覧

| key | local (.dev.vars) | staging | production | 公開区分 |
|-----|------------------|---------|------------|---------|
| `ENVIRONMENT` | `local` | `staging` | `production` | non-secret |
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8787` | `https://ubm-hyogo-api-staging.daishimanju.workers.dev` | `https://ubm-hyogo-api.daishimanju.workers.dev` | public（クライアント可視） |
| `PUBLIC_API_BASE_URL` | 同上 | 同上 | 同上 | non-secret（既存・SSR 用） |
| `INTERNAL_API_BASE_URL` | 同上 | 同上 | 同上 | non-secret（service binding fallback） |
| `AUTH_URL` | `http://127.0.0.1:3000` | `https://web-staging.example.com` | `https://web.example.com` | non-secret |
| `SENTRY_DSN` | `op://Personal/UBM Sentry Dev/dsn`（local のみ ENV 注入） | Cloudflare Secret | Cloudflare Secret | secret |
| `SENTRY_ENVIRONMENT` | `local` | `staging` | `production` | non-secret |
| `SENTRY_TRACES_SAMPLE_RATE` | `1.0` | `0.2` | `0.1` | non-secret |
| `AUTH_SECRET` | `op://...` | Cloudflare Secret | Cloudflare Secret | secret |

> `NEXT_PUBLIC_API_BASE_URL` は **client bundle に焼き込まれる** ため、ビルド時に decision する。`@opennextjs/cloudflare` のビルドはローカル `wrangler dev` 起動時 → `[vars]` から、`pnpm --filter @repo/web build` → 環境変数 / `.dev.vars` から取得する点を README に明記。

---

## 5. wrangler.toml 差分（具体例）

```toml
# apps/web/wrangler.toml （差分のみ抜粋）

[vars]
ENVIRONMENT = "production"
# NEXT_PUBLIC_* は build 時に bundler が解決する想定。Workers ランタイムからも参照可能とする。
NEXT_PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
SENTRY_ENVIRONMENT = "production"
SENTRY_TRACES_SAMPLE_RATE = "0.1"

[env.staging.vars]
ENVIRONMENT = "staging"
PUBLIC_API_BASE_URL = "https://ubm-hyogo-api-staging.daishimanju.workers.dev"
INTERNAL_API_BASE_URL = "https://ubm-hyogo-api-staging.daishimanju.workers.dev"
NEXT_PUBLIC_API_BASE_URL = "https://ubm-hyogo-api-staging.daishimanju.workers.dev"
SENTRY_ENVIRONMENT = "staging"
SENTRY_TRACES_SAMPLE_RATE = "0.2"

[env.production.vars]
ENVIRONMENT = "production"
PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
INTERNAL_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
NEXT_PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
SENTRY_ENVIRONMENT = "production"
SENTRY_TRACES_SAMPLE_RATE = "0.1"
```

> Cloudflare Secrets（`SENTRY_DSN` / `AUTH_SECRET`）は wrangler.toml に書かない。`bash scripts/cf.sh secret put SENTRY_DSN --config apps/web/wrangler.toml --env production` 等で投入し、ランタイム読み出しのみ行う。

---

## 6. `.dev.vars.example`

```ini
# apps/web/.dev.vars.example
# このファイルはコミットする。実値は書かない。
# 利用法: cp .dev.vars.example .dev.vars && op inject -i .dev.vars -o .dev.vars.local

ENVIRONMENT=local
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787
PUBLIC_API_BASE_URL=http://127.0.0.1:8787
INTERNAL_API_BASE_URL=http://127.0.0.1:8787
AUTH_URL=http://127.0.0.1:3000
SENTRY_ENVIRONMENT=local
SENTRY_TRACES_SAMPLE_RATE=1.0

# secret（op 参照）
SENTRY_DSN=op://Personal/UBM Sentry Dev/dsn
AUTH_SECRET=op://Personal/UBM Auth/secret
```

---

## 7. 関数 / 型シグネチャ

### 7.1 `apps/web/src/lib/env.ts`

```ts
import { z } from "zod";

/** Cloudflare Workers ランタイムから渡る env binding の正本スキーマ */
export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  PUBLIC_API_BASE_URL: z.string().url(),
  INTERNAL_API_BASE_URL: z.string().url(),
  AUTH_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1),
  AUTH_SECRET: z.string().min(16).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Cloudflare Workers / Next.js (RSC / Server Action / Edge / Node) いずれの
 * ランタイムでも安全に env を取得する。
 *
 * - Workers: `getCloudflareContext().env`
 * - Node (build / test): `process.env`
 *
 * @throws {z.ZodError} 必須キー欠落時
 */
export function getEnv(): Env {
  // Workers ランタイムなら getCloudflareContext を優先
  // それ以外（build / test / Node SSR）は process.env をフォールバック
  const raw = readRawEnv();
  return EnvSchema.parse(raw);
}

/** クライアント bundle に焼き込まれる public env 用ヘルパ（NEXT_PUBLIC_* のみ） */
export function getPublicEnv(): Pick<Env, "NEXT_PUBLIC_API_BASE_URL" | "ENVIRONMENT"> {
  return {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
    ENVIRONMENT: (process.env.ENVIRONMENT ?? "local") as Env["ENVIRONMENT"],
  };
}

function readRawEnv(): Record<string, unknown> {
  // OpenNext for Cloudflare では server-side で getCloudflareContext().env が利用可能
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext?.();
    if (ctx?.env) return ctx.env as Record<string, unknown>;
  } catch {
    /* fallthrough to process.env */
  }
  return process.env as Record<string, unknown>;
}
```

### 7.2 利用側（task-11 以降での想定）

```ts
import { getEnv } from "@/lib/env";

export async function listMembers() {
  const { NEXT_PUBLIC_API_BASE_URL } = getEnv();
  const res = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/public/members?limit=20`);
  if (!res.ok) throw new Error(`listMembers failed: ${res.status}`);
  return res.json();
}
```

---

## 8. 入力 / 出力 / 副作用

| 種別 | 内容 |
|------|------|
| 入力 | `wrangler.toml` の `[vars]`、Cloudflare Secrets、`.dev.vars`（local） |
| 出力 | `getEnv()` が型安全な `Env` オブジェクトを返す。違反時は ZodError throw |
| 副作用 | なし（read-only。logger は task-04 の責務） |
| 失敗時挙動 | Zod parse 失敗 → throw → `app/error.tsx`（task-05）が補足 |

---

## 9. テスト方針

### 9.1 追加テスト

| ファイル | ケース | 期待値 |
|---------|--------|--------|
| `apps/web/src/lib/__tests__/env.test.ts` | `getEnv` が必須キーを正しく解釈する | 各環境のキーを mock して `Env` 型に一致する |
| 同上 | `NEXT_PUBLIC_API_BASE_URL` が URL 形式でないと throw する | `ZodError` が発生 |
| 同上 | `SENTRY_TRACES_SAMPLE_RATE` が 0..1 範囲外で throw する | `ZodError` |
| 同上 | secret がないモードでも非 secret は parse 通る | `SENTRY_DSN` 欠落でもエラーなし |

### 9.2 Smoke

- `pnpm --filter @repo/web exec rg '127\.0\.0\.1:8888'` が 0 件
- `pnpm --filter @repo/web exec rg 'process\.env\.NEXT_PUBLIC_API_BASE_URL' --files-with-matches | wc -l` が `lib/env.ts` 以外で増えていない

---

## 10. ローカル実行・検証コマンド

```bash
# 依存解決
mise exec -- pnpm install

# .dev.vars 用意（実値は op 経由）
cp apps/web/.dev.vars.example apps/web/.dev.vars
op inject -i apps/web/.dev.vars -o apps/web/.dev.vars

# 型チェック / lint
mise exec -- pnpm --filter @repo/web exec tsc --noEmit
mise exec -- pnpm --filter @repo/web lint

# 単体テスト
mise exec -- pnpm --filter @repo/web test src/lib/__tests__/env.test.ts

# wrangler dev で env 注入確認
bash scripts/cf.sh dev --config apps/web/wrangler.toml

# build 通過確認（OpenNext for Cloudflare）
mise exec -- pnpm --filter @repo/web build

# staging deploy（dry-run）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
```

---

## 11. DoD

- [ ] `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に §4 のキーが揃っている
- [ ] `apps/web/.dev.vars.example` が存在し、実値を含まない
- [ ] `apps/web/src/lib/env.ts` が存在し、`getEnv()` が zod 検証で型安全な値を返す
- [ ] `pnpm --filter @repo/web exec rg '127\.0\.0\.1:8888'` の検出件数が 0
- [ ] `pnpm --filter @repo/web exec tsc --noEmit` が通過
- [ ] `pnpm --filter @repo/web build` が通過
- [ ] `pnpm --filter @repo/web test src/lib/__tests__/env.test.ts` が全 pass
- [ ] staging deploy（dry-run）でエラーが出ない
- [ ] Cloudflare Secrets（`SENTRY_DSN` / `AUTH_SECRET`）の値が **wrangler.toml に書かれていない**ことを `rg 'oklch|sk-|whsec_'` で機械確認

---

## 12. リスクと緩和

| リスク | 影響 | 緩和 |
|--------|------|------|
| `NEXT_PUBLIC_*` の build 時固定でローカル切替が効かない | local 開発体験悪化 | `.dev.vars` を使い `wrangler dev` 経由で起動する手順を README 化 |
| `getCloudflareContext` が edge / node ランタイムで未定義 | runtime error | `try/catch` でフォールバック、process.env を最終 fallback として保持 |
| Cloudflare Secrets 投入忘れ | 本番 SENTRY_DSN 欠落 | task-03 の DoD で deploy 前 `wrangler secret list` を確認 |


---

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/<dir>/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する
