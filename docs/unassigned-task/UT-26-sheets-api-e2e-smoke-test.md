# UT-26: Sheets API エンドツーエンド疎通確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-26 |
| タスク名 | Sheets API エンドツーエンド疎通確認 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-26 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 発見元 | UT-03 Phase 12 未タスク検出 |
| GitHub Issue | #41 |

## 目的

UT-03 で実装した `sheets-auth.ts` モジュールと UT-25 で配置した `GOOGLE_SERVICE_ACCOUNT_JSON` を使い、実際の Google Sheets API v4 への認証・データ取得疎通を確認する。UT-03 のテストは fetch mock を使用しており、実 API への疎通は SA 設定後に別途実施が必要なため、独立タスクとして分離された。本タスク完了により、後続の UT-09（Sheets→D1 同期ジョブ）が本番 Sheets API に安全にアクセスできることが保証される。

## スコープ

### 含む

- curl または Node.js スクリプトによる Sheets API v4 `spreadsheets.values.get` への実リクエスト確認
- `sheets-auth.ts` モジュールを使った JWT 署名・アクセストークン取得の実動作確認
- TTL 1時間のキャッシュ動作確認（2回目以降のリクエストでキャッシュヒットすること）
- 疎通確認結果の `outputs/verification-report.md` への記録
- 403 / 401 エラー発生時のトラブルシュート手順の文書化

### 含まない

- Sheets データの読み書き実装（→ UT-09 で実施）
- D1 への書き込み処理（→ UT-09 / UT-21 で実施）
- パフォーマンステスト・負荷テスト

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-03 (Sheets API 認証方式設定) | sheets-auth.ts モジュールの実装が前提 |
| 上流 | UT-25 (Cloudflare Secrets 本番配置) | 実 SA JSON key が配置済みでなければ疎通不可 |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | 本タスクの疎通確認完了後に同期ジョブ実装へ進む |

## 着手タイミング

| 条件 | 理由 |
| --- | --- |
| UT-25 完了後 | SA JSON key が staging/production に配置されている必要がある |
| Sheets スプレッドシートへの SA 共有設定済み | Service Account メールアドレスが対象 Sheets に「閲覧者」として共有されていること |

## 苦戦箇所・知見

**1. テストが fetch mock を使用しているため実 API 疎通を保証しない**
UT-03 の Vitest テストは `vi.spyOn(global, 'fetch')` で fetch をモックしており、実際の Google OAuth 2.0 Token Endpoint や Sheets API v4 への接続は検証されていない。実装コードが正しくても、JWT の `aud` フィールドや `iss` フィールドの値が間違っていると実 API で 401 が返る。疎通確認は必ず実 SA JSON key を使って行うこと。

**2. 403 PERMISSION_DENIED の原因は SA 共有設定忘れが多い**
Sheets API v4 への認証は成功しても、対象スプレッドシートに SA メールアドレスを共有していないと 403 PERMISSION_DENIED が返る。`spreadsheets.get` や `spreadsheets.values.get` 両方で発生する。エラーメッセージが `The caller does not have permission` のみで分かりにくいため、SA メールアドレスの共有設定を最初に確認すること。

**3. アクセストークンの有効期限は 1 時間だが JWT 生成時刻が重要**
JWT の `iat`（issued at）と `exp`（expiration）が Workers のシステム時刻に依存する。Cloudflare Workers の時刻は UTC であり、`Date.now()` で取得した値がほぼ正確だが、SA 認証サーバー側とのズレが大きいと `invalid_grant` エラーになることがある。実動作確認時に JWT の claims を Base64 デコードして確認する。

**4. curl での疎通確認手順**
```bash
# ステップ1: アクセストークン取得（JWT 生成・exchange）
# sheets-auth.ts の getAccessToken() を Wrangler で呼び出すか、
# 別途 Node.js スクリプトで JWT を生成してトークンを取得

# ステップ2: Sheets API v4 へのリクエスト
SPREADSHEET_ID="119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"
RANGE="Sheet1!A1:Z10"
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}"
```

**5. キャッシュ動作確認の注意点**
Workers の in-memory キャッシュは Worker インスタンスが再起動すると消える。`wrangler dev` では再起動が頻繁に起きるため、キャッシュヒットの確認は同一リクエスト内で短時間に2回リクエストを送るか、KV キャッシュを使う実装であれば KV の内容を確認する。

## 実行概要

1. UT-25 で配置した SA JSON key を使い、`wrangler dev` または staging 環境で `getAccessToken()` 呼び出しを実行
2. 取得したアクセストークンで `spreadsheets.values.get` へ curl リクエストを送信
3. 正常レスポンス（200 + JSON データ）が返ることを確認
4. 2回目のリクエストでキャッシュが利用されていることを確認（ログ出力またはトークン再取得なしで応答）
5. 確認結果を `docs/ut-26-sheets-api-e2e-smoke-test/outputs/verification-report.md` に記録

## 完了条件

- [ ] Sheets API v4 `spreadsheets.values.get` へのリクエストが 200 で返ること
- [ ] 実際のスプレッドシートデータが取得できること（ID: `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`）
- [ ] アクセストークンのキャッシュが動作していること（2回目以降の fetch 省略を確認）
- [ ] 疎通確認結果が verification-report.md に記録されていること
- [ ] 403/401 エラー発生時のトラブルシュート手順が文書化されていること

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/ut-03-sheets-api-auth/outputs/verification-report.md | UT-03 の疎通確認テンプレートと参考 |
| 必須 | docs/ut-03-sheets-api-auth/phase-05.md | setup-runbook.md の手順 5 参照 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 疎通確認方法 |
