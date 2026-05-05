# Phase 5: 実装テンプレート / 実装委譲ガイド

## Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | Phase 1-4 で確定した仕様（AC-1〜AC-6 / T-01〜T-42 / runbook 設計骨子）を、実装担当が即座に着手できる「ファイル別変更指示」「実装手順」「handoff 入出力」へ展開する |
| 入力 | Phase 1 AC / RISK、Phase 2 wrangler.toml / web-cd.yml / runbook 骨子、Phase 3 テスト計画、Phase 4 実行可能テスト仕様 / NO-GO 閾値 |
| 出力 | `outputs/phase-05/main.md`、`outputs/phase-05/web-cd-patch.md`（pseudo-diff）、`outputs/phase-05/cutover-runbook.md`（本文）、`outputs/phase-05/handoff-to-implementation.md` |
| 完了条件 | 改修対象 4 ファイルそれぞれに変更指示が記述 / 実装手順 5-10 ステップ確定 / runbook 6 セクション本文確定 / handoff の入力・出力・検証コマンドが列挙 |

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装テンプレート / 実装委譲ガイド |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 4（テスト仕様化） |
| 次 Phase | 6（レビューチェックリスト / 異常系） |
| 状態 | spec_created |
| taskType | implementation |

## 設計方針

1. 本 Phase は実コードを生成しない。pseudo-diff / patch 記述で仕様を提示する。
2. 実装担当（受け側）の handoff 入力は本タスク仕様一式、出力は PR diff + staging smoke evidence。
3. Cloudflare CLI 実行は `bash scripts/cf.sh` 経由を絶対遵守。
4. cutover は staging 先行 → AC-3 gate condition satisfied → production の順を厳守。
5. secret reference は維持し、実値の埋込みを禁止する。

## ファイル別変更指示

### F-1: `.github/workflows/web-cd.yml`

#### deploy-staging job（pseudo-diff）

```diff
   - name: Build
-    run: pnpm --filter @ubm-hyogo/web build
+    run: mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
     working-directory: .

   - name: Deploy (Cloudflare Workers via OpenNext)
     uses: cloudflare/wrangler-action@v3
     with:
       apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
       accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
       workingDirectory: apps/web
       wranglerVersion: '4.85.0'
-      command: pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging --branch=dev
+      command: deploy --env staging
       gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

#### deploy-production job（pseudo-diff）

```diff
   - name: Build
-    run: pnpm --filter @ubm-hyogo/web build
+    run: mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare

       ...
-      command: pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }} --branch=main
+      command: deploy --env production
```

#### 周辺確認項目

- `concurrency.group = web-cd-${{ github.ref_name }}` 維持
- `environment.name`: staging / production 維持
- `permissions: contents: read, deployments: write` 維持
- `vars.CLOUDFLARE_PAGES_PROJECT` の参照を **完全削除**
- `secrets.CLOUDFLARE_API_TOKEN` / `vars.CLOUDFLARE_ACCOUNT_ID` 維持
- `production` environment に Required reviewers を設定する場合は GitHub Environment 設定で別途実施（workflow ファイル変更なし）

### F-2: `apps/web/wrangler.toml`（変更なし・確認のみ）

| 確認項目 | 期待 |
| --- | --- |
| `main` | `.open-next/worker.js` |
| `pages_build_output_dir` | 不在 |
| `[assets].directory` | `.open-next/assets` |
| `[assets].not_found_handling` | `single-page-application` |
| `[env.staging].name` | `ubm-hyogo-web-staging` |
| `[env.staging.services].API_SERVICE` | `ubm-hyogo-api-staging` |
| `[env.production].name` | `ubm-hyogo-web-production` |
| `[env.production.services].API_SERVICE` | `ubm-hyogo-api-production` |

> 本ファイルは Phase 2 で確定した最終形を維持。改修なしで AC-5 を満たす。

### F-3: `apps/web/package.json`（変更なし・確認のみ）

| script | 期待 |
| --- | --- |
| `build` | `next build`（維持） |
| `build:cloudflare` | `opennextjs-cloudflare build && node ../../scripts/patch-open-next-worker.mjs`（維持） |

### F-4: `apps/web/next.config.ts`（互換性確認のみ）

- 確認: `output: "export"` 不在、`assetPrefix` 固定不在、`images.unoptimized` の整合
- 非互換 key 検出時のみ最小修正（Phase 6 で異常系として再評価）

## 実装手順（実装担当向け 8 ステップ）

1. ワークツリー上で `mise exec -- pnpm install` を実行し依存を整える。
2. `.github/workflows/web-cd.yml` を F-1 pseudo-diff の通り書き換え、`pages deploy` 文字列が消えたことを `grep` で確認（T-10）。
3. `apps/web/wrangler.toml` の F-2 確認項目を `grep` / 目視で確認（T-04）。差分があれば中断。
4. ローカルで `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` を実行し、`.open-next/worker.js` と `.open-next/assets/` の生成を確認（T-01〜T-03）。
5. `mise exec -- pnpm typecheck` と `mise exec -- pnpm lint` を実行し全 PASS を確認。
6. 改修 PR を `dev` ブランチへ作成し、`web-cd / deploy-staging` の成功を観測（T-12）。staging URL に対し T-13 / T-14 / T-20〜T-30 を実行（AC-3 gate）。
7. AC-3 gate condition satisfied 後、`outputs/phase-05/cutover-runbook.md` の S2（staging）に従い旧 Pages staging project を Pause Deployments。
8. `main` への merge → production cutover（runbook S3 / S4）→ T-30 production 再実行 → rollback drill T-40 を staging で実証 → evidence を `outputs/phase-11/` に保存。

## handoff（受け側実装タスクへの委譲）

### 入力（実装担当が受け取るもの）

- 本タスク仕様一式（Phase 1〜4）
- `outputs/phase-05/web-cd-patch.md`（F-1 pseudo-diff）
- `outputs/phase-05/cutover-runbook.md`（S1〜S6 本文）
- T-01〜T-42 / NO-GO 閾値（Phase 4）

### 出力（実装担当が返すもの）

- 改修 PR（`.github/workflows/web-cd.yml` の diff のみ。他 3 ファイルは変更なしを expected）
- `outputs/phase-11/web-cd-deploy-log.md`
- `outputs/phase-11/wrangler-deploy-output.md`
- `outputs/phase-11/staging-smoke-results.md`
- `outputs/phase-11/staging-smoke-results.md`（T-20〜T-30 PASS 一覧）
- `outputs/phase-11/rollback-readiness.md`

### 検証コマンド一覧

| 用途 | コマンド |
| --- | --- |
| 依存準備 | `mise exec -- pnpm install` |
| typecheck | `mise exec -- pnpm typecheck` |
| lint | `mise exec -- pnpm lint` |
| OpenNext build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` |
| local preview（任意） | `mise exec -- pnpm --filter @ubm-hyogo/web preview:cloudflare` |
| 手動 deploy（事故時のみ） | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` |
| 手動 rollback | `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env <stage>` |
| tail 観察 | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` |
| contract grep | `grep -nE 'pages\s+deploy' .github/workflows/web-cd.yml` (期待 0 件) |

