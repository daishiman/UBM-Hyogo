# Lessons Learned（current）2026-04 / UT-06 派生

> 親ファイル: [lessons-learned-current-2026-04.md](lessons-learned-current-2026-04.md)
> 役割: UT-06（本番デプロイ実行）派生の教訓を分離管理（500 行制限のため `lessons-learned-current-2026-04.md` から責務分離）
> 対象タスク: UT-06 production deploy execution（2026-04-27 close-out）

## 概要

UT-06 の本番デプロイ実行で得られた、Cloudflare CLI 運用 / Secret 取り扱い / Next.js 16 Turbopack monorepo 設定 / wrangler 4.x strict mode / TypeScript build gate に関する教訓を 5 件記録する。これらは下流タスクおよび他 worktree でも再発しうるため、関連 reference の更新（`deployment-cloudflare.md` / `deployment-core.md` / `deployment-secrets-management.md`）と併せて canonical 化する。

---

## L-UT06-001: `wrangler` 直叩き禁止 → `scripts/cf.sh` に集約

| 項目 | 内容 |
| --- | --- |
| カテゴリ | infra / Cloudflare CLI / wrapper |
| 症状 | `wrangler deploy` を直接実行すると、(a) グローバル `esbuild` とローカル `node_modules/esbuild` のバージョン不整合で deploy が失敗する、(b) `wrangler login` の OAuth トークンが `~/Library/Preferences/.wrangler/config/default.toml` に永続化されて secret hygiene を破る、(c) Node 18 系がアクティブだと OpenNext のビルドが falls back する |
| 原因 | `wrangler` を直接呼ぶと、1Password による secret 注入・`ESBUILD_BINARY_PATH` の固定・`mise exec` での Node 24 / pnpm 10 強制という三つの前提条件が個別に再現できない |
| 解決策 | 全 Cloudflare CLI 呼び出しを `bash scripts/cf.sh ...` に集約。`scripts/cf.sh` は `scripts/with-env.sh`（`op run --env-file=.env`）経由で `CLOUDFLARE_API_TOKEN` を環境変数として揮発的に注入し、`ESBUILD_BINARY_PATH` を worktree のローカル `node_modules/esbuild` に固定し、`mise exec --` で Node 24 / pnpm 10 を強制し、`node_modules/.bin/wrangler` を優先解決する |
| 再発防止 | `CLAUDE.md` / `deployment-cloudflare.md` / `deployment-secrets-management.md` に canonical wrapper を明文化。Claude Code の Memory `feedback_cloudflare_cli_wrapper.md` に「wrangler 直接実行禁止」を恒久ルールとして登録。skill audit 時は `wrangler ` で始まる実行例が `bash scripts/cf.sh` に置換されているか確認 |
| 関連タスク | UT-06 / UT-05 |

---

## L-UT06-002: `.env` に実値を書かず `op://` 参照のみ（AI 学習混入防止）

| 項目 | 内容 |
| --- | --- |
| カテゴリ | security / secrets / AI hygiene |
| 症状 | ローカル `.env` に Cloudflare API Token や OAuth Client Secret の実値を貼り付けると、AI エージェント（Claude Code を含む）の context window に混入する経路が複数存在する（`Read` / `Bash cat` / IDE のインデックス・補完など） |
| 原因 | `.env` は worktree のファイルシステム上に存在するため、AI エージェントの「ファイル参照」操作で読み取られる可能性が常にある。値を一度でも文字列としてエージェントに見せると、後続セッションへ転記・要約される事故が起きうる |
| 解決策 | ローカル `.env` には実値を書かず、`op://Vault/Item/Field` 形式の 1Password 参照のみを記述。`scripts/with-env.sh` が `op run --env-file=.env` で実行時に動的注入し、実値はプロセス環境変数として揮発的に渡るのみ（ファイルやログには残らない） |
| 再発防止 | `CLAUDE.md` に「`.env` に実値を書かない」「`.env` を `cat` / `Read` / `grep` 等で表示しない」を AI エージェント向け禁止事項として明示。`feedback_no_doc_for_secrets.md` を Memory に登録。`pnpm dev` 等の起動も `scripts/with-env.sh` 経由のラッパーに統一 |
| 関連タスク | UT-06 / UT-05 / UT-CICD-OP-RUN-001 |

---

## L-UT06-003: wrangler 4.x strict mode で `[env.production]` 明示必須

