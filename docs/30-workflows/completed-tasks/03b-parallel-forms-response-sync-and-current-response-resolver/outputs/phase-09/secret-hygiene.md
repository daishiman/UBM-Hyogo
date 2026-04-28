# Secret Hygiene — 03b

## 取り扱う secret

| 名前 | 用途 | 保管 | 注入経路 |
|------|------|------|---------|
| `SYNC_ADMIN_TOKEN` | admin route Bearer | Cloudflare Secrets | `wrangler.toml` 経由バインド |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Forms API JWT subject | Cloudflare Secrets | 同上 |
| `GOOGLE_PRIVATE_KEY` | Forms API JWT 署名鍵（PEM） | Cloudflare Secrets | 同上 |
| `GOOGLE_FORM_ID` | 同期対象フォーム | 非機密だが env 変数経由 | wrangler.toml `[vars]` でも可 |

ローカル開発時は **すべて 1Password に保管し、`.env` には `op://Vault/Item/Field` 参照のみ**。
`scripts/with-env.sh` が `op run --env-file=.env` でラップして揮発注入する。

## 禁止事項

- `.env` を `cat` / `Read` / `grep` で表示・読み取らない
- secret 値をドキュメントやログに出力しない
- `wrangler login` のローカル OAuth トークンを保持しない（`scripts/cf.sh` 経由のみ）
- `wrangler` を直接呼ばない（`scripts/cf.sh` を通すこと）

## ログでの redaction

`runResponseSync` 内で error / metrics を `console.warn` する箇所には `redact()` を通す
（email を `<email-redacted>` に置換）。

```ts
function redact(input: unknown): string {
  return String(input).replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "<email-redacted>");
}
```

`sync_jobs.metrics_json` には email を保存しない（processedCount / writeCount / cursor / errorCount のみ）。
`sync_jobs.error_json` には `code` / `safeMessage` のみ（stack に email が混じる場合は redact 通過後）。

## 鍵ローテーション

- `GOOGLE_PRIVATE_KEY` を回転する場合は **1Password の値を更新 → Cloudflare Secrets を再 put**
  → `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`（無 deploy で
  Secrets 反映可能だが、worker の cold start を予測可能にするため deploy を推奨）
- `SYNC_ADMIN_TOKEN` 回転は同手順。回転中は短時間 401 が出る可能性があるため admin 経路は
  休止時間帯に行う

## 監査

- Cloudflare ダッシュボード → Workers → Logs で 401/403 の急増を監視
- D1 `sync_jobs WHERE status='failed' ORDER BY started_at DESC LIMIT 50` を定期確認
- `error_json.code` が `FORMS_AUTH` で連続するなら鍵漏洩 / 期限切れを疑う
