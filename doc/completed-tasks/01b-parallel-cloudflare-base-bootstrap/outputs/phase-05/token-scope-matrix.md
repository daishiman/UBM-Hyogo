# Cloudflare API Token スコープ定義表

> 作成日: 2026-04-23
> 対象タスク: 01b-parallel-cloudflare-base-bootstrap

## Token 定義

| Token 名 | 用途 | 配置先 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | CI/CD デプロイ認証 | GitHub Secrets（実投入: 04-cicd-secrets） |

## スコープ定義（最小権限の原則）

| スコープ | リソース種別 | 権限レベル | 必要理由 |
| --- | --- | --- | --- |
| Cloudflare Pages | Account | Edit | Pages プロジェクトの作成・デプロイ |
| Workers Scripts | Account | Edit | Workers サービスのデプロイ・更新 |
| D1 | Account | Edit | D1 マイグレーションの実行 |

## 付与しないスコープ（明示的に除外）

| スコープ | 除外理由 |
| --- | --- |
| Zone > DNS | CI/CD には不要 |
| Zone > Cache Purge | CI/CD には不要 |
| Account > Cloudflare Zero Trust | 初回スコープ外（UN-03） |
| Account > R2 | 初回スコープ外（UN-01） |
| Account > KV | 初回スコープ外（UN-02） |

## Token 作成手順

1. Cloudflare Dashboard → My Profile → API Tokens → Create Token
2. "Edit Cloudflare Workers" テンプレートを選択
3. 上記3スコープのみを残し、余分なスコープを削除
4. Account Resource: 特定アカウントを指定
5. Zone Resource: 全ゾーン または 特定ゾーン
6. TTL: 必要に応じて設定（推奨: 1年）
7. IP フィルタリング: 任意（推奨: GitHub Actions の IP レンジを許可）
8. Create Token → 生成されたトークンを 1Password に保存

## 検証方法

```bash
# Token のスコープを確認（Token 作成後）
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
# → "status": "active" が返ることを確認

# wrangler で認証確認
CLOUDFLARE_API_TOKEN=<token> wrangler whoami
# → ユーザー名とアカウントIDが表示されることを確認
```

## セキュリティ方針

| 方針 | 内容 |
| --- | --- |
| 最小権限 | 必要な3スコープのみ付与 |
| 分離 | deploy auth（GitHub Secrets）と runtime secrets（Cloudflare Secrets）を分離 |
| 保管 | 実値は 1Password に保管。ドキュメントには記載しない |
| ローテーション | 漏洩疑いがある場合は即時 revoke し再作成 |
| 実投入タイミング | GitHub Secrets への実投入は `04-serial-cicd-secrets-and-environment-sync` で実施 |
