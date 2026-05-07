# Phase 9: 品質保証

実装区分: 実装仕様書（CONST_004 デフォルト適用 — `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` 整理 / `apps/web/.dev.vars.example` 新規 / `apps/web/src/lib/env.ts` 新規 / `apps/web/src/lib/__tests__/env.test.ts` 新規 / `apps/web/next.config.ts` 最小修正を伴う）

## 9.1 目的

Phase 1〜8 で確定した実装方針 / AC マトリクス / DRY 集約原則 / 異常系カバレッジを、機械実行可能なコマンド列として固定する。実行結果は `outputs/phase-09/` 配下に evidence として保存し、Phase 10 最終レビューで GO/NO-GO 判定の入力に使う。

## 9.2 実行コマンド一覧

実行は worktree ルート（`/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-161844-wt-7/`）から行う。

### 9.2.1 依存解決

```bash
mise exec -- pnpm install
```

期待: 終了コード 0、`prepare` script で `lefthook install` も成功。

### 9.2.2 型チェック

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit \
  | tee outputs/phase-09/typecheck.log
```

期待: 終了コード 0。`getEnv()` / `EnvSchema` / `Env` 型の export 整合。

### 9.2.3 lint

```bash
mise exec -- pnpm --filter @ubm-hyogo/web lint \
  | tee outputs/phase-09/lint.log
```

期待: 終了コード 0。

### 9.2.4 単体テスト（env.test.ts）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/env.test.ts \
  | tee outputs/phase-09/env-test.log
```

期待: §9.1（元タスク）の 4 ケース + Phase 6 異常系 F-01〜F-07/F-12 が全 PASS。test ケース総数 ≥ 8。

### 9.2.5 build（OpenNext for Cloudflare）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build \
  | tee outputs/phase-09/build.log
```

期待: 終了コード 0。NEXT_PUBLIC_* の build 時解決が `[vars]` / `.dev.vars` 経路で成功。

### 9.2.6 staging deploy dry-run

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run \
  | tee outputs/phase-09/staging-dry-run.log
```

期待: 終了コード 0。wrangler.toml の `[env.staging.vars]` が valid TOML として parse され、bundle 生成段階までエラーなし。

### 9.2.7 grep ゲート（127.0.0.1:8888 焼き込み）

```bash
rg '127\.0\.0\.1:8888' apps/web/src \
  > outputs/phase-09/grep-localhost-8888.txt \
  && { echo "UNEXPECTED_HIT" >> outputs/phase-09/grep-localhost-8888.txt; exit 1; } \
  || echo "GREP_ZERO_HITS" >> outputs/phase-09/grep-localhost-8888.txt
```

期待: `rg` 終了コード 1（hit なし）。`test $? -ne 0` が true の場合に gate PASS。

### 9.2.8 grep ゲート（process.env.NEXT_PUBLIC_API_BASE_URL 直参照）

```bash
rg 'process\.env\.NEXT_PUBLIC_API_BASE_URL' apps/web/src --files-with-matches \
  | tee outputs/phase-09/grep-process-env-public.txt
```

期待: 出力が `apps/web/src/lib/env.ts` の 1 行のみ。それ以外の hit があれば Phase 8 DRY 違反として fail。

### 9.2.9 grep ゲート（Cloudflare Secrets 直書き検出）

```bash
rg 'SENTRY_DSN_WEB\s*=\s*"https|AUTH_SECRET\s*=\s*"|sk-|whsec_' apps/web/wrangler.toml \
  > outputs/phase-09/grep-secret-leak.txt \
  && { echo "UNEXPECTED_SECRET_HIT" >> outputs/phase-09/grep-secret-leak.txt; exit 1; } \
  || echo "SECRET_GREP_ZERO_HITS" >> outputs/phase-09/grep-secret-leak.txt
```

期待: `rg` 終了コード 1（hit なし）。`SENTRY_DSN_WEB` の URL 値直書き等を別途確認するため以下も併用。

```bash
rg 'SENTRY_DSN_WEB|AUTH_SECRET' apps/web/wrangler.toml \
  >> outputs/phase-09/grep-secret-leak.txt \
  && { echo "SECRET_KEY_SHOULD_NOT_BE_IN_TOML" >> outputs/phase-09/grep-secret-leak.txt; exit 1; } \
  || echo "SECRET_KEYS_ABSENT_FROM_TOML" >> outputs/phase-09/grep-secret-leak.txt
```

### 9.2.10 wrangler.toml の env キー存在確認

```bash
rg '^NEXT_PUBLIC_API_BASE_URL' apps/web/wrangler.toml \
  | tee outputs/phase-09/wrangler-vars.txt
```

期待: 3 行（`[vars]` / `[env.staging.vars]` / `[env.production.vars]` 各 1 行）。

### 9.2.11 .dev.vars.example の実値混入チェック

```bash
test -f apps/web/.dev.vars.example \
  && rg -v '^(#|\s*$|[A-Z_]+=op://|[A-Z_]+=(local|staging|production|http://127\.0\.0\.1|1\.0))' apps/web/.dev.vars.example \
  | tee outputs/phase-09/dev-vars-example.txt
```

期待: 出力が空（実値混入 0 行）。

## 9.3 coverage 確認

env.test.ts の line / branch coverage は Phase 6 異常系を網羅した結果として 90% 以上を期待する。`pnpm --filter @ubm-hyogo/web test --coverage src/lib/__tests__/env.test.ts` を任意で実行し、結果を `outputs/phase-09/coverage.txt` に保存（必須ではないが推奨）。

## 9.4 regression check（task-01 scope-gate との整合）

task-01 で確定した 19 routes scope の枠外に env 由来の breakage が出ていないことを以下で確認する。

```bash
# task-01 が定義した scope-gate 出力との突合
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \
  | rg -E 'Failed to compile|Module not found|TypeError' \
  | tee outputs/phase-09/regression-check.txt; \
  test $? -ne 0
```

期待: build 出力中に compile fail / module not found / runtime TypeError が含まれない。

## 9.5 自動修復ループ

§CLAUDE.md「品質検証失敗時の自動修復」に従い、以下の最大 3 回ループを許容する。

1. `pnpm install --force` 失敗 → lockfile 再生成 → 再実行
2. `pnpm typecheck` 失敗 → unused import / 型注釈 / export-import 不整合の最小差分修正 → 再実行
3. `pnpm lint` 失敗 → `pnpm lint --fix` → 残違反のみ手修正 → 再実行

3 回で復旧しない場合は Phase 10 最終レビューで NO-GO 判定し、上流フェーズに差し戻す。

## 9.6 evidence 出力先

すべての実行ログ / grep 出力は以下に固定する。

```
outputs/phase-09/
├── typecheck.log
├── lint.log
├── env-test.log
├── build.log
├── staging-dry-run.log
├── grep-localhost-8888.txt
├── grep-process-env-public.txt
├── grep-secret-leak.txt
├── wrangler-vars.txt
├── dev-vars-example.txt
├── regression-check.txt
└── coverage.txt（任意）
```

## 9.7 次フェーズへの引き渡し

Phase 10 最終レビューでは、本フェーズで生成した evidence 群と Phase 7 AC マトリクスを突合し、AC-1〜AC-11 全行 PASS を GO 条件として判定する。
