# Phase 2 成果: 技術設計サマリ

本ファイルは `phase-02.md` 仕様の close-out 出力。`apps/web/wrangler.toml` 最終形 / `.github/workflows/web-cd.yml` deploy step 差分 / `apps/web/package.json` 確認 / `apps/web/next.config.ts` 互換性確認 / Cloudflare side cutover runbook 設計骨子の 5 観点を集約する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 技術設計 |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 1（要件定義） |
| 次 Phase | 3（設計レビュー） |
| 状態 | spec_created |

## 既存レイアウト discovery

| パス | 実在 | 現状要点 |
| --- | --- | --- |
| `apps/web/wrangler.toml` | あり | `name = "ubm-hyogo-web"` / `main = ".open-next/worker.js"` / `[assets] directory = ".open-next/assets"` / `[env.staging]` `[env.production]` 完備、`pages_build_output_dir` 不在 |
| `.github/workflows/web-cd.yml` | あり | 2 jobs（deploy-staging / deploy-production）、ともに `pnpm --filter @ubm-hyogo/web build` → `cloudflare/wrangler-action@v3` で `pages deploy .next --project-name=...` を呼び出し |
| `apps/web/package.json` | あり | `build`（next build）と `build:cloudflare`（`opennextjs-cloudflare build && node ../../scripts/patch-open-next-worker.mjs`）が共存 |
| `apps/web/next.config.ts` | あり | OpenNext 互換確認は Phase 2 ステップ 4 で実施 |

## 設計方針

1. `wrangler.toml` は **既存のまま維持**。Phase 1 の AC-5 は「現状の OpenNext 形式を破壊せず維持確認する」ことを意図しており、新規追加は不要。
2. `web-cd.yml` の build step を `build:cloudflare` に差し替える。OpenNext 出力（`.open-next/`）が CD job 内で生成されないと `wrangler deploy` が deploy 対象を見つけられないため。
3. `web-cd.yml` の deploy step を `pages deploy .next ...` から `wrangler deploy --env <stage>` に差し替える。`wrangler-action` の `command` 引数で完結させ、`workingDirectory: apps/web` を維持。
4. `next.config.ts` は OpenNext 非互換オプション（`output: "export"` / 相対 `assetPrefix` 固定 等）の不在を確認し、互換であれば変更しない。
5. cutover runbook は **6 セクション構成**（前提 / staging cutover 手順 / production cutover 手順 / custom domain 移譲 / rollback 手順 / Pages dormant 期間運用）で `outputs/phase-05/cutover-runbook.md` に集約する。Phase 2 では設計骨子のみ確定し、本文は Phase 5 で展開する。
6. Cloudflare 側手動オペレーションは **`bash scripts/cf.sh ...` ラッパー経由**を必須とし、`wrangler` 直接実行を runbook に書かない（CLAUDE.md / UNASSIGNED-G 整合）。
7. Schema / 共有コード ownership は Phase 1 宣言のまま：本タスクが `web-cd.yml` / `wrangler.toml` / runbook の正本化担当。

## 詳細仕様への参照

| 観点 | 個別ドキュメント |
| --- | --- |
| `apps/web/wrangler.toml` 最終形 | [`wrangler-final-form.md`](./wrangler-final-form.md) |
| `.github/workflows/web-cd.yml` 差分 | [`web-cd-diff.md`](./web-cd-diff.md) |
| `apps/web/next.config.ts` 互換性確認 | [`next-config-compat.md`](./next-config-compat.md) |
| cutover runbook 6 セクション骨子 | [`cutover-runbook-design.md`](./cutover-runbook-design.md) |

## `apps/web/package.json` 確認（変更不要）

| script | 現状 | 本タスクでの扱い |
| --- | --- | --- |
| `build` | `next build` | 維持（ローカル開発・他 CI 用途） |
| `build:cloudflare` | `opennextjs-cloudflare build && node ../../scripts/patch-open-next-worker.mjs` | 維持（CD が呼ぶ canonical script） |
| `cf-typegen` | `wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts` | 維持 |
| `preview:cloudflare` | `pnpm build:cloudflare && opennextjs-cloudflare preview` | 維持（ローカル smoke 用途） |

