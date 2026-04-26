# Phase 5: セットアップ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | google-workspace-bootstrap |
| Phase 番号 | 5 / 13 |
| Phase 名称 | セットアップ実行 |
| 作成日 | 2026-04-23 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

Google Workspace / Sheets 連携基盤 における Phase 5 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | integration package の責務 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | local canonical env |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret placement |
| 参考 | Google Cloud Console | Project / OAuth / service account |
| 参考 | User request on 2026-04-23 | Google スプレッドシート入力 |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-05/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 5 | pending | upstream を読む |
| 2 | 成果物更新 | 5 | pending | outputs/phase-05/main.md |
| 3 | 4条件確認 | 5 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | Phase 5 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物が作成済み
- 正本仕様参照が残っている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: Google Workspace / Sheets 連携基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## 手順全文 (Google Cloud Console 操作手順)

### 手順1: Google Cloud Project の作成
1. https://console.cloud.google.com/ にアクセス
2. 画面上部のプロジェクト選択 > 「新しいプロジェクト」をクリック
3. プロジェクト名: `ubm-hyogo`（任意）
4. 「作成」をクリック
5. 作成後、プロジェクトを選択した状態にする

### 手順2: Sheets API / Drive API の有効化
1. 左メニュー > 「APIとサービス」 > 「ライブラリ」
2. 検索: "Google Sheets API" > 「有効にする」
3. 検索: "Google Drive API" > 「有効にする」

### 手順3: OAuth Consent Screen の設定
1. 「APIとサービス」 > 「OAuth 同意画面」
2. User Type: External（または Internal）
3. App名: `ubm-hyogo`
4. User support email: （自分のメールアドレス）
5. Scopes: `https://www.googleapis.com/auth/spreadsheets.readonly` を追加
6. 保存して次へ

### 手順4: OAuth 2.0 クライアント ID の作成
1. 「APIとサービス」 > 「認証情報」 > 「認証情報を作成」 > 「OAuth クライアント ID」
2. アプリケーションの種類: 「ウェブ アプリケーション」
3. 名前: `ubm-hyogo-web`
4. 承認済みのリダイレクト URI: `http://localhost:3000/api/auth/callback/google`
5. 「作成」をクリック
6. 表示された **クライアント ID** と **クライアント シークレット** を安全な場所にメモ
7. これらが `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### 手順5: Service Account の作成
1. 「IAMと管理」 > 「サービス アカウント」 > 「サービス アカウントを作成」
2. サービスアカウント名: `ubm-hyogo-sheets-reader`
3. サービスアカウント ID: （自動生成）
4. 説明: `Read-only access to Google Sheets`
5. 「作成して続行」> ロール: 今回は不要（Sheetsへのアクセスはシート側で設定）
6. 「完了」をクリック
7. 作成されたSAの **メールアドレス** をメモ

### 手順6: Service Account の JSON Key 取得
1. 作成したSAをクリック > 「キー」タブ
2. 「鍵を追加」 > 「新しい鍵を作成」 > 「JSON」
3. ダウンロードされた `.json` ファイルを安全な場所に保存
4. このJSONファイルの内容が `GOOGLE_SERVICE_ACCOUNT_JSON`

### 手順7: Google Sheet へのアクセス共有
1. 対象のスプレッドシートを Google Drive で開く
2. 右上「共有」ボタン > SAのメールアドレス（例: `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com`）を追加
3. 権限: 「閲覧者」
4. 「共有」をクリック
5. スプレッドシートのURLから `GOOGLE_SHEET_ID` を取得: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

### 手順8: Secret の配置
| 変数名 | 値 | 配置先 | コマンド例 |
|--------|-----|--------|------------|
| GOOGLE_CLIENT_ID | OAuth クライアントID | Cloudflare Secrets | `wrangler secret put GOOGLE_CLIENT_ID` |
| GOOGLE_CLIENT_SECRET | OAuth シークレット | Cloudflare Secrets | `wrangler secret put GOOGLE_CLIENT_SECRET` |
| GOOGLE_SERVICE_ACCOUNT_JSON | SAのJSON key内容 | Cloudflare Secrets | `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` |
| GOOGLE_SHEET_ID | スプレッドシートID | GitHub Variables | Settings > Secrets and variables > Variables |

※ Secret の実値は仕様書に書かない。プレースホルダーのみ記載。
- ローカル開発の値は `1Password Environments` を正本にし、平文 `.env` を正本にしない。
