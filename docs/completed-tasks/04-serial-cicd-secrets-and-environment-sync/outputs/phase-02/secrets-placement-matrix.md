# Secret 配置マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 2 / 13 |
| 作成日 | 2026-04-26 |
| 状態 | completed |

---

## 配置マトリクス

| 変数名 | 種別 | Cloudflare Secrets | GitHub Secrets | GitHub Variables | 1Password Environments | wrangler.toml vars | 備考 |
| --- | --- | :---: | :---: | :---: | :---: | :---: | --- |
| `CLOUDFLARE_API_TOKEN` | deploy | ✗ | ✓ | ✗ | ✗ | ✗ | CI/CD 実行時のみ参照。GitHub Environment Secret として dev/main で値を分離 |
| `CLOUDFLARE_API_TOKEN_DEV` | deploy | ✗ | ✓ | ✗ | ✗ | ✗ | dev ブランチデプロイ専用 Token（main Token と分離） |
| `CLOUDFLARE_API_TOKEN_MAIN` | deploy | ✗ | ✓ | ✗ | ✗ | ✗ | main ブランチデプロイ専用 Token（dev Token と分離） |
| `CLOUDFLARE_ACCOUNT_ID` | deploy config | ✗ | ✗ | ✓ | ✗ | ✗ | 非機密だが wrangler コマンドに必要。GitHub Variables に統一 |
| `GOOGLE_CLIENT_SECRET` | runtime | ✓ | ✗ | ✗ | ✓ | ✗ | Workers runtime の Auth.js Google OAuth に必要。1Password が正本 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | runtime | ✓ | ✗ | ✗ | ✓ | ✗ | Google Forms API への server-side アクセスに必要。1Password が正本 |
| `NEXT_PUBLIC_API_URL` | public | ✗ | ✗ | ✓ | ✗ | ✓ | 公開設定値。暗号化不要。GitHub Variables + wrangler.toml vars に記載 |
| `NEXT_PUBLIC_GOOGLE_FORM_URL` | public | ✗ | ✗ | ✗ | ✗ | ✓ | フォーム固定 URL。wrangler.toml に直接記載可（公開情報） |
| `DATABASE_ID` (D1) | deploy config | ✗ | ✗ | ✓ | ✗ | ✓ | D1 の binding ID。wrangler.toml に記載、機密ではない |
| `AUTH_SECRET` | runtime | ✓ | ✗ | ✗ | ✓ | ✗ | Auth.js のセッション署名用シークレット。Workers runtime に必要 |

---

## 種別定義

| 種別 | 定義 | 置き場の原則 |
| --- | --- | --- |
| **runtime** | Workers が実行時に参照する機密値 | Cloudflare Secrets のみ。GitHub Actions には渡さない |
| **deploy** | CI/CD が Cloudflare へデプロイする際に使用する機密値 | GitHub Secrets のみ。Cloudflare Secrets には登録しない |
| **public** | 暗号化不要な設定値・公開 URL 等 | GitHub Variables または wrangler.toml vars |
| **deploy config** | デプロイ設定値（機密ではないがビルドに必要） | wrangler.toml または GitHub Variables |

---

## 配置先の定義と役割

### Cloudflare Secrets
- **用途:** Workers の実行コンテキストで `env.SECRET_NAME` として参照される
- **設定方法:** `wrangler secret put SECRET_NAME --env staging/production`
- **アクセス範囲:** Workers runtime のみ。GitHub Actions からは直接参照不可
- **ライフサイクル:** wrangler または Cloudflare ダッシュボードで管理

### GitHub Secrets
- **用途:** GitHub Actions workflow の実行コンテキストで `${{ secrets.SECRET_NAME }}` として参照される
- **設定方法:** GitHub リポジトリ Settings → Secrets and variables → Actions
- **アクセス範囲:** GitHub Actions のみ。Workers runtime には渡さない
- **ライフサイクル:** GitHub UI または gh CLI で管理

### GitHub Variables
- **用途:** 非機密の設定値を GitHub Actions / workflow で参照する
- **設定方法:** GitHub リポジトリ Settings → Secrets and variables → Variables
- **アクセス範囲:** GitHub Actions（暗号化なしで参照可能）
- **ライフサイクル:** GitHub UI または gh CLI で管理

### 1Password Environments
- **用途:** ローカル開発環境でのシークレット正本。平文 `.env` の代わりに使用
- **設定方法:** 1Password CLI (`op`) または 1Password アプリで管理
- **アクセス範囲:** ローカル開発者のみ（チームメンバー全員に共有可）
- **ライフサイクル:** `op` CLI で取得し、`op run` で環境変数として注入

### wrangler.toml vars
- **用途:** 非機密の環境変数を Workers に渡す。コミット対象
- **設定方法:** `wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` セクション
- **アクセス範囲:** Workers runtime（公開情報として扱う）
- **ライフサイクル:** Git でバージョン管理

---

## 禁止パターン

以下のパターンは本設計で明示的に禁止する。

| 禁止パターン | 理由 |
| --- | --- |
| `GOOGLE_CLIENT_SECRET` を GitHub Secrets に登録する | deploy secret と runtime secret が混在し、rotate 対象の判断が曖昧になる |
| `CLOUDFLARE_API_TOKEN` を Cloudflare Secrets に登録する | Workers runtime から Cloudflare API を操作できる状態になり、権限過剰 |
| 平文 `.env` をリポジトリにコミットする | 機密値が Git 履歴に残り、revoke しても履歴から取得可能になる |
| `AUTH_SECRET` を wrangler.toml に直接記載する | コミット対象ファイルに機密値が含まれる |
| dev と main で同一の Cloudflare API Token を使用する | dev Token 漏洩が production に影響する |

---

## Rotation 責任マトリクス

| 変数名 | Rotation 担当 | 更新が必要な場所 | 頻度 |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN_DEV` | インフラ担当 | GitHub Secrets | 90日 / 担当者交代時 |
| `CLOUDFLARE_API_TOKEN_MAIN` | インフラ担当 | GitHub Secrets | 90日 / 担当者交代時 |
| `GOOGLE_CLIENT_SECRET` | 認証担当 | Cloudflare Secrets (dev/main) + 1Password | Google 推奨 / 漏洩時即時 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | インフラ担当 | Cloudflare Secrets (dev/main) + 1Password | 90日 / 担当者交代時 |
| `AUTH_SECRET` | 認証担当 | Cloudflare Secrets (dev/main) + 1Password | 180日 / 漏洩時即時 |
