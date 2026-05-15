# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/api` Worker の `scheduled` handler / `env.ts` / `wrangler.toml` / 新規 `scheduled/healthcheck.ts` モジュールにコード変更を加える実装タスク。仕様策定単体では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17-FU-003 alert-relay 週次自動 healthcheck (Cron Triggers) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

UT-17-FU-003（alert-relay 週次 healthcheck Cron）の必要性・スコープ・受入条件を確定し、
Phase 2 設計に渡す入力を Phase 1 で固定する。特に以下 4 つの真の論点を本 Phase で明文化する:

1. Cloudflare Workers free plan の **cron 上限 3 本制約** にどう収めるか
2. healthcheck からの alert-relay 呼び出しは **HTTP 往復 vs 関数直接 import vs Request 偽造 fetch** のいずれを採るか
3. Slack channel 分離（OK 通知のノイズ問題）を **専用 channel** で実現するか **同居** にするか
4. Slack 経路失敗時の **Mail fallback** の送信方式を MailChannels / Resend / Email Routing のいずれにするか

## 真の論点

### 論点 1: cron 上限 3 本制約

`apps/api/wrangler.toml` の現状は production / staging とも `crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]`
の 3 本で、free plan の account 内 cron 上限に既に張り付いている（`apps/api/wrangler.toml:76-80` のコメント参照）。

選択肢:
- **(A) 既存 `0 18 * * *` への相乗り**: `scheduled` handler 内で `new Date().getUTCDay() === 1`（月曜）判定で
  週次起動。新規 cron 不要・追加コストゼロ。**第一推奨**。
- **(B) 既存 cron のいずれかを廃止**: `*/5 * * * *` (tag queue retry) は SLO に直結するため廃止不可。
  `0 18 * * *` は schema sync + retention purge を兼ねるため廃止不可。`*/15 * * * *` は forms response
  sync + audit-correlation の二重責務で廃止不可。**実質採用不能**。
- **(C) Workers Paid に移行**: 月額 $5。本タスクの単一目的では費用対効果が低い。**Trade-off 記載のみ**。

→ Phase 1 では **(A) を採用** として確定する。

### 論点 2: alert-relay 呼び出し方式

`apps/api/src/routes/internal/alert-relay.ts` の `createAlertRelayRoute()` は `Hono<{ Bindings: AlertRelayEnv }>`
を返し、外部 HTTP 経由で `verifyCfWebhookAuth` middleware を通過する設計になっている。

選択肢:
- **(A) HTTP 往復 (fetch + 公開 URL)**: `fetch(env.SELF_URL + "/internal/alert-relay", ...)`。
  Workers 内 self-fetch は料金枠を 2 回消費する上、subrequest 制限（50/req）にも影響。**不採用**。
- **(B) 関数を直接 import 呼び出し**: `createAlertRelayRoute()` は Hono インスタンスなので関数として直接
  呼べない。内部の `sendSlackMessage` / `formatCloudflareAlertToSlack` を直接使う案は、
  alert-relay の dedupe ロジック・auth middleware を bypass し UT-17 不変条件を緩める。**準推奨**。
- **(C) Request 偽造して Hono インスタンスの `.fetch(request, env)` 経由で呼ぶ**:
  `const app = createAlertRelayRoute(); await app.fetch(new Request("https://internal/", { method: "POST", headers: { "cf-webhook-auth": env.CF_WEBHOOK_AUTH_SECRET, "content-type": "application/json" }, body: JSON.stringify(payload) }), env);`
  の形。auth / dedupe / formatter をすべて通る・UT-17 の挙動と完全一致。**第一推奨**。

→ Phase 1 では **(C) Request 偽造方式** を採用として確定する。

### 論点 3: Slack channel 分離

OK 通知が本番 alert channel に毎週流れると、本物のアラートが埋もれる運用ノイズが発生する（原典 6.2 章）。

