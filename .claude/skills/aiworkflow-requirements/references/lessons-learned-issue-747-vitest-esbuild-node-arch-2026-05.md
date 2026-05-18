# Lessons Learned — Issue #747 Vitest esbuild arch & worktree isolation (2026-05)

Canonical workflow: `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/`
Inventory: [[workflow-issue-747-vitest-esbuild-arch-and-worktree-isolation-artifact-inventory]]
Predecessor (root override SSOT): [[lessons-learned-fix-wrangler-esbuild-import-source-error-2026-05]]

## L-I747-001: 3 層複合根本原因モデル

**Fact**: focused Vitest 2 spec が起動不能だった真因は単一の version mismatch ではなく次の 3 層が直列で連鎖していた:

1. **Node arch mismatch** — `mise` 経由で install された Node 24.15.0 が Rosetta 2 経由で `process.arch === "x64"` として動作。esbuild host が `@esbuild/darwin-x64` を resolve しに行った。
2. **Worktree node_modules 漏れ込み** — ワークツリー `node_modules/@esbuild/` には `darwin-arm64` しか install されておらず、Node の module resolution が `..` を遡って親リポジトリ `node_modules/@esbuild/darwin-x64/` を引き当てた。
3. **親リポジトリ esbuild version drift** — 親側の `@esbuild/darwin-x64` が 0.25.4。ワークツリー host 0.27.3 と version 不一致で abort。

**Why**: 当時の unassigned spec `parallel-09-followup-002-vitest-esbuild-version-alignment.md` は「host/binary version mismatch」と表現していたが、その mismatch 自体は **症状** であり、Rosetta 2 + worktree topology が原因だった。

**How to apply**: 同種の esbuild / Vitest runtime 失敗を見たら、(a) `node -p "process.arch"` で arch を即時確認、(b) `node -p "require.resolve('@esbuild/darwin-arm64/bin/esbuild')"` で resolved path が `process.cwd()` 配下にあるかを必ず assert、(c) host / binary / lock の 3 者突合を診断手順に組み込む。

## L-I747-002: 3 つの verify script を gate 二重化で配置する

**Fact**: `scripts/verify-node-arch.mjs` / `scripts/verify-worktree-node-modules-isolation.mjs` / `scripts/verify-esbuild-version.mjs` を新規追加し、**lefthook `pre-push`** と **GitHub Actions `verify-esbuild` workflow（`ubuntu-latest` + `macos-14` matrix）** の両方で同じ verifier を呼ぶ。

**Why**: ローカルだけ・CI だけ片側 gate にすると、worktree 切替や Rosetta 環境の差で再発する。Linux runner では `verify-node-arch` は `skipped` exit 0 とし、Apple Silicon 限定で `arm64` を強制する非対称 gate にすることで matrix を破壊しない。

**How to apply**: 環境依存の runtime 不変条件は「両側 gate」「runner 種別ごとの skip allowance」を 1 ペアで設計する。新規 verifier を追加するときは `package.json` scripts に entry を 1 つ用意し、lefthook と CI 両方から同じ script を呼ぶ contract を維持する。`scripts/verify-esbuild-version.mjs` は host (`esbuild/package.json`) / platform binary `--version` / `pnpm-lock.yaml` の 3 者を必ず突合する。

## L-I747-003: root `esbuild@0.27.3` devDependency を contract 化

**Fact**: CI strict pnpm 解決下でも verifier が動くよう、root `package.json` の `devDependencies.esbuild = "0.27.3"` を明示宣言し、`pnpm-lock.yaml` root importer に登録した。

**Why**: verifier は transitive dependency で偶然 hoist されている esbuild に頼っていると、上流の `wrangler` / `@opennextjs/aws` の dependency 変更で容易に壊れる。root SSOT に格上げすることで「verifier が verifier 自身を信頼できる」状態を作る。これは [[lessons-learned-fix-wrangler-esbuild-import-source-error-2026-05]] で確立した `pnpm.overrides.esbuild = "0.27.3"` SSOT と整合する。

**How to apply**: runtime gate に使う tool は root devDependency に昇格させ、`pnpm-lock.yaml` で固定する。historical 0.25.4 への新規参照は禁止（current SSOT は 0.27.3）。

## L-I747-004: `ESBUILD_BINARY_PATH` の干渉を runbook で明文化

**Fact**: `scripts/cf.sh` は Cloudflare deploy 経路で global esbuild への path を `ESBUILD_BINARY_PATH` で固定するが、この環境変数が exported のまま Vitest を起動すると binary が host version と乖離する。`runbook.md` に「Vitest 実行時は unset すること」を明記。

**Why**: 同じ env var が 2 つの目的（deploy / test）で衝突する境界 condition は、コード fix では検出できず必ず runbook で人間に伝える必要がある。

**How to apply**: cross-purpose env var を発見したら、必ず runbook の escalation 手順に「どちらの目的で unset / set すべきか」を表で残す。AI が deploy script を編集する際は `ESBUILD_BINARY_PATH` の二次防御性質を破壊しない。

## L-I747-005: closed Issue でも `Refs #<n>` で後付け canonical workflow を建てる

**Fact**: Issue #747 は既に CLOSED されていたが、真因が当時の unassigned spec と乖離していたため、issue を reopen せず `docs/30-workflows/issue-747-.../` を後付け canonical root として作成し、PR / commit は `Refs #747` のみで参照する運用にした。

**Why**: CLOSED issue を reopen すると history の意味が壊れる。一方、後付けで正しい canonical root を作ることで evidence と仕様の所在を一意化できる。これは `references/closed-issue-canonical-workflow-recovery.md` で確立した pattern の適用例。

**How to apply**: closed issue に対する後続作業は (a) issue を reopen しない、(b) `Refs #<n>` だけで PR / commit を参照、(c) canonical workflow root を後付けで作成、(d) `legacy-ordinal-family-register.md` に supersede 行を追加。

## L-I747-006: parent repository `node_modules` cleanup は AI が自動実行しない

**Fact**: 真因の一つである親リポジトリ `/Users/dm/dev/dev/個人開発/UBM-Hyogo/node_modules/@esbuild/darwin-x64/` の cleanup は runbook 記載のみとし、AI による自動削除はしない。

**Why**: 親リポジトリは他 worktree や別タスクが依存している可能性があり、blast radius が大きい。`rm -rf node_modules` 系は user 判断必須。

**How to apply**: worktree 系の cleanup 手順は runbook に書くだけ。AI 側は verifier で検出して fail させるだけに留め、destructive cleanup は user に委ねる。
