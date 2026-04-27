# Google Workspace Bootstrap Runbook

## 対象タスク
01c-parallel-google-workspace-bootstrap

## 前提条件
- Google アカウント（manjumoto.daishi@senpai-lab.com）で Google Cloud Console にログイン済み
- ブラウザで https://console.cloud.google.com を開いておく

---

## 手順 1: Google Cloud プロジェクトの作成

**どの画面か**
Google Cloud Console のトップページ。画面上部に「Google Cloud」ロゴと、現在のプロジェクト名が表示されている黒いヘッダーバーがある。

**操作手順**
1. ヘッダーバーのプロジェクト名（「マイプロジェクト」など）をクリックする
2. ポップアップが開くので、右上の「**新しいプロジェクト**」ボタンをクリックする
3. 「新しいプロジェクト」画面が開く
   - **プロジェクト名**: `ubm-hyogo` と入力
   - **場所**: 「組織なし」のままでよい
4. 「**作成**」ボタンをクリックする
5. 数秒後に通知が出るので、「**プロジェクトを選択**」をクリックして `ubm-hyogo` に切り替える

---

## 手順 2: Google Sheets API の有効化

**どの画面か**
左側のナビゲーションメニュー（ハンバーガーアイコン）→「**APIとサービス**」→「**ライブラリ**」を選択した画面。API の検索ボックスが中央に表示される。

**操作手順**
1. 検索ボックスに「`Google Sheets API`」と入力してEnterを押す
2. 検索結果に「Google Sheets API」が表示されるのでクリックする
3. 「Google Sheets API」の詳細ページが開くので「**有効にする**」ボタンをクリックする
4. 「有効」と表示されれば完了

---

## 手順 3: Google Drive API の有効化

**どの画面か**
手順 2 と同じ「APIとサービス」→「ライブラリ」画面。

**操作手順**
1. 検索ボックスに「`Google Drive API`」と入力してEnterを押す
2. 検索結果に「Google Drive API」が表示されるのでクリックする
3. 「**有効にする**」ボタンをクリックする
4. 「有効」と表示されれば完了

---

## 手順 4: OAuth 設定（Google Auth Platform — 新 UI）

**どの画面か**
左側メニュー「**APIとサービス**」→「**OAuth 同意画面**」を選択すると、新しい UI「**Google Auth Platform**」の概要画面が開く。
左メニューに「概要 / ブランディング / 対象 / クライアント / データアクセス / 検証センター / 設定」が並ぶ。

### 4-1: ブランディング（アプリ名・メールの設定）

左メニューの「**ブランディング**」をクリックする。

- **アプリ名**: `ubm-hyogo` と入力
- **ユーザーサポートのメール**: `manjumoto.daishi@senpai-lab.com` を選択
- **デベロッパーの連絡先メール**: `manjumoto.daishi@senpai-lab.com` と入力
- 「**保存**」をクリックする

### 4-2: 対象（ユーザータイプの設定）

左メニューの「**対象**」をクリックする。

- **ユーザーの種類**: 「**外部（External）**」を選択する
- 「**保存**」をクリックする

### 4-3: データアクセス（スコープの設定）

左メニューの「**データアクセス**」をクリックする。

1. 「**スコープを追加または削除**」ボタンをクリックする
2. 画面右側にパネルが開くので、検索ボックスに `spreadsheets.readonly` と入力する
3. `https://www.googleapis.com/auth/spreadsheets.readonly` にチェックを入れて「**更新**」をクリックする
4. 「**保存**」をクリックする

---

## 手順 5: OAuth クライアント ID の作成

**どの画面か**
Google Auth Platform の左メニュー「**クライアント**」をクリックした画面。または概要画面の「**OAuth クライアントを作成**」ボタンをクリックする。

**操作手順**
1. 「**クライアントを作成**」ボタン（または「**OAuth クライアントを作成**」）をクリックする
2. フォームが開く
   - **アプリケーションの種類**: 「**ウェブ アプリケーション**」を選択
   - **名前**: `ubm-hyogo-web` と入力
   - **承認済みのリダイレクト URI** の「**URIを追加**」をクリックして `http://localhost:3000/api/auth/callback/google` と入力
