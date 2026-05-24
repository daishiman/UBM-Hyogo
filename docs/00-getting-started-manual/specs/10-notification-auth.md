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

| 変数名 | 種別 | 説明 | Cloudflare | GitHub | 1Password |
|--------|------|------|:----------:|:------:|:---------:|
| `AUTH_SECRET` | Secret | Auth.js 用シークレット | Secrets | - | ✅ (正本) |
| `AUTH_GOOGLE_ID` | Secret | Google OAuth クライアント ID | Secrets | - | ✅ (正本) |
| `AUTH_GOOGLE_SECRET` | Secret | Google OAuth クライアントシークレット | Secrets | - | ✅ (正本) |
| `MAIL_PROVIDER_KEY` | Secret | Magic Link メール送信 provider の API キー | Secrets | - | ✅ (正本) |
| `MAIL_FROM_ADDRESS` | Variable | 差出人メールアドレス。staging / production smoke では必須 | Variables | - | 任意（runtime smoke では必須） |
| `AUTH_URL` | Variable | Magic Link callback URL を組み立てる base URL。staging / production smoke では必須 | Variables | - | 任意（runtime smoke では必須） |

**ルール**: Secret は本番・staging の Cloudflare Secrets に登録し、Variable は Cloudflare Variables / `apps/api/wrangler.toml` の環境別 vars で管理する。ローカル開発は 1Password Environments から `op run` で取得する。平文 `.env` をリポジトリにコミットしない。production で `MAIL_PROVIDER_KEY` が未設定の場合、Magic Link 送信は 502 `MAIL_FAILED` で fail-closed する。`MAIL_FROM_ADDRESS` / `AUTH_URL` はローカル fallback があるため任意だが、staging / production の実送信 smoke では必須として扱う。

---

## 事故防止ルール

1. Magic Link 発行前に `rulesConsent` と削除状態を確認する
2. `responseEmail` 不一致を silent fail にせず登録導線へ戻す
3. GAS prototype のログイン無し UI を本番要件にしない

---

## 通知 Channel 抽象 & opt-out (Issue #55)

### Channel 抽象
通知送信は `apps/api/src/services/notification/channel.ts` の `NotificationChannel` interface を共通入口とする。
現行 `NotificationChannelKind` は `"mail"` のみ。将来 LINE / Slack を追加する際は kind を拡張し adapter を `services/notification/channels/` に追加する。
dispatcher tick は registry (`createNotificationChannelRegistry`) 経由で row の `channel` を解決し、未登録 channel は provider 呼び出しを行わず DLQ + `ledger.event_type='unknown_channel'` を記録する。

### Opt-out gate
`member_status.notification_opt_out INTEGER NOT NULL DEFAULT 0` を正本とする。
`notificationOutbox.enqueue` は対象 member の opt-out を確認し、`true` の場合は outbox 行を作らず `ledger.event_type='skipped_opt_out'` のみ記録し `{ ok: false, reason: 'opt_out' }` を返す。
管理者は `PATCH /admin/members/:memberId/notification-pref` body `{ notificationOptOut: boolean }` でこのフラグを切り替える。会員自身は MVP では切り替え UI を持たない（規約・login 救済通知が止まると認証導線が破綻するため）。

### Ledger event 拡張
`notification_ledger.event_type` CHECK 制約に `skipped_opt_out` / `unknown_channel` を追加する（migration `0020`）。

### 不変条件
1. `apps/web` から `notification_outbox` / `member_status` に直接アクセスしない（`apps/api` 経由）
2. opt-out true の member には channel 種別に関わらず送信しない
3. `MAIL_PROVIDER_KEY` 未設定時は Magic Link は 502 fail-closed だが、outbox dispatcher は `mail_provider_unconfigured` を sanitized error として retry/dlq 経路に乗せる
