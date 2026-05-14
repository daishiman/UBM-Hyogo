# Lessons Learned: UT-17 followup-003 alert relay weekly healthcheck cron (2026-05)

> task: `ut-17-followup-003-alert-relay-healthcheck-cron`
> workflow root: `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/`
> 関連 spec: `references/deployment-cloudflare.md` §UT-17 weekly alert-relay healthcheck cron, `references/workflow-ut-17-cloudflare-analytics-alerts-artifact-inventory.md`

## 概要

UT-17 alert relay の経路（Cloudflare Notifications → `/internal/alert-relay` → Slack）を、Workers free plan の cron 3 本上限を維持したまま週次セルフテストする仕組みを追加したタスク。新規 cron slot は作らず、既存の daily cron `0 18 * * *` に scheduled handler を相乗りさせ、UTC Monday gate（JST Tuesday 03:00）でのみ実行する設計に集約した。Slack 経路が落ちた場合は Resend mail fallback で `HEALTHCHECK_FALLBACK_EMAIL` 宛に通知する。

## 苦戦箇所

### L-UT17-FU003-001: 新規 cron slot を作らず既存 daily cron に相乗りさせる判断

- 症状: 「週 1 cron」と聞くと `0 18 * * 1` のような new entry を `[triggers] crons` に足したくなる。
- 原因: Workers free plan の cron 上限が 3 本である事実が、wrangler.toml の既存 `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` から直感的に読み取れない。
- 解決: `runAlertRelayHealthcheck` 内で `controller.cron === "0 18 * * *"` かつ `new Date(controller.scheduledTime).getUTCDay() === 1` の二段ゲートで日次→週次に絞る。cron slot は増やさず handler 側で sub-frequency を表現する。
- 再発防止: Workers の cron 追加判断では、まず「既存 cron に相乗り可能か」を先に検討する。`apps/api/src/scheduled/` 配下に dispatch layer を置き、cron 文字列を gate key として handler が判定する形を標準化する。

### L-UT17-FU003-002: Slack 200 + 非"ok" body の擬陽性

- 症状: Slack Incoming Webhook が経路の中継で `200 OK` を返しつつ body が `"no_service"` 等になるケースがあり、healthcheck が「成功」と判定されてしまう。
- 原因: HTTP status だけで合否判定していた。Slack webhook の成功条件は status と body=`"ok"` の両方。
- 解決: `slackOkBodyGuard` で fetch をラップし、`status 2xx && body.trim() === "ok"` 以外を `502` に書き換えて upstream に伝搬。`/internal/alert-relay` の既存 retry/abort 経路に巻き込まれる。
- 再発防止: Slack webhook 経由の healthcheck では、必ず body assertion を入れる。`response.ok` だけを見ない。

### L-UT17-FU003-003: mail fallback の no-throw 補強

- 症状: Resend fetch が throw した場合、scheduled handler 全体が落ちて Cloudflare 側に red event だけ残り、Slack 経路と mail 経路のどちらが死んでいるか runbook 担当者に伝わらない。
- 原因: `fetch` reject を bubble させていた。
- 解決: `sendHealthcheckFailureMail` を `try { fetch } catch { return { ok:false } }` で wrap し、error message のみ `console.error` に redacted log で残す。`RESEND_API_KEY` / `HEALTHCHECK_FALLBACK_EMAIL` 未設定時は `{ ok:true, skipped:true }` を返し、警告ログのみで scheduled handler は green に維持。
- 再発防止: fallback 経路は「fallback 自体の失敗で primary 報告が消える」事態を防ぐため、必ず no-throw + structured log で握る。`reason: "mail_config_not_ready"` のような machine-readable tag を入れる。

### L-UT17-FU003-004: optional env binding を Env 型に追加するだけでは zod 検証されない

- 症状: `SLACK_WEBHOOK_URL_HEALTHCHECK` / `HEALTHCHECK_FALLBACK_EMAIL` / `RESEND_API_KEY` を `apps/api/src/env.ts` に追加した際、optional のため zod schema を通っていなくても `getEnv()` がそのまま通る。
- 原因: Workers の secret binding は型で declare しても実値の有無は runtime まで分からない。
- 解決: `apps/api/src/lib/healthcheck-mail-fallback.ts` 側で `env.RESEND_API_KEY?.trim()` / `env.HEALTHCHECK_FALLBACK_EMAIL?.trim()` を call site validation し、未設定時は skip + warn log。Slack 側も `env.SLACK_WEBHOOK_URL_HEALTHCHECK ?? env.SLACK_WEBHOOK_URL` の fallback chain で legacy 互換を担保。
- 再発防止: optional binding は「型で存在を保証できない」前提で、call site で trim + empty 判定 + skip log を必ず置く。skipped 状態は scheduled handler の return では green として扱い、外形監視（runbook 担当者の dashboard 巡回）に委ねる。

### L-UT17-FU003-005: ISO week key を policy_id に焼き付けて dedup を効かせる

- 症状: 同じ週内で複数回 scheduled handler が走った場合（Cloudflare 側の at-least-once 配信や手動 fire）、Slack に同じ healthcheck 通知が重複する。
- 原因: `policy_id` を timestamp ベースで生成すると毎回 unique になり、`/internal/alert-relay` 側の dedup を素通りする。
- 解決: `isoWeekKey(date)` で `2026-W20` 形式の週キーを生成し、`policy_id: "ut-17-weekly-healthcheck-2026-W20"` として焼き付け。`/internal/alert-relay` の policy_id ベース dedup が同一週内の重複送信を吸収する。
- 再発防止: 週次 / 月次 cron で alert を発火させる場合、`policy_id` には「発火粒度に揃った時間 bucket key」を入れる。ISO week は `getUTCDay() || 7` で月曜起点の調整を入れること（getDay は日曜=0）。

### L-UT17-FU003-006: implementation_completed_external_ops_pending という state 表記

- 症状: コードと local test は完全に通っているのに、staging/production 投入は user approval gate 待ちで、workflow registry 上の state が `implementation` のままだと「実装途中」と誤読される。
- 原因: 「local implementation 完了 + external ops pending」を表す state name が既存語彙に無かった。
- 解決: `task-workflow-active.md` および resource-map 側で `CODE_COMPLETE_EXTERNAL_OPS_PENDING` を runtime gate label として記録し、state は `implementation` / scope は `NON_VISUAL` を維持。Phase 11 evidence には「secrets 投入・deploy・manual cron fire・first cron observation は user approval 後」と明記。
- 再発防止: 「local 完了 / external ops pending」のタスクは runtime gate ラベルで明示する。`spec_created` や `implementation` の状態名だけでは upstream 担当者に進捗が伝わらない。

## 適用範囲

- Cloudflare Workers cron で free plan 3 本上限を維持しながら異なる頻度を表現したい場合（既存 cron 相乗り + gate 判定）
- Slack Incoming Webhook 経由の healthcheck / synthetic monitoring 全般（body assertion 必須）
- Resend を fallback 通知経路に使う Workers task（no-throw + skip log + optional binding）
- ISO week / month / quarter 単位で policy_id を bucket 化して dedup を効かせたい alert relay 経路

## 関連リンク

- 実装: `apps/api/src/scheduled/healthcheck.ts`, `apps/api/src/lib/healthcheck-mail-fallback.ts`
- 既存 spec: `references/deployment-cloudflare.md` §UT-17 weekly alert-relay healthcheck cron（line 252-274）
- artifact inventory: `references/workflow-ut-17-cloudflare-analytics-alerts-artifact-inventory.md`
- workflow root: `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/`
- runbook: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
