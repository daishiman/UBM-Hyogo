# Phase 12: 正本同期

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 名称 | 正本同期 |
| タスク | UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) |
| GitHub Issue | #635 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は Phase 2-11 で実装した scheduled handler / existing cron fan-out / Resend メールフォールバック / runbook 役割分担追記の正本を、aiworkflow-requirements skill / task-specification-creator skill / runbook 群へ反映する Phase。本タスクは UI を持たない implementation / NON_VISUAL だが Phase 12 strict 7 outputs は省略しない。 |

---

## 目的

Phase 1〜11 で完成した cron healthcheck 実装と runbook 役割分担を、
システム仕様書群（aiworkflow-requirements skill 配下の deployment-cloudflare 等）と
unassigned-task index へ正本として引き継ぐ。

---

## なぜ正本同期が必要か（中学生レベル）

「家のアラームに自動点検タイマーを取り付けた」だけでは、3 ヶ月後に
「あれ、なんで毎週月曜にメッセージが届くんだっけ？」と本人や別の家族が混乱する。

Phase 12 では「**自動点検タイマーの存在を取扱説明書の決まったページに追記する作業**」を行う。

- 取扱説明書（aiworkflow-requirements skill の `deployment-cloudflare.md`）に
  「2026-05 改修：毎週月曜 UTC 18:00 に Slack へ自動 ping を送る」と追記
- 月次の手動点検 runbook の冒頭に「自動点検が主、手動点検は補助」と書く
- unassigned-task の付箋を「完了済」の箱に移動する

---

## 必須 outputs

| # | output | 出力先 |
| --- | --- | --- |
| 1 | main.md | `outputs/phase-12/main.md` |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md` |
| 3 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` |
| 5 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md` |
| 6 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md` |
| 7 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

---

## 12-1. implementation-guide.md（Phase 13 PR 本文に直接転記される）

### Part 1 — 中学生レベル概念説明

| 概念 | 例え |
| --- | --- |
| Cron Trigger | 「毎週月曜の朝にアラームを鳴らす」タイマー機能 |
| scheduled handler | タイマーが鳴ったときに「何をするか」を書いたメモ |
| Monday gate | 「タイマーは毎日鳴るけど、月曜のときだけ実際に動く」二段ロック |
| healthcheck payload | 「これはお試しメッセージです」と書かれた印が付いた荷物 |
| メールフォールバック | LINE が通じなかったときの「電話 / メール」予備連絡網 |
| free plan 3 本上限 | アラームは家に 3 個までしか付けられない制限。新規にもう 1 個増やせないので「既存の朝アラームに月曜だけ別の動作を追加」する |

### Part 2 — 技術契約

| 項目 | 契約 |
| --- | --- |
| cron schedule | `0 18 * * *` (UTC daily 18:00 = JST 03:00 翌日)。既存 daily cron に相乗り。Workers free plan の cron 3 本制限を回避するため新規 cron は追加しない |
| 実行 gate | scheduled handler 内で `new Date(controller.scheduledTime).getUTCDay() === 1` のみ healthcheck を走らせる（UTC Monday gate = JST Tuesday 03:00） |
| healthcheck payload | `{ name: "UT-17 weekly healthcheck", severity: "info", data: { healthcheck: true, timestamp: <ISO8601> } }` 固定 |
| alert-relay 呼び出し | service binding ではなく Request 偽造 + `createAlertRelayRoute().request("/", reqInit, env)` で既存 route contract を通す |
| Slack 成功判定 | Slack fetch を `slackOkBodyGuard()` で `status 2xx + body.trim() === "ok"` に正規化し、relay route の戻り値は 200/502 として扱う |
| 失敗時の挙動 | Resend API（`HEALTHCHECK_FALLBACK_EMAIL` 宛）で「UT-17 healthcheck failed at <timestamp>」を送信 |
| env binding | `SLACK_WEBHOOK_URL_HEALTHCHECK?` / `HEALTHCHECK_FALLBACK_EMAIL?` / `RESEND_API_KEY?` を `Env` interface に optional として追加 |
| 未設定時のフォールバック | `SLACK_WEBHOOK_URL_HEALTHCHECK` 未設定 → `SLACK_WEBHOOK_URL` を使用。`HEALTHCHECK_FALLBACK_EMAIL` 未設定 → 失敗時メール送信を skip し redacted error をログ出力 |
| identifier 分離 | `data.healthcheck: true` を Cloudflare Notifications 由来の本物アラート（このフィールドを持たない）と区別する識別子に使う |

### Part 3 — 変更ファイル一覧（CONST_005）

