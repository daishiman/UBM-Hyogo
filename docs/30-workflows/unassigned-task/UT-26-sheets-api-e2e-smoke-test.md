# UT-26: Sheets API エンドツーエンド疎通確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-26 |
| タスク名 | Sheets API エンドツーエンド疎通確認 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | なし（UT-03 はモジュール実装と fetch mock テスト、本タスクは実 API への疎通確認） |
| 組み込み先 | - |
| 検出元 | UT-03 実装後に実 API 疎通が別タスクとして分離 |

## 目的

UT-03 で実装した `packages/integrations/sheets-auth.ts` モジュールと UT-25 で配置した `GOOGLE_SERVICE_ACCOUNT_JSON` シークレットを使い、実際の Google Sheets API v4 への認証・データ取得疎通を確認する。UT-03 のテストは fetch mock を使用しており実 API への疎通は SA 設定後に別途実施が必要なため、独立タスクとして分離された。本タスク完了により、後続の UT-09（Sheets→D1 同期ジョブ）が本番 Sheets API に安全にアクセスできることが保証される。

## スコープ

### 含む

- staging 環境の Cloudflare Workers から Google Sheets API v4（`spreadsheets.values.get`）への疎通確認
- Service Account 認証フロー（JWT 生成 → アクセストークン取得 → API 呼び出し）の end-to-end 動作確認
- 対象スプレッドシート（formId: `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` に紐づく Google Sheets）からのデータ取得
- エラーケースの確認（401 / 403 / 429 のハンドリングが期待通りに動作すること）
- 疎通確認結果の記録（成功ログ・レスポンスサマリーを設計文書に追記）
- ローカル開発環境（`.dev.vars` 使用）での疎通確認

### 含まない

- 同期ロジックの実装（UT-09 のスコープ）
- D1 へのデータ書き込み（UT-09 / UT-21 のスコープ）
- production 環境への本番データ書き込み（疎通確認は読み取りのみ）
- Sheets API のレート制限対応の実装（UT-09 のスコープ）
- sheets-auth.ts モジュールの機能追加（UT-03 のスコープ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-03（Sheets API 認証方式設定） | sheets-auth.ts が実装済みであること |
| 上流 | UT-25（Cloudflare Secrets 本番配置） | `GOOGLE_SERVICE_ACCOUNT_JSON` が staging / production に配置済みであること |
| 上流 | 01c-parallel-google-workspace-bootstrap | Service Account に対象 Sheets スプレッドシートの閲覧権限が付与済みであること |
| 下流 | UT-09（Sheets→D1 同期ジョブ実装） | 本タスク完了により本番 Sheets API へのアクセスが保証される |

## 着手タイミング

> **着手前提**: UT-03 と UT-25 の両方が完了していること。対象 Sheets に Service Account メールアドレスの共有設定が済んでいること。

| 条件 | 理由 |
| --- | --- |
| UT-03 完了 | sheets-auth.ts の実装が存在しないと疎通確認スクリプトが作成できない |
| UT-25 完了 | `GOOGLE_SERVICE_ACCOUNT_JSON` が Workers に配置されていないと認証フローが動作しない |
| Service Account の Sheets 共有設定済み | 未設定の場合 403 PERMISSION_DENIED が返り、疎通確認が失敗する |

## 苦戦箇所・知見

**1. fetch mock テストと実 API の差分**
UT-03 のユニットテストは `fetch` をモックしているため、JWT 署名・トークン取得フローの実際の HTTP 通信が検証されていない。実 API では Google の OAuth エンドポイント（`https://oauth2.googleapis.com/token`）への POST リクエストが必要で、Workers の Edge Runtime 上で Web Crypto API による RSA-SHA256 署名が正しく動作するかを実機で確認する必要がある。

**2. Service Account の権限付与漏れ**
疎通確認が 403 で失敗する場合、原因は (a) Service Account メールアドレスが Sheets に共有されていない、(b) `GOOGLE_SERVICE_ACCOUNT_JSON` の値が壊れている（改行コード問題）、(c) Sheets API が Google Cloud Project で有効化されていない、のいずれかが多い。エラーメッセージが「PERMISSION_DENIED」だけでは原因が特定しにくいため、各ステップを順に確認すること。

**3. formId と spreadsheetId の対応確認**
Google Forms の formId（`119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`）と、回答が格納される Google Sheets の spreadsheetId は異なる。疎通確認で使用する spreadsheetId は Forms の「回答」タブからリンクされたスプレッドシートの URL から取得する。

**4. Workers ローカル開発での wrangler dev 環境**
`wrangler dev` でローカル実行する場合、`.dev.vars` に設定した `GOOGLE_SERVICE_ACCOUNT_JSON` が正しく読み込まれること、および外部への fetch が許可されていること（`wrangler dev --local` では制限がかかる場合がある）を確認する。`wrangler dev`（非 `--local`）モードを使うと外部 API への fetch が通りやすい。

**5. アクセストークンの TTL と再取得**
sheets-auth.ts がアクセストークンを TTL 1時間でキャッシュする設計の場合、疎通確認セッション中にキャッシュの動作も確認する。KV や in-memory cache の実装が Workers の再起動で失われることを前提とした設計になっているか確認する。

## 実行概要

1. staging 環境向けの疎通確認スクリプトを作成する（`apps/api/src/scripts/smoke-test-sheets.ts` または Hono の dev エンドポイントとして実装）
2. スクリプトから `sheets-auth.ts` の認証フローを呼び出し、JWT 生成とアクセストークン取得を実行する
3. 取得したアクセストークンで Google Sheets API v4 `spreadsheets.values.get` を呼び出し、対象スプレッドシートからデータを取得する
4. 取得成功のレスポンス（シート名・行数・サンプルデータ）をログ出力して確認する
5. 401 / 403 エラーケースのハンドリングが期待通りのエラーメッセージを返すことを確認する
6. ローカル開発環境（`.dev.vars` + `wrangler dev`）でも同様の疎通確認を行う
7. 疎通確認結果（成功日時・環境・取得データのサマリー）を UT-03 の設計文書または本タスクの完了記録に追記する

## 完了条件

- [ ] staging 環境の Cloudflare Workers から Sheets API v4 `spreadsheets.values.get` が成功する（HTTP 200 レスポンス取得）
- [ ] JWT 生成 → アクセストークン取得 → API 呼び出しの end-to-end フローが Workers 上で動作することが確認される
- [ ] 対象スプレッドシート（formId: `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` に紐づく Sheets）からのデータ取得成功
- [ ] 401 / 403 エラーケースのハンドリングが期待通りに動作する
- [ ] ローカル開発環境（`.dev.vars` + `wrangler dev`）でも疎通確認が成功する
- [ ] 疎通確認結果（成功ログ・レスポンスサマリー）が設計文書に記録される
- [ ] UT-09 が本番 Sheets API に安全にアクセスできることが保証されたとしてマークされる

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/unassigned-task/UT-03-sheets-api-auth-setup.md | sheets-auth.ts の実装詳細・認証フロー |
| 必須 | docs/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | シークレット配置の前提タスク |
| 必須 | docs/unassigned-task/UT-09-sheets-d1-sync-job-implementation.md | 本タスク完了後の次ステップ（同期ジョブ実装） |
| 参考 | https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get | Sheets API v4 spreadsheets.values.get リファレンス |
| 参考 | https://developers.google.com/identity/protocols/oauth2/service-account | Service Account 認証フロー公式ドキュメント |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets / .dev.vars 管理方針 |