## 仕様語 ↔ 実装語 対応表

| 仕様語（本タスク内） | 実装語（コード / コマンド） | 出典 |
| --- | --- | --- |
| OpenNext 出力ディレクトリ | `apps/web/.open-next/` | `@opennextjs/cloudflare` 出力 |
| OpenNext entrypoint | `.open-next/worker.js` | `wrangler.toml main` |
| 静的アセット | `.open-next/assets/` + `[assets]` binding `ASSETS` | wrangler.toml |
| Workers script (staging) | `ubm-hyogo-web-staging` | wrangler.toml `[env.staging] name` |
| Workers script (production) | `ubm-hyogo-web-production` | wrangler.toml `[env.production] name` |
| service binding | `API_SERVICE` → `ubm-hyogo-api-<stage>` | wrangler.toml `[[env.<stage>.services]]` |
| 旧 Pages project（廃止対象） | `${{ vars.CLOUDFLARE_PAGES_PROJECT }}` および `<project>-staging` | 旧 web-cd.yml |
| CD 内 build コマンド | `pnpm --filter @ubm-hyogo/web build:cloudflare` | package.json |
| CD 内 deploy コマンド | `wrangler deploy --env <stage>`（`cloudflare/wrangler-action` の `command` 引数として渡す） | web-cd.yml after |
| ローカル手動オペレーション | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <stage>` | CLAUDE.md / cf.sh |
| rollback | `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env <stage>` | CLAUDE.md / cf.sh |

## open question 4 件への解

| open question | 解 |
| --- | --- |
| 1. `next.config.ts` の OpenNext 非互換オプション混入有無 | Phase 2 ステップで棚卸しし、`outputs/phase-02/next-config-compat.md` に記録。非互換が見つかった場合のみ Phase 4 で改修タスク化 |
| 2. `wrangler deploy` の追加オプション要否 | 不要。`--env <stage>` のみで wrangler.toml 側に全構成集約済 |
| 3. environment protection rule で手動承認を要求するか | production のみ手動承認を推奨（GitHub Environment `production` の Required reviewers）。staging は自動 deploy 維持。Phase 8 で詳細化 |
| 4. Pages project dormant 期間と削除タイミング | 2 週間 dormant、3 週目以降に手動 delete。本タスク runbook S6 で固定 |

## 依存境界 / 統合テスト連携

| Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビュー（採用案 vs 代替 2 件比較）の入力 |
| Phase 4 | サブタスク分解（workflow 改修 / runbook 執筆 / smoke 再実行 / next.config 確認） |
| Phase 5 | runbook 本文執筆と staging cutover の host environment deployment checkpoint |
| Phase 6 | テスト戦略（build smoke / deploy dry-run / smoke S-01〜S-10）の入力 |
| Phase 8 | CI / 環境保護 rule（production manual approval）の確定 |
| Phase 11 | NON_VISUAL evidence（HTTP 応答 / wrangler deploy log / smoke result） |

## 多角的チェック観点

- **不変条件 #5**: apps/web は service binding 経由で apps/api を呼ぶ構成を維持。D1 直接アクセスを発生させない（wrangler.toml に D1 binding を追加しないことで gate）
- **secret hygiene**: runbook と Phase 11 evidence に API Token / OAuth secret 等の実値を貼らない（CLAUDE.md 禁止事項整合）
- **wrangler ラッパー強制**: 手動オペレーションは `scripts/cf.sh` 経由を runbook 全章で徹底
- **rollback 実行性**: `wrangler rollback` 一次 / Pages 二次の二段戦略を S5 / S6 で保証

## 完了条件

- [x] `wrangler.toml` 最終形が表で確定（`wrangler-final-form.md`）
- [x] `web-cd.yml` deploy-staging / deploy-production の差分表が確定（`web-cd-diff.md`）
- [x] `package.json` / `next.config.ts` 確認方針が確定（本ファイル + `next-config-compat.md`）
- [x] cutover runbook 6 セクションの設計骨子が確定（`cutover-runbook-design.md`）
- [x] 用語対応表が確定
- [x] open question 4 件への解が記載

## 次の Phase

Phase 3: 設計レビュー（PASS / MINOR / MAJOR 判定 + 代替案比較）
