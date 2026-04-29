# Phase 9: 無料枠想定

## Cloudflare Workers

| 項目 | 想定使用量 / 月 | 無料枠上限 | 余裕 |
| --- | --- | --- | --- |
| Requests | 認証コール 720 回（毎時 token refresh）| 100,000 / day | 圧倒的に余裕 |
| CPU time | JWT 署名 ~5ms × 720 = 3.6 sec | 10ms / req | OK |
| Secrets | `GOOGLE_SERVICE_ACCOUNT_JSON` × 3 環境 | 64 secrets / Worker | OK |

## Google Sheets API

| 項目 | 想定使用量 / 月 | クォータ | 余裕 |
| --- | --- | --- | --- |
| Token endpoint (`oauth2.googleapis.com/token`) | TTL 1h キャッシュにより ~720 / month | 制限なし（accounts.google.com 標準） | OK |
| Sheets API v4 read | UT-09 同期 5min 毎 → 8,640 req/month | 300 req/min/project = ~13M/month | 圧倒的に余裕 |

## 1Password

| 項目 | 件数 | プラン上限 | 余裕 |
| --- | --- | --- | --- |
| Vault item 追加 | +1（SA JSON）| 個人プラン無制限 | OK |

→ すべての無料 / 既存枠内で完結する。
