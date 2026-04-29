# secret-hygiene — forms-schema-sync (03a)

シークレット取扱い基準と本実装でのチェック結果。

---

## 1. 取扱い対象

| 名前 | 用途 | 保管場所 |
| --- | --- | --- |
| `SYNC_ADMIN_TOKEN` | `/admin/sync/schema` の Bearer 認証 | Cloudflare Secrets / 1Password |
| `GOOGLE_FORM_ID` | 対象 Form ID | Cloudflare Vars（公開可・実値は CLAUDE.md の固定値） |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | service account 識別子 | Cloudflare Secrets / 1Password |
| `GOOGLE_PRIVATE_KEY` | service account 秘密鍵 | Cloudflare Secrets / 1Password |
| `GOOGLE_FORM_RESPONDER_URL` | Form 回答リンク（任意） | Cloudflare Vars |

---

## 2. チェックリスト

| 項目 | 結果 |
| --- | --- |
| 平文値をリポジトリにコミットしていない | OK（grep でリテラル無し）|
| sync_jobs.error_json に秘密値を入れない | OK（message のみ保存） |
| Workers logs に秘密値を出力していない | OK（`[schema-sync] failed: <message>` のみ） |
| route response に秘密値を含めない | OK（jobId / status / counts のみ） |
| ローカル `.env` は op 参照（`op://Vault/Item/Field`）のみ | OK（CLAUDE.md ポリシー準拠） |
| `wrangler` を直接呼ばず `scripts/cf.sh` 経由 | OK（実行手順は cf.sh のみ） |

---

## 3. 留意事項

- `SYNC_ADMIN_TOKEN` ローテーションは Cloudflare dashboard / `bash scripts/cf.sh secret put` を使用する想定（運用ドキュメントは wave 9b で整備）。
- service account の鍵更新は `GOOGLE_PRIVATE_KEY` Secret 差し替え + redeploy で反映。
- 失敗時の error message に Forms API の URL / payload を含めない（client 側で sanitize 済み）。
