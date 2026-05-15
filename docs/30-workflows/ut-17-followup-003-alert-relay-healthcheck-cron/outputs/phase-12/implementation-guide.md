# UT-17-followup-003 Implementation Guide

[実装区分: 実装仕様書]

## Part 1: 概念（中学生レベル）

家のセキュリティアラームに「自動点検タイマー」を取り付けるイメージ。
今までは月 1 回、家の人が手動でアラームのテストボタンを押していた（月次 runbook）。
本タスクで「毎週月曜の朝、自動でテスト発火 → 本物の Slack に届くか確認」する仕組みを追加する。
もし Slack が壊れていたら（webhook URL が失効していたら）、予備の連絡網としてメールで知らせる。

| 用語 | やさしい説明 |
| --- | --- |
| Cron Trigger | Cloudflare Workers に「決まった時間に動け」と命令するタイマー |
| scheduled handler | タイマーで呼ばれる処理本体（fetch handler とは別の入口） |
| Monday gate | タイマーは毎日鳴るけど、「月曜のときだけ実際に走る」二段ロック |
| healthcheck payload | 「これはお試しメッセージです」と書かれた印付き荷物 |
| Resend | メール送信代行サービス。送信元ドメイン検証を Resend 側で済ませてくれる |
| メールフォールバック | LINE/Slack がダメだったときの「予備の連絡網」 |

### 必須サブセクション

1. **なぜ自動 healthcheck が必要か**
   月次手動 runbook だけだと、Slack webhook URL が失効しても最大 1 ヶ月気付けない。
   本物のアラート（無料枠 80% 到達）が来てから気付くと「すでに従量課金が始まっている」事故に直結する。
   週 1 回の自動 ping で「経路の生死」を週単位で検知する。

2. **なぜ cron を新規追加せず既存 daily cron に相乗りするのか**
   Cloudflare Workers の free plan は同一 Worker で持てる cron trigger が最大 3 本。
   リポジトリには既に他の cron が走っており枠を圧迫する。
   daily で発火させて handler 内で「Monday のみ実行」と分岐すれば、cron 本数を増やさず週次運用ができる。

3. **なぜ Slack の戻り値を 2 段階で検証するのか**
   Slack Incoming Webhook は失効した webhook URL に対して HTTP 200 を返し、
   本文に `"no_service"` を入れて返してくるケースが報告されている。
   `response.ok` だけだと壊れた webhook を検知できないため、`status === 200 && body.trim() === "ok"`
   の両面で見る。

4. **なぜメールフォールバックは Resend なのか**
   MailChannels や Cloudflare Email Routing は自社ドメインの SPF/DKIM/DMARC を整える必要があり、
   spam 判定される事故リスクが高い。Resend 無料枠（3,000 通/月）なら Resend ドメインで送信できるため、
   ドメイン検証不要・最小実装で確実に届く。

5. **なぜ `data.healthcheck: true` を識別子に入れるのか**
   本物の Cloudflare Notifications 由来アラートにはこのフィールドが存在しない。
   将来 formatter や log で「healthcheck だけ別 channel に流したい」「healthcheck は集計から外したい」
   といった要望が出たとき、この識別子 1 行で分岐できる。

6. **なぜ Monday を UTC で判定するのか**
   cron 自体が UTC で動く。`0 18 * * *` は UTC 18:00 daily = JST 03:00 翌日。
   この時刻が動くのは UTC 月曜 18:00（=日本時間火曜 03:00）。運用文言は絶対時刻で記録する。
   `getUTCDay() === 1` は UTC 月曜 18:00（=日本時間火曜 03:00）の判定になる。

## Part 2: 技術契約

