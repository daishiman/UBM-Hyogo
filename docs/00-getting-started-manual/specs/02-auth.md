# Google API 認証とアプリ認証の分離

## 採用方針

認証は 2 系統に分ける。

1. Google Forms API 読み取り
   - サービスアカウント
   - schema sync / response sync 専用
2. 会員ログイン
   - Auth.js
   - Google OAuth を主導線、Magic Link を補助導線

この 2 つは同じ Google 系でも責務が違うため、鍵と権限を分離する。
実装先は `apps/web` のログイン UI と `apps/api` の認証確認・照合処理に分ける。

---

## Google Forms API 側

### 用途

- `forms.get`
- `forms.responses.list`
- 必要に応じた Drive 上のフォーム参照

### 必要な環境変数

| 変数名 | 説明 |
|--------|------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` |
| `GOOGLE_PRIVATE_KEY` | `private_key` |
| `GOOGLE_FORM_ID` | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` |

### 推奨スコープ

```text
https://www.googleapis.com/auth/forms.body.readonly
https://www.googleapis.com/auth/forms.responses.readonly
https://www.googleapis.com/auth/drive.readonly
```

更新系スコープは使わない。

---

## 会員ログイン側

### 認証基準

- 一致判定は `responseEmail`
- `responseEmail` は Google が自動収集した verified email
- フォーム項目の email 入力欄は前提にしない

### ログイン判定

1. `member_identities.response_email` を検索
2. `current_response_id` を取得
3. `member_status.rules_consent` を確認
4. `member_status.is_deleted` を確認
5. 条件を満たしたらセッションを作成

---

## `/login` の状態設計

`/no-access` 専用画面には依存しない。`/login` 自体が状態を持つ。

| 状態 | 条件 | 表示内容 |
|------|------|---------|
| `input` | 初期状態 | Google ログインとメールリンク入力 |
| `sent` | Magic Link 送信済み | メール確認案内 |
| `unregistered` | `responseEmail` 不一致 | Google Form 登録 CTA |
| `rules_declined` | `rulesConsent != consented` | 規約同意付き再回答 CTA |
| `deleted` | `isDeleted = true` | 管理者問い合わせ案内 |

登録・未同意・削除済みを別画面へ飛ばさず、ログイン導線の中で吸収する。

---

## サービスアカウントのセットアップ

1. Google Cloud Console で Forms API / Drive API を有効化
2. サービスアカウントを作成し、JSON キーをダウンロード
3. 対象フォームを Viewer 共有（サービスアカウントのメールアドレスを追加）
4. 秘密情報を以下のルールで設定する

| 変数名 | 本番/staging の設定先 | ローカルの設定先 | CI/CDの設定先 |
|--------|---------------------|----------------|--------------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Cloudflare Secrets | 1Password Environments | - |
| `GOOGLE_PRIVATE_KEY` | Cloudflare Secrets | 1Password Environments | - |
| `GOOGLE_FORM_ID` | Cloudflare Secrets | 1Password Environments | - |

**ルール**:
- 秘密鍵 JSON はリポジトリに含めない
- ローカル開発では `op run` コマンドで 1Password から取得する
- 平文 `.env` ファイルをコミットしない（`.env*` は operational artifact only）

---

## GAS prototype の扱い

`docs/00-getting-started-manual/gas-prototype/` は UI の叩き台であり、認証・API・DB 接続は未実装。
本番の認証仕様はこのファイルと `06-member-auth.md`, `13-mvp-auth.md` を正本とする。

---

## 内部 endpoint: `GET /auth/session-resolve`（apps/web → apps/api）

不変条件 #5（`apps/web` から D1 直接アクセス禁止）のため、
Auth.js v5 の `signIn` / `jwt` callback は `apps/web` で完結せず、
`apps/api` の internal endpoint を経由して member identity / admin 判定を解決する。

| 観点 | 値 |
|------|----|
| メソッド | `GET` |
| パス | `/auth/session-resolve?email=<email>` |
| 認証ヘッダ | `X-Internal-Auth: <INTERNAL_AUTH_SECRET>`（必須） |
| 入力 | `email` を lowercase normalize |
| 出力 | `{ memberId, isAdmin, gateReason }` |
| `gateReason` 列挙値 | `"unregistered" | "deleted" | "rules_declined" | null` |

レスポンス契約:

```ts
type GateReason = "unregistered" | "deleted" | "rules_declined";
type SessionResolveResponse = {
  memberId: string | null;
  isAdmin: boolean;
  gateReason: GateReason | null;
};
```

実装:

- 入口: `apps/api/src/routes/auth/session-resolve.ts`
- 認可 middleware: `apps/api/src/middleware/internal-auth.ts`（`INTERNAL_AUTH_SECRET` 比較のみ。D1 を触らない）
- 呼び出し元: `apps/web/src/lib/auth.ts`（Auth.js `signIn` / `jwt` callback から fetch）
- 共有型: `packages/shared/src/auth.ts`（`GateReason` / `SessionResolveResponse`）

### 必要な環境変数

| 変数名 | 説明 |
|--------|------|
| `INTERNAL_AUTH_SECRET` | apps/web → apps/api の Worker-to-Worker 共有秘密。両 Worker の Cloudflare Secrets に同値で登録 |
| `AUTH_SECRET` | Auth.js cookie session JWT (HS256) と API 側 `verifySessionJwt` の共有秘密 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth Provider 用（apps/web のみ） |
