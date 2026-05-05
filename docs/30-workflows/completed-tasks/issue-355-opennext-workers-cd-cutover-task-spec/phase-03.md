# Phase 3: テスト計画

## Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | Phase 1 AC-1〜AC-6 と Phase 2 設計を検証するテスト戦略を確定する。単体（build 出力検証）/ 統合（staging deploy + Web→API 連携）/ smoke（UT-06 Phase 11 S-01〜S-10）/ rollback の 4 層と NO-GO 条件を定義する |
| 入力 | Phase 1 AC / RISK、Phase 2 wrangler.toml 最終形 / web-cd.yml 差分 / runbook 設計骨子、UT-06 Phase 11 smoke 仕様 |
| 出力 | `outputs/phase-03/main.md`、テストケース一覧（T-01〜T-NN）、NO-GO 条件、evidence 取得計画 |
| 完了条件 | 4 層全てにテストケースが定義 / NO-GO 条件 4 件以上が明記 / 各 AC に対する検証マッピング完成 / Phase 11 evidence 取得計画と整合 |

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| Phase 番号 | 3 / 13 |
| Phase 名称 | テスト計画 |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 2（技術設計） |
| 次 Phase | 4（タスク分解） |
| 状態 | spec_created |

## テスト戦略概要

| レイヤ | 目的 | 主な検証物 | 実行タイミング |
| --- | --- | --- | --- |
| L1 単体 | OpenNext build smoke | `.open-next/worker.js` / `.open-next/assets/` 生成 | ローカル + CI build job |
| L2 統合 | staging deploy + Web→API 連携 | `wrangler deploy --env staging` 成功 / staging URL 200 / service binding 経由 API 応答 | dev branch merge 直後（CD 自動） |
| L3 smoke | UT-06 Phase 11 S-01〜S-10 流用 | 公開ルートの全件 PASS | staging cutover 完了直後 + production cutover 完了直後 |
| L4 rollback | rollback 経路の実行可能性 | `wrangler rollback` の dry / 旧 Pages resume の実行性 | staging で 1 回実証 |

## テストケース

### L1: 単体（build smoke）

| ID | 検証対象 | 手順 | 期待結果 | 関連 AC |
| --- | --- | --- | --- | --- |
| T-01 | `build:cloudflare` 成功 | `pnpm --filter @ubm-hyogo/web build:cloudflare` をクリーンな worktree で実行 | exit 0 | AC-1 |
| T-02 | OpenNext entrypoint 生成 | T-01 完了後 `apps/web/.open-next/worker.js` の存在確認 | ファイル存在 | AC-1 |
| T-03 | 静的アセット生成 | T-01 完了後 `apps/web/.open-next/assets/` の存在と非空確認 | ディレクトリ存在 + ファイル 1 件以上 | AC-1 |
| T-04 | wrangler.toml 整合 | `grep -n "pages_build_output_dir" apps/web/wrangler.toml` / `grep -n 'main = ".open-next/worker.js"' apps/web/wrangler.toml` | 前者ヒットなし、後者ヒットあり | AC-5 |
| T-05 | next.config.ts 非互換 key 不在 | Phase 2 互換確認に基づき `output: "export"` 等の不在を grep | ヒットなし（互換 key のみ） | AC-1 / AC-2 |

### L2: 統合（staging deploy + Web→API）

| ID | 検証対象 | 手順 | 期待結果 | 関連 AC |
| --- | --- | --- | --- | --- |
| T-10 | web-cd.yml 静的検証 | 改修後 `web-cd.yml` を `grep -n "pages deploy"` | ヒットゼロ | AC-2 |
| T-11 | web-cd.yml deploy command | `grep -n "deploy --env staging" .github/workflows/web-cd.yml` / `--env production` 同様 | 各 1 件以上ヒット | AC-2 |
| T-12 | dev branch merge → CD 起動 | dev へ merge 後 GitHub Actions の `web-cd / deploy-staging` を観測 | job 成功（exit 0） | AC-2 |
| T-13 | staging URL 疎通 | T-12 後 `curl -I https://ubm-hyogo-web-staging.<account>.workers.dev/` | HTTP 200 または 3xx（home route） | AC-4 |
| T-14 | Web→API 連携（service binding） | staging 上の任意 API 経由 page を curl / browser で叩き、API レスポンスが HTML / JSON に反映されること | service binding 経由で apps/api-staging から応答取得 | AC-4 |
| T-15 | observability 有効 | Cloudflare Dashboard / `wrangler tail` で staging worker の実行ログが取得可能 | ログ取得可能 | AC-2 補強 |

### L3: smoke（UT-06 Phase 11 S-01〜S-10 流用）

| ID | 検証対象 | 手順 | 期待結果 | 関連 AC |
| --- | --- | --- | --- | --- |
| T-20 | S-01 トップページ | UT-06 Phase 11 S-01 を staging URL に対し実行 | PASS | AC-3 |
| T-21 | S-02 公開ディレクトリ | UT-06 S-02 同様 | PASS | AC-3 |
| T-22 | S-03 認証導線 | UT-06 S-03 同様 | PASS | AC-3 |
| T-23 | S-04 マイページ | UT-06 S-04 同様 | PASS | AC-3 |
| T-24 | S-05 管理 BO | UT-06 S-05 同様 | PASS | AC-3 |
| T-25 | S-06 静的アセット | UT-06 S-06 同様（`.open-next/assets/` 配信検証） | PASS | AC-3 / AC-1 |
| T-26 | S-07 404 ハンドリング | UT-06 S-07 同様（`not_found_handling = "single-page-application"` の挙動） | PASS | AC-3 |
| T-27 | S-08 robots / sitemap | UT-06 S-08 同様 | PASS | AC-3 |
| T-28 | S-09 OAuth callback | UT-06 S-09 同様 | PASS | AC-3 |
| T-29 | S-10 Magic Link redirect | UT-06 S-10 同様 | PASS | AC-3 |
| T-30 | smoke 全件 PASS の集約 | T-20〜T-29 結果を `outputs/phase-11/staging-smoke-results.md` に記録 | 10/10 PASS | AC-3 |

