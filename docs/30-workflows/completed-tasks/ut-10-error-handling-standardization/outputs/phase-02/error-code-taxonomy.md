# UBM エラーコード体系（確定版・Phase 2 成果物）

## 命名規則（確定）

```
UBM-Nxxx
    │   └── 連番 3 桁固定（カテゴリ内で一意）
    └────── カテゴリ番号 1 桁（HTTP ステータスファミリーと近似）
```

regex: `^UBM-[14-6]\d{3}$`

## カテゴリ定義（4 大区分）

| カテゴリ | プレフィックス | HTTP ファミリー | 想定 source |
| --- | --- | --- | --- |
| クライアントエラー | `UBM-1xxx` | 4xx (400/404/409/422) | リクエスト不正・バリデーション |
| 認証・認可エラー | `UBM-4xxx` | 4xx (401/403) | Auth.js / セッション / 権限 |
| サーバ内部エラー | `UBM-5xxx` | 5xx (500/503) | 内部例外・D1 失敗 |
| 外部統合エラー | `UBM-6xxx` | 5xx (502/503/504) | Sheets API / 外部サービス |

## 確定コード一覧

### UBM-1xxx（クライアントエラー）

| コード | HTTP | title | defaultDetail | i18nKey |
| --- | --- | --- | --- | --- |
| UBM-1000 | 400 | Bad Request | リクエストが不正です。 | error.UBM_1000 |
| UBM-1001 | 422 | Validation Failed | 入力値の検証に失敗しました。 | error.UBM_1001 |
| UBM-1002 | 409 | Conflict | リソースの状態が競合しました。 | error.UBM_1002 |
| UBM-1404 | 404 | Not Found | 対象のリソースが見つかりません。 | error.UBM_1404 |

### UBM-4xxx（認証・認可エラー）

| コード | HTTP | title | defaultDetail | i18nKey |
| --- | --- | --- | --- | --- |
| UBM-4001 | 401 | Unauthorized | 認証が必要です。 | error.UBM_4001 |
| UBM-4002 | 403 | Forbidden | この操作の権限がありません。 | error.UBM_4002 |
| UBM-4003 | 403 | Tool Forbidden | このツールは利用できません。 | error.UBM_4003 |

### UBM-5xxx（サーバ内部エラー）

| コード | HTTP | title | defaultDetail | i18nKey |
| --- | --- | --- | --- | --- |
| UBM-5000 | 500 | Internal Server Error | 内部エラーが発生しました。 | error.UBM_5000 |
| UBM-5001 | 500 | Database Error | データベース操作に失敗しました。 | error.UBM_5001 |
| UBM-5101 | 500 | Compensation Failed | 補償処理に失敗しました。 | error.UBM_5101 |
| UBM-5500 | 503 | Service Unavailable | 一時的にサービスが利用できません。 | error.UBM_5500 |

### UBM-6xxx（外部統合エラー）

| コード | HTTP | title | defaultDetail | i18nKey |
| --- | --- | --- | --- | --- |
| UBM-6001 | 502 | External Service Error | 外部サービスとの通信に失敗しました。 | error.UBM_6001 |
| UBM-6002 | 504 | External Service Timeout | 外部サービスへのリクエストがタイムアウトしました。 | error.UBM_6002 |
| UBM-6003 | 503 | External Service Throttled | 外部サービスのレート制限に達しました。 | error.UBM_6003 |
| UBM-6004 | 502 | External Service Auth Error | 外部サービスの認証に失敗しました。 | error.UBM_6004 |

## マッピング指針（既知の例外 → コード）

| 例外/状況 | 正規化先コード | 補足 |
| --- | --- | --- |
| `throw new Error(...)`（未捕捉） | UBM-5000 | `errorHandler` の最終 fallback |
| `app.notFound` トリガー | UBM-1404 | Hono `notFound` ハンドラ経由 |
| zod スキーマ失敗（将来） | UBM-1001 | `detail` に validation issue 要約（PII strip）|
| D1 prepare/exec 失敗 | UBM-5001 | SQL は log 限定 |
| `runWithCompensation` 二重失敗 | UBM-5101 | `cause` チェーン保持 |
| Sheets API 5xx | UBM-6001 | `withRetry` 上限超過後の最終形 |
| Sheets API timeout（累計） | UBM-6002 | `totalTimeoutMs` 超過 |
| Sheets API 429 | UBM-6003 | rate limit 検出 |
| Google OAuth トークン失敗 | UBM-6004 | `getAccessToken` エラー |
| 認証ミドルウェア失敗 | UBM-4001 | 401 + 必要に応じて `WWW-Authenticate` |

## 拡張ルール

- 新規コード追加時は本ドキュメントとコード（`UBM_ERROR_CODES` 定数）の両方を同時更新する（DRY 原則）
- HTTP ステータスを既存とは異なる組み合わせにする場合は、Phase 3 相当の設計レビューを必須とする
- 同一カテゴリ内で `UBM-1010` 〜 `UBM-1099` までは bug fix 用予約番号として確保

## 不変条件

| # | 不変条件 |
| --- | --- |
| INV-T1 | コード文字列は `UbmErrorCode` 型ユニオンで網羅される（リテラル型による型安全性）|
| INV-T2 | コード→ステータス・title・defaultDetail の対応は `UBM_ERROR_CODES` 単一定数に集約 |
| INV-T3 | 機械可読 `code` と人間可読 `title` / `defaultDetail` を分離（i18n 拡張容易性）|
