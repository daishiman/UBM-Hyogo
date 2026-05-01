# Phase 2 成果物: 判断軸定義（6 軸）

## 現状スナップショット（2026-05-01 実測 grep 結果）

```
$ rg -n "pages_build_output_dir|^main\s*=|\[assets\]|wrangler deploy|wrangler pages deploy|@opennextjs/cloudflare|\.open-next/worker\.js" \
    apps/web/wrangler.toml \
    .github/workflows/web-cd.yml \
    .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md \
    CLAUDE.md
```

| ファイル | 行 | リテラル | 形式 |
| --- | --- | --- | --- |
| `CLAUDE.md` | L19 | `Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare (apps/web)` | Workers 宣言 |
| `CLAUDE.md` | L37 | `Cloudflare Workers (Next.js via @opennextjs/cloudflare)` | Workers 宣言 |
| `apps/web/wrangler.toml` | L2 | `main = ".open-next/worker.js"` | **Workers 形式（既移行済）** |
| `apps/web/wrangler.toml` | L6 | `[assets]` | Workers 形式 |
| `.github/workflows/web-cd.yml` | L48 | `command: pages deploy .next --project-name=...-staging --branch=dev` | **Pages 形式（drift 残）** |
| `.github/workflows/web-cd.yml` | L85 | `command: pages deploy .next --project-name=... --branch=main` | Pages 形式 |
| `deployment-cloudflare.md` | L41-42 | Pages / Workers 両論併記 | 両論 |
| `deployment-cloudflare.md` | L78 | `current facts (UT-CICD-DRIFT / 2026-04-29)`: wrangler.toml は Pages | **陳腐化** |
| `deployment-cloudflare.md` | L84-85 | 判定表で Pages を稼働中と表記 | 陳腐化（要更新） |
| `deployment-cloudflare.md` | L139, L143 | OpenNext Workers 形式の例示 | 将来形式 |
| `deployment-cloudflare.md` | L443, L453 | Pages-form preflight + cutover 後 `wrangler deploy --env <env>` 切替予定 | 将来計画 |

**重要**: 2026-04-29 → 2026-05-01 の 2 日間で `apps/web/wrangler.toml` は Pages 形式から Workers 形式へ既に移行済み。残 drift は (a) `web-cd.yml` の `pages deploy` 系 step / (b) `deployment-cloudflare.md` の current facts 表記の 2 点。

## 6 判断軸定義

| # | 判断軸 | 評価方法 |
| --- | --- | --- |
| 1 | rollout cost | cutover に必要な作業量（wrangler.toml / web-cd.yml / Cloudflare 側 project 切替）を工数 S/M/L で評価 |
| 2 | Cloudflare features 利用範囲 | Workers 形式で得られるが Pages では制約される機能（Workers Bindings 柔軟性 / static assets binding / Smart Placement / observability） |
| 3 | runtime parity | Next.js App Router / middleware / server components が Pages / Workers それぞれでどこまで等価に動くかを `@opennextjs/cloudflare` の実装上限で評価 |
| 4 | D1 binding 配置整合 | 不変条件 #5 を維持できるか（apps/web に `[[d1_databases]]` を置かない方針が両形式で守れるか） |
| 5 | 既存 GHA 互換性 | `web-cd.yml` の現行 step（`wrangler-action` + `pages deploy`）から `wrangler deploy --env <env>` への切替工数と secrets / variables の再配線範囲 |
| 6 | `@opennextjs/cloudflare` バージョン互換 | 現行 dependency 版での Workers 形式 cutover 適合性 / 破壊的変更の有無 |

## `@opennextjs/cloudflare` バージョン互換性メモ

- 現行版: `@opennextjs/cloudflare@1.19.4`（`apps/web/package.json` L20）
- ビルドコマンド: `opennextjs-cloudflare build`（`apps/web/package.json` `build:cloudflare`）
- preview コマンド: `opennextjs-cloudflare build && opennextjs-cloudflare preview`
- 出力先: `.open-next/worker.js` / `.open-next/assets`
- wrangler 互換: `wrangler@4.85.0`（apps/web devDependencies + web-cd.yml `wranglerVersion: 4.85.0`）

**互換性所見**: 現行 `1.19.4` で Workers 形式 `wrangler.toml`（`main = ".open-next/worker.js"` + `[assets] binding = "ASSETS"`）が成立しており、ローカル `preview:cloudflare` も成立可能。本 ADR の cutover 採択は技術的に既成事実化済（wrangler.toml レベル）。残るは `web-cd.yml` の deploy step を `wrangler deploy --env <env>` に置き換えるだけで、`@opennextjs/cloudflare` 側の障壁はなし。メジャーアップデート（2.x 系）時はバージョン監視タスク（baseline 候補）で再評価。

## 軸別評価（3 案 × 6 軸）

詳細は `cutover-vs-hold-comparison.md` を参照。本ファイルでは判断軸の定義 / 評価方法 / 現状スナップショットに留める。

## 完了確認

- [x] 6 判断軸の定義 + 評価方法
- [x] 現状スナップショット（grep 結果）
- [x] `@opennextjs/cloudflare` バージョン互換性メモ
