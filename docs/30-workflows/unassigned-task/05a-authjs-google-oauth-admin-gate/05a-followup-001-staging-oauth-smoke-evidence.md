# 05a Follow-up 001: Staging OAuth Smoke Evidence

## 苦戦箇所【記入必須】

05a Phase 11 は実 Google OAuth client と Cloudflare Workers staging/preview が未接続だったため、OAuth redirect/callback、`/login?gate=...`、`/admin/*` redirect、実 cookie を使った curl 証跡、screenshot を取得できなかった。自動化テストで JWT / session-resolve / admin route gate は確認済みだが、ユーザー可視の OAuth flow 証跡は staging で上書きが必要。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Google OAuth redirect URI / Cloudflare host 設定差分で本番直前に失敗する | staging URL を Google OAuth client に登録し、Phase 11 `smoke-checklist.md` をそのまま実行する |
| screenshot / curl / session JSON が placeholder のまま残る | `outputs/phase-11/` の placeholder を実証跡で上書きし、Phase 12 implementation-guide の参照も更新する |

## 検証方法

- `docs/30-workflows/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/smoke-checklist.md` の M-01〜M-11 / F-09 / F-15 / F-16 / B-01 を staging で実行
- screenshot 9 枚、curl 結果、`session-member.json` / `session-admin.json`、`wrangler-dev.log` を保存
- `/no-access` が作られていないことを再確認

## スコープ（含む/含まない）

含む:

- staging OAuth smoke 実行
- Phase 11 evidence の placeholder 上書き
- Phase 12 implementation-guide の証跡リンク更新

含まない:

- Auth.js / API gate の設計変更
- Google OAuth verification 申請
