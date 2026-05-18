# Phase 10: 実行コマンド / Local & CI

## 10.1 ローカル実行コマンド一覧

> `package.json` の root scripts を正本コマンドとする。focused Vitest は `--filter` + package-relative path では root config と噛み合わず test discovery に失敗するため、CI と同じ root path script に固定する。

```bash
# 0. Node / pnpm 整合
mise install
mise exec -- pnpm install --frozen-lockfile

# 1. 3 verify を個別実行
mise exec -- pnpm verify:node-arch
mise exec -- pnpm verify:worktree-isolation
mise exec -- pnpm verify:esbuild

# 2. 集約コマンド
mise exec -- pnpm verify:vitest-runtime

# 3. focused Vitest 2 spec
mise exec -- pnpm test:parallel09-primitives
mise exec -- pnpm test:parallel09-use-admin-mutation

# 4. 型 / Lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 5. lefthook 動作確認（実 push しない）
lefthook run pre-push
```

## 10.2 CI 起動条件

- `.github/workflows/verify-esbuild.yml` を含む PR
- target branch: `dev` or `main`
- matrix `ubuntu-latest` / `macos-14` の両 job 緑

## 10.3 失敗時のリトライ手順（runbook §3 escalation）

1. `mise exec -- pnpm install --force`
2. `mise exec -- pnpm rebuild esbuild`
3. `mise exec -- pnpm dedupe`
4. `rm -rf node_modules && mise exec -- pnpm install --frozen-lockfile`
5. `rm -rf node_modules apps/*/node_modules packages/**/node_modules && pnpm store prune && mise exec -- pnpm install --frozen-lockfile`

各段階終了後に `pnpm verify:vitest-runtime` で再評価。

## 10.4 完了条件（Phase 10）

- 10.1 の全 12 コマンドが 1 サイクル内で順番に実行できる
- 10.3 の escalation が runbook と一致
- `package.json` に存在しない script 名を evidence PASS として扱わない。focused Vitest は root script (`test:parallel09-*`) と CI workflow の同一契約で実測を Phase 11 に保存する
