# Phase 4: 仕様詳細 / コード実装契約

## 4.1 `scripts/verify-node-arch.mjs` 実装契約

- shebang: `#!/usr/bin/env node`
- top-level await OK（Node 24）
- 外部依存なし（`node:os`, `node:process` のみ）
- 出力: 1 行サマリ + fail 時のみ Hint 2-3 行
- exit code: 0 / 1

擬似テスト（Vitest 不要、`node --test` か手動で smoke 可）:

```bash
# Apple Silicon arm64 native node で実行 → exit 0
node scripts/verify-node-arch.mjs; echo $?  # → 0

# 偽 arch を環境変数で notify する設計にはしない。実 arch のみ評価する。
```

## 4.2 `scripts/verify-worktree-node-modules-isolation.mjs` 実装契約

- 外部依存なし
- `createRequire(import.meta.url)` ベース
- 評価対象: `@esbuild/${platform}-${arch}/bin/esbuild`
- 解決失敗時も fail（exit 1）。Hint で `pnpm install` を案内
- 解決成功でも `process.cwd()` 配下にない時は fail
- `process.cwd()` は `pnpm` 実行時のリポジトリ root を想定（lefthook / CI でも同じ）

擬似テスト:

```bash
# 期待: worktree root で実行 → exit 0
node scripts/verify-worktree-node-modules-isolation.mjs; echo $?  # → 0

# 期待: 親リポジトリの node_modules が漏れている時 → exit 1, Hint 表示
```

## 4.3 `scripts/verify-esbuild-version.mjs` 実装契約

- host: `require('esbuild/package.json').version`
- binary: `execFileSync(<resolved>, ['--version']).toString().trim()`
- lock: `pnpm-lock.yaml` の `^\s+esbuild@([\d.]+):` regex 抽出
- 3 値を 1 行で出力（`host=X bin=Y lock=Z -> OK|FAIL`）
- いずれかが空文字なら fail
- exit code: 0 / 1

## 4.4 `package.json` scripts 追記

```json
{
  "scripts": {
    "verify:node-arch": "node scripts/verify-node-arch.mjs",
    "verify:worktree-isolation": "node scripts/verify-worktree-node-modules-isolation.mjs",
    "verify:esbuild": "node scripts/verify-esbuild-version.mjs",
    "verify:vitest-runtime": "pnpm verify:node-arch && pnpm verify:worktree-isolation && pnpm verify:esbuild"
  }
}
```

## 4.5 `lefthook.yml` 追記契約

- 既存 `pre-push` 構造を破壊しない
- `verify-esbuild` を pre-push の新しい `commands.<name>` として追加
- `skip` で merge / rebase 中は無効化
- `tags: [test, env]` を付与（既存タグ慣習があればそれに合わせる）

## 4.6 GitHub Actions `.github/workflows/verify-esbuild.yml`

- name: `verify-esbuild`
- trigger: `pull_request` / `push` to `dev` & `main`
- matrix: `[ubuntu-latest, macos-14]`
- node-version: `24.15.0`
- pnpm: `10.33.2`
- 各 verify の step は独立（fail 場所が分かるように）
- focused Vitest 2 spec を最後の step として実行
- `--frozen-lockfile` を強制

## 4.7 `.mise.toml` 変更契約

- 既存 `[tools]` を尊重
- `node = "24.15.0"` の表記を維持しつつ、`[hooks]` セクションで post-install verifier を実行
- 変更前後の `mise install` が冪等であること

例:

```toml
[tools]
node = "24.15.0"
pnpm = "10.33.2"

[hooks]
postinstall = "node scripts/verify-node-arch.mjs || true"
```

> `|| true` を付ける理由: mise install の最中に worktree がまだセットアップ前で fail することを許容。実際の gate は lefthook / CI 側で行う。

## 4.8 runbook (`runbook.md`)

セクション構成:

1. 症状（Vitest 起動 abort のメッセージ）
2. 原因（arch + worktree topology + version drift の 3 層）
3. 復旧 escalation 1〜5（`pnpm install --force` → `pnpm rebuild esbuild` → `pnpm dedupe` → worktree `node_modules` 削除 → 親リポジトリ含む全 `node_modules` 削除）
4. Rosetta 2 / arch 検知の確認手順（`arch` コマンド、`uname -m`、`process.arch`）
5. `ESBUILD_BINARY_PATH` 干渉対策（Vitest 実行 shell では unset、`scripts/cf.sh` 経由 deploy では維持）
6. 再発防止の verify gate 一覧

## 4.9 `unassigned-task/parallel-09-followup-002-...md` 更新契約

```yaml
---
status: consumed
canonical_workflow: docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/
consumed_at: 2026-05-17
consumed_reason: |
  真因が「version mismatch」ではなく「arch + worktree resolution + 親リポジトリ version drift の 3 層複合」であることが判明したため、
  Refs #747 として canonical workflow を再生成し、本ファイルは consumed trace として残置。
---
```

物理削除しない。

## 4.10 完了条件（Phase 4）

- 全 9 ファイルの実装契約（シグネチャ・入出力・依存）が確定
- 各 verify が単体 smoke 可能
- 追加 npm scripts 名が確定
