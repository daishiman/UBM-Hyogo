# 未割当タスク (Unassigned Task Detection)

本タスク 05b では「触れない / 触れられない責務」を以下に列挙し、後続 issue / task を提案する。

| # | 未割当責務 | 想定 task / 担当先 | 暫定対応 (本タスクでの吸収) | 優先度 |
|---|---|---|---|---|
| U-01 | next-auth (Auth.js) 本体導入 + Credentials Provider 実装 + `/api/auth/callback/email` route | 06b (member-login) / `docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md` | `apps/web/app/lib/auth/config.ts` を placeholder として配置。session callback 形を文書化 | High |
| U-02 | rate-limit を KV / Durable Object へ昇格 | 09b 系 cron + monitoring | in-memory bucket (per-isolate) で MVP 許容。多 isolate デプロイ時に bucket 共有不可なため要昇格 | Medium |
| U-03 | mail provider 監視 dashboard / alerting | `docs/30-workflows/unassigned-task/task-05b-mail-provider-monitoring-alerting-001.md` | 502 `MAIL_FAILED` を返すのみ。alert なし | Medium |
| U-04 | token 履歴の admin 可視化 (発行 / 消費 / 失効) | `docs/30-workflows/unassigned-task/task-05b-magic-token-admin-operations-001.md` | MVP 範囲外。magic_tokens テーブルへの直接 query で代替 | Low |
| U-05 | token 強制無効化 admin UI | `docs/30-workflows/unassigned-task/task-05b-magic-token-admin-operations-001.md` | MVP 範囲外。緊急時は magic_tokens DELETE を D1 直接実行 | Low |
| U-06 | `/auth/gate-state` 等の API 仕様を正本仕様へ正式反映 | 05b Phase 12 再検証 | `references/api-endpoints.md` / `environment-variables.md` / lessons hub / indexes へ反映済み | Done |
| U-07 | rate-limit 数値 (5/h, 30/h, 60/h) のチューニング | 09b (本番運用後の調整) | 定数で集中管理し変更容易に | Low |
| U-08 | Cloudflare Email Routing への Resend 依存解消 | 09b 後続 | Resend free tier 3000/月で MVP 充足 | Low |
| U-09 | UI route 実装 + wrangler dev での視覚的 smoke | 06a/b/c | 本タスクは契約 smoke (vitest) で代替 | High (06b) |
| U-10 | Magic Link メール本文の i18n / a11y 拡張 | `docs/30-workflows/unassigned-task/task-05b-magic-link-mail-i18n-a11y-001.md` | 日本語固定 + plaintext fallback で MVP 充足 | Low |

## ブロッカー判定

- 上記 U-01 / U-09 は 06b の必須作業。06a/b/c の wave 6 開始前に着手必要。
- U-02 / U-03 は wave 9 (運用 + monitoring) で対応する想定。MVP リリースの blocker ではない。
