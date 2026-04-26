# Phase 06 — 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 名称 | 異常系検証 |
| タスク | UT-03 Sheets API 認証方式設定 |
| 状態 | pending |
| 作成日 | 2026-04-26 |
| 担当 | delivery |
| GitHub Issue | #5 |

---

## 目的

Sheets API 認証における認証失敗ケースを網羅的に洗い出し、
それぞれに対するエラーハンドリングの動作を検証する。
本番環境での障害発生時に素早くトリアージできるよう、
症状・原因・対処法の対応表（failure-case-matrix）を整備する。

---

## 実行タスク

### 6-1. Failure Case 一覧の定義

以下の各ケースを `outputs/phase-06/failure-case-matrix.md` に記録する。

---

#### FC-01: JSON key 不正（parse error）

| 項目 | 内容 |
| --- | --- |
| 原因 | `GOOGLE_SERVICE_ACCOUNT_JSON` の値が正しい JSON 形式でない |
| 発生タイミング | Workers 起動時 or `getSheetsAccessToken()` 呼び出し時 |
| 症状 | `SyntaxError: Unexpected token` または `Error: Invalid GOOGLE_SERVICE_ACCOUNT_JSON` |
| 期待するエラー | `Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: parse failed')` をスロー |
| 確認方法 | `GOOGLE_SERVICE_ACCOUNT_JSON="{broken json}"` を `.dev.vars` に設定して `wrangler dev` 起動 |
| 対処法 | シークレットの値を正しい JSON（1行圧縮）で再登録する |

---

#### FC-02: Service Account 権限不足（Sheets API 未有効化）

| 項目 | 内容 |
| --- | --- |
| 原因 | Google Cloud プロジェクトで Sheets API v4 が有効化されていない |
| 発生タイミング | OAuth2 トークン取得時またはSheetsAPI呼び出し時 |
| 症状 | HTTP 403 `PERMISSION_DENIED: Google Sheets API has not been used in project ...` |
| 期待するエラー | ステータスコード 403 とエラーボディをスローする |
| 確認方法 | Sheets API を無効化した状態でトークン取得を試みる（テスト用プロジェクトを使用） |
| 対処法 | Google Cloud Console → APIとサービス → Sheets API を有効化する |

---

#### FC-03: Service Account のスプレッドシートアクセス権限なし

| 項目 | 内容 |
| --- | --- |
| 原因 | 対象スプレッドシートに Service Account メールアドレスが共有設定されていない |
| 発生タイミング | Sheets API v4 でスプレッドシートデータを取得しようとした時 |
| 症状 | HTTP 403 `The caller does not have permission` |
| 期待するエラー | ステータスコード 403 をスローする |
| 確認方法 | スプレッドシートの共有設定から Service Account を削除して API を呼び出す |
| 対処法 | スプレッドシートの「共有」設定で Service Account メールを再追加する |

---

#### FC-04: トークン期限切れ → refresh フロー

| 項目 | 内容 |
| --- | --- |
| 原因 | キャッシュ済みアクセストークンの有効期限（1時間）が切れた |
| 発生タイミング | `getSheetsAccessToken()` 呼び出し時（キャッシュ有効期限チェック） |
| 症状 | Sheets API が HTTP 401 を返す、またはキャッシュの `expiresAt` が現在時刻を過ぎている |
| 期待する挙動 | `cachedToken` を無効化して新しいトークンを自動取得（refresh）する |
| 確認方法 | `cachedToken.expiresAt` をわざと過去の時刻に書き換えてリクエストを送る |
| 対処法 | TTL キャッシュの実装が正しければ自動 refresh される。手動対応不要 |

---

#### FC-05: .dev.vars ファイル不存在（ローカル開発）