## cutover-runbook.md（本文骨子・Phase 5 で執筆）

> Phase 2 設計骨子（S1〜S6）に従い、以下の見出し構成で執筆する。本セクションは目次のみ。本文は `outputs/phase-05/cutover-runbook.md` に記述。

```
## S1. 前提
- 環境一覧（staging URL / production URL / API Token scope）
- 事前確認: bash scripts/cf.sh whoami

## S2. staging cutover 手順
- 操作 1〜5（Phase 2 設計骨子と同じ）

## S3. production cutover 手順
- 操作 1〜5

## S4. custom domain 移譲
- 手順 1〜4 / staging は適用外

## S5. rollback 手順
- 一次手段（wrangler rollback）/ 二次手段（Pages resume）/ 通知テンプレ

## S6. Pages dormant 期間運用
- 2 週間 dormant / 3 週目以降に手動 delete
```

## 実装中の risk gate

| risk | gate | 措置 |
| --- | --- | --- |
| secret 漏洩 | PR diff レビューで `secrets.` / `vars.` 参照のみであることを確認 | 実値検出時は PR を即 close し履歴削除 |
| Pages 配信併存中の DNS 影響 | staging は `*.workers.dev` のみで完結 / production は S4 手順で原子的切替 | DNS TTL を事前に短縮（runbook S4 に記載） |
| staging 先行 / main 後追い | dev → main の順を `concurrency` と GitHub Environment で gate | environment protection rule（production）に Required reviewers 設定（GitHub UI 側） |
| `wrangler` 直叩き混入 | grep `wrangler\s+(deploy\|publish)` で 0 件確認（CLAUDE.md 規約） | 検出時は `bash scripts/cf.sh` へ書き換え |

## 多角的チェック

- 価値性: AC-1〜AC-6 を満たす最小変更（workflow 1 ファイル本質改修）に集約
- 実現性: 既存資産（wrangler.toml / build:cloudflare / scripts/cf.sh）の組合せで完結
- 整合性: 不変条件 #5（D1 直アクセス禁止）/ secret hygiene / ラッパー必須を全 step で維持
- 運用性: rollback / dormant / custom domain 切替を runbook 6 セクションで網羅

## 完了条件

- [ ] F-1〜F-4 の変更指示が記述（pseudo-diff 含む）
- [ ] 実装手順 8 ステップが確定
- [ ] handoff 入力 / 出力 / 検証コマンドが列挙
- [ ] runbook S1〜S6 の本文骨子が確定
- [ ] risk gate 4 件が措置とセットで明記
- [ ] `wrangler` 直叩きが本 Phase 仕様内に 0 件

## 成果物

- `outputs/phase-05/main.md`
- `outputs/phase-05/web-cd-patch.md`
- `outputs/phase-05/cutover-runbook.md`
- `outputs/phase-05/handoff-to-implementation.md`

## 次の Phase

Phase 6: レビューチェックリスト / 異常系（セルフレビュー観点 + 異常系 6 件以上の検出・対処・エスカレーション）
