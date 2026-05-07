# Phase 04 — テスト戦略

実装区分: 実装仕様書（CONST_004 デフォルト適用）

## 1. test matrix

### 1.1 unit test (`apps/web/src/lib/__tests__/env.test.ts`)

| # | ケース | 入力 | 期待値 | 関連 AC |
| --- | --- | --- | --- | --- |
| UT-1 | 必須キー揃った env を parse | `ENVIRONMENT=local`, `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787`, ... 全必須キー | `Env` 型に一致、no throw | AC-3, AC-4 |
| UT-2 | URL 形式違反 | `NEXT_PUBLIC_API_BASE_URL=not-a-url` | `ZodError` throw | AC-3 |
| UT-3 | `SENTRY_TRACES_SAMPLE_RATE` 範囲違反 | `SENTRY_TRACES_SAMPLE_RATE=1.5` | `ZodError` throw | AC-3 |
| UT-4 | optional secret 欠落許容 | `SENTRY_DSN_WEB` / `AUTH_SECRET` 未設定 | parse 通過、`Env.SENTRY_DSN_WEB === undefined` | AC-3, AC-4 |
| UT-5 | `ENVIRONMENT` enum 違反 | `ENVIRONMENT=qa` | `ZodError` throw | AC-3 |
| UT-6 | `getPublicEnv()` が NEXT_PUBLIC_* subset を返す | `NEXT_PUBLIC_API_BASE_URL` / `ENVIRONMENT` のみセット | subset shape を返す | AC-3 |
| UT-7 | Workers context 優先 | `getCloudflareContext` が `env` を返すモック | `process.env` ではなく Workers env 値を採用 | AC-4 |
| UT-8 | Workers context 未定義時 process.env フォールバック | `getCloudflareContext` が throw | `process.env` から parse | AC-4 |

### 1.2 grep-based smoke gate（CI / Phase 9 / Phase 11）

| # | コマンド | 期待値 | 関連 AC |
| --- | --- | --- | --- |
| SM-1 | `pnpm --filter @ubm-hyogo/web exec rg '127\.0\.0\.1:8888'` | 0 件 | AC-5 |
| SM-2 | `pnpm --filter @ubm-hyogo/web exec rg 'process\.env\.NEXT_PUBLIC_API_BASE_URL'` excluding `src/lib/env.ts` | 0 件 | AC-6 |
| SM-3 | `rg 'SENTRY_DSN_WEB\s*=\s*"http' apps/web/wrangler.toml` | 0 件 | AC-9 |
| SM-4 | `rg 'AUTH_SECRET\s*=\s*"' apps/web/wrangler.toml` | 0 件 | AC-9 |
| SM-5 | `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` | exit 0 | AC-8 |
| SM-6 | `pnpm --filter @ubm-hyogo/web lint` | exit 0 | AC-8 |
| SM-7 | `pnpm --filter @ubm-hyogo/web build` | exit 0 | AC-8 |
| SM-8 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | exit 0 | AC-8 |

### 1.3 build 出力検査（Phase 11）

| # | 検証 | 期待値 |
| --- | --- | --- |
| BO-1 | build 後の `.open-next/` または `.next/standalone/` 内に `127.0.0.1:8888` が含まれない | 0 件 |
| BO-2 | client bundle 内に `NEXT_PUBLIC_API_BASE_URL` の値が environment 通り焼き込まれる | environment 値と一致 |

## 2. AC × test mapping

| AC | UT | SM | BO |
| --- | --- | --- | --- |
| AC-1 (3 環境キー揃い) | — | SM-7, SM-8 | — |
| AC-2 (.dev.vars.example) | — | grep で実値含まずを確認 | — |
| AC-3 (zod schema) | UT-1〜6 | — | — |
| AC-4 (runtime fallback) | UT-7, UT-8 | — | — |
| AC-5 (127.0.0.1:8888 0 件) | — | SM-1 | BO-1 |
| AC-6 (process.env 直接参照禁止) | — | SM-2 | — |
| AC-7 (env.test.ts 4+ ケース) | UT-1〜8 | — | — |
| AC-8 (typecheck/lint/build/staging dry-run) | — | SM-5, 6, 7, 8 | — |
| AC-9 (secret 値が wrangler.toml になし) | — | SM-3, SM-4 | — |
| AC-10 (D1 binding 名漏洩なし) | — | env キー一覧目視 | — |
| AC-11 (next.config.ts 最小編集) | — | diff 目視 + SM-7 | BO-2 |

## 3. test 実行コマンド一覧

```bash
# unit
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/env.test.ts

# typecheck / lint / build
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web build

# grep gate
pnpm --filter @ubm-hyogo/web exec rg '127\.0\.0\.1:8888'
pnpm --filter @ubm-hyogo/web exec rg 'process\.env\.NEXT_PUBLIC_API_BASE_URL' --files-with-matches | grep -v 'src/lib/env\.ts'
rg 'SENTRY_DSN_WEB\s*=\s*"http' apps/web/wrangler.toml
rg 'AUTH_SECRET\s*=\s*"' apps/web/wrangler.toml

# staging dry-run
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
```

## 4. 失敗時の切り分け

| 失敗パターン | 原因候補 | アクション |
| --- | --- | --- |
| UT-1 失敗 | zod schema が必須キー誤定義 | env.ts の `EnvSchema` を見直し |
| UT-7 失敗（fallback が Workers より優先される） | `readRawEnv` の優先順位ミス | `getCloudflareContext` 優先のロジック修正 |
| SM-1 検出あり | 既存コードに焼き込み残存 | `getEnv()` 経由に書き換え（phase-05 step 6） |
| SM-2 検出あり（env.ts 以外） | 直接参照箇所が残存 | 該当ファイルを `getEnv()` 経由に移行 |
| SM-7 失敗 | next.config.ts の env 公開キー不足 / 型不整合 | `NEXT_PUBLIC_*` 許可リスト調整 |
| SM-8 失敗 | wrangler.toml の構文エラー / Cloudflare Secrets 未投入 | `bash scripts/cf.sh secret list --env staging` で確認 |

## 5. coverage 方針

`apps/web/src/lib/env.ts` の line coverage 95%+ を目標とする（`getEnv` / `getPublicEnv` / `readRawEnv` 全分岐）。`SENTRY_TRACES_SAMPLE_RATE` の `z.coerce.number()` 経路は string / number 両方の入力で検証する。
