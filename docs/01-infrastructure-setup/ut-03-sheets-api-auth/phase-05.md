# Phase 05 — 実装・セットアップ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 名称 | 実装・セットアップ実行 |
| タスク | UT-03 Sheets API 認証方式設定 |
| 状態 | pending |
| 作成日 | 2026-04-26 |
| 担当 | delivery |
| GitHub Issue | #5 |

---

## 目的

Google Cloud Console での Service Account 作成から、Cloudflare Secrets への JSON key 配置、
`packages/integrations/src/sheets-auth.ts` モジュールの実装仕様策定、
ローカル開発用 `.dev.vars` 設定、そして Sheets API v4 疎通確認（sanity check）まで、
認証基盤をエンドツーエンドで動作可能な状態にすることを目的とする。

---

## 実行タスク

### 5-1. Google Cloud Console での Service Account 作成（Runbook）

以下の手順を `outputs/phase-05/setup-runbook.md` に記録する。

1. **プロジェクト選択**
   - Google Cloud Console（https://console.cloud.google.com）にアクセスする
   - 対象プロジェクト（`ubm-hyogo` または既存プロジェクト）を選択する

2. **Sheets API v4 の有効化**
   - 左メニュー「APIとサービス」→「ライブラリ」を開く
   - `Google Sheets API` を検索して「有効にする」をクリックする

3. **Service Account の作成**
   - 「APIとサービス」→「認証情報」→「認証情報を作成」→「サービス アカウント」をクリックする
   - サービスアカウント名: `ubm-hyogo-sheets-reader`（例）
   - ロール: `閲覧者`（読み取りのみ必要な場合）または Sheets への権限は後述の共有設定で制御する
   - 「完了」をクリックする

4. **JSON Key のダウンロード**
   - 作成したサービスアカウントの「キー」タブを開く
   - 「鍵を追加」→「新しい鍵を作成」→「JSON」を選択する
   - ダウンロードされた `*.json` ファイルは安全な場所に保管し、**リポジトリには絶対に含めない**

> **重要**: JSON key ファイルには秘密鍵が含まれる。1Password などのシークレット管理ツールに保管すること。

---

### 5-2. Cloudflare Secrets への配置

```bash
# JSON key の内容を環境変数として Cloudflare Secrets に登録する
# --env オプションで staging / production を切り替えること
wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging
# プロンプトに JSON key ファイルの内容（1行に圧縮したJSON文字列）を貼り付ける

wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env production
```

**確認コマンド**:
```bash
# シークレットが登録されていることを確認（値は表示されない）
wrangler secret list --env staging
wrangler secret list --env production
```

---

### 5-3. Google Sheets への Service Account 共有設定

1. 対象の Google スプレッドシートを開く
2. 右上「共有」ボタンをクリックする
3. 「ユーザーやグループを追加」に Service Account のメールアドレスを入力する
   - 形式: `ubm-hyogo-sheets-reader@<project-id>.iam.gserviceaccount.com`
4. 権限: `閲覧者`（読み取りのみの場合）または `編集者`（書き込みも必要な場合）を選択する
5. 「送信」をクリックする（通知はオフにして構わない）

---

### 5-4. `packages/integrations/src/sheets-auth.ts` 実装仕様

以下の仕様を `outputs/phase-05/sheets-auth-spec.md` に記録する。

#### 概要

| 項目 | 内容 |
| --- | --- |
| 配置パス | `packages/integrations/src/sheets-auth.ts` |
| ランタイム | Cloudflare Workers (Edge Runtime) |
| 署名方式 | Web Crypto API (`crypto.subtle.importKey` / `crypto.subtle.sign`) |
| 認証スコープ | `https://www.googleapis.com/auth/spreadsheets.readonly` |
| トークン TTL | 3600秒（1時間）|
| キャッシュ | Workers グローバル変数 + 有効期限チェックによる TTL キャッシュ |

#### JWT 生成フロー

```
Service Account JSON
  └─ private_key (PEM) を Web Crypto API で PKCS#8 にインポート
       └─ HS256 ではなく RS256 でヘッダー+ペイロードを署名
            └─ JWT（header.payload.signature）を Google OAuth2 エンドポイントに POST
                 └─ アクセストークン（Bearer）を取得
```

#### 実装仕様（擬似コード）

