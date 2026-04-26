# 異常系マトリクス（Failure Case Matrix）

## FC-01: JSON key 不正（parse error）

| 項目 | 内容 |
| --- | --- |
| 原因 | `GOOGLE_SERVICE_ACCOUNT_JSON` が正しい JSON 形式でない |
| 発生タイミング | `getAccessToken()` 呼び出し時 |
| 症状 | `SheetsAuthError: Invalid GOOGLE_SERVICE_ACCOUNT_JSON: parse failed` |
| 確認方法 | `.dev.vars` に `GOOGLE_SERVICE_ACCOUNT_JSON={broken` を設定してテスト |
| 対処法 | シークレットの値を正しい JSON（1行圧縮）で再登録する |
| テスト | AUTH-06 でカバー済み |

## FC-02: Service Account 権限不足（Sheets API 未有効化）

| 項目 | 内容 |
| --- | --- |
| 原因 | Google Cloud プロジェクトで Sheets API v4 が有効化されていない |
| 症状 | HTTP 403 `PERMISSION_DENIED: Google Sheets API has not been used` |
| 対処法 | `gcloud services enable sheets.googleapis.com --project=<PROJECT_ID>` |

## FC-03: スプレッドシートアクセス権限なし

| 項目 | 内容 |
| --- | --- |
| 原因 | 対象スプレッドシートに Service Account が共有されていない |
| 症状 | HTTP 403 `The caller does not have permission` |
| 対処法 | スプレッドシートの「共有」設定で SA メールを再追加する |

## FC-04: アクセストークン期限切れ

| 項目 | 内容 |
| --- | --- |
| 原因 | キャッシュ済みトークンの有効期限（1時間）が切れた |
| 症状 | HTTP 401 `Invalid Credentials` |
| 期待する動作 | `getAccessToken()` が自動的に新しいトークンを取得する（TTL チェック） |
| 実装 | `expiresAt - 60` 秒前に再取得するロジック実装済み |

## FC-05: PEM 形式の private_key が不正

| 項目 | 内容 |
| --- | --- |
| 原因 | JSON key の `private_key` フィールドが壊れているまたは欠損 |
| 症状 | `SheetsAuthError: Failed to import private key` |
| 対処法 | JSON key を再発行して Cloudflare Secrets を更新する |
| テスト | AUTH-01b でカバー済み |

## FC-06: Cloudflare Secrets 未配置

| 項目 | 内容 |
| --- | --- |
| 原因 | staging/production に `GOOGLE_SERVICE_ACCOUNT_JSON` が設定されていない |
| 症状 | `SheetsAuthError: Invalid GOOGLE_SERVICE_ACCOUNT_JSON` または `undefined` エラー |
| 確認方法 | `wrangler secret list --env staging` で一覧確認 |
| 対処法 | runbook の手順 2 に従って Cloudflare Secrets に配置する |

## FC-07: Workers KV binding 未設定

| 項目 | 内容 |
| --- | --- |
| 原因 | `SHEETS_TOKEN_CACHE` KV namespace が wrangler.toml に設定されていない |
| 症状 | エラーにはならない（in-memory fallback が動作する） |
| 影響 | Worker インスタンス間でキャッシュが共有されない（パフォーマンス低下） |
| 対処法 | wrangler.toml に KV binding を追加する（オプション） |