| 項目 | 契約 |
| --- | --- |
| Trigger | Workers cron `0 18 * * *` (UTC daily, 既存 daily cron に相乗り) |
| 実行 gate | scheduled handler 内で `new Date(controller.scheduledTime).getUTCDay() === 1` のみ healthcheck 実行 |
| Payload | `{ name: "UT-17 weekly healthcheck", severity: "info", data: { healthcheck: true, timestamp: <ISO8601> } }` |
| alert-relay 呼び出し | Request 偽造 + `createAlertRelayRoute().request(...)`（service binding 不使用）。既存 route contract を通す |
| Slack 成功判定 | Slack fetch を `slackOkBodyGuard()` で `status 2xx + body.trim() === "ok"` に正規化し、relay route は 200/502 を返す |
| 失敗時 | Resend API 経由で `HEALTHCHECK_FALLBACK_EMAIL` 宛にメール送信 |
| env binding（新規 optional） | `SLACK_WEBHOOK_URL_HEALTHCHECK?` / `HEALTHCHECK_FALLBACK_EMAIL?` / `RESEND_API_KEY?` |
| Fallback chain | `SLACK_WEBHOOK_URL_HEALTHCHECK` 未設定 → `SLACK_WEBHOOK_URL` 流用。`HEALTHCHECK_FALLBACK_EMAIL` 未設定 → mail 送信 skip + log |
| Retry 戦略 | 既存 `sendSlackMessage` の retry（既定 3 回）を流用する。Slack 失敗後の mail fallback 失敗も throw せず redacted log に留める |
| Dedup | 不要（週 1 回固定発火、dedup 対象になる頻度ではない） |

### 親 UT-17 / 兄弟 followup との関係

| タスク | 責務 | 本タスクとの境界 |
| --- | --- | --- |
| UT-17（親） | alert-relay endpoint / formatter / 月次 runbook | 既に完成。本タスクは「生死確認」レイヤを追加するのみで API surface は変更しない |
| ut-17-followup-001 / 002 / 004 | 別軸（同 workflow 内） | 独立。互いに依存なし |
| UT-08-IMPL | WAE custom alerts | 別軸。本タスクは Cloudflare native usage alerts 経路の生死確認のみ |

## Part 3: 本サイクルで実装するもの（変更ファイル一覧 - CONST_005）

### 新規ファイル

- `apps/api/src/scheduled/healthcheck.ts` — scheduled handler 本体
- `apps/api/src/lib/healthcheck-mail-fallback.ts` — Resend API ラッパー
- `apps/api/src/scheduled/__tests__/healthcheck.test.ts` — handler テスト
- `apps/api/src/lib/__tests__/healthcheck-mail-fallback.test.ts` — fallback テスト

### 編集ファイル

- `apps/api/src/index.ts` — `scheduled` export 追加
- `apps/api/src/env.ts` — `Env` interface に optional 3 binding 追加
- `apps/api/wrangler.toml` — 既存 `[triggers]` `crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` を確認（本タスクでは変更なし）
- local env sample — 対象ファイルなし。本タスクでは追加しない
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` — cron 自動化との役割分担追記

## Part 4: 主要関数シグネチャ

```ts
// apps/api/src/scheduled/healthcheck.ts
export async function runAlertRelayHealthcheck(
  env: Env,
  controller: ScheduledController,
  deps?: AlertRelayHealthcheckDeps,
): Promise<void>;

// apps/api/src/lib/healthcheck-mail-fallback.ts
export async function sendHealthcheckFailureMail(
  env: Env,
  reason: string,
): Promise<{ ok: boolean; skipped?: "no-fallback-email" | "no-resend-key" }>;
```

```ts
// apps/api/src/index.ts (差分)
export default {
  fetch: app.fetch,
  scheduled: async (
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) => {
    ctx.waitUntil(runAlertRelayHealthcheck(env, controller));
  },
} satisfies ExportedHandler<Env>;
```

## Part 5: 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `runAlertRelayHealthcheck` | env, controller (scheduledTime 含む) | `void` | (Monday のみ) alert-relay 内部呼び出し → Slack POST。失敗時 mail fallback。最終的な例外は redacted log に留める |
| `sendHealthcheckFailureMail` | env, reason | `{ ok, skipped? }` | Resend API HTTP POST (`https://api.resend.com/emails`)。env 未設定なら no-op + log |

## Part 6: テスト方針

| レイヤ | ファイル | ケース |
| --- | --- | --- |
| unit | `scheduled/__tests__/healthcheck.test.ts` | Mon (UTC) 発火で実行 / Tue 発火で skip / Slack 200+"ok" → success / 200+"no_service" → retry 後 mail / mail fallback fetch reject でも reject しない |
| unit | `lib/__tests__/healthcheck-mail-fallback.test.ts` | Resend 202 → ok / Resend 4xx → ok:false + log / fetch reject → ok:false + log / config 欠落 → skipped |
| static | `apps/api/src/env.ts` | 3 binding が `Env` interface の optional field として typecheck に通る |
| 統合(外部) | staging cron 手動発火 | Slack staging channel 到達 / 不正 webhook で mail 到達 |

