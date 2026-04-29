# 会員認証・権限制御

## 認証の仕組み

```text
未ログイン
  -> 公開ページはそのまま閲覧可
  -> 会員機能に入ると /login

/login
  -> Google OAuth or Magic Link
  -> normalize email
  -> lookup member by responseEmail
  -> check rulesConsent
  -> check isDeleted
  -> create session
  -> redirect to member area
```

管理者判定は `admin_users` による。

`apps/web` がログイン UI とセッション導線を担い、`apps/api` は member lookup / admin 判定 / D1 照合を受け持つ。

---

## 権限モデル

| ロール | できること |
|--------|------------|
| 公開ユーザー | 公開一覧・公開詳細・登録導線の閲覧 |
| 会員 | 公開ページ + 自分の会員画面の閲覧 |
| 管理者 | 全画面 + 公開状態、削除、開催日、参加履歴、タグ、schema 運用 |

---

## ログイン許可条件

1. `responseEmail` に一致する `member_identities` が存在する
2. `member_status.rules_consent = "consented"`
3. `member_status.is_deleted = false`

公開表示条件:

1. `member_status.public_consent = "consented"`
2. `member_status.publish_state = "public"`
3. `member_status.is_deleted = false`

ログイン可否と公開可否は分離する。

---

## `/login` の UX

`/no-access` には依存しない。`/login` に状態を持たせる。

### 初期状態

- Google でログイン
- メールリンクを送信
- 未登録者向け Google Form 登録リンク

### エラーではなく誘導として扱う状態

| 状態 | 説明 |
|------|------|
| `unregistered` | まだフォーム回答が無い。登録 CTA を出す |
| `rules_declined` | 規約同意が無いためログイン不可。再回答 CTA を出す |
| `deleted` | アプリ上で削除済み。管理者連絡導線を出す |

---

## 会員更新との関係

会員プロフィールの更新はアプリ内編集ではなく Google Form 再回答を正式経路とする。

そのため認証後のマイページには以下を置く。

1. 現在の公開状態サマリ
2. Google Form 再回答導線
3. `editResponseUrl` がある場合の再編集導線
4. 参加履歴の閲覧

---

## 管理者判定

```text
session.user.email
  -> normalize
  -> lookup admin_users.email
  -> isAdmin = true / false
```

管理者は本文の直接編集をせず、Google Form schema 外データのみを運用する。

---

## セッションに保持する情報

```ts
type SessionUser = {
  email: string;
  memberId: string;
  responseId: string;
  isAdmin: boolean;
  authGateState: "active" | "rules_declined" | "deleted";
};
```

`/me` は認証済み session の状態として `active` / `rules_declined` / `deleted` を返す。
`input` / `sent` / `unregistered` は magic link 入力から本人照合までの gate flow 状態であり、
`SessionUser.authGateState` には入れない。

---

## 事故防止ルール

1. `responseId` と `memberId` を混同しない
2. `publicConsent` と `rulesConsent` を混同しない
3. 削除済みメンバーのセッションは新規発行しない
4. 未登録者を `/no-access` に送らず、登録導線へ戻す
