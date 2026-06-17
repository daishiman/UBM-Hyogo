# Implementation Guide

## Part 1: 中学生レベルの概念説明

### なぜ必要か

このタスクは、テストを自動でチェックしてくれる道具「Vite（ヴィート）」を、古い型番 5 から新しい型番 7 へ入れ替える作業です。道具の名前と使い方は同じですが、新しい型に合わせて設定を点検します。

たとえるなら、教室で使う採点マシンを古い型 5 から新しい型 7 に買い替えるようなものです。マシンの置き場所も、生徒が解く問題も、貼り出される成績表（＝アプリの見た目）も何も変わりません。ただ、新しいマシンは差し込み口の形が少し変わっているので、つなぐコード（＝設定）が合っているかを点検するだけです。

大事なのは「アプリ本体の見た目は何も変わらない」ことです。なぜなら、お客さんが見る画面（apps/web）は、この Vite という道具を本番ではまったく使っていないからです。本番の画面は別の道具（Next.js の webpack）で作られています。Vite は「テストのときだけ」使う裏方の道具なので、見た目への影響はゼロです。

### 何をするか

新しい型 7 の Vite を「使いますよ」と部品リスト（package.json）に正式に書き加えます。今までは誰も名指しで頼んでいなかったので、たまたま一番古い型 5 が選ばれていました。今度は「型 7 をください」とはっきり書くことで、新しい型に切り替わります。

そのあと、テストが全部これまで通り合格するか、新しい道具が「この書き方はもう古いよ」と注意を出さないか、道具が型 7 で一本化されているかを確認します。画面やユーザー操作は変えないため、スクリーンショットは不要です。

### 今回作ったもの

| 作るもの | 内容 |
| --- | --- |
| 依存追加 | root `package.json` に `"vite": "^7.0.0"` を新規追加（直接指定で 5.4.21 → 7.x へ引き上げ） |
| lockfile | `pnpm-lock.yaml` を再生成し、Vite が単一の 7.x で解決される状態にする |
| 設定の点検 | `vitest.config.ts` / `vitest.d1.config.ts` を等価維持（必要なときだけ最小修正） |
| NON_VISUAL 証跡 | typecheck / lint / shard test / deprecation grep / `pnpm why vite` の結果 |

> 本ガイドは本実装サイクルの実施結果を記録する。commit / push / PR だけを user-gated に残す。

## Part 2: 開発者向け実装詳細

### 変更対象（`_shared-context.md` §4 と一致）

| File | Required change |
| --- | --- |
| `package.json`（root） | `devDependencies` に `"vite": "^7.0.0"` を **新規追加**（推移依存の最低版 5.4.21 固定を解除し 7.x へ引き上げ） |
| `pnpm-lock.yaml` | `mise exec -- pnpm install` で再生成（vite を 7.x へ解決・単一バージョン維持） |
| `vitest.config.ts` | 変更なし。`resolve.alias`（react subpath）/ `optimizeDeps` / `dedupe` / `plugins:[react()]` は等価維持 |
| `vitest.d1.config.ts` | 変更なし。`pool: forks` / `singleFork: true`（issue-617 port exhaustion 回避）を維持 |
| 破壊的変更で fail した `*.spec.{ts,tsx}` | Vite 7 起因の RED なし。テストファイル変更なし |

> `apps/api/package.json` / `apps/og/package.json` / `apps/web/package.json` / `packages/*` は vite を直接依存しないため bump 対象外。vite は root の単一ノードで解決される。

### package.json 差分（root のみ・実施済み）

```diff
   "devDependencies": {
+    "vite": "^7.0.0",
     ...
   }
```

- 現状 Vite の直接 specifier は **存在しない**（全 package.json で `"vite":` 0 件）。推移依存（`@vitejs/plugin-react@4.7.0` / `vitest@3.2.6` の `@vitest/mocker` / `vite-node@3.2.4`）の共通最低版として 5.4.21 が選ばれているだけ。
- 直接 devDependency 追加を採用する理由: (1) dependabot が以後追跡可能、(2) 解決バージョンが可視化され drift しにくい、(3) Issue の「specifier をメジャー更新」意図に最も忠実。
- 代替案 `pnpm.overrides.vite` は「強制上書き」で peer 検証を弱めるため非採用（フォールバックとしてのみ言及）。