| 項目 | 内容 |
| --- | --- |
| カテゴリ | infra / Cloudflare Workers / wrangler config |
| 症状 | wrangler 4.x で `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` を実行すると `Configuration file is missing the [env.production] section` で deploy が失敗する |
| 原因 | wrangler 4.x は strict mode により、`--env <name>` 指定時に対応する `[env.<name>]` セクションが top-level に存在しないと deploy を許可しない（3.x までは top-level config を fallback 解釈していた） |
| 解決策 | `apps/api/wrangler.toml` および `apps/web/wrangler.toml` に `[env.staging]` と `[env.production]` を明示的に定義。production は top-level 設定を継承する形で最低限 `name`（および環境別 D1 / KV binding）を記述する |
| 再発防止 | `deployment-cloudflare.md` の wrangler.toml 例を `[env.production]` 含む形に更新。新規 Workers 追加時は両環境 section を必ず作成する Phase 2 設計チェックを `task-specification-creator` SKILL のテンプレートに追加候補 |
| 関連タスク | UT-06 |

---

## L-UT06-004: Next.js 16 + Turbopack の worktree root 誤検出

| 項目 | 内容 |
| --- | --- |
| カテゴリ | build / Next.js / Turbopack / monorepo |
| 症状 | worktree から `pnpm --filter web build` を実行すると、Turbopack が monorepo の親方向（`.worktrees/` の上位）を root と誤検出して、無関係なファイルを tracing 対象に含めたり、`outputFileTracingRoot` のパス解決が崩れて `.open-next/worker.js` の生成が不安定化する |
| 原因 | Next.js 16 / Turbopack は package.json / pnpm-workspace.yaml の探索を上方向に行う。worktree（`.worktrees/<name>/`）は親リポジトリの workspace ファイルが上位に存在するため、root 推定が worktree 外を指す |
| 解決策 | `apps/web/next.config.ts` で `outputFileTracingRoot` と `turbopack.root` を `path.resolve(__dirname, "../..")` で worktree の app 群 root に明示固定。これにより tracing と Turbopack の root が同一 worktree 内に閉じる |
| 再発防止 | `deployment-cloudflare.md` の `apps/web/next.config.ts` 例を更新。`deployment-core.md` の UT-06 deploy gate 表に「Turbopack monorepo root 誤検出ゲート」を追加 |
| 関連タスク | UT-06 |

---

## L-UT06-005: `ignoreBuildErrors` は別 tsc gate と pair 必須

| 項目 | 内容 |
| --- | --- |
| カテゴリ | quality / TypeScript / build gate |
| 症状 | Next.js 16 / Turbopack の monorepo 誤検出に起因する型解決エラーが build 時にだけ出る場合、`typescript.ignoreBuildErrors = true` で抑制すると deploy は通るが、本物の型エラーまで素通りする危険がある |
| 原因 | `ignoreBuildErrors` は build 時の型チェックを無効化するが、Next.js の build と TypeScript の型チェックは責務が異なる。build 通過 = 型 OK と等価ではない |
| 解決策 | `ignoreBuildErrors = true` を有効にする場合は、必ず別途 `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` を独立した gate として実行する。CI / 手動 deploy gate の双方で pair 運用し、`ignoreBuildErrors` 単独で deploy gate を通すことを禁止する |
| 再発防止 | `deployment-core.md` の UT-06 不可逆操作ゲートに「別 tsc gate（`ignoreBuildErrors=true` 使用時）」を必須化。`apps/web/next.config.ts` の該当オプションには別 tsc gate と pair 必須のコメントを併記する |
| 関連タスク | UT-06 |

---

## 関連 reference 更新まとめ

| reference | 反映内容 |
| --- | --- |
| `deployment-cloudflare.md` | `wrangler login` 禁止注記 / canonical 例の `bash scripts/cf.sh ...` 統一 / `apps/web/next.config.ts` 例に `outputFileTracingRoot` / `turbopack.root` / `ignoreBuildErrors` 反映 / API `wrangler.toml` 例に `[env.staging]` `[env.production]` |
| `deployment-core.md` | UT-06 ゲート表に「Turbopack monorepo root 誤検出ゲート」「別 tsc gate（`ignoreBuildErrors=true` 使用時）」追加 |
| `deployment-secrets-management.md` | `scripts/cf.sh` を 1Password / esbuild / mise 統合の canonical wrapper として記述、`wrangler login` ローカル OAuth トークン保持禁止 |
| `indexes/keywords.json` / `indexes/topic-map.md` | UT-06 派生キーワードと topic anchor を追加 |
