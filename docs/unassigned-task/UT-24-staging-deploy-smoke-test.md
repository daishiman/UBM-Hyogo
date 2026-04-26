# UT-24: 初回 staging deploy smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-24 |
| タスク名 | 初回 staging deploy smoke test |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 状態 | 未着手 |
| 作成日 | 2026-04-26 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元 | docs/04-serial-cicd-secrets-and-environment-sync/outputs/phase-12/unassigned-task-detection.md (U-05) |

## 目的

04-serial-cicd-secrets-and-environment-sync で整備した CD ワークフロー（`web-cd.yml` / `backend-deploy.yml`）が実際に Cloudflare Workers へデプロイできることを、`dev` ブランチへのマージ時に初回 smoke test として検証する。特に `@opennextjs/cloudflare deploy --env staging` の実挙動を確認し、staging 環境が期待どおりに動作することを保証する。

## スコープ

### 含む
- `dev` ブランチへの初回 push/merge による CD ワークフロー実行確認
- `web-cd.yml` の staging deploy ステップ成功確認（`@opennextjs/cloudflare`）
- `backend-deploy.yml` の staging deploy ステップ成功確認（`wrangler deploy --env staging`）
- Cloudflare Workers 管理コンソールでの staging デプロイ確認
- staging URL へのヘルスチェック（`/api/health` 等）
- GitHub Actions のログ確認と失敗時の原因調査・修正
- smoke test 結果の記録（`outputs/phase-11/` 相当のログ）

### 含まない
- production デプロイ（別途承認後に実施）
- 機能テスト・E2E テスト（アプリ実装後のタスク）
- D1 migration の本番適用（UT-22 のスコープ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | CD ワークフローと secrets 配置が完了済みであること |
| 上流 | UT-22（D1 migration） | staging D1 が利用可能であること |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | Cloudflare API Token が GitHub Secrets に登録済みであること |
| 下流 | 後続アプリ実装タスク | staging 環境が動作することを確認してから機能開発へ |

## 着手タイミング

| 条件 | 理由 |
| --- | --- |
| 04-serial マージ済み・`dev` ブランチに CD workflow が存在する | workflow が存在しないと実行できない |
| GitHub Secrets に `CLOUDFLARE_API_TOKEN` 等が登録済み | 未登録だと workflow が失敗する |
| staging Cloudflare Workers が provisioned 済み | デプロイ先が存在すること |

## 苦戦箇所・知見

**04-serial 実装時の発見点（未検証事項）**
- `@opennextjs/cloudflare deploy --env staging` が実際に動くかは 04-serial の実装のみでは未検証。OpenNext の `--env` フラグが `wrangler.toml` の `[env.staging]` セクションを参照するかどうかを初回実行で確認が必要
- `apps/web/wrangler.toml` に `[env.staging]` セクションが存在しない場合、`--env staging` は失敗またはデフォルト設定でデプロイされる可能性がある
- `@opennextjs/cloudflare` のバージョンによって `deploy` コマンドの引数や挙動が異なる場合があるため、package.json に固定されたバージョンの動作を確認すること
- staging と production で `workers_dev = true` / `route` の設定差分が wrangler.toml に反映されているか確認が必要

**CI/CD 統合の考慮点**
- CD workflow は CI workflow の完了を `needs` で直接参照していない（branch protection で代替）。もし CI が失敗しても CD が起動するリスクがあるため、初回 smoke 時に branch protection の設定を確認する
- path filter により `apps/web/**` と `apps/api/**` の変更が混在する PR では両方の CD が起動する場合がある

## 実行概要

1. 04-serial の PR を `dev` ブランチにマージ
2. GitHub Actions で `web-cd.yml` と `backend-deploy.yml` の実行を確認
3. 各ステップのログを確認し、失敗ステップがあれば原因調査
4. Cloudflare Dashboard で staging Workers のデプロイが反映されているか確認
5. staging URL にアクセスしてヘルスチェック（HTML or JSON レスポンスを確認）
6. smoke test 結果を `outputs/smoke-test-staging-YYYYMMDD.md` に記録

## 完了条件

- [ ] `dev` ブランチへのマージで `web-cd.yml` の staging deploy ステップが成功
- [ ] `dev` ブランチへのマージで `backend-deploy.yml` の staging deploy ステップが成功
- [ ] Cloudflare Dashboard で staging Workers が最新バージョンで表示される
- [ ] staging URL で `/api/health` 等のヘルスチェックが HTTP 200 を返す
- [ ] `@opennextjs/cloudflare deploy --env staging` の実挙動が確認・記録済み
- [ ] 失敗があった場合は原因と修正内容が記録済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/04-serial-cicd-secrets-and-environment-sync/outputs/phase-05/github-actions-drafts.md | 実装済み workflow の詳細 |
| 必須 | docs/04-serial-cicd-secrets-and-environment-sync/outputs/phase-04/workflow-topology.md | workflow 設計図 |
| 参考 | https://developers.cloudflare.com/workers/platform/deployments/ | Cloudflare Workers deploy |
| 参考 | https://opennext.js.org/cloudflare | OpenNext Cloudflare 公式 |
