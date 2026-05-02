# テストケース一覧（L1 / L2 / L3 / L4）

`phase-03.md` 仕様の正本転写。AC-1〜AC-6 を 4 層に展開する。

## L1: 単体（build smoke）

| ID | 検証対象 | 手順 | 期待結果 | 関連 AC |
| --- | --- | --- | --- | --- |
| T-01 | `build:cloudflare` 成功 | `pnpm --filter @ubm-hyogo/web build:cloudflare` をクリーンな worktree で実行 | exit 0 | AC-1 |
| T-02 | OpenNext entrypoint 生成 | T-01 完了後 `apps/web/.open-next/worker.js` の存在確認 | ファイル存在 | AC-1 |
| T-03 | 静的アセット生成 | T-01 完了後 `apps/web/.open-next/assets/` の存在と非空確認 | ディレクトリ存在 + ファイル 1 件以上 | AC-1 |
| T-04 | wrangler.toml 整合 | `grep -n "pages_build_output_dir" apps/web/wrangler.toml` / `grep -n 'main = ".open-next/worker.js"' apps/web/wrangler.toml` | 前者ヒットなし、後者ヒットあり | AC-5 |
| T-05 | next.config.ts 非互換 key 不在 | Phase 2 互換確認に基づき `output: "export"` 等の不在を grep | ヒットなし（互換 key のみ） | AC-1 / AC-2 |

## L2: 統合（staging deploy + Web→API）

| ID | 検証対象 | 手順 | 期待結果 | 関連 AC |
| --- | --- | --- | --- | --- |
| T-10 | web-cd.yml 静的検証 | 改修後 `web-cd.yml` を `grep -n "pages deploy"` | ヒットゼロ | AC-2 |
| T-11 | web-cd.yml deploy command | `grep -n "deploy --env staging" .github/workflows/web-cd.yml` / `--env production` 同様 | 各 1 件以上ヒット | AC-2 |
| T-12 | dev branch merge → CD 起動 | dev へ merge 後 GitHub Actions の `web-cd / deploy-staging` を観測 | job 成功（exit 0） | AC-2 |
| T-13 | staging URL 疎通 | T-12 後 `curl -I https://ubm-hyogo-web-staging.<account>.workers.dev/` | HTTP 200 または 3xx（home route） | AC-4 |
| T-14 | Web→API 連携（service binding） | staging 上の任意 API 経由 page を curl / browser で叩き、API レスポンスが HTML / JSON に反映されること | service binding 経由で apps/api-staging から応答取得 | AC-4 |
| T-15 | observability 有効 | Cloudflare Dashboard / `wrangler tail` で staging worker の実行ログが取得可能 | ログ取得可能 | AC-2 補強 |

## L3: smoke（UT-06 Phase 11 S-01〜S-10 流用）

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

## L4: rollback

| ID | 検証対象 | 手順 | 期待結果 | 関連 AC / RISK |
| --- | --- | --- | --- | --- |
| T-40 | wrangler rollback dry-run（staging） | staging で意図的に古い VERSION_ID へ `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env staging` を実行 → 直後に最新 deploy へ戻す | rollback 完了 + 復旧完了 | AC-6 / RISK-4 |
| T-41 | Pages dormant resume の確認 | staging 旧 Pages project の `Resume Deployments` UI 操作可能性確認（実行はしない） | UI から resume 可能と確認 | AC-6 / RISK-4 |
| T-42 | runbook 6 セクション存在 | `outputs/phase-05/cutover-runbook.md` に S1〜S6 が章として存在 | 6 セクション全存在 | AC-6 |

## 実行タイミングまとめ

| Phase | 実行する test ID |
| --- | --- |
| ローカル / pre-merge CI | T-01 〜 T-05、T-10 〜 T-11 |
| dev merge 後（CD 自動） | T-12、T-13、T-14、T-15 |
| staging cutover 直後 | T-20 〜 T-30 |
| staging で rollback drill | T-40、T-41、T-42 |
| production cutover 直後 | T-20 〜 T-30 を本番 URL で再実行 |