選択肢:
- **(A) 専用 channel `#alerts-healthcheck` + 別 Webhook URL**: Slack 側で 1 channel 増設、
  Webhook URL を `SLACK_WEBHOOK_URL_HEALTHCHECK` として別 secret で管理。「無投稿が 2 週続いたら異常」と
  運用者が判断できる。**第一推奨**。
- **(B) 同一 channel の単一スレッド集約**: Incoming Webhook は `thread_ts` 制御不可。Bot Token 経路は
  認可スコープ追加で過剰投資。**実質不能**。
- **(C) 同 channel に混在**: ノイズ問題を放置するため**不採用**。

→ Phase 1 では **(A) 専用 channel** を採用。ただし `SLACK_WEBHOOK_URL_HEALTHCHECK` 未設定時は
本番 `SLACK_WEBHOOK_URL` にフォールバック（運用 bootstrap 期間用）。

### 論点 4: Mail fallback の送信方式

選択肢:
- **(A) MailChannels for Workers**: SPF / DKIM / DMARC を自社ドメイン側で検証必要。検証未設定だと
  spam 判定される事故が頻発（原典 6.5 章）。**準採用**。
- **(B) Cloudflare Email Routing**: inbound only 構成のため outbound 送信に使えない。**不採用**。
- **(C) Resend 無料枠**: 3,000 通/月。Resend 所有ドメイン (`onboarding@resend.dev` 等) からの送信が可能で
  SPF/DKIM 検証は Resend 側で完結。Workers から HTTP POST のみで送信可能。**第一推奨**。

→ Phase 1 では **(C) Resend** を採用。`RESEND_API_KEY` を新 secret として追加。

## 依存境界と責務

| 種別 | 対象 | 境界 |
| --- | --- | --- |
| 上流 | UT-17 cloudflare-analytics-alerts | `createAlertRelayRoute` / `verifyCfWebhookAuth` / `cloudflare-alert-formatter` は実装済み・改変禁止 |
| 上流 | `apps/api/wrangler.toml` 既存 cron 3 本 | 改変は `0 18 * * *` 分岐への healthcheck ロジック追加のみ。cron 本数は不変 |
| 上流 | 1Password Environments | `SLACK_WEBHOOK_URL_HEALTHCHECK` / `HEALTHCHECK_FALLBACK_EMAIL` / `RESEND_API_KEY` の正本 |
| 連携 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 月次手動 runbook の役割再定義 |
| 対象外 | UT-08 (WAE カスタム計装) | 別責務 |
| 対象外 | UT-14 (WAF アラート) | 別責務 |
| 対象外 | UT-18 (Workers CPU 個別観測) | 別責務 |
| 対象外 | D1 schema 変更 | 不要 |
| 対象外 | `apps/web` 配下 | 不要 |

## 価値とコスト評価

- **初回提供価値**: Slack Webhook revoke / drift / 誤投入を最大 1 週間以内に検出可能になる。
  月次手動 runbook 担当者の失念リスクを解消。Mail fallback により Slack 自体が落ちても気付ける。
- **初回に払わないコスト**: Workers Paid 移行、自社ドメイン SPF/DKIM 設定、Bot Token 化、新 cron スロット。
- **設計コスト**: Phase 02 成果物 5 件 + Phase 03 レビュー 1 件 = 6 ドキュメント。
- **実装コスト見積（Phase 4 以降）**:
  - `apps/api/src/scheduled/healthcheck.ts` 新規 約 150〜200 行
  - `apps/api/src/index.ts` の `0 18 * * *` 分岐への追加 約 20 行
  - `apps/api/src/env.ts` への field 3 件追加
  - `apps/api/src/scheduled/healthcheck.test.ts` 新規 約 200 行（正常系 / Slack 失敗 / Mail fallback / dedupe 衝突 / dayOfWeek=非月曜スキップ）
  - 月次 runbook 追記 約 30 行
