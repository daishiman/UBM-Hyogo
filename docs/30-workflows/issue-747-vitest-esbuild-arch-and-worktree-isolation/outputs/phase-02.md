# Phase 2: スコープ確定 / 影響範囲

## 2.1 変更対象ファイル

| ファイル | 変更種別 | 役割 |
| --- | --- | --- |
| `scripts/verify-node-arch.mjs` | 新規 | `process.arch === 'arm64'` を Apple Silicon host で強制（Linux CI runner は無効化） |
| `scripts/verify-worktree-node-modules-isolation.mjs` | 新規 | `require.resolve('@esbuild/<arch>/bin/esbuild')` が `process.cwd()` 配下にあることを assert |
| `scripts/verify-esbuild-version.mjs` | 新規 | host / binary / `pnpm-lock.yaml` の 3 者一致を assert |
| `.mise.toml` | 編集 | `[tools]` の `node` に arch hint を追加。`node = { version = "24.15.0", arch = "arm64" }` 形式 or post-install verify hook |
| `lefthook.yml` | 編集 | `pre-push` に `verify-esbuild` group を追加（3 verify を直列実行） |
| `.github/workflows/verify-esbuild.yml` | 新規 | PR / push gate。ubuntu-latest と macos-14 (arm64) の matrix で 3 verify を実行 |
| `package.json` | 編集 | `scripts` に `verify:esbuild` / `verify:node-arch` / `verify:worktree-isolation` を追加 |
| `docs/30-workflows/issue-747-.../runbook.md` | 新規 | escalation 1〜5 / Rosetta 2 検知 / `ESBUILD_BINARY_PATH` 干渉対策 |
| `CLAUDE.md` | 編集（最小） | runbook 参照 1 行追記のみ（既存方針には触れない） |
| `docs/30-workflows/unassigned-task/parallel-09-followup-002-...md` | 編集 | frontmatter `status: consumed` + `canonical_workflow:` pointer を追加（物理削除しない） |

## 2.2 影響を受けない領域

- `apps/web/src/**` のアプリケーションコード
- `apps/api/src/**`
- `pnpm-lock.yaml` の esbuild バージョン（0.27.3 を固定維持）
- `scripts/cf.sh` の `ESBUILD_BINARY_PATH` 設定ロジック（runbook で運用注意のみ追加）

## 2.3 検証マトリクス

| 検証項目 | コマンド | 期待 exit |
| --- | --- | --- |
| Node arch | `pnpm verify:node-arch` | 0（arm64 host）/ 0（Linux CI runner は skip） |
| Worktree isolation | `pnpm verify:worktree-isolation` | 0 |
| esbuild version | `pnpm verify:esbuild` | 0 |
| focused Vitest A | `pnpm test:parallel09-primitives` | 0 |
| focused Vitest B | `pnpm test:parallel09-use-admin-mutation` | 0 |
| Typecheck | `pnpm typecheck` | 0 |
| Lint | `pnpm lint` | 0 |

## 2.4 リスクと対策

| リスク | 対策 |
| --- | --- |
| Apple Silicon 以外の macOS（Intel）開発機で arch verifier が誤検知 | verifier 内で `os.cpus()[0].model` を確認し Apple Silicon 識別子を含む場合のみ arm64 強制 |
| Linux CI runner で arch verifier が常に fail | verifier 冒頭で `process.platform !== 'darwin'` の場合は exit 0 で skip |
| `ESBUILD_BINARY_PATH` を unset した場合 wrangler deploy が壊れる | runbook で「Vitest 実行 shell では unset、`scripts/cf.sh` 経由の deploy では維持」と分離を明記 |
| 親リポジトリ `node_modules` を消すと他 worktree が壊れる | runbook では「全 worktree 同時再 install」を escalation の最後段とし、影響範囲を明示 |
| `.mise.toml` の arch hint が mise の version によって構文非対応 | post-install verify hook 形式に fallback できる選択肢を runbook に併記 |

## 2.5 完了条件（Phase 2）

- 変更対象ファイル一覧が確定
- 検証マトリクスが書ける
- リスク 5 件に対策が紐づいている