### 破壊的変更カテゴリ V1〜V8（`_shared-context.md` §5）

| ID | カテゴリ | 当 repo での対応 |
| --- | --- | --- |
| V1 | 解決機構 | 直接 vite 依存が無い → `vite ^7` devDep 追加で 5.4.21→7.x へ引き上げ（実装の中核）。`pnpm why vite` 単一 7.x を確認 |
| V2 | resolve.alias / optimizeDeps | react subpath（`react/jsx-dev-runtime` 等）の alias 解決・prebundle 挙動。等価維持で green 期待。解決失敗時のみ新 API へ等価変換 |
| V3 | @vitejs/plugin-react interop | `plugins:[react()]` の Vite 7 連携。4.7.0 が peer で v7 宣言済み → runtime warning 0 を確認 |
| V4 | deprecation / removed API | `splitVendorChunkPlugin` / CJS Node API / `resolve.conditions` 既定変更 / `legacy` 等。現 config は未使用 → 警告 0 期待。出たら最小置換 |
| V5 | esbuild 整合 | `pnpm.overrides.esbuild=0.27.3` と Vite 7 の esbuild レンジ整合。不整合時は `ESBUILD_BINARY_PATH` / `pnpm verify:vitest-runtime` で吸収（環境ブロッカー側で扱う） |
| V6 | Node engine 要件 | Vite 7 は Node 20.19+/22.12+ 要求。現環境 Node 24.15.0 で充足（対応不要） |
| V7 | vite-node / 重複バージョン | `vite-node@3.2.4` の vite peer と単一バージョン解決。`pnpm why vite` で 5系/7系 併存がないことを確認 |
| V8 | apps/web ビルド非影響 | Next.js webpack ビルドが Vite 非依存である事実の明示確認。`pnpm build` sanity で OpenNext bundle 健全（`[project]/...` 仮想 specifier 混入なし）。blocker ではない |

### apps/web は Vite 非影響（明示）

- `apps/web` 本番ビルドは `next build --webpack`（Next.js / OpenNext Workers）であり、**Vite を一切使わない**。`apps/web/next.config.*` / `wrangler.toml` に vite 参照なし（grep 0 件）。
- Vite を消費するのは `vitest`（テストランナー）と `@vitejs/plugin-react`（テスト時 JSX 変換）のみ。
- 帰結: 「`@opennextjs/cloudflare` の Vite メジャー非対応で apps/web ビルド破壊」は構造的にほぼ無効。Vite は deploy bundle に関与しない。apps/web ビルドは sanity 確認に留め、blocker ではない。

### CLIシグネチャ / Verification commands（`_shared-context.md` §9）

```bash
mise exec -- pnpm install            # lockfile 再生成
mise exec -- pnpm why vite           # 単一 7.x 解決の確認（V1/V7）
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts packages
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts infra
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og 2>&1 | grep -i "deprecat\|warn" || echo "OK: 警告なし"
mise exec -- pnpm build              # apps/web sanity（V8）
bash scripts/verify-pr-ready.sh
```

### 使用例

```bash
# Vite 7 lockfile を再生成し、単一解決とローカル証跡を確認する最小例
mise exec -- pnpm install
mise exec -- pnpm why vite
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/url/__tests__/members-search.spec.ts
```

### Execution steps（実装サイクル）

1. root `package.json` に `"vite": "^7.0.0"` を追加し `pnpm install` で lockfile を再生成する。
2. `pnpm why vite` で単一 7.x 解決（V1/V7）を確認する。
3. shard 別 vitest を実行し RED（V2/V3/V4 起因の fail）を採取・分類する。
4. RED に対し test 期待値 / mock / config の最小修正のみを行う（プロダクトコードは無変更。真の product bug が証明された場合のみ例外）。
5. typecheck / lint / deprecation grep / `pnpm build` sanity で締める。
6. V5（esbuild 整合）等の環境ブロッカーは source-level PASS と分離して記録する。

### エラーハンドリング