- **運用コスト**: Resend API key の年次ローテーション、`SLACK_WEBHOOK_URL_HEALTHCHECK` 死活の月次確認。

## 4 条件評価

| 条件 | 問い | 判定 | 解消条件 |
| --- | --- | --- | --- |
| 価値性 | Slack 経路サイレント障害を 1 週間以内に検知できるか | PASS | — |
| 実現性 | Free plan cron 3 本制約下で実装可能か | PASS | 論点 1 の (A) 相乗り方式採用で達成 |
| 整合性 | UT-17 不変条件・既存 `scheduled` handler 構造と整合するか | CONDITIONAL | 既存 `0 18 * * *` 分岐内の schema sync / retention purge と並列起動するため、`ctx.waitUntil` の独立 promise として throw を吸収する設計を Phase 2 で固定 |
| 運用性 | OK 通知が本番 alert channel を埋めないか | CONDITIONAL | 論点 3 の (A) 専用 channel + 未設定時 fallback を Phase 2 設計で固定 |

## 既存資産インベントリ

| 資産 | 確認結果 | 参照 |
| --- | --- | --- |
| `apps/api/wrangler.toml` cron 定義 | `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` 3 本で free plan 上限到達済 | apps/api/wrangler.toml:13-14, 81-82, 140-141 |
| `apps/api/src/index.ts` `scheduled` handler | 3 cron 分岐実装済（`TAG_QUEUE_TICK_CRON`, `*/15`, `0 18 * * *`, `0 * * * *`） | apps/api/src/index.ts:388-499 |
| `apps/api/src/routes/internal/alert-relay.ts` | `createAlertRelayRoute()` 実装済。dedupe TTL 5 分・`cf-webhook-auth` 検証あり | apps/api/src/routes/internal/alert-relay.ts:33-98 |
| `apps/api/src/env.ts` | `Env` interface に `SLACK_WEBHOOK_URL?` / `CF_WEBHOOK_AUTH_SECRET?` 定義済 | apps/api/src/env.ts:85-91 |
| `apps/api/src/lib/slack-sender.ts` | `sendSlackMessage` 既存（status 検証実装あり） | (実装確認は Phase 2 で再確認) |
| `apps/api/src/middleware/verify-cf-webhook-auth.ts` | `cf-webhook-auth` 固定シークレット検証実装済 | UT-17 親 outputs/phase-02/relay-worker-design.md |
| `scripts/cf.sh` | secret put / deploy ラッパー利用可能 | CLAUDE.md |
| 1Password Environments | 新規 secret 3 件の追加可能 | CLAUDE.md |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 月次手動 runbook 存在（役割分担追記対象） | 親タスク AC-9 連携 |

## スコープ確定

### 含む

- Cloudflare Workers 既存 cron への週次 healthcheck 相乗り（dayOfWeek=1 判定）
- `apps/api/src/scheduled/healthcheck.ts` 新規モジュール
- `apps/api/src/index.ts` の `scheduled` handler 拡張
- `apps/api/src/env.ts` への optional binding 3 件追加
- Slack `SLACK_WEBHOOK_URL_HEALTHCHECK` 専用 channel + 未設定時 fallback
- Mail fallback (Resend API)
- 正常系 / 異常系 unit test
- 月次 runbook の役割分担追記方針

### 含まない

- 新規 cron スロット追加
- Workers Paid プラン移行
- Bot Token / Slack Web API への移行
- MailChannels 経由送信
- Cloudflare Email Routing 構成変更
- D1 schema 変更
- `apps/web` 配下の変更
- UT-08 / UT-14 / UT-18 責務領域

## 受入条件 (AC) 確認

index.md で定義した AC-1〜AC-9 を Phase 1 で正式承認する。
- AC-1〜AC-7 → Phase 2 各成果物に対応
- AC-8 → Phase 3 design-review に対応
- AC-9 → Phase 2 設計内に runbook 役割分担方針を含めることに対応

