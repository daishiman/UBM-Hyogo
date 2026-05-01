# Phase 11 成果物 — 手動 smoke / 実測 evidence

## 状態
- 実行済（2026-05-01）
- visualEvidence: NON_VISUAL（CLI / log artifact）

## 1. esbuild bundle 検査（AC-1 / AC-4）

### コマンド

```bash
mise exec -- npx esbuild --bundle apps/api/src/index.ts \
  --platform=neutral --format=esm \
  '--external:cloudflare:*' '--external:node:*' \
  --outfile=/tmp/api-bundle.js --metafile=/tmp/api-meta.json \
  --tsconfig=apps/api/tsconfig.build.json
```

### 出力

```
  ../../../../../../../../tmp/api-bundle.js  792.9kb

⚡ Done in 97ms
```

### bundle 内容確認

```bash
grep -c "__fixtures__\|__tests__\|miniflare" /tmp/api-bundle.js
# → 0
```

→ AC-1 PASS（bundle 内に test / fixture / miniflare 由来文字列は存在しない）。

> 注: `wrangler deploy --dry-run` も同等の evidence を生成できるが、本ローカル環境では
> wrangler 同梱 esbuild とグローバル esbuild のバージョン不整合により `--outdir` 指定の
> dry-run が exit 144 で停止した（CLAUDE.md の `scripts/cf.sh` ラッパーは本 worktree 未配置）。
> 本 follow-up の AC-1 / AC-4 は esbuild 直接 bundle で代替 evidence を確保（wrangler の
> 内部 bundler は esbuild なので bundle 内訳の判定基準は同一）。

## 2. build から exclude する source 量（AC-4 補強）

```
$ find apps/api/src -type f \( -path "*/__tests__/*" -o -path "*/__fixtures__/*" -o -name "*.test.ts" \) | xargs wc -c | tail -1
  344831 total

$ find apps/api/src -type f -name "*.ts" | xargs wc -c | tail -1
  722356 total
```

→ apps/api/src 全体の TypeScript source 722,356 B のうち、tsconfig.build.json で
exclude される test/fixture source は 344,831 B（47.7%）/ 90 ファイル。

これらは production typecheck（`pnpm build`）の対象外となり、tsconfig.build.json の
`exclude` パターンと dep-cruiser `no-prod-to-fixtures-or-tests` rule によって runtime
bundle にも構造的に流入しない。

## 3. dep-cruiser smoke（AC-3）

### 通常実行

```
✔ no dependency violations found (438 modules, 723 dependencies cruised)
```

### 合成違反テスト

`apps/api/src/__violation_test.ts` 一時投入後:

```
  error no-prod-to-fixtures-or-tests: apps/api/src/__violation_test.ts → ./repository/__fixtures__/admin.fixture
x 1 dependency violations (1 errors, 0 warnings). 440 modules, 724 dependencies cruised.
```

→ AC-3 PASS（rule が想定通り発火）。違反ファイル削除後は再び 0 violations。

## 4. typecheck（AC-2 補強）

```
$ mise exec -- pnpm --filter @ubm-hyogo/api typecheck
> tsc -p tsconfig.json --noEmit
（exit 0）

$ mise exec -- pnpm --filter @ubm-hyogo/api build
> tsc -p tsconfig.build.json --noEmit
（exit 0）
```

→ test/fixture を含めた typecheck と production typecheck の双方が PASS。