| 項目 | 内容 |
| --- | --- |
| 原因 | `apps/api/.dev.vars` ファイルが存在しない状態で `wrangler dev` を起動した |
| 発生タイミング | `wrangler dev` 起動時 |
| 症状 | `env.GOOGLE_SERVICE_ACCOUNT_JSON` が `undefined` → `getSheetsAccessToken()` で JSON parse エラー |
| 期待するエラー | 明示的なエラーメッセージ（`GOOGLE_SERVICE_ACCOUNT_JSON is not configured`）をスローする |
| 確認方法 | `.dev.vars` を削除した状態で `wrangler dev` を起動してエンドポイントを呼び出す |
| 対処法 | `outputs/phase-05/local-dev-guide.md` の手順に従って `.dev.vars` を作成する |

---

#### FC-06: Cloudflare Secrets 未配置（Workers runtime エラー）

| 項目 | 内容 |
| --- | --- |
| 原因 | `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` が staging / production 環境で未実行 |
| 発生タイミング | Workers デプロイ後、`getSheetsAccessToken()` の初回呼び出し時 |
| 症状 | `env.GOOGLE_SERVICE_ACCOUNT_JSON` が `undefined` → エラースロー |
| 期待するエラー | `Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured')` をスロー |
| 確認方法 | `wrangler secret list` でシークレット一覧を確認し、未登録であることを意図的に再現する |
| 対処法 | `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env <staging|production>` を実行する |

---

#### FC-07: private_key の PEM フォーマット不正

| 項目 | 内容 |
| --- | --- |
| 原因 | Service Account JSON の `private_key` フィールドが正しい PKCS#8 PEM 形式でない |
| 発生タイミング | `crypto.subtle.importKey()` 呼び出し時 |
| 症状 | `DOMException: Failed to execute 'importKey'` または類似のエラー |
| 期待するエラー | `Error('Failed to import private key: <原因>')` をスロー |
| 確認方法 | `private_key` の `\n` を空白に置換した壊れたキーで `importKey` を呼び出す |
| 対処法 | JSON key を再ダウンロードして Cloudflare Secrets を再登録する |

---

### 6-2. Failure Case 検証マトリクス（サマリー）

| FC | 原因カテゴリ | 発生環境 | 自動回復 | 手動対処難易度 |
| --- | --- | --- | --- | --- |
| FC-01 | 設定不正 | local / staging / prod | 不可 | 低（再登録）|
| FC-02 | GCP設定漏れ | local / staging / prod | 不可 | 低（API有効化）|
| FC-03 | Sheets共有設定漏れ | local / staging / prod | 不可 | 低（共有追加）|
| FC-04 | トークン期限切れ | local / staging / prod | 自動 refresh | 不要 |
| FC-05 | .dev.vars 欠損 | local のみ | 不可 | 低（ファイル作成）|
| FC-06 | Secrets 未配置 | staging / prod | 不可 | 低（secret put）|
| FC-07 | PEM 不正 | local / staging / prod | 不可 | 中（key 再取得）|

---

## 参照資料

| 種別 | パス / URL | 用途 |
| --- | --- | --- |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/phase-05.md | 実装仕様・Runbook |
| 参考 | https://developers.google.com/identity/protocols/oauth2/service-account#error-codes | OAuth2 エラーコード |
| 参考 | https://developers.cloudflare.com/workers/observability/errors/ | Workers エラー観測 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-case-matrix.md | 異常系ケース網羅マトリクス |

---

## 完了条件

- [ ] FC-01〜FC-07 の全ケースが `outputs/phase-06/failure-case-matrix.md` に記録されている
- [ ] 各ケースの「確認方法」が具体的な手順（コマンド例または操作手順）で記述されている
- [ ] 各ケースに「期待するエラー」と「対処法」が明記されている
- [ ] 自動回復可能なケース（FC-04）と手動対処が必要なケースが明確に区別されている

---

## 次 Phase

Phase 07 — 検証項目網羅性（AC トレーサビリティマトリクスの作成）に進む。

異常系を網羅した後、受入条件（AC-1〜AC-7）全項目が
どの Phase でカバーされているかを確認し、検証漏れがないことを保証する。
