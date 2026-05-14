# Phase 11: NON_VISUAL Evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 名称 | NON_VISUAL evidence |
| タスク | UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) |
| Issue | #635 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL |
| 証跡の主ソース | local command evidence + `outputs/phase-11/visual-verification-skip.md` |
| screenshot を作らない理由 | 本サイクルの実装差分は `apps/api` の Worker scheduled handler / wrangler.toml `[triggers]` / メールフォールバック実装と runbook のみ。`apps/web` への変更なし、UI が無いため視覚的検証は対象外 |

---

## 判定

UT-17-followup-003 は Cloudflare Workers の `scheduled` handler（cron trigger）追加のみで、
画面 UI を一切持たない。よって視覚的検証（screenshot 取得）は不要。
Phase 11 の成果物は `outputs/phase-11/visual-verification-skip.md` を正本とする。

実 Slack 画面・メールフォールバック受信の確認は Phase 4（staging 動作確認）
および post-deploy 操作の中で staging 環境にて取得する。

---

## 代替検証

UI が存在しない代わりに、以下で品質を担保する。

| 対象 | evidence | 内容 |
| --- | --- | --- |
| scheduled handler | `apps/api/src/scheduled/__tests__/healthcheck.test.ts` | cron 発火時の dummy payload 生成、alert-relay 内部呼び出し、Slack 成功/失敗判定、メールフォールバック分岐の unit test |
| Slack 戻り値判定 | 上記 test 内 | `status === 200 && body.trim() === "ok"` の両面確認テストケース |
| メールフォールバック | 上記 test 内 | Slack 失敗時のみメール送信、成功時メール送信なしのテストケース |
| Env interface | `apps/api/src/env.ts` | `SLACK_WEBHOOK_URL_HEALTHCHECK?` / `HEALTHCHECK_FALLBACK_EMAIL?` / `RESEND_API_KEY?` が optional binding として定義される |
| wrangler.toml | `apps/api/wrangler.toml` | `[triggers]` `crons = ["0 18 * * *"]` の存在 + scheduled handler 内 Monday gate コメント |
| runbook 整合 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | cron 自動化との役割分担追記 |

### staging 実行 evidence（外部実施項目）

Phase 4 staging deploy 後に以下を取得し、本ファイルから参照する:

| 種別 | 期待 evidence | 配置先 |
| --- | --- | --- |
| Slack 投稿スクリーンショット（staging channel） | 「UT-17 weekly healthcheck OK」が staging healthcheck channel に届く | `outputs/phase-11/screenshots/slack-healthcheck-ok-staging.png`（1 枚） |
| メールフォールバック受信スクリーンショット | SLACK_WEBHOOK_URL を意図的に不正値に差し替えた状態で cron 手動発火 → `HEALTHCHECK_FALLBACK_EMAIL` 宛にメール受信 | `outputs/phase-11/screenshots/email-fallback-staging.png`（1 枚） |
| `wrangler tail` の cron 発火ログ | `Cron Trigger fired: 0 18 * * *` + Monday gate 内側のログ出力 | `outputs/phase-11/cron-fire-log.txt` |

> screenshot は staging で外部実施するため、本 Phase の初回完了時点では未取得でよい。`visual-verification-skip.md` で「外部実施項目」として明示する。

---

## 完了条件

- [x] `artifacts.json` の `visualEvidence` が `NON_VISUAL`
- [x] UI screenshot 不要理由を `outputs/phase-11/visual-verification-skip.md` に記録
- [x] Phase 12 implementation guide から Phase 11 skip evidence を参照
- [x] staging Slack 投稿 / メールフォールバック実画面確認は外部実施項目として分離
- [x] `screenshots/.gitkeep` や placeholder PNG を作成していない

---

## 参照

- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-11.md`（フォーマット参考）
- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-11/visual-verification-skip.md`（同上）
- `docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md`（原典）

---

## 次 Phase 引き継ぎ事項

Phase 12 では、NON_VISUAL skip と local test evidence を PR 本文の evidence source として扱う。
staging で取得する 2 枚の screenshot + cron 発火ログは Phase 13 PR 本文の Evidence セクションへ転記する。