| Failure | Handling |
| --- | --- |
| `pnpm why vite` が 5系/7系併存を示す | specifier と推移制約を点検し lockfile を再生成。重複を残さない（V7） |
| Vite config deprecation（V4）が出る | 実証された非推奨キーのみ新 API へ等価変換し、同 shard を再実行 |
| react subpath 解決失敗（V2） | alias を Vite 7 の新 API へ等価変換。挙動は維持 |
| esbuild 不整合（V5） | `ESBUILD_BINARY_PATH` / `pnpm verify:vitest-runtime` / issue-747 runbook で吸収。解消不能なら Phase 3 でユーザーエスカレーション |
| scripts shard RPC timeout（高負荷） | `--no-file-parallelism` で再実行し境界を記録。fail テストを隠さない |

### エッジケース

| Category | Handling |
| --- | --- |
| V2 alias / optimizeDeps | jsx-dev-runtime 等の解決失敗時のみ等価変換 |
| V3 plugin-react interop | runtime warning 0 を確認。plugin-react のメジャーアップはしない（4.7.0 据え置き） |
| V4 removed API | `splitVendorChunkPlugin` / CJS Node API / `legacy` 等を grep。現 config 未使用なら無変更 |
| V5 esbuild | overrides 0.27.3 を維持。整合しない場合のみ Phase 3 エスカレーション |
| V8 apps/web build | `pnpm build` で OpenNext bundle に `[project]/...` 仮想 specifier が混入しないことを確認 |

### テスト構成

| Layer | Command / evidence | Purpose |
| --- | --- | --- |
| Typecheck | `mise exec -- pnpm typecheck` / `outputs/phase-11/evidence/typecheck.log` | workspace 型検査が Vite 7 lockfile 後も green であることを確認 |
| Lint | `mise exec -- pnpm lint` / `outputs/phase-11/evidence/lint.log` | config / source style drift がないことを確認 |
| Vitest shards | `vitest.config.ts` broad shards + focused reruns / `outputs/phase-11/evidence/test.log` | Vite 7 起因の module resolution / plugin-react / warning regression がないことを確認 |
| D1 Vitest | `vitest.d1.config.ts` focused rerun / `outputs/phase-11/evidence/test.log` | `pool: forks` / `singleFork: true` の port exhaustion 回避設計を維持 |
| Build sanity | `mise exec -- pnpm build` / `outputs/phase-11/evidence/build.log` | apps/web が Vite 非依存の Next webpack/OpenNext build であることを確認 |
| Grep gate | `pnpm why vite` + deprecation grep / `outputs/phase-11/evidence/grep-gate.log` | Vite 7.3.5 単一解決と Vite removed/deprecated API warning 0 件を確認 |

### 設定項目と定数一覧

| Category | Handling |
| --- | --- |
| `vite` | root `package.json` に `^7.0.0`（新規直接 devDependency） |
| `@vitejs/plugin-react` | `4.7.0` 据え置き（既に Vite 7 を peer サポート） |
| `pnpm.overrides.esbuild` | `0.27.3` 維持 |
| `vitest.config.ts` | `resolve.alias` / `optimizeDeps` / `dedupe` / `plugins:[react()]` を等価維持 |
| `vitest.d1.config.ts` | `pool: "forks"` / `singleFork: true` を維持 |
| `visualEvidence` | `NON_VISUAL`; screenshots は不要 |
| `workflow_state` | `implemented_local_evidence_captured` |

### Type-level contract

```ts
type ViteUpgradeTarget = {
  packageName: "vite";
  fromResolved: "5.4.21";
  toRange: "^7.0.0";
  mechanism: "new-direct-devDependency"; // not "specifier-update" (no prior direct specifier)
};
```

これは新規 runtime API ではなくドキュメント契約であり、本サイクルで満たした解決バージョン要件（5.4.21 → 単一 7.x）を記録する。

### Visual evidence

UI/UX 変更なしのため Phase 11 スクリーンショット不要。Phase 11 evidence は command output: shard 別 vitest 結果、deprecation grep（V4）、`pnpm why vite`（単一 7.x 解決）ログである。これらは `outputs/phase-11/` に採取済み。
