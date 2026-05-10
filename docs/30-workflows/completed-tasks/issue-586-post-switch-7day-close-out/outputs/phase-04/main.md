# Phase 4 — 環境準備 / 前提条件確認

## Gate-RUNTIME-CLASSIFIER-SET 実施記録

```
$ gh api -X POST repos/daishiman/UBM-Hyogo/environments/production/variables \
    -f name=CF_AUDIT_CLASSIFIER -f value=ml
{}
$ gh api repos/daishiman/UBM-Hyogo/environments/production/variables
{"variables":[{"name":"CF_AUDIT_CLASSIFIER","value":"ml","created_at":"2026-05-09T13:08:39Z","updated_at":"2026-05-09T13:08:39Z"}],"total_count":1}
```

`production` environment scope に `CF_AUDIT_CLASSIFIER=ml` が存在することを確認。Gate-RUNTIME-CLASSIFIER-SET 通過。

## D1 schema diff

`apps/api/migrations/` の差分: 0（forward-safe で D1 列追加なし）。

## ローカル開発環境

- Node 24.15.0 / pnpm 10.33.2（mise）
- esbuild root 0.27.3 と darwin-arm64 binary の version 不整合あり: `ESBUILD_BINARY_PATH=node_modules/esbuild/node_modules/@esbuild/darwin-arm64/bin/esbuild` で解決
- ディスク余量: 117〜193 MiB（critical pressure）— `pnpm install --force` / production build は本サイクルでスキップし、focused test と typecheck/lint のみで evidence 化
