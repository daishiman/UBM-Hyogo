# Runbook — Issue #747 Vitest esbuild arch & worktree isolation

> Refs #747 / canonical workflow: `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/`

## 1. 症状

focused Vitest spec の起動時に次のような abort が発生する:

```
Error: Expected "X.Y.Z" but got "A.B.C" / version mismatch between host and binary
```

または Vitest が config load 直後に exit 1 で停止する。

## 2. 原因（3 層複合）

| 層 | 内容 |
| --- | --- |
| (a) Node arch mismatch | Apple Silicon Mac で `mise` install された Node が **Rosetta 2 経由の x64** で動作（`process.arch === 'x64'`） |
| (b) Worktree node_modules 漏れ込み | worktree 配下 `node_modules/@esbuild/` に必要 arch が無く、親リポジトリ `node_modules/@esbuild/` に Node module resolution が遡る |
| (c) 親リポジトリの esbuild version drift | 親側 `@esbuild/<arch>` が worktree host esbuild と version 不一致 |

3 つが**同時に揃わない限り再現しない**。本タスクの verify scripts は各層を独立に検出する。

## 3. 復旧 escalation 1〜5

各 step 終了後に `pnpm verify:vitest-runtime` で再評価する。

1. `mise exec -- pnpm install --force` — lockfile を信頼して優しく再 install
2. `mise exec -- pnpm rebuild esbuild` — host のみ rebuild
3. `mise exec -- pnpm dedupe` — store の重複を解消
4. `rm -rf node_modules && mise exec -- pnpm install --frozen-lockfile` — worktree 全消し再生成
5. `rm -rf node_modules apps/*/node_modules packages/**/node_modules && pnpm store prune && mise exec -- pnpm install --frozen-lockfile`
   — pnpm store 含むフルクリーン（最終手段）

> 親リポジトリ root の `node_modules` クリーンアップは `cd ../.. && rm -rf node_modules` で行う。
> **ユーザー判断**で実行する。他 worktree も同時に install が必要になる。

## 4. Rosetta 2 / arch 検知の確認手順

```bash
# 1. shell が arm64 か x64 で動いているか
arch                        # → arm64 が正
uname -m                    # → arm64 が正

# 2. Node が arm64 native か
node -e "console.log(process.arch)"   # → arm64 が正

# 3. mise が install した Node 実体
file "$(mise which node)"   # → "Mach-O 64-bit executable arm64" が正
```

x64 になっている場合、Terminal.app / iTerm の「Rosetta を使用して開く」が ON になっている可能性。
OFF にした後 `mise install --force` で Node を再 install する。

## 5. `ESBUILD_BINARY_PATH` 干渉対策

`scripts/cf.sh` は Cloudflare deploy 時に **global esbuild とのバージョン解決**のため
`ESBUILD_BINARY_PATH` をセットする。**Vitest 実行 shell では unset する**:

```bash
# 干渉していないかチェック
echo "${ESBUILD_BINARY_PATH:-<unset>}"

# 干渉している場合、Vitest 実行前に unset
unset ESBUILD_BINARY_PATH
pnpm verify:esbuild
```

`scripts/cf.sh` は `op run` の sub-shell に閉じて env を渡すため、通常の開発 shell には漏れない。
意図的に export している場合のみ干渉する。

## 6. 再発防止 — verify gate 一覧

| gate | 場所 | 検出層 |
| --- | --- | --- |
| `pnpm verify:node-arch` | local / lefthook pre-push / CI | (a) |
| `pnpm verify:worktree-isolation` | local / lefthook pre-push / CI | (b) |
| `pnpm verify:esbuild` | local / lefthook pre-push / CI | (c) |
| `pnpm verify:vitest-runtime` | 上記 3 つの集約 | (a)+(b)+(c) |
| `.mise.toml` postinstall hook | `mise install` 後の best-effort 通知 | (a) |
| `.github/workflows/verify-esbuild.yml` | PR / push to dev,main | (a)+(b)+(c) + focused Vitest 2 spec |

## 7. 関連参照

- `scripts/verify-node-arch.mjs`
- `scripts/verify-worktree-node-modules-isolation.mjs`
- `scripts/verify-esbuild-version.mjs`
- `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx`
- `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx`
- `docs/30-workflows/unassigned-task/parallel-09-followup-002-vitest-esbuild-version-alignment.md`（consumed trace）
