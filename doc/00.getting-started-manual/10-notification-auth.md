# メール通知・マジックリンクログイン設計

## 全体の流れ

```text
1. メンバーがフォームに回答する
2. `/login` で Googleログインまたはメールリンク送信を使う
3. システムが登録済み email か確認する
4. メールリンクが必要なら一時トークンを発行して送信する
5. クリック後にログインし、/members へ遷移する
```

---

## 採用方式

- 主導線: Googleログイン
- 補助導線: マジックリンク

管理者が手動で通知メールを送る前提は採らない。
通知は認証補助に限定する。

---

## メール送信サービス

| サービス | 無料枠 | 採用 |
|---------|--------|------|
| Resend | 3,000通/月 | ✅ |

```bash
pnpm add resend
```

---

## マジックリンクの仕組み

```text
【送信時】
  1. ランダムトークンを生成
  2. D1 の magic_tokens に保存
  3. `/auth/verify?token=...` を含むメールを送信

【受信時】
  1. トークンを照合
  2. 有効ならセッションを作成
  3. `/members` へリダイレクト
  4. 無効なら `/login` に戻す
```

---

## D1 テーブル

```sql
CREATE TABLE IF NOT EXISTS magic_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  response_id TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
```

`response_id` と `schema_hash` を持たせると、フォーム再同期後もどの回答に紐づくトークンか追跡できる。

---

## ログインページのUI

```text
┌────────────────────────────────────┐
│ UBM兵庫支部会 メンバーサイト         │
│                                    │
│ [ Googleでログイン ]                │
│                                    │
│ または                               │
│ [ メールアドレス ] [ リンク送信 ]     │
└────────────────────────────────────┘
```

- ログイン画面に管理者向け通知ボタンは置かない
- 認証は自走できることを優先する

---

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `AUTH_SECRET` | Auth.js 用シークレット |
| `AUTH_GOOGLE_ID` | Google OAuth クライアントID |
| `AUTH_GOOGLE_SECRET` | Google OAuth クライアントシークレット |
| `RESEND_API_KEY` | Resend APIキー |
| `RESEND_FROM_EMAIL` | 送信元メールアドレス |
| `SITE_URL` | 本番URL |

---

## 通知方針

- メールはログイン補助のために使う
- `ruleConsent` が未同意の人にはマジックリンクを発行しない
- 管理者のデフォルトUXには「通知メール送信」を入れない
- 公開状態変更や削除/復元は画面内反映を優先する
- 通知の送信結果は `sync_jobs` または運用ログに残す