```typescript
// 1. シークレットから Service Account JSON をパース
const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);

// 2. PEM → CryptoKey のインポート（RS256 / PKCS#8）
const privateKey = await crypto.subtle.importKey(
  'pkcs8',
  pemToDer(sa.private_key), // PEM のヘッダー/フッターと改行を除去してバイナリ化
  { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
  false,
  ['sign']
);

// 3. JWT ペイロード生成
const now = Math.floor(Date.now() / 1000);
const payload = {
  iss: sa.client_email,
  scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  aud: 'https://oauth2.googleapis.com/token',
  exp: now + 3600,
  iat: now,
};

// 4. RS256 署名
const headerB64 = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
const payloadB64 = base64url(JSON.stringify(payload));
const signingInput = `${headerB64}.${payloadB64}`;
const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, encoder.encode(signingInput));
const jwt = `${signingInput}.${base64url(signature)}`;

// 5. Google OAuth2 トークンエンドポイントへ POST
const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
});
const { access_token, expires_in } = await res.json();

// 6. TTL キャッシュ（モジュールスコープ変数）
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getSheetsAccessToken(env: Env): Promise<string> {
  const now = Date.now() / 1000;
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token; // 有効期限1分前まではキャッシュを返す
  }
  const token = await fetchNewToken(env);
  cachedToken = { token, expiresAt: now + 3600 };
  return token;
}
```

#### エラーハンドリング仕様

| エラー原因 | 期待する挙動 |
| --- | --- |
| JSON parse エラー | `Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: parse failed')` をスローする |
| PEM インポートエラー | `Error('Failed to import private key')` をスローする |
| OAuth2 レスポンス 4xx/5xx | ステータスコードとボディを含むエラーをスローする |
| トークンフィールド欠損 | `Error('Missing access_token in response')` をスローする |

---

### 5-5. `.dev.vars` ローカル開発設定手順

以下の手順を `outputs/phase-05/local-dev-guide.md` に記録する。

1. **ファイルの作成**
   ```bash
   # リポジトリルートまたは apps/api/ に .dev.vars を作成する
   touch apps/api/.dev.vars
   ```

2. **内容の記述**
   ```ini
   # apps/api/.dev.vars
   # このファイルは .gitignore に含まれること（絶対にコミットしない）
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
   ```
   > JSONは1行に圧縮（改行なし）で記述する。`private_key` 内の改行は `\n` エスケープにする。

3. **`.gitignore` への追加確認**
   ```bash
   grep -n ".dev.vars" .gitignore || echo "WARN: .dev.vars が .gitignore に未登録"
   ```
   未登録の場合は `.gitignore` に `.dev.vars` を追記する。

4. **`wrangler dev` での読み込み確認**
   ```bash
   mise exec -- pnpm --filter api exec wrangler dev --env local
   # または
   mise exec -- wrangler dev --env local
   ```
   起動ログに `Loaded .dev.vars` が表示されることを確認する。

---

### 5-6. Sanity Check — Sheets API v4 疎通確認

以下の手順を `outputs/phase-05/setup-runbook.md` に追記する。

#### アクセストークン取得確認（ローカル）

```bash
# wrangler dev が起動中であることを前提とする
# ローカルエンドポイント（例）にリクエストを送り、トークン取得ログを確認する
curl -s http://localhost:8787/debug/sheets-token | jq .
```

#### Sheets API v4 直接疎通確認（手動）

```bash
# 1. アクセストークンを取得する（手動取得の場合）
ACCESS_TOKEN="ya29.xxxxx"
SPREADSHEET_ID="119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"

# 2. Sheets API v4 でスプレッドシートのメタデータを取得する
curl -s \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=spreadsheetId,properties.title" \
  | jq .

# 期待レスポンス例:
# {
#   "spreadsheetId": "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg",
#   "properties": { "title": "UBM兵庫 会員フォーム" }
# }
```

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/phase-02.md | 比較評価・設計方針 |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/phase-04.md | 事前検証・前提条件確認 |
| 参考 | https://developers.google.com/identity/protocols/oauth2/service-account | Google OAuth2 SA フロー |
| 参考 | https://developers.google.com/sheets/api/reference/rest | Sheets API v4 リファレンス |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Web Crypto API (Workers) |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/setup-runbook.md | SA作成・Secrets配置・疎通確認 Runbook |
| ドキュメント | outputs/phase-05/sheets-auth-spec.md | sheets-auth.ts 実装仕様書 |
| ドキュメント | outputs/phase-05/local-dev-guide.md | ローカル開発 .dev.vars 設定ガイド |

---

## 完了条件

- [ ] Google Cloud Console で Service Account が作成されている
- [ ] Sheets API v4 が対象プロジェクトで有効化されている
- [ ] `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` が staging / production 両環境で完了している
- [ ] 対象スプレッドシートに Service Account のメールアドレスが共有設定されている
- [ ] `packages/integrations/src/sheets-auth.ts` の実装仕様が `outputs/phase-05/sheets-auth-spec.md` に記録されている
- [ ] `.dev.vars` が `.gitignore` に登録されていることが確認されている
- [ ] Sheets API v4 への疎通確認（curl）が成功し、スプレッドシートのメタデータが取得できている
- [ ] `outputs/phase-05/setup-runbook.md`、`sheets-auth-spec.md`、`local-dev-guide.md` が作成されている

---

## 次 Phase

Phase 06 — 異常系検証（failure-case-matrix.md の作成）に進む。

認証基盤が動作確認できた後、意図的に認証情報を壊した状態での挙動を検証することで、
本番環境での障害対応能力を担保する。