3. 「**作成**」をクリックする
4. ポップアップが表示され、**クライアント ID** と **クライアント シークレット** が確認できる
   - この2つの値をコピーして安全な場所に保存する（1Password Environments に入力する）
   - これが `GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` になる
5. 「**OK**」をクリックして閉じる

---

## 手順 6: サービスアカウントの作成

**どの画面か**
左側メニュー「**IAMと管理**」→「**サービス アカウント**」を選択した画面。サービスアカウントの一覧が表示される。

**操作手順**
1. 上部の「**サービス アカウントを作成**」ボタンをクリックする
2. フォームが開く
   - **サービス アカウント名**: `ubm-hyogo-sheets-reader` と入力
   - **サービス アカウント ID**: 自動入力されるのでそのままでよい
   - **説明**: `Read-only access to Google Sheets` と入力
3. 「**作成して続行**」をクリックする
4. 「このサービス アカウントにプロジェクトへのアクセスを許可する」はロール不要なので「**続行**」をクリックする
5. 「**完了**」をクリックする
6. 一覧に `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com` のようなメールアドレスが表示される。このメールアドレスをコピーしておく（手順 7 で使用）

---

## 手順 7: サービスアカウントの JSON キーをダウンロード

**どの画面か**
手順 6 の「サービス アカウント」一覧画面。作成したサービスアカウントをクリックして詳細画面に入る。

**操作手順**
1. 一覧から `ubm-hyogo-sheets-reader` をクリックして詳細画面を開く
2. 画面上部のタブ「**キー**」をクリックする
3. 「**鍵を追加**」ボタン→「**新しい鍵を作成**」をクリックする
4. ポップアップが表示される
   - キーのタイプ: 「**JSON**」を選択
   - 「**作成**」をクリックする
5. `.json` ファイルが自動的にダウンロードされる
   - このファイルを安全な場所に保存する（中身の JSON テキスト全体が `GOOGLE_SERVICE_ACCOUNT_JSON` になる）
   - ダウンロードしたファイルをリポジトリに入れないこと

---

## 手順 8: Google スプレッドシートへのアクセス共有

**どの画面か**
Google Drive（drive.google.com）または Google スプレッドシートを直接開いた画面。

**操作手順**
1. 対象のスプレッドシートを Google Drive で開く
2. 右上の「**共有**」ボタンをクリックする
3. 「ユーザーやグループを追加」の入力欄に手順 6 でコピーしたサービスアカウントのメールアドレス（例: `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com`）を貼り付ける
4. 権限を「**閲覧者**」に設定する
5. 「**送信**」をクリックする
6. スプレッドシートの URL を確認する
   - URL の形式: `https://docs.google.com/spreadsheets/d/[ここがSHEET_ID]/edit`
   - `[ここがSHEET_ID]` の部分をコピーして保存する（これが `GOOGLE_SHEET_ID` になる）

---

## 手順 9: 1Password Environments へのシークレット保管（ローカル開発用）

### 9-1: 1Password の開発者機能を有効にする

**どの画面か**
1Password デスクトップアプリ（バージョン8以降）の設定画面。

**操作手順**
1. 1Password デスクトップアプリを開く
2. macOS メニューバー左上の「**1Password**」→「**設定...**」をクリックする
3. 設定ウィンドウが開くので「**開発者**」タブをクリックする
4. 「**コマンドラインツールとの統合を使用**」にチェックを入れる
5. 設定ウィンドウを閉じる

---

### 9-2: Environments を開く

**どの画面か**
1Password の左サイドバー下部に「**開発者**」セクションがある。

**操作手順**
1. 左サイドバーを下にスクロールして「**開発者**」をクリックする
2. 「**Environments**」が表示されるのでクリックする
3. Environments の一覧画面が開く

> 左サイドバーに表示されない場合は、画面上部の検索バーに「Environments」と入力して探す。

---

### 9-3: ubm-hyogo 用の Environment を新規作成する

**どの画面か**
Environments の一覧画面。

**操作手順**
1. 「**新しい Environment**」または「**+ New Environment**」ボタンをクリックする
2. **名前**: `ubm-hyogo` と入力する
3. 「**作成**」をクリックする

