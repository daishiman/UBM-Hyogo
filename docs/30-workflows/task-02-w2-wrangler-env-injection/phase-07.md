# Phase 7: AC マトリクス

実装区分: 実装仕様書（CONST_004 デフォルト適用 — `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` 整理 / `apps/web/.dev.vars.example` 新規 / `apps/web/src/lib/env.ts` 新規 / `apps/web/src/lib/__tests__/env.test.ts` 新規 / `apps/web/next.config.ts` 最小修正を伴う）

## 7.1 目的

元タスク §11 DoD と §9 テスト方針から導出した Acceptance Criteria（AC-1〜AC-11）を、test ケース・不変条件・evidence の N:M トレース表として固定する。Phase 9 の品質保証実行で、本マトリクスの全行を機械検証可能な状態に保つ。

## 7.2 AC 一覧

| AC# | 内容 | 由来 |
|-----|------|------|
| AC-1 | `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に §4 環境別キー一覧の全キーが揃っている | §11 DoD 1 行目 / §4 表 |
| AC-2 | `apps/web/.dev.vars.example` が存在し、実値を含まず `op://...` 参照のみで構成されている | §11 DoD 2 行目 / §6 |
| AC-3 | `apps/web/src/lib/env.ts` が `getEnv()` を export し、zod 検証で型安全な `Env` を返す（不正値で `ZodError` throw） | §11 DoD 3 行目 / §7.1 |
| AC-4 | `apps/web/src` 配下で `127.0.0.1:8888` の焼き込みが grep 0 件 | §11 DoD 4 行目 / §9.2 |
| AC-5 | `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` および `pnpm --filter @ubm-hyogo/web build` が PASS | §11 DoD 5,6 行目 |
| AC-6 | `pnpm --filter @ubm-hyogo/web test src/lib/__tests__/env.test.ts` が全 pass（§9.1 のケース 4 件 + Phase 6 異常系 8 件） | §11 DoD 7 行目 / §9.1 |
| AC-7 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` が成功 | §11 DoD 8 行目 / §10 |
| AC-8 | Cloudflare Secrets（`SENTRY_DSN_WEB` / `AUTH_SECRET`）の値が wrangler.toml に直書きされていない（`rg 'oklch\|sk-\|whsec_'` で 0 件） | §11 DoD 9 行目 |
| AC-9 | `SENTRY_DSN_WEB` / `AUTH_SECRET` の実値直書きが 0 件 | index.md AC-9 |
| AC-10 | D1 binding 名・直接接続情報を `apps/web` 側 env キーに含めない | index.md AC-10 |
| AC-11 | `next.config.ts` は既存 `env` field がない場合は変更せず、build gate で担保 | index.md AC-11 |

## 7.3 N:M トレース表（AC × test × 不変条件 × evidence）

| AC# | 検証手段 | 検証ファイル / コマンド | 関連不変条件（§0.5） | 関連失敗ケース（Phase 6） | evidence 出力先 |
|-----|----------|------------------------|---------------------|--------------------------|----------------|
| AC-1 | `rg '^NEXT_PUBLIC_API_BASE_URL' apps/web/wrangler.toml` で 3 環境分（[vars] + staging + production）の hit | `apps/web/wrangler.toml` | #5 NEXT_PUBLIC_* は public 値のみ | F-08 | `outputs/phase-09/wrangler-vars.txt` |
| AC-2 | `test -f apps/web/.dev.vars.example` + `rg -v 'op://' apps/web/.dev.vars.example` で実値混入 0 行 | `apps/web/.dev.vars.example` | #2 平文 .env 禁止 | — | `outputs/phase-09/dev-vars-example.txt` |
| AC-3 | `pnpm --filter @ubm-hyogo/web test src/lib/__tests__/env.test.ts` 内の正常系 + ZodError throw ケース全 PASS | `apps/web/src/lib/env.ts` / `env.test.ts` | #1, #3 | F-01, F-04, F-05, F-06, F-12 | `outputs/phase-09/env-test.log` |
| AC-4 | `rg '127\.0\.0\.1:8888' apps/web/src` の終了コード 1（マッチなし） | apps/web/src 全域 | — | F-09 | `outputs/phase-09/grep-localhost-8888.txt` |
| AC-5 | `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` と `pnpm --filter @ubm-hyogo/web build` の終了コード 0 | tsconfig / next.config.ts | — | F-08 | `outputs/phase-09/typecheck.log` / `outputs/phase-09/build.log` |
| AC-6 | env.test.ts の test runner 出力が全 PASS、Phase 6 F-01〜F-07/F-12 のケースが含まれる | `env.test.ts` | — | F-01〜F-07, F-12 | `outputs/phase-09/env-test.log` |
| AC-7 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` の終了コード 0 | `wrangler.toml` / `scripts/cf.sh` | #4 cf.sh 経由のみ | F-08（dry-run では検出されないが build で検出） | `outputs/phase-09/staging-dry-run.log` |
| AC-8 | `rg 'oklch\|sk-\|whsec_' apps/web/wrangler.toml` の終了コード 1（マッチなし） + `rg 'SENTRY_DSN_WEB\s*=\s*"https' apps/web/wrangler.toml` 0 件 | `apps/web/wrangler.toml` | #2 平文秘密禁止、#5 secret は Cloudflare Secrets | F-11 | `outputs/phase-09/grep-secret-leak.txt` |

## 7.4 test ケースと AC の対応（逆引き）

| test ケース（env.test.ts） | 主要 AC | 補助 AC |
|---------------------------|---------|---------|
| `getEnv() が全必須キーを正しく解釈する` | AC-3 | AC-6 |
| `NEXT_PUBLIC_API_BASE_URL が URL 形式でないと throw する` | AC-3 | AC-6 |
| `SENTRY_TRACES_SAMPLE_RATE が 0..1 範囲外で throw する` | AC-3 | AC-6 |
| `secret 欠落でも非 secret は parse 通る` | AC-3 | AC-6 |
| `getCloudflareContext 未定義時に process.env フォールバックする` | AC-3 | AC-6 |
| `ENVIRONMENT enum 違反で throw する` | AC-3 | AC-6 |
| `process.env 完全欠落で複数 issues を含む ZodError を throw` | AC-3 | AC-6 |
| `AUTH_SECRET 短すぎで throw` | AC-3 | AC-6 |

## 7.5 不変条件マトリクス

| 不変条件 | 関連 AC |
|---------|---------|
| #1 form schema 固定しすぎない | AC-3（env キー名で form schema を表現しない） |
| #2 平文 `.env` 禁止 | AC-2, AC-8 |
| #3 GAS prototype を本番昇格しない | AC-1（env キー名選定で GAS 仕様を引きずらない） |
| #4 Cloudflare CLI は cf.sh 経由 | AC-7 |
| #5 NEXT_PUBLIC_* は public 値のみ / secret は Cloudflare Secrets | AC-1, AC-8 |

## 7.6 GO/NO-GO 判定

Phase 10 最終レビューでは AC-1〜AC-11 全行が PASS でなければ NO-GO。1 件でも fail がある場合、Phase 9 の自動修復ループに差し戻す。
