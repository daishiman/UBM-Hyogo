# Google API認証設定

## 採用方式

Google Forms API の読み取りは **サービスアカウント** を使う。
これは schema sync / response sync 専用であり、ユーザーログイン用の Google OAuth とは分離する。

役割分担:

- サービスアカウント: Forms API / Drive API のサーバー間通信
- Auth.js + Google OAuth: メンバーのログイン

---

## セットアップ手順

### 1. Google Cloud 側で API を有効化

有効化する API:

1. Google Forms API
2. Google Drive API

補助シートは使わない。
Google Form の表示ロジックと保存ロジックは D1 を正本にする。

### 2. サービスアカウント作成

1. Google Cloud Console → IAM と管理 → サービスアカウント
2. `ubm-forms-reader` などの名前で作成
3. JSON キーを発行してダウンロード

### 3. フォームへの共有

- Google Drive で対象フォームを開く
- サービスアカウントのメールアドレスを `Viewer` で共有する

### 4. Cloudflare Variables に登録

| 変数名 | 説明 |
|--------|------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` |
| `GOOGLE_PRIVATE_KEY` | `private_key` |
| `GOOGLE_FORM_ID` | 対象フォーム ID |

`GOOGLE_FORM_ID` を唯一の正本 ID にする。

---

## 推奨スコープ

```text
https://www.googleapis.com/auth/forms.body.readonly
https://www.googleapis.com/auth/forms.responses.readonly
https://www.googleapis.com/auth/drive.readonly
```

更新系スコープは不要。今回のサイトはフォーム編集をしないため、read-only に寄せる。

---

## 実行フロー

```text
Cloudflare Cron / Route Handler
  -> getServiceAccountAuth()
  -> forms.get()
  -> forms.responses.list()
  -> normalize
  -> save to D1
```

ローカル開発時も同じフローでよい。秘密鍵は `.dev.vars` や Cloudflare のローカル変数に入れる。

---

## 注意事項

- サービスアカウント JSON は Git に含めない
- `GOOGLE_PRIVATE_KEY` は改行を `\n` で保持する
- `questionId` と `itemId` は変わる前提で扱う
- 認証が通っても mapping が壊れている可能性はあるため、schema diff 監視を必ず入れる