---

### 9-4: 環境変数を追加する

**どの画面か**
作成した `ubm-hyogo` の Environment 詳細画面。「変数を追加」ボタンがある。

**操作手順**
「**変数を追加**」または「**+ Add variable**」ボタンを押して、以下の4つを1つずつ入力する。

| キー名 | 値 | どこで取得したか |
|--------|-----|----------------|
| `GOOGLE_CLIENT_ID` | OAuth クライアント ID | 手順 5 のポップアップに表示された値 |
| `GOOGLE_CLIENT_SECRET` | OAuth クライアントシークレット | 手順 5 のポップアップに表示された値 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON ファイルの中身（テキスト全体） | 手順 7 でダウンロードした `.json` ファイルを VSCode などで開いてすべて選択してコピー |
| `GOOGLE_SHEET_ID` | スプレッドシートの ID | 手順 8 の URL から取得した値 |

**`GOOGLE_SERVICE_ACCOUNT_JSON` の入力方法**
1. ダウンロードした `.json` ファイルを VSCode または テキストエディット で開く
2. `{ "type": "service_account", ... }` という形式のテキストが表示される
3. 全選択（⌘A）してコピー（⌘C）する
4. 1Password の値の欄に貼り付ける（1行の JSON テキストがそのまま値になる）

**注意事項**
- 平文の `.env` ファイルをリポジトリに置かないこと
- ダウンロードした `.json` ファイルは保存後に削除するか、リポジトリ外の安全な場所に移動すること
- `GOOGLE_SHEET_ID` は機密ではないが、他の3つは外部に漏らさないこと

---

### 9-5: ローカル開発でのシークレット利用方法（オプション）

1Password CLI を使うと、実際の値を `.env` に書かずに環境変数をアプリに渡せる。

**1Password CLI のインストール（初回のみ）**
```bash
brew install 1password-cli
```

**サインイン（初回のみ）**
```bash
op signin
```

#### 方法 A: 1Password Environments を使う（推奨）

`開発者` → `環境` に `ubm-hyogo` Environment が作成済みの場合、`.env` ファイル不要で直接注入できる。

**動作確認（変数が解決されるか）**
```bash
op run --env=ubm-hyogo -- env | grep GOOGLE
```

**開発サーバー起動**
```bash
op run --env=ubm-hyogo -- pnpm dev
```

#### 方法 B: ボールトアイテム + `.env` 参照ファイルを使う

Employee ボールトの通常アイテムとして保存した場合はこちら。

**`op://` 参照を書いた `.env` ファイルを作成する**

値は実際のシークレットではなく `op://ボールト名/アイテム名/フィールド名` の参照形式で書く。
```
GOOGLE_CLIENT_ID=op://Employee/ubm-hyogo/GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=op://Employee/ubm-hyogo/GOOGLE_CLIENT_SECRET
GOOGLE_SERVICE_ACCOUNT_JSON=op://Employee/ubm-hyogo/GOOGLE_SERVICE_ACCOUNT_JSON
GOOGLE_SHEET_ID=op://Employee/ubm-hyogo/GOOGLE_SHEET_ID
```

**`.env` を gitignore に追加する**
```bash
echo ".env" >> .gitignore
```

**開発サーバー起動**
```bash
op run --env-file=.env -- pnpm dev
```

> このプロジェクトでは方法 A（Environments）を採用している。

---

## 手順 10: 本番・ステージング用シークレットの投入

これは `04-serial-cicd-secrets-and-environment-sync` タスクで実施予定のため、今すぐ設定不要。
今すぐ確認したい場合は以下を実行する。

**Cloudflare Secrets への登録（3変数）**
```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
```

**GitHub Variables への `GOOGLE_SHEET_ID` の登録**
1. GitHub リポジトリを開き「**Settings**」タブをクリックする
2. 左メニュー「**Secrets and variables**」→「**Actions**」をクリックする
3. 「**Variables**」タブを選択して「**New repository variable**」をクリックする
4. **Name**: `GOOGLE_SHEET_ID`、**Value**: スプレッドシート ID を入力して「**Add variable**」をクリックする
