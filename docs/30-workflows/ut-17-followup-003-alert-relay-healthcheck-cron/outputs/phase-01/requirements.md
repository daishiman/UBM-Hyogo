# Phase 1 / 要件定義 — outputs

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/api` Worker への新規モジュール追加・既存 `scheduled` handler 拡張・`env.ts` 型拡張・Cloudflare Secrets 投入を伴う実装タスク。

## 1. タスク背景と目的

UT-17 で実装した Cloudflare Notifications → 日本語化リレー Worker → Slack の通知経路は、
現状 `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` の月次手動 runbook 依存。
Slack Incoming Webhook の revoke / drift / `SLACK_WEBHOOK_URL` 誤投入は本物アラート発火まで検知できない構造的サイレント障害となる。

本タスクは Cloudflare Workers Cron Triggers を用いた **週次自動 healthcheck** を `apps/api` に実装し、
Slack 経路失敗時は Resend 経由でメールフォールバック通知することで、検知ラグを最大 1 週間に短縮する。

## 2. 真の論点（4 点）

### 論点 1: Cloudflare Workers Free Plan の cron 上限 3 本制約

`apps/api/wrangler.toml:13-14, 81-82, 140-141` の通り、production / staging とも cron 3 本で free plan 上限到達済。

| 選択肢 | 評価 | 採否 |
| --- | --- | --- |
| (A) 既存 `0 18 * * *` 分岐への相乗り（dayOfWeek=1 判定） | 追加コストゼロ、新規 cron 不要 | **採用** |
| (B) 既存 cron 1 本を廃止 | `*/5` / `*/15` / `0 18` いずれも SLO 直結のため廃止不可 | 不採用 |
| (C) Workers Paid プラン移行 ($5/月) | 単一目的に対し費用対効果が低い | Trade-off 記載のみ |

### 論点 2: alert-relay 呼び出し方式

`apps/api/src/routes/internal/alert-relay.ts:33-98` の `createAlertRelayRoute()` は Hono インスタンスを返す。

| 選択肢 | 評価 | 採否 |
| --- | --- | --- |
| (A) HTTP 往復 (self-fetch) | 料金枠 2 回消費 / subrequest 制限消費 | 不採用 |
| (B) Request 偽造 | dedupe / auth middleware を bypass し UT-17 不変条件を緩める | 不採用 |
| (C) Request 偽造 (`app.fetch(new Request(...), env)`) | auth / dedupe / formatter を全て通過、本物経路と完全一致 | **採用** |

### 論点 3: Slack channel 分離戦略

OK 通知が本番 alert channel を埋めるノイズ問題（原典 6.2）。

| 選択肢 | 評価 | 採否 |
| --- | --- | --- |
| (A) 専用 channel `#alerts-healthcheck` + `SLACK_WEBHOOK_URL_HEALTHCHECK` | 「無投稿が 2 週続いたら異常」と運用判断可能 | **採用** |
| (B) 同 channel の thread 集約 | Incoming Webhook で `thread_ts` 制御不可 | 実質不能 |
| (C) 同 channel に混在 | ノイズ放置 | 不採用 |

未設定時 fallback: `env.SLACK_WEBHOOK_URL_HEALTHCHECK ?? env.SLACK_WEBHOOK_URL`。Bootstrap 期間のみ後者で運用可。

### 論点 4: Mail fallback の送信方式

| 選択肢 | 評価 | 採否 |
| --- | --- | --- |
| (A) MailChannels for Workers | 自社ドメイン SPF/DKIM 検証必須・spam 判定リスク | 準採用 |
| (B) Cloudflare Email Routing | inbound only / outbound 不可 | 不採用 |
| (C) Resend (3,000 通/月 free) | Resend 所有ドメインから送信 / SPF/DKIM 検証不要 | **採用** |

## 3. スコープ

### 含む
- `apps/api/wrangler.toml` の既存 cron を維持しつつ、コメントで healthcheck 相乗り意図を記録
- `apps/api/src/scheduled/healthcheck.ts` 新規（`runAlertRelayHealthcheck` / `buildHealthcheckPayload` / `sendMailFallback`）
- `apps/api/src/index.ts` の `0 18 * * *` 分岐に呼び出しを追加
- `apps/api/src/env.ts` に 3 つの optional binding を追加
- Slack `status === 200 && body.trim() === "ok"` の両面検証
- Resend 経由 Mail fallback
- Unit test `apps/api/src/scheduled/healthcheck.test.ts` 新規（T-01〜T-10）
- 月次 runbook 役割分担追記方針（Phase 02 設計）

### 含まない
- 新規 cron 追加、Workers Paid プラン移行、MailChannels 構成、Email Routing outbound 構成
- Bot Token / Slack Web API 移行、D1 schema 変更、`apps/web` 配下変更
- UT-08 / UT-14 / UT-18 責務領域