## Part 7: ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm exec vitest run \
  apps/api/src/scheduled/__tests__/healthcheck.test.ts \
  apps/api/src/lib/__tests__/healthcheck-mail-fallback.test.ts
```

## Part 8: 設計判断（Architecture Decision Record）

| 判断 | 採用 | 不採用 | 理由 |
| --- | --- | --- | --- |
| cron 戦略 | 既存 daily cron 相乗り + Monday gate | 新規 weekly cron 追加 | Workers free plan の cron 3 本上限を保護 |
| alert-relay 呼び出し | Request 偽造 | service binding | 既存 auth / formatter / dedupe を通しつつ同一 Worker 内で完結 |
| Slack 成功判定 | status + body 両面 | response.ok のみ | revoke 後の HTTP 200 + `"no_service"` パターンを検知 |
| Mail provider | Resend | MailChannels / SMTP | ドメイン検証不要 / 無料枠 3,000 通 / 最小実装 |
| Channel 分離 | optional 別 binding `SLACK_WEBHOOK_URL_HEALTHCHECK` | 本番 alert channel 強制相乗り | 運用者が将来 channel 分離選択可能（noise 削減） |
| 識別子 | `data.healthcheck: true` | severity 上書き | 本物アラートとフィールド単位で確実に区別 |
| Monday 判定 | UTC `getUTCDay() === 1` | JST 換算 | cron が UTC のため一貫性確保 |

## Part 9: 検証手順

ローカル（必須）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test
```

staging（外部実施）:

```bash
# 1. secrets 投入（1Password 経由）
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --env staging
bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL --env staging
bash scripts/cf.sh secret put RESEND_API_KEY --env staging

# 2. deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 3. Cloudflare Dashboard → Workers → Triggers → 手動 trigger 発火
# 4. Slack staging healthcheck channel に投稿があることを確認 → screenshot 取得
# 5. SLACK_WEBHOOK_URL_HEALTHCHECK を不正値に差し替え → 再発火 → メール受信確認
# 6. 元の値に戻す
```

production（外部実施）:

```bash
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --env production
bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL --env production
bash scripts/cf.sh secret put RESEND_API_KEY --env production
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# 翌月曜 UTC 18:00 の cron 発火を wrangler tail で観測
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production
```

## Part 10: ロールバック手順

| 範囲 | 手順 |
| --- | --- |
| デプロイ | `bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env <env>` |
| cron 設定のみ | 本タスクでは `wrangler.toml` を変更していない。既存 daily cron は schema sync / retention purge も使うため削除しない |
| scheduled handler のみ無効化 | `apps/api/src/index.ts` の `scheduled` export を一時削除 → 再 deploy。cron は発火するが no-op 化 |
| Secrets | optional のため残置可。完全撤去なら `bash scripts/cf.sh secret delete <name> --env <env>` を 3 binding 分実行 |
| runbook | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` の追記部分を revert |

## Part 11: DoD（Definition of Done）

### 機能要件
- [x] `apps/api/wrangler.toml` に既存 `[triggers]` `crons` が定義され staging/production 両 env で有効
- [x] `scheduled` handler が `env` 経由で alert-relay route を呼べる
- [x] healthcheck payload が本物アラートと識別可能（`data.healthcheck: true`）
- [x] Slack fetch 戻り値を `slackOkBodyGuard()` で status + body 両面検証
- [x] Slack 失敗時に Resend メールフォールバックが発火し、mail fallback の fetch reject でも cron promise は reject しない

### 品質要件
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` PASS（2026-05-14 実行）
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api lint` PASS（2026-05-14 実行）
- [x] direct focused Vitest 2 files PASS（2026-05-14 実行、7 tests）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` full suite PASS（package script が `apps/api` 全体を走らせ、unrelated Miniflare/D1 contract tests で `EADDRNOTAVAIL` FAIL）
- [ ] staging で正常系 / 異常系両方の動作確認ログ取得（外部実施）

### ドキュメント要件
- [x] 月次 runbook に cron 自動化との役割分担追記
- [x] cron 連続 2 回失敗時の月次 runbook 即時実施閾値が定義

### Phase 12 同期要件
- [x] `aiworkflow-requirements/references/deployment-cloudflare.md` に週次 healthcheck セクション追記
- [x] `aiworkflow-requirements/indexes/keywords.json` に `cron healthcheck` 関連 4 キーワード追加
- [ ] `docs/30-workflows/unassigned-task/ut-17-followup-003-*.md` を `completed-tasks/` 配下へ移動（external ops 完了後）
