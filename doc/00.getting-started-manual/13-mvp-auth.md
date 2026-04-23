# 認証設計（MVP のデフォルト実装）

## 採用する認証方式

```text
1. Google login
   -> primary path

2. Magic link
   -> fallback path from notification email
```

認証基盤は **Auth.js v5 (`next-auth@5.0.0-beta.30`)** を前提にする。
環境変数は `AUTH_*` 系に統一し、`NEXTAUTH_*` は使わない。

---

## 認証の考え方

### Google login

- 普段の Gmail アカウントで入る主経路
- Auth.js の Google provider を使う
- ログイン後に D1 の `member_responses.responseEmail` と照合する

### Magic link

- 掲載通知や再ログイン救済用の副経路
- D1 `magic_tokens` に 1 回限りのトークンを保存する
- トークン検証後に Auth.js session を発行する

---

## ログイン許可条件

ログインを許可する条件:

1. フォーム回答が存在する
2. `ruleConsent = "consented"`
3. `member_status.is_deleted = false`

公開一覧への表示条件:

1. `publicConsent = "consented"`
2. `member_status.is_public = true`
3. `member_status.is_deleted = false`

つまり、ログイン可否と公開可否は分けて扱う。

---

## 認証フロー

### Google login

```text
click Google login
  -> Google OAuth
  -> callback
  -> normalize email
  -> lookup member_responses by responseEmail
  -> check ruleConsent == "consented"
  -> check member_status
  -> create session
  -> redirect /members
```

### Magic link

```text
admin sends notification
  -> create token
  -> store in magic_tokens
  -> send email

user clicks link
  -> /auth/verify?token=...
  -> validate token
  -> lookup member by responseEmail
  -> check ruleConsent == "consented"
  -> check member_status
  -> mark token used
  -> create session
  -> redirect /members
```

---

## セッションに保持する情報

```ts
type SessionUser = {
  email: string;
  responseId: string;
  memberId: string;
  isAdmin: boolean;
  isPublic: boolean;
};
```

- UI の出し分けは `memberId` と `isAdmin` を中心に行う
- 本人のプロフィール編集可否は `responseId` で判定する
- 管理者 UI では `member_status` と `admin_users` だけを根拠にする

---

## 環境変数

Cloudflare Workers 上の Auth.js v5 前提で統一する。

| 変数名 | 説明 |
|--------|------|
| `AUTH_SECRET` | セッション暗号化キー |
| `AUTH_GOOGLE_ID` | Google OAuth クライアントID |
| `AUTH_GOOGLE_SECRET` | Google OAuth クライアントシークレット |
| `SITE_URL` | 本番URL |

---

## Google OAuth アプリ設定

1. Google Cloud Console で OAuth 2.0 クライアント ID を作成する
2. OAuth 2.0 リダイレクト URI に以下を追加する
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-site.example.com/api/auth/callback/google`
3. ログイン済み email がフォーム回答者と一致することを利用条件にする

---

## 実装メモ

- OpenNext + Cloudflare Workers では認証判定を Middleware と Route Handler の両方で行う
- 一覧表示可否は `publicConsent` と `member_status.is_public` の積で決める
- 管理者が変更できるのは `member_status` と `admin_users` のみ
- `ruleConsent` が未同意ならセッションは作らない

---

## 事故を防ぐルール

1. `email` だけで管理者判定しない
2. `publicConsent` と `ruleConsent` を混同しない
3. `member_status` が削除済みなら再ログインを許可しない
4. Google Form 側のラベル変更に依存しない
