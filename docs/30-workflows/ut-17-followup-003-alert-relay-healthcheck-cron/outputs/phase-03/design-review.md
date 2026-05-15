# Phase 3 / design-review — outputs

[実装区分: 実装仕様書]

> **AC 紐付け**: AC-8

## 1. レビュー対象

Phase 2 で作成された 5 ファイル:

- `outputs/phase-02/cron-schedule-design.md`
- `outputs/phase-02/scheduled-handler-design.md`
- `outputs/phase-02/mail-fallback-design.md`
- `outputs/phase-02/env-binding-design.md`
- `outputs/phase-02/slack-channel-strategy.md`

## 2. 観点別判定（R-1〜R-7）

| # | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| R-1 | cron 上限遵守 | **PASS** | cron-schedule-design.md で `[triggers]` `crons` は不変、`0 18 * * *` への dayOfWeek=1 相乗りで実現することが示されている |
| R-2 | alert-relay 不変条件 | **PASS** | scheduled-handler-design.md で `createAlertRelayRoute()` を `.fetch()` で呼ぶ Request 偽造方式 / `cf-webhook-auth` ヘッダ付与が明示。本体改変なし |
| R-3 | 並列起動の安全性 | **PASS** | cron-schedule-design.md / scheduled-handler-design.md ともに `ctx.waitUntil` 独立 promise + 内部 try/catch で throw 吸収する設計を明示 |
| R-4 | dedupe 衝突回避 | **PASS** | scheduled-handler-design.md で `policy_id = "ut-17-weekly-healthcheck-{ISO週}"` 形式により relay 内 5 分窓 dedupe を回避することを明示 |
| R-5 | Slack 失敗判定の二段化 | **CONDITIONAL** | scheduled-handler-design.md 第 4 章で 1 段目を `slack-sender.ts` の責務として記載。**実装着手前に `apps/api/src/lib/slack-sender.ts` が `status===200 && body.trim()==="ok"` 検証を実装済か再確認必須**。未実装ならパッチを本タスクスコープに含める |
| R-6 | Mail fallback 信頼性 | **PASS** | mail-fallback-design.md で Resend 採用根拠 / Resend 所有ドメイン送信 / 10s timeout / quota 評価が示されている |
| R-7 | 運用性 | **PASS** | slack-channel-strategy.md で fallback ルール / Bootstrap 許容 / 月次 runbook 連携が示されている |

## 3. ファイル別チェック結果

### `apps/api/wrangler.toml`

- [x] `crons` 行に追加なし（cron-schedule-design.md §2）
- [x] `[env.production.vars]` / `[env.staging.vars]` のコメントに UT-17-FU-003 相乗り意図を追記する方針（cron-schedule-design.md §5 / env-binding-design.md §6）

### `apps/api/src/index.ts`

- [x] `0 18 * * *` 分岐末尾に `runAlertRelayHealthcheck` 呼び出しを追加（cron-schedule-design.md §4）
- [x] 内部で曜日判定する設計（caller 側で曜日分岐しない）→ テスト容易性（scheduled-handler-design.md §3）
- [x] env 未設定時は internal で `{ status: "skipped" }` を返し throw しない（scheduled-handler-design.md §3）

### `apps/api/src/env.ts`

- [x] 3 field を optional で追加（env-binding-design.md §1）
- [x] 既存 `SLACK_WEBHOOK_URL?` / `CF_WEBHOOK_AUTH_SECRET?` 不変
- [x] UT-17-FU-003 のコメントブロック挿入位置が示されている（env-binding-design.md §2）

### `apps/api/src/scheduled/healthcheck.ts`

- [x] `runAlertRelayHealthcheck` / `buildHealthcheckPayload` / `formatIsoWeek` / `sendMailFallback` export
- [x] DI 境界 (`deps.fetch` / `deps.now` / `deps.relayAppFactory`) 明確
- [x] Request 偽造の構造（`new Request("https://internal/", { headers: { "cf-webhook-auth": ... } })`）明示
- [x] Slack 投稿先: `env.SLACK_WEBHOOK_URL_HEALTHCHECK ?? env.SLACK_WEBHOOK_URL` 優先
- [x] 構造化 log フォーマット明示

### `apps/api/src/scheduled/healthcheck.test.ts`

- [x] T-01〜T-10 全 10 ケースが phase-02.md で明示
- [x] dayOfWeek 非月曜は T-02 でカバー
- [x] Resend / Slack 異常系のモック方針が示されている（scheduled-handler-design.md §9, mail-fallback-design.md §6）

### `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

- [x] Phase 4 以降の編集差分として役割分担追記方針が slack-channel-strategy.md §7 に明示

## 4. CONDITIONAL の解消条件

### R-5: Slack 失敗判定の二段化

**解消条件**: Phase 4 実装着手の最初のステップで以下を確認:

```bash
grep -n "status === 200" apps/api/src/lib/slack-sender.ts
grep -n "body.*ok" apps/api/src/lib/slack-sender.ts
```

- 既に検証実装済 → そのまま healthcheck.ts は relay の戻り値 `{ ok: true }` を信頼可
- 未実装 → 本タスクのスコープに `slack-sender.ts` パッチを追加し、`response.status === 200 && (await response.text()).trim() === "ok"` の両面検証を追加した上で healthcheck.test.ts でも回帰確認

## 5. その他申し送り事項

| # | 事項 | 対応先 |
| --- | --- | --- |
| 1 | `MAIL_PROVIDER_KEY` と `RESEND_API_KEY` の統合可否を将来検討 | 後続フォローアップ（本タスク範囲外） |
| 2 | Slack channel `#alerts-healthcheck` の Slack admin 側オペレーションが Phase 4 実装前に必要 | Phase 4 前段の外部オペレーション |
| 3 | dayOfWeek=1 (UTC 月曜) vs dayOfWeek=0 (UTC 日曜 = JST 月曜) の最終判断 | 本レビューで dayOfWeek=1 (UTC 月曜 = JST 火曜 03:00) を採用確定 |
| 4 | Phase 4 以降の実装計画書（phase-04〜phase-13）は本サイクル外 | 別サイクルで追補 |

## 6. 最終判定

**GO**（実装着手可）

- R-1〜R-4 / R-6 / R-7: PASS
- R-5: CONDITIONAL（解消条件は Phase 4 着手最初の grep 確認で解消可能・差し戻し不要）

Phase 4 以降の実装は、本 design-review §4 の CONDITIONAL 解消ステップを最初に実施した上で着手すること。

## 7. DoD

- [x] R-1〜R-7 観点別判定が PASS / CONDITIONAL で記録
- [x] 変更対象ファイル別チェック結果が記録
- [x] CONDITIONAL の解消条件が具体的コマンドレベルで示されている
- [x] 申し送り事項 4 件が記録
- [x] 最終 GO/NO-GO 判定が結論として明示
- [x] AC-8（設計レビュー結果記録）達成
