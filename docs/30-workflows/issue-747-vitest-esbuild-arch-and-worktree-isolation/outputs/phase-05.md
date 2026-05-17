# Phase 5: 実装手順 / Step-by-Step

実装は次の順で実施する。各 Step 完了時に Phase 6 のテスト spec が更新可能な状態であること。

## Step 5.1 — verify scripts を新規作成

1. `scripts/verify-node-arch.mjs` を Phase 3.1.1 のシグネチャで作成
2. `scripts/verify-worktree-node-modules-isolation.mjs` を Phase 3.1.2 のシグネチャで作成
3. `scripts/verify-esbuild-version.mjs` を Phase 3.1.3 のシグネチャで作成
4. 各 script を `chmod +x` する必要は無い（`node scripts/...` で直接実行する）

**スモーク確認**:

```bash
node scripts/verify-node-arch.mjs            # 期待: arm64 host で exit 0
node scripts/verify-worktree-node-modules-isolation.mjs  # 期待: 真因再現中は exit 1
node scripts/verify-esbuild-version.mjs      # 期待: 真因再現中は exit 1
```

## Step 5.2 — `package.json` に scripts 追記

Phase 4.4 のとおり 4 entry を追加。

```bash
pnpm verify:node-arch
pnpm verify:worktree-isolation
pnpm verify:esbuild
```

## Step 5.3 — 真因の解消（ローカル）

runbook escalation を実施し、worktree 内 esbuild resolve が cwd 配下に収まる状態を作る。

```bash
# (1) ローカル状態を強制再構築
rm -rf node_modules apps/*/node_modules packages/*/node_modules packages/integrations/*/node_modules
pnpm store prune
mise exec -- pnpm install --frozen-lockfile

# (2) 検証
pnpm verify:worktree-isolation
pnpm verify:esbuild
```

> Node arch が x64 のままでも worktree isolation を満たせる場合がある（worktree に
> `@esbuild/darwin-x64@0.27.3` が install されれば良い）。最終ゴールは「3 verify すべて exit 0」。

> arm64 が満たせない場合は mise install 時の terminal 起動経路（Rosetta 2 経由か否か）を runbook §4 に従って確認する。

## Step 5.4 — focused Vitest 復旧確認

```bash
pnpm test:parallel09-primitives
pnpm test:parallel09-use-admin-mutation
```

期待: いずれも exit 0。fail する場合は Step 5.3 の escalation を進める。

## Step 5.5 — lefthook 統合

`lefthook.yml` の `pre-push` セクションに `verify-esbuild` を追加し:

```bash
pnpm install   # prepare で lefthook install が走り、hook が再配置される
git push --dry-run  # hook 実行を確認（実 push は Phase 13 まで実施しない）
```

## Step 5.6 — GitHub Actions workflow 追加

`.github/workflows/verify-esbuild.yml` を新規追加。`act` 等での local run は任意。

## Step 5.7 — `.mise.toml` post-install hook 追加

Phase 4.7 の形式で `[hooks].postinstall` を追加。

```bash
mise install   # 冪等性を確認
```

## Step 5.8 — runbook 作成

`docs/30-workflows/issue-747-.../runbook.md` を Phase 4.8 の 6 セクション構成で作成。

## Step 5.9 — `CLAUDE.md` 最小追記

「## よく使うコマンド」または「## シークレット管理」近傍の適切な場所に 1〜2 行で runbook 参照を追加。既存方針には触れない。

## Step 5.10 — 旧仕様書を `consumed` 化

`docs/30-workflows/unassigned-task/parallel-09-followup-002-vitest-esbuild-version-alignment.md` の frontmatter に Phase 4.9 の YAML を追加。本文は残置。

## Step 5.11 — 全体検証

```bash
mise exec -- pnpm install
mise exec -- pnpm verify:vitest-runtime
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test:parallel09-primitives
mise exec -- pnpm test:parallel09-use-admin-mutation
```

すべて exit 0 で完了。

## 完了条件（Phase 5）

- Step 5.1〜5.11 が一筆書きで実行可能であり、各 Step に検証コマンドが付随している
