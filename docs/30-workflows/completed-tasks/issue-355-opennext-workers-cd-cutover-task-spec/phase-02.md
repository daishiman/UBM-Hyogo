# Phase 2: 技術設計

## Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | Phase 1 で確定した AC-1〜AC-6 / RISK-1〜RISK-5 / open question 4 件を前提に、`apps/web/wrangler.toml` 最終形・`web-cd.yml` deploy step 差分・`build:cloudflare` 確認・`next.config.ts` 互換性確認・Cloudflare side cutover runbook をテキスト仕様として確定する |
| 入力 | Phase 1 成果物、現行 4 ファイル（`apps/web/wrangler.toml` / `.github/workflows/web-cd.yml` / `apps/web/package.json` / `apps/web/next.config.ts`）、`scripts/cf.sh` ラッパー仕様 |
| 出力 | `outputs/phase-02/main.md`、`outputs/phase-02/wrangler-final-form.md`、`outputs/phase-02/web-cd-diff.md`、`outputs/phase-02/cutover-runbook-design.md`、用語対応表 |
| 完了条件 | 4 ファイル仕様確定 / runbook 6 セクション設計確定 / Phase 3 レビューに渡せる代替案候補が並ぶ / open question 4 件への解が示される |

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

Phase 2 設計の前提として、対象 4 ファイルの実在と現状を確認した（Phase 1 P50 調査結果と整合）。

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

## `apps/web/wrangler.toml` 最終形（テキスト仕様）

現状を最終形として固定する。下表の section が揃っていれば AC-5 を満たす。

| section | 値 / 構造 | 役割 |
| --- | --- | --- |
| トップ `name` | `ubm-hyogo-web` | Workers script 名（プロジェクトデフォルト） |
| トップ `main` | `.open-next/worker.js` | OpenNext 生成 entrypoint |
| トップ `compatibility_date` | `2025-01-01` | Workers runtime 互換日 |
| トップ `compatibility_flags` | `["nodejs_compat"]` | OpenNext 必須 flag |
| `[assets]` | `directory = ".open-next/assets"` / `binding = "ASSETS"` / `not_found_handling = "single-page-application"` | 静的アセット配信 |
| `[observability]` | `enabled = true` | Workers 観測 |
| `[vars]` | `ENVIRONMENT = "production"` | デフォルト環境変数 |
| `[env.staging]` | `name = "ubm-hyogo-web-staging"` | staging Workers script 名 |
| `[env.staging.vars]` | `ENVIRONMENT="staging"` / `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` | staging 用 API URL |
| `[[env.staging.services]]` | `binding = "API_SERVICE"` / `service = "ubm-hyogo-api-staging"` | service binding |
| `[env.staging.assets]` | root と同型 | staging asset 配信 |
| `[env.staging.observability]` | `enabled = true` | staging 観測 |
| `[env.production]` 配下一式 | staging と同型・production 値 | production 用 |

**禁止事項**: `pages_build_output_dir` を再導入しない（AC-5）。

## `.github/workflows/web-cd.yml` 差分（テキスト仕様）

### deploy-staging job

| 項目 | before | after |
| --- | --- | --- |
| Build step `run` | `pnpm --filter @ubm-hyogo/web build` | `pnpm --filter @ubm-hyogo/web build:cloudflare` |
| Deploy step `command` | `pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging --branch=dev` | `deploy --env staging` |
| Deploy step `gitHubToken` | 維持 | 維持（Workers でも deployment status を post するため） |
| `workingDirectory` | `apps/web` | `apps/web`（維持） |
| `wranglerVersion` | `4.85.0` | `4.85.0`（維持。`apps/web/package.json` devDependencies と整合） |

### deploy-production job

| 項目 | before | after |
| --- | --- | --- |
| Build step `run` | `pnpm --filter @ubm-hyogo/web build` | `pnpm --filter @ubm-hyogo/web build:cloudflare` |
| Deploy step `command` | `pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }} --branch=main` | `deploy --env production` |
| その他 | 維持 | 維持 |

### 周辺方針

- `concurrency.group = web-cd-${{ github.ref_name }}` は維持（同一 ref の deploy 重複抑止）
- `environment.name` は staging / production を維持（GitHub Environment protection rule の receptacle）
- `permissions: contents: read, deployments: write` は維持
- `vars.CLOUDFLARE_PAGES_PROJECT` への参照は **削除**（Pages project 名は不要になる）
- `secrets.CLOUDFLARE_API_TOKEN` / `vars.CLOUDFLARE_ACCOUNT_ID` は維持

## `apps/web/package.json` 確認（変更不要）

| script | 現状 | 本タスクでの扱い |
| --- | --- | --- |
| `build` | `next build` | 維持（ローカル開発・他 CI 用途） |
| `build:cloudflare` | `opennextjs-cloudflare build && node ../../scripts/patch-open-next-worker.mjs` | 維持（CD が呼ぶ canonical script） |
| `cf-typegen` | `wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts` | 維持 |
| `preview:cloudflare` | `pnpm build:cloudflare && opennextjs-cloudflare preview` | 維持（ローカル smoke 用途） |