### L4: rollback

| ID | 検証対象 | 手順 | 期待結果 | 関連 AC / RISK |
| --- | --- | --- | --- | --- |
| T-40 | wrangler rollback dry-run（staging） | staging で意図的に古い VERSION_ID へ `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env staging` を実行 → 直後に最新 deploy へ戻す | rollback 完了 + 復旧完了 | AC-6 / RISK-4 |
| T-41 | Pages dormant resume の確認 | staging 旧 Pages project の `Resume Deployments` UI 操作可能性確認（実行はしない） | UI から resume 可能と確認 | AC-6 / RISK-4 |
| T-42 | runbook 6 セクション存在 | `outputs/phase-05/cutover-runbook.md` に S1〜S6 が章として存在 | 6 セクション全存在 | AC-6 |

## AC ↔ テスト 対応表

| AC | 主検証 | 補助検証 |
| --- | --- | --- |
| AC-1 | T-01, T-02, T-03 | T-05 |
| AC-2 | T-10, T-11, T-12 | T-15 |
| AC-3 | T-20〜T-30 | — |
| AC-4 | T-13, T-14 | T-15 |
| AC-5 | T-04 | — |
| AC-6 | T-42 | T-40, T-41 |

## NO-GO 条件

| ID | 条件 | 対応 |
| --- | --- | --- |
| NG-1 | smoke S-01〜S-10 のうち 1 件でも FAIL | production cutover を保留。原因切分後に staging 再 deploy → smoke 再実行 |
| NG-2 | `apps/web/.open-next/worker.js` または `.open-next/assets/` が build 後に未生成 | build script の不具合と判定し、`opennextjs-cloudflare` バージョン / `patch-open-next-worker.mjs` を点検。NG 解消まで CD 改修 PR を merge しない |
| NG-3 | `wrangler deploy --env staging` が binding 解決失敗（`API_SERVICE` not found 等）で失敗 | apps/api-staging の存在 / wrangler.toml service binding の整合を再確認。staging cutover 中止 |
| NG-4 | staging URL が HTTP 5xx 連発 / observability ログに critical error | rollback（一次手段 `scripts/cf.sh rollback`）を即実行。production cutover 保留 |
| NG-5 | rollback 経路（T-40）が staging で実証できない | runbook S5 を再設計。production cutover 保留 |

## evidence 取得計画（Phase 11 連携）

| evidence | 取得方法 | 保存先 |
| --- | --- | --- |
| OpenNext build log | T-01 実行ログを保存 | `outputs/phase-11/web-cd-deploy-log.md` |
| `.open-next/` 生成物の ls | `ls -la apps/web/.open-next/ apps/web/.open-next/assets/ \| head -30` | `outputs/phase-11/wrangler-deploy-output.md` |
| `wrangler deploy` log | GitHub Actions の deploy job ログ抜粋 | `outputs/phase-11/wrangler-deploy-output.md` / `...-production.log` |
| staging URL HTTP | `curl -I` 結果 | `outputs/phase-11/staging-smoke-results.md` |
| smoke 結果 | T-20〜T-30 PASS/FAIL 一覧 | `outputs/phase-11/staging-smoke-results.md` |
| rollback 実証 | T-40 実行ログ | `outputs/phase-11/rollback-readiness.md` |

> 本タスクは `visualEvidence = NON_VISUAL` のため、screenshot は取得しない（UI 視覚変化なし）。代替 evidence は上記 6 種で構成する（`phase-11-non-visual-alternative-evidence.md` 整合）。

## 多角的チェック観点

- **不変条件 #5 整合**: T-14 で service binding 経由を確認し、apps/web から D1 直接アクセスが発生していないことを実応答経路で間接 gate
- **secret hygiene**: evidence ファイルに API Token / OAuth secret を出力しない。`curl -I` は token を含まないこと、wrangler deploy log は token を mask した状態で保存
- **rollback 実行性**: T-40 / T-41 / T-42 の 3 段で AC-6 を検証
- **CI gate との整合**: T-10 / T-11 は静的 grep のため pre-merge CI でも実行可能。Phase 8 で CI 組込みを検討

## 完了条件

- [ ] L1〜L4 全 4 層にテストケースが定義されている
- [ ] AC-1〜AC-6 すべてに主検証テストが対応している
- [ ] NO-GO 条件 5 件が明記されている
- [ ] evidence 取得計画 6 種が整理されている
- [ ] `outputs/phase-03/main.md` にテスト戦略サマリが記載されている

## 成果物

- `outputs/phase-03/main.md`
- `outputs/phase-03/test-cases.md`
- `outputs/phase-03/no-go-conditions.md`
- `outputs/phase-03/evidence-plan.md`

## 次の Phase

Phase 4: タスク分解（workflow 改修 / runbook 執筆 / smoke 再実行 / next.config 確認 を実装可能粒度に分解）
