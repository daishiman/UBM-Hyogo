# UBM エラーコード体系ドラフト（Phase 1 成果物）

## 命名規則

```
UBM-N xxx
    │   └── 連番（カテゴリ内の通し番号、3 桁固定）
    └────── カテゴリ番号（1 桁、HTTP ステータスファミリーと近似）
```

例: `UBM-5000` = サーバ内部エラー、未知例外の汎用ラベル。

## 4 大区分

| カテゴリ | プレフィックス | HTTP ステータス | 用途 |
| --- | --- | --- | --- |
| クライアントエラー | `UBM-1xxx` | 400 / 404 / 409 / 422 | バリデーション失敗・不正リクエスト・リソース未存在 |
| 認証・認可エラー | `UBM-4xxx` | 401 / 403 | 未認証・権限不足・トークン期限切れ |
| サーバ内部エラー | `UBM-5xxx` | 500 / 503 | 未知例外・D1 失敗・内部ロジック破綻 |
| 外部統合エラー | `UBM-6xxx` | 502 / 503 / 504 | Sheets API 失敗・Auth.js 連携失敗・タイムアウト |

## 主要コード（最小セット・ドラフト）

### UBM-1xxx（クライアントエラー）

| コード | HTTP | title | 用途 |
| --- | --- | --- | --- |
| UBM-1000 | 400 | Bad Request | リクエスト不正の汎用 |
| UBM-1001 | 422 | Validation Failed | スキーマバリデーション失敗 |
| UBM-1002 | 409 | Conflict | 一意制約違反・状態不整合 |
| UBM-1404 | 404 | Not Found | リソース未存在・未定義ルート |

### UBM-4xxx（認証・認可エラー）

| コード | HTTP | title | 用途 |
| --- | --- | --- | --- |
| UBM-4001 | 401 | Unauthorized | 未認証・トークン無効 |
| UBM-4002 | 403 | Forbidden | 権限不足 |
| UBM-4003 | 403 | Tool Forbidden | SDK `canUseTool` 拒否（将来拡張） |

### UBM-5xxx（サーバ内部エラー）

| コード | HTTP | title | 用途 |
| --- | --- | --- | --- |
| UBM-5000 | 500 | Internal Server Error | 未知例外の正規化先 |
| UBM-5001 | 500 | Database Error | D1 操作失敗（接続・SQL）|
| UBM-5101 | 500 | Compensation Failed | 補償処理の二重失敗 |
| UBM-5500 | 503 | Service Unavailable | 一時的な内部過負荷 |

### UBM-6xxx（外部統合エラー）

| コード | HTTP | title | 用途 |
| --- | --- | --- | --- |
| UBM-6001 | 502 | External Service Error | Sheets API 等の 5xx |
| UBM-6002 | 504 | External Service Timeout | リトライ累計タイムアウト超過 |
| UBM-6003 | 503 | External Service Throttled | レート制限・429 |
| UBM-6004 | 502 | External Service Auth Error | OAuth トークン取得失敗 |

## 既知 → コードマッピング指針

| 例外/状況 | 正規化先 | 補足 |
| --- | --- | --- |
| `throw new Error(...)`（未捕捉） | UBM-5000 | `errorHandler` の最終 fallback |
| zod スキーマ失敗 | UBM-1001 | `detail` に validation issue を要約（PII 除外） |
| D1 prepare/exec 失敗 | UBM-5001 | SQL 文・bind 値はログのみ |
| 補償処理 catch | UBM-5101 | `cause` チェーンで原因を保持 |
| Sheets API 5xx | UBM-6001 | `withRetry` 上限超過後の最終形 |
| Sheets API timeout | UBM-6002 | `totalTimeoutMs` 超過 |
| Google OAuth 失敗 | UBM-6004 | `getAccessToken` エラー |
| 認証ミドルウェア失敗 | UBM-4001 | 401 + WWW-Authenticate ヘッダ検討 |

## i18n 設計（将来拡張）

- `code` は機械可読・不変。`title` / `defaultDetail` は i18n 辞書のキーとして利用
- MVP では辞書を `packages/shared/src/errors.ts` の inline 定数として保持
- 将来 `@ubm-hyogo/i18n` パッケージへ切り出し可能な構造（key を export 化）

## 次 Phase への引き継ぎ

Phase 2 で本ドラフトを `error-code-taxonomy.md`（確定版）に昇格させる。確定時の追加検討事項:

- 各コードの `defaultDetail` 文言（日本語）を確定
- `i18nKey` の命名規則（`error.UBM_5000` 形式想定）
- HTTP ステータスとの 1:1 対応の例外ケース（同一コードで複数 status を許すか）
- 外部公開可否（一部コードはセキュリティ観点で内部限定にする可能性）
