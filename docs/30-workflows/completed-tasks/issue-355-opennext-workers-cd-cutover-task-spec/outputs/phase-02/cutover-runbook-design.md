# Cloudflare side cutover runbook 設計骨子（6 セクション）

`outputs/phase-05/cutover-runbook.md` として Phase 5 で本文を作成する。Phase 2 では以下 6 セクションの目次・各セクションの記載項目を確定する。AC-6 の正本仕様。

## 全体方針

- Cloudflare 側手動オペレーションは **`bash scripts/cf.sh ...` ラッパー経由**を必須とし、`wrangler` 直接実行を runbook に書かない（CLAUDE.md / UNASSIGNED-G 整合）
- secret hygiene: API Token / OAuth secret 等の実値を runbook に貼らない
- staging は `*.workers.dev` 完結、production は custom domain 移譲を伴う

## S1. 前提

- 対象環境（staging / production）と URL 一覧
- 必要権限（Cloudflare API Token scope: Workers Scripts:Edit、Workers Routes:Edit、Zone:Read（Pages:Edit は dormant 操作用の別承認 token のみ））
- 事前確認: `bash scripts/cf.sh whoami` で認証通過、wrangler 4.85.0 整合

## S2. staging cutover 手順

- 操作1: `dev` ブランチに本タスク改修を merge → `web-cd.yml` deploy-staging job 自動起動
- 操作2: `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` を CD が実行（手動再現は同コマンド）
- 操作3: `https://ubm-hyogo-web-staging.<account>.workers.dev` の HTTP 応答確認
- 操作4: UT-06 Phase 11 smoke S-01〜S-10 を staging URL に対し実行
- 操作5: 旧 staging Pages project (`<project>-staging`) を Dashboard で「Pause Deployments」ボタン押下

## S3. production cutover 手順

- 操作1: staging 全 smoke PASS が AC-3 gate 通過後にのみ実施
- 操作2: `main` ブランチへ merge → `web-cd.yml` deploy-production job 自動起動
- 操作3: `wrangler deploy --env production` 完了確認、`VERSION_ID` を記録（rollback 用）
- 操作4: production custom domain を Pages project から Workers script へ移譲（S4 参照）
- 操作5: production smoke 再実行（同 S-01〜S-10）

## S4. custom domain 移譲

- 前提: production custom domain は Cloudflare Dashboard 上で Pages project に紐付いている
- 手順1: Workers script `ubm-hyogo-web-production` の Custom Domains から target domain を Add
- 手順2: SSL 証明書発行待ち（5 分目安）
- 手順3: 旧 Pages project の Custom Domains から該当 domain を Remove
- 手順4: `dig` / `curl` で TLS 証明書が Workers 経由になったことを確認
- staging は `*.workers.dev` 完結のため本セクション対象外

## S5. rollback 手順

- 一次手段（推奨）: `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env <stage>`
- 二次手段（cutover 直後 dormant 期間内のみ）: 旧 Pages project の `Resume Deployments` → 旧 deploy URL を custom domain へ再 attach
- 判断基準: smoke S-01〜S-10 のうち 1 件でも本番で FAIL → 即座に一次手段
- 通知: rollback 実行は GitHub Issue / Slack に記録（本タスク runbook 内テンプレ）

## S6. Pages dormant 期間運用

- 期間: cutover 完了後 1 sprint（2 週間）
- 期間中: Pages project は `Pause Deployments` 状態で残置、custom domain は外す
- 期間後: Cloudflare Dashboard から Pages project を delete（runbook に削除手順を記載、本タスクでは実行しない）

## 受け入れ基準（AC-6）との対応

| AC-6 要件 | 対応セクション |
| --- | --- |
| 前提 | S1 |
| staging cutover 手順 | S2 |
| production cutover 手順 | S3 |
| custom domain 移譲 | S4 |
| rollback 手順 | S5 |
| Pages dormant 期間運用 | S6 |

6 セクションすべてを Phase 5 で本文化することで AC-6 を満たす。
