# Cloudflare 手動確認チェックリスト（Manual Smoke Test）

> 作成日: 2026-04-23
> 対象タスク: 01b-parallel-cloudflare-base-bootstrap
> 担当: インフラ担当者が実環境で目視確認する

## Cloudflare Pages 確認

- [ ] `ubm-hyogo-web` プロジェクトが Dashboard に存在する
- [ ] `ubm-hyogo-web-staging` プロジェクトが Dashboard に存在する
- [ ] `main` ブランチが production 環境（`ubm-hyogo-web`）に接続されている
- [ ] `dev` ブランチが staging 環境（`ubm-hyogo-web-staging`）に接続されている
- [ ] Pages の build count が 500/月 枠内で追跡できる（Dashboard > Pages > Usage）

## Cloudflare Workers 確認

- [ ] `ubm-hyogo-api` が Workers リストに存在する
- [ ] `ubm-hyogo-api-staging` が Workers リストに存在する
- [ ] Workers の request count が 100k/day 枠内で追跡できる（Dashboard > Workers > Analytics）

## Cloudflare D1 確認

- [ ] `ubm-hyogo-db-prod` データベースが存在する
- [ ] `ubm-hyogo-db-staging` データベースが存在する
- [ ] D1 のストレージが 5GB 枠内で追跡できる（Dashboard > D1 > Usage）
- [ ] `wrangler d1 migrations apply ubm-hyogo-db-prod` が成功する
- [ ] `wrangler d1 migrations apply ubm-hyogo-db-staging --env staging` が成功する

## API Token 確認（AC-3）

- [ ] API Token のスコープが Pages:Edit + Workers:Edit + D1:Edit の3つのみ
- [ ] Token が GitHub Secrets の `CLOUDFLARE_API_TOKEN` に登録されている（または登録予定が記録されている）
- [ ] `CLOUDFLARE_ACCOUNT_ID` が GitHub Secrets に登録されている（または登録予定が記録されている）

## Rollback 確認（ドライラン）（AC-5）

- [ ] Pages の Deployments ページでロールバック対象のデプロイが選択できる
- [ ] `wrangler rollback --name ubm-hyogo-api` コマンドが実行可能（または dry-run で確認）
- [ ] Pages rollback と Workers rollback が相互に独立していること（片方 rollback でもう片方が影響を受けない）

## 環境変数確認

- [ ] `NEXT_PUBLIC_API_URL` が staging (`https://api-staging.ubm-hyogo.workers.dev`) に設定されている
- [ ] `NEXT_PUBLIC_API_URL` が production (`https://api.ubm-hyogo.workers.dev`) に設定されている
- [ ] wrangler.toml の `ENVIRONMENT` 変数が staging/production で正しく分岐している

## 正常系動作確認

- [ ] `curl https://ubm-hyogo-web.pages.dev` で 200 OK が返る
- [ ] `curl https://ubm-hyogo-web-staging.pages.dev` で 200 OK が返る
- [ ] `curl https://api.ubm-hyogo.workers.dev/api/health` で 200 OK が返る
- [ ] `curl https://api-staging.ubm-hyogo.workers.dev/api/health` で 200 OK が返る

## 未確認項目（Phase 12 行き）

| 項目 | 理由 |
| --- | --- |
| M-02: `ubm-hyogo-web.pages.dev` URL の最終確定 | DNS 設定が完了するまで確定しない |

## 失敗時の戻り先（逆引き表）

| 問題 | 戻り先 |
| --- | --- |
| branch / env drift | Phase 2 / 8 |
| source-of-truth drift | Phase 2 / 3 |
| output path drift | Phase 5 / 8 |
| API Token スコープ超過 | Phase 4 |
| rollback 手順が runbook に未記載 | Phase 5 / 8 |
| Analytics で quota 追跡不可 | Phase 5 |