## 4. 受入条件（AC）

index.md AC-1〜AC-9 を本 Phase で正式承認する（詳細は index.md 参照）。

| AC | 対応 Phase |
| --- | --- |
| AC-1〜AC-7 | Phase 2 各成果物 |
| AC-8 | Phase 3 design-review |
| AC-9 | Phase 2 設計内 runbook 役割分担方針 |

## 5. 4 条件評価

| 条件 | 問い | 判定 | 解消条件 |
| --- | --- | --- | --- |
| 価値性 | Slack 経路サイレント障害を 1 週間以内に検知できるか | PASS | — |
| 実現性 | Free plan cron 3 本制約下で実装可能か | PASS | 論点 1 (A) で達成 |
| 整合性 | UT-17 不変条件・既存 `scheduled` handler と整合するか | CONDITIONAL | 既存 `0 18 * * *` 分岐内の schema sync / retention purge と並列起動するため `ctx.waitUntil` 独立 promise として throw 吸収する設計を Phase 2 で具体化 |
| 運用性 | OK 通知がアラート channel を埋めないか | CONDITIONAL | 論点 3 (A) 専用 channel + 未設定時 fallback を Phase 2 で具体化 |

## 6. 既存資産インベントリ

| 資産 | 確認結果 | 参照 |
| --- | --- | --- |
| `apps/api/wrangler.toml` cron 定義 | 3 本で free plan 上限到達済 | apps/api/wrangler.toml:13-14, 81-82, 140-141 |
| `apps/api/src/index.ts` `scheduled` handler | 4 分岐実装済（TAG_QUEUE_TICK_CRON / `*/15` / `0 18` / `0 *`） | apps/api/src/index.ts:388-499 |
| `apps/api/src/routes/internal/alert-relay.ts` | `createAlertRelayRoute()` 実装済、dedupe 5 分窓 / `cf-webhook-auth` 検証あり | apps/api/src/routes/internal/alert-relay.ts:33-98 |
| `apps/api/src/env.ts` | `SLACK_WEBHOOK_URL?` / `CF_WEBHOOK_AUTH_SECRET?` 定義済 | apps/api/src/env.ts:85-91 |
| `apps/api/src/lib/slack-sender.ts` | `sendSlackMessage` 既存（Phase 2 で内部挙動再確認） | — |
| `apps/api/src/middleware/verify-cf-webhook-auth.ts` | 認証 middleware 実装済 | UT-17 親 phase-02 |
| `scripts/cf.sh` | Secret put / deploy ラッパー | CLAUDE.md |
| 1Password Environments | 新 secret 3 件追加可能 | CLAUDE.md |

## 7. 用語集

| 用語 | 意味 |
| --- | --- |
| cron 相乗り | 新規 cron を増やさず既存 cron 分岐内で曜日 / 日付判定し週次起動する手法 |
| dayOfWeek 判定 | `new Date(event.scheduledTime).getUTCDay() === 1`（月曜）。月曜 18:00 UTC = 火曜 3:00 JST |
| healthcheck payload | `name: "UT-17 weekly healthcheck"`, `severity: "info"`, `data.healthcheck: true` を含む Cloudflare Notifications 互換 JSON |
| ISO 週番号 | dedupe 回避用の `policy_id` サフィックス `ut-17-weekly-healthcheck-2026W20` 形式 |
| Request 偽造 | `new Request("https://internal/", { ... })` 経由で Hono `.fetch()` を呼ぶ手法 |
| Resend | Transactional email SaaS / 3,000 通/月 free / Resend 所有ドメイン送信可 |

## 8. Phase 2 への申し送り事項

1. 論点 1〜4 の採用案 (A)-(C)-(A)-(C) を設計前提として固定
2. CONDITIONAL 解消条件 2 件:
   - 並列起動: `runAlertRelayHealthcheck` を `ctx.waitUntil` 独立 promise として呼び、内部 try/catch で全 throw を吸収
   - Slack channel fallback: `env.SLACK_WEBHOOK_URL_HEALTHCHECK ?? env.SLACK_WEBHOOK_URL` の優先順を実装
3. dedupe 衝突回避: `policy_id` に ISO 週番号を含める
4. 既存資産インベントリ行番号を設計内コード参照に転記
5. 異常系の Phase 2 必須カバレッジ:
   - Slack 200 + body 非 "ok"
   - Slack 5xx
   - Resend 401 / quota 枯渇 (429)
   - env 部分未設定
   - dayOfWeek 非月曜

## 9. 完了確認

- [x] 真の論点 4 点を文書化
- [x] 4 条件評価を PASS / CONDITIONAL で記録、CONDITIONAL 解消条件を明示
- [x] AC-1〜AC-9 を正式承認
- [x] 既存資産インベントリを行番号付きで記録
- [x] Phase 2 への引き継ぎ事項を明記