## 用語集

| 用語 | 意味 |
| --- | --- |
| cron 相乗り | 新規 cron スロットを追加せず、既存 cron 分岐内の関数で曜日 / 日付判定を行って週次起動する手法 |
| dayOfWeek 判定 | `new Date(event.scheduledTime).getUTCDay() === 1`（月曜）。月曜 0:00 UTC は JST 月曜 9:00 に相当 |
| healthcheck payload | `name: "UT-17 weekly healthcheck"`, `severity: "info"`, `data.healthcheck: true` を固定で含む Cloudflare Notifications 互換 JSON |
| ISO 週番号 | dedupe 衝突回避用の `policy_id` サフィックス。`ut-17-weekly-healthcheck-2026W20` 等 |
| Request 偽造 | `new Request("https://internal/", { ... })` を作って Hono `.fetch()` に渡し、HTTP 往復なしに route を呼ぶ手法 |
| Resend | Transactional email SaaS。無料枠 3,000 通/月。Resend 所有ドメインから送信できるため自社 SPF/DKIM 検証不要 |
| 専用 channel | `#alerts-healthcheck` 等、healthcheck OK 通知専用に分離した Slack channel |

## 実行タスク

- [ ] 原典タスク `docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md` を読み込み、要件・苦戦箇所 6.1〜6.5 を本 spec に反映する
- [ ] 既存 `apps/api/wrangler.toml` / `apps/api/src/index.ts` / `apps/api/src/routes/internal/alert-relay.ts` / `apps/api/src/env.ts` の現状を確認する
- [ ] 真の論点 4 点を Phase 1 で明文化する
- [ ] 4 条件評価を行い、CONDITIONAL の解消条件を Phase 2 へ申し送る
- [ ] 既存資産インベントリを洗い出す
- [ ] `outputs/phase-01/requirements.md` を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md | 原典タスク |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/index.md | 親 AC・不変条件 |
| 必須 | apps/api/wrangler.toml | cron 上限の正本 |
| 必須 | apps/api/src/index.ts | `scheduled` handler 既存構造 |
| 必須 | apps/api/src/env.ts | binding 拡張対象 |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 内部呼出対象 |
| 必須 | CLAUDE.md | Secret 管理 / `scripts/cf.sh` ルール |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | cron 仕様 |
| 参考 | https://api.slack.com/messaging/webhooks | Slack Webhook 仕様 |
| 参考 | https://resend.com/docs/api-reference/emails/send-email | Resend send email API |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物（4 論点・スコープ・AC・4条件評価・既存資産・用語集） |

## 完了条件

- [ ] 4 つの真の論点が文書化されている
- [ ] 4 条件評価が PASS / CONDITIONAL で記録され、CONDITIONAL の解消条件が明示されている
- [ ] AC-1〜AC-9 が Phase 1 で正式承認されている
- [ ] 既存資産インベントリが行番号付きで記録されている
- [ ] downstream handoff（Phase 2 への引き継ぎ事項）が明記されている
- [ ] `outputs/phase-01/requirements.md` が作成されている

## タスク 100% 実行確認【必須】

- 全実行タスク completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（Slack 200 + body 非 "ok" / Resend API quota 枯渇 / 既存 `0 18 * * *` 分岐の他処理 throw / dedupe 衝突）を Phase 2 申し送り事項に含む
- 次 Phase への引き継ぎ事項を明記

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項:
  - 論点 1〜4 の採用案（(A)-(C)-(A)-(C)）を Phase 2 設計の前提として固定
  - CONDITIONAL 解消条件 2 件（並列 promise / Slack channel fallback）を Phase 2 で具体化
  - 既存資産インベントリの行番号を Phase 2 設計内のコード参照に転記
- ブロック条件: `outputs/phase-01/requirements.md` 未作成 / CONDITIONAL 解消条件未記録 の場合は Phase 2 に進まない