| 種別 | パス | 役割 |
| --- | --- | --- |
| 新規 | `apps/api/src/scheduled/healthcheck.ts` | scheduled handler の実体（export `runAlertRelayHealthcheck(env, controller)`） |
| 新規 | `apps/api/src/lib/healthcheck-mail-fallback.ts` | Resend API 経由のメール送信関数（export `sendHealthcheckFailureMail(env, reason)`） |
| 新規 | `apps/api/src/scheduled/__tests__/healthcheck.test.ts` | Monday gate / Slack 成功失敗 / mail fallback 分岐の unit test |
| 新規 | `apps/api/src/lib/__tests__/healthcheck-mail-fallback.test.ts` | Resend API mock test |
| 編集 | `apps/api/src/index.ts` | `0 18 * * *` branch 内で `runAlertRelayHealthcheck` を `ctx.waitUntil` 実行 |
| 編集 | `apps/api/src/env.ts` | `SLACK_WEBHOOK_URL_HEALTHCHECK`/`HEALTHCHECK_FALLBACK_EMAIL`/`RESEND_API_KEY` を optional 追加 |
| 確認 | `apps/api/wrangler.toml` | 既存 `[triggers]` `crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` を維持（新規 cron 追加なし） |
| 編集 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 冒頭に「定常監視は cron 自動化が担当、本 runbook は四半期確認 + cron 連続失敗時 deep-dive」と追記。連続 N (=2) 回失敗で月次 runbook 即時実施の閾値追加 |

### Part 4 — 主要関数シグネチャ

```ts
// apps/api/src/scheduled/healthcheck.ts
export async function runAlertRelayHealthcheck(
  env: Env,
  controller: ScheduledController,
): Promise<void>;

// apps/api/src/lib/healthcheck-mail-fallback.ts
export async function sendHealthcheckFailureMail(
  env: Env,
  reason: string,
): Promise<{ ok: boolean }>;

// apps/api/src/index.ts
export default {
  fetch: app.fetch,
  scheduled: async (controller: ScheduledController, env: Env, ctx: ExecutionContext) => {
    ctx.waitUntil(runAlertRelayHealthcheck(env, controller));
  },
} satisfies ExportedHandler<Env>;
```

### Part 5 — 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `runAlertRelayHealthcheck` | env, ScheduledController | void | (UTC Monday のみ) alert-relay route 内部呼び出し → Slack POST。失敗時 `sendHealthcheckFailureMail` 呼び出し |
| `sendHealthcheckFailureMail` | env, reason 文字列 | `{ ok: boolean }` | Resend API への HTTP POST。`HEALTHCHECK_FALLBACK_EMAIL` 未設定なら no-op + log |

### Part 6 — テスト方針

| テストレイヤ | 対象 | 想定ケース |
| --- | --- | --- |
| unit | `runAlertRelayHealthcheck` | Monday gate (Mon/Tue で挙動差) / Slack 200+"ok" / 200+"no_service" / 503 / network error / mail fallback 呼び分け |
| unit | `sendHealthcheckFailureMail` | Resend 成功 / Resend 失敗 / `HEALTHCHECK_FALLBACK_EMAIL` 未設定で no-op |
| static | env typing | 3 binding が `Env` interface で optional として typecheck に通る |
| 統合（外部） | staging cron 手動発火 | Slack staging channel 到達 + 不正 webhook で mail fallback 到達 |

### Part 7 — ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm exec vitest run \
  apps/api/src/scheduled/__tests__/healthcheck.test.ts \
  apps/api/src/lib/__tests__/healthcheck-mail-fallback.test.ts
```

### Part 8 — 設計判断

| 判断 | 理由 |
| --- | --- |
| 新規 cron を増やさず既存 daily cron に相乗り | Workers free plan の cron triggers は同一 Worker で最大 3 本（リポジトリ既存 cron 構成で空きが少ない）。週次専用 cron を増やすと将来枠を圧迫する。daily 発火＋Monday gate なら無料枠で確実に運用可能 |
| service binding ではなく Request 偽造 | service binding は Worker-to-Worker の余分な境界を増やす。同一 Worker 内で `createAlertRelayRoute().request(...)` を使えば auth / formatter / dedupe / Slack sender の既存 route contract を通したまま追加 fetch を避けられる |
| Slack 戻り値を status + body 両面確認 | Slack Incoming Webhook は revoke 後に HTTP 200 + body=`"no_service"` を返すケースが報告されており、`response.ok` のみだとサイレント故障になる |
| メール送信は Resend を採用 | MailChannels は送信元ドメインで SPF/DKIM 設定が必要。Resend の無料枠（3,000 通/月）なら Resend ドメインで送信できるため自社ドメイン検証不要・最小実装 |
| `SLACK_WEBHOOK_URL_HEALTHCHECK` を optional 別 binding として用意 | 専用 channel に分離したい運用と、当面は本番 alert channel に相乗りしたい運用の両方を吸収するため。未設定なら `SLACK_WEBHOOK_URL` にフォールバック |
| `data.healthcheck: true` を識別子に追加 | 本物アラート（Cloudflare Notifications 由来）には存在しないフィールド。formatter / log 側で区別可能 |
| Monday gate を JST ではなく UTC で判定 | cron 自体が UTC のため。`getUTCDay() === 1` は UTC Monday 18:00 (= JST Tuesday 03:00) に動く。運用文言は絶対時刻で記録する |

### Part 9 — 検証手順

ローカル:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test
```

staging（外部実施）:

