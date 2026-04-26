# ログイン導線と通知補助

## 全体方針

認証導線は次の 2 本立てにする。

1. 主導線: Google ログイン
2. 補助導線: Magic Link

通知は認証補助に限定し、管理者が都度手動送信しないと使えない UX にはしない。
実装先は `apps/web` のログイン導線と `apps/api` の通知送信・検証処理に分ける。

---

## `/login` の状態

prototype の `input -> sent` を正式仕様に取り込む。

```text
input
  -> Googleでログイン
  -> メールリンク送信
  -> Google Form 登録 CTA

sent
  -> メール確認案内
```

さらに認証判定結果に応じて次の状態を同画面内で出し分ける。

| 状態 | 表示 |
|------|------|
| `unregistered` | まだ登録が無いので Google Form へ |
| `rules_declined` | 規約同意が無いため再回答が必要 |
| `deleted` | 管理者へ問い合わせ |

`/no-access` 専用画面は前提にしない。

---

## Magic Link の用途

- Google OAuth を使えない場合の補助
- 再ログイン救済
- ログイン入力完了後の `sent` 状態への遷移

通知メールはログイン補助のためだけに使い、公開通知や運用通知は MVP の必須要件にしない。

---

## トークン保存

```sql
CREATE TABLE IF NOT EXISTS magic_tokens (
  token TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  email TEXT NOT NULL,
  response_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
```

---

## メール本文で伝えること

1. このリンクは一時的であること
2. 対象アカウントの `responseEmail` と一致する必要があること
3. 未登録なら Google Form に戻ること
4. プロフィール更新はアプリ内編集ではなく Google Form 再回答で行うこと

---

## 環境変数

| 変数名 | 説明 | Cloudflare Secrets | GitHub Secrets | 1Password |
|--------|------|:-----------------:|:--------------:|:---------:|
| `AUTH_SECRET` | Auth.js 用シークレット | ✅ | - | ✅ (正本) |
| `AUTH_GOOGLE_ID` | Google OAuth クライアント ID | ✅ | - | ✅ (正本) |
| `AUTH_GOOGLE_SECRET` | Google OAuth クライアントシークレット | ✅ | - | ✅ (正本) |
| `RESEND_API_KEY` | 送信 API キー | ✅ | - | ✅ (正本) |
| `RESEND_FROM_EMAIL` | 差出人メールアドレス | ✅ | - | ✅ (正本) |
| `SITE_URL` | 本番 URL（非機密） | - | GitHub Variables | - |

**ルール**: 本番・staging 環境は Cloudflare Secrets に登録。ローカル開発は 1Password Environments から `op run` で取得。平文 `.env` をリポジトリにコミットしない。

---

## 事故防止ルール

1. Magic Link 発行前に `rulesConsent` と削除状態を確認する
2. `responseEmail` 不一致を silent fail にせず登録導線へ戻す
3. GAS prototype のログイン無し UI を本番要件にしない