## `apps/web/next.config.ts` 互換性確認方針

Phase 2 ステップとして以下のキーが含まれていないこと、または OpenNext 互換であることを確認する。

| key | OpenNext 互換性 | 確認結果（Phase 2 で記載） |
| --- | --- | --- |
| `output` | `"export"` は非互換 | 不在を確認 |
| `assetPrefix` | 固定文字列は要注意 | 互換性確認 |
| `images.unoptimized` | OpenNext 側で image optimization 未対応の場合 true 推奨 | 確認 |
| `experimental.runtime` | `"edge"` 強制は不要 | 確認 |
| `basePath` | OpenNext は対応するが Workers route と整合させる必要 | 確認 |

確認結果は `outputs/phase-02/next-config-compat.md` に記録し、非互換 key が存在した場合のみ Phase 4 で改修サブタスクを起こす。

## Cloudflare side cutover runbook 設計骨子

`outputs/phase-05/cutover-runbook.md` として Phase 5 で本文を作成する。Phase 2 では以下 6 セクションの目次・各セクションの記載項目を確定する。

### S1. 前提

- 対象環境（staging / production）と URL 一覧
- 必要権限（Cloudflare API Token scope: Workers Scripts:Edit、Workers Routes:Edit、Zone:Read（Pages:Edit は dormant 操作用の別承認 token のみ））
- 事前確認: `bash scripts/cf.sh whoami` で認証通過、wrangler 4.85.0 整合

### S2. staging cutover 手順

- 操作1: `dev` ブランチに本タスク改修を merge → `web-cd.yml` deploy-staging job 自動起動
- 操作2: `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` を CD が実行（手動再現は同コマンド）
- 操作3: `https://ubm-hyogo-web-staging.<account>.workers.dev` の HTTP 応答確認
- 操作4: UT-06 Phase 11 smoke S-01〜S-10 を staging URL に対し実行
- 操作5: 旧 staging Pages project (`<project>-staging`) を Dashboard で「Pause Deployments」ボタン押下

### S3. production cutover 手順

- 操作1: staging 全 smoke PASS が AC-3 gate 通過後にのみ実施
- 操作2: `main` ブランチへ merge → `web-cd.yml` deploy-production job 自動起動
- 操作3: `wrangler deploy --env production` 完了確認、`VERSION_ID` を記録（rollback 用）
- 操作4: production custom domain を Pages project から Workers script へ移譲（S4 参照）
- 操作5: production smoke 再実行（同 S-01〜S-10）

### S4. custom domain 移譲

- 前提: production custom domain は Cloudflare Dashboard 上で Pages project に紐付いている
- 手順1: Workers script `ubm-hyogo-web-production` の Custom Domains から target domain を Add
- 手順2: SSL 証明書発行待ち（5 分目安）
- 手順3: 旧 Pages project の Custom Domains から該当 domain を Remove
- 手順4: `dig` / `curl` で TLS 証明書が Workers 経由になったことを確認
- staging は `*.workers.dev` 完結のため本セクション対象外

### S5. rollback 手順

- 一次手段（推奨）: `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env <stage>`
- 二次手段（cutover 直後 dormant 期間内のみ）: 旧 Pages project の `Resume Deployments` → 旧 deploy URL を custom domain へ再 attach
- 判断基準: smoke S-01〜S-10 のうち 1 件でも本番で FAIL → 即座に一次手段
- 通知: rollback 実行は GitHub Issue / Slack に記録（本タスク runbook 内テンプレ）

### S6. Pages dormant 期間運用

- 期間: cutover 完了後 1 sprint（2 週間）
- 期間中: Pages project は `Pause Deployments` 状態で残置、custom domain は外す
- 期間後: Cloudflare Dashboard から Pages project を delete（runbook に削除手順を記載、本タスクでは実行しない）

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

- [ ] `wrangler.toml` 最終形が表で確定
- [ ] `web-cd.yml` deploy-staging / deploy-production の差分表が確定
- [ ] `package.json` / `next.config.ts` 確認方針が確定
- [ ] cutover runbook 6 セクションの設計骨子が確定
- [ ] 用語対応表が確定
- [ ] open question 4 件への解が記載
- [ ] `outputs/phase-02/main.md` に設計サマリ記載

## 成果物

- `outputs/phase-02/main.md`
- `outputs/phase-02/wrangler-final-form.md`
- `outputs/phase-02/web-cd-diff.md`
- `outputs/phase-02/next-config-compat.md`
- `outputs/phase-02/cutover-runbook-design.md`

## 次の Phase

Phase 3: 設計レビュー（PASS / MINOR / MAJOR 判定 + 代替案比較）