```bash
# 1. secrets 投入
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --env staging
bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL --env staging
bash scripts/cf.sh secret put RESEND_API_KEY --env staging

# 2. デプロイ
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 3. cron 手動発火（Cloudflare Dashboard）→ Slack 投稿確認
# 4. SLACK_WEBHOOK_URL_HEALTHCHECK を不正値に差し替えて再発火 → メール受信確認
# 5. 元の値に戻す
```

### Part 10 — ロールバック手順

| 範囲 | 手順 |
| --- | --- |
| コード | 前 deploy version へ rollback: `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env staging` |
| wrangler.toml | `[triggers]` の `crons` 配列から `"0 18 * * *"` を削除（既存 daily cron がない場合のみ。既にある場合は本タスクで配列に追加していないため変更不要） |
| scheduled handler | `apps/api/src/index.ts` の `scheduled` export を削除すれば cron 発火しても no-op になる |
| secrets | 投入した 3 つ (`SLACK_WEBHOOK_URL_HEALTHCHECK`/`HEALTHCHECK_FALLBACK_EMAIL`/`RESEND_API_KEY`) は optional のため残置で害なし。完全撤去するなら `bash scripts/cf.sh secret delete <name> --env <env>` |

### Part 11 — DoD（Definition of Done）

- [x] `apps/api/wrangler.toml` に既存 `[triggers]` `crons` が定義され、staging/production 両 env で有効（新規 cron 追加なし）
- [x] `scheduled` handler が `env` 経由で alert-relay route を呼べる
- [x] healthcheck payload に `name: "UT-17 weekly healthcheck"` / `severity: "info"` / `data.healthcheck: true` が乗る
- [x] Slack fetch 戻り値を `slackOkBodyGuard()` で status + body 両面検証している
- [x] Slack 失敗時に Resend 経由メールフォールバックが発火する
- [x] `Env` interface で 3 binding が optional として定義されている
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` PASS（2026-05-14 実行）
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api lint` PASS（2026-05-14 実行）
- [x] direct focused Vitest 2 files PASS（2026-05-14 実行、7 tests）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` full suite PASS（package script が `apps/api` 全体を走らせ、unrelated Miniflare/D1 contract tests で `EADDRNOTAVAIL` FAIL）
- [x] 月次 runbook に cron 自動化との役割分担と連続 2 回失敗時の即時実施閾値が追記されている
- [ ] staging で正常系 / 異常系両方の動作確認ログがある（外部実施項目）

---

## 12-2. system-spec-update-summary.md（要点）

詳細は `outputs/phase-12/system-spec-update-summary.md` を参照。

| Step | 対象 | 内容 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録 | `docs/30-workflows/unassigned-task/ut-17-followup-003-*.md` を `completed-tasks/` 配下へ移動（実装＋外部 deploy 完了後） |
| Step 1-B | 実装状況 | `spec_created` → `implementation_completed_external_ops_pending` → external ops 完了で `completed` |
| Step 1-C | 関連タスク | UT-17 親 / followup-001 / 002 / 004 は本タスクと独立、影響なし |
| Step 2 | システム仕様反映 | `aiworkflow-requirements/references/deployment-cloudflare.md` に「scheduled cron による週次 alert-relay healthcheck」セクションを追記。`indexes/keywords.json` に `cron healthcheck` / `weekly healthcheck` / `Monday gate` / `Resend fallback` を追加 |

---

## 12-3. unassigned-task-detection.md（要点）

詳細は `outputs/phase-12/unassigned-task-detection.md` を参照。

- 本サイクルで新たに発見した unassigned task: **なし**
- 親 UT-17 / followup-001/002/004 との独立性確認: 各 followup は完全に独立（cron / D1 / WAF / 監視メトリクスで責務分離）
- Issue #635 の扱い: 仕様書追記により closed のままで OK（追記ステータス: implementation_completed_external_ops_pending → completed）

---

## 完了条件

- [x] strict 7 outputs（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）が `outputs/phase-12/` に配置されている
- [x] `implementation-guide.md` に Part 1〜11（中学生レベル + 技術契約 + 変更ファイル + シグネチャ + 入出力 + テスト + コマンド + 設計判断 + 検証 + ロールバック + DoD）が揃っている
- [x] `system-spec-update-summary.md` に Step 1-A / 1-B / 1-C / Step 2 の判定が明記されている
- [x] `unassigned-task-detection.md` に本タスク完了に伴う unassigned-task 移動手順と他 followup との独立性が記録されている

---

## 次 Phase 引き継ぎ事項

- 次 Phase: Phase 13 (PR・振り返り)
- 引き継ぎ:
  - `implementation-guide.md` Part 3 + 8 + 9 + 10 → PR 本文「変更ファイル / 設計判断 / 検証手順 / ロールバック」
  - `unassigned-task-detection.md` → PR 本文「Summary」と post-merge 「unassigned-task 移動」アクション
- ブロック条件: strict 7 outputs に欠落、または `apps/web` への変更混入が検出された場合は実行しない

---

## 参照

- `docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md`（原典）
- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-12.md`（フォーマット参考）
- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/`（フォーマット参考）
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`（strict 7 outputs ルール）
