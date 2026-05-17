# Phase 5 — 環境準備

## 1. 前提環境

| 項目 | 値 |
| --- | --- |
| Node | 24.15.0（`.mise.toml` 固定） |
| pnpm | 10.33.2（`.mise.toml` 固定） |
| OS | macOS / Linux（CI: ubuntu-latest） |
| 実行ラッパー | `mise exec --` 経由を必須 |

## 2. セットアップ手順

```bash
mise install
mise exec -- pnpm install
```

## 3. ローカル動作確認用コマンド

```bash
# 既存 fixture の sanity check（編集前のベースライン取得）
mise exec -- pnpm test scripts/__tests__/verify-phase12-compliance.spec.ts

# typecheck / lint のベースライン
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 4. 必要ツール / 権限

- 追加の secret は無し
- Cloudflare CLI 不要
- 1Password 参照不要

## 5. リスク / 注意点

- `pnpm install` でワークツリー固有の `node_modules` が再生成される。複数ワークツリー並列時はそれぞれで実行する
- `verify:phase12-compliance` は git diff base ref を `origin/dev` に依存するため、`git fetch origin dev` を事前実行する
