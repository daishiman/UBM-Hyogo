# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 2 で設計したコード変更（`scheduled/healthcheck.ts` 新規・`scheduled` handler 拡張・`env.ts` 拡張）の GO/NO-GO 判定を行うレビュー Phase。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17-FU-003 alert-relay 週次自動 healthcheck (Cron Triggers) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (実装計画・別サイクル) |
| 状態 | completed |

## 目的

Phase 2 設計成果物 5 件（cron-schedule-design / scheduled-handler-design / mail-fallback-design / env-binding-design / slack-channel-strategy）に対し、
以下 7 軸で GO / NO-GO 判定を行い、`outputs/phase-03/design-review.md` に判定根拠を記録する（AC-8）。

## レビュー観点

| # | 観点 | 判定基準 |
| --- | --- | --- |
| R-1 | cron 上限遵守 | 既存 `crons` 3 本以外を増やしていない / dayOfWeek 判定で週次起動可能 |
| R-2 | alert-relay 不変条件 | UT-17 `createAlertRelayRoute` のシグネチャ・middleware・dedupe / formatter を改変していない |
| R-3 | 並列起動の安全性 | `0 18 * * *` 既存処理（schema sync / retention purge）と並列起動するが、`ctx.waitUntil` の独立 promise として throw を吸収している |
| R-4 | dedupe 衝突回避 | `policy_id` に ISO 週番号を含めることで relay 内 5 分窓 dedupe を回避 |
| R-5 | Slack 失敗判定 | `status === 200 && body.trim() === "ok"` の両面検証を Phase 02 全文書で一貫させている |
| R-6 | Mail fallback 信頼性 | Resend 採用 / Resend 所有ドメインからの送信 / SPF/DKIM 検証不要 / quota 3,000 通/月で年間 52 通使用想定 |
| R-7 | 運用性 | `SLACK_WEBHOOK_URL_HEALTHCHECK` 未設定時の本番 URL fallback / 月次 runbook 役割分担 / 構造化 log |

## 主要レビュー項目（変更対象ファイル別）

### `apps/api/wrangler.toml`

- [ ] `crons` 行に追加なし
- [ ] `[env.production.vars]` / `[env.staging.vars]` のコメントに UT-17-FU-003 相乗り意図が追記されている

### `apps/api/src/index.ts`

- [ ] `0 18 * * *` 分岐の末尾に `runAlertRelayHealthcheck` 呼び出しが追加されている（既存 schema sync / retention purge の `ctx.waitUntil` と並列）
- [ ] dayOfWeek 判定は `runAlertRelayHealthcheck` 内部に閉じる（caller 側で曜日分岐しない）→ テスト容易性
- [ ] env binding 未設定時は内部で `result.status === "skipped"` を返し throw しない

### `apps/api/src/env.ts`

- [ ] `Env` interface に `SLACK_WEBHOOK_URL_HEALTHCHECK?`, `HEALTHCHECK_FALLBACK_EMAIL?`, `RESEND_API_KEY?` を追加（全て optional）
- [ ] 既存 `SLACK_WEBHOOK_URL?` / `CF_WEBHOOK_AUTH_SECRET?` は不変
- [ ] コメントで UT-17-FU-003 が新規追加 binding であることを明示

### `apps/api/src/scheduled/healthcheck.ts`

- [ ] `runAlertRelayHealthcheck` / `buildHealthcheckPayload` / `sendMailFallback` が export されている
- [ ] `deps.fetch` / `deps.now` / `deps.relayApp` の DI 境界が明確
- [ ] alert-relay 本体への Request 偽造（`new Request("https://internal/", { method: "POST", headers: { "cf-webhook-auth": ..., "content-type": "application/json" }, body: JSON.stringify(payload) })`）が `cf-webhook-auth` を正しくセット
- [ ] Slack 投稿先は `env.SLACK_WEBHOOK_URL_HEALTHCHECK ?? env.SLACK_WEBHOOK_URL` の優先順
- [ ] `console.log` で構造化 log を必ず 1 回 emit

### `apps/api/src/scheduled/healthcheck.test.ts`

- [ ] T-01〜T-10 の 10 ケース全てが実装されている
- [ ] dayOfWeek=2〜7 全曜日のうち最低 1 ケースを T-02 でカバー
- [ ] Resend / Slack 双方の異常系をモックで再現可能

### `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

- [ ] Phase 4 以降の編集差分として「定常監視は cron / 本 runbook は四半期に 1 回の deep-dive + cron 失敗時の trace 専用」と冒頭追記する方針が Phase 02 で明文化されている

## レビュー実行手順

1. Phase 2 で作成された `outputs/phase-02/` 配下 5 ファイル全てを読み込む
2. 各観点 R-1〜R-7 に対し PASS / FAIL / CONDITIONAL を判定
3. 変更対象ファイル別レビュー項目を全てチェック
4. `outputs/phase-03/design-review.md` に判定結果を以下構造で記録:
   - 観点別判定表（R-1〜R-7）
   - ファイル別チェック結果
   - CONDITIONAL の解消条件 / NO-GO の場合の差し戻し事項
   - 最終 GO / NO-GO 判定
5. NO-GO 時は Phase 2 へ差し戻し、解消後再レビュー

## DoD（Phase 3 完了条件）

- [ ] `outputs/phase-03/design-review.md` が作成されている
- [ ] R-1〜R-7 観点別判定が全て記録されている
- [ ] 変更対象ファイル別レビュー項目に対する判定根拠が記載されている
- [ ] 最終 GO / NO-GO 判定が結論として明示されている
- [ ] AC-8（設計レビュー結果記録）が満たされている

## ローカル実行・検証コマンド

```bash
# Phase 02 成果物の存在確認
ls docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-02/

# 参照整合性チェック（手動）
grep -r "ut-17-followup-003" docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/

# 型 / lint で Phase 2 設計の構造的不整合がないか先行確認は不要（実装は Phase 4 以降）
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | レビュー対象 Phase |
| 必須 | outputs/phase-02/cron-schedule-design.md | R-1, R-3 評価対象 |
| 必須 | outputs/phase-02/scheduled-handler-design.md | R-2, R-4, R-5 評価対象 |
| 必須 | outputs/phase-02/mail-fallback-design.md | R-6 評価対象 |
| 必須 | outputs/phase-02/env-binding-design.md | R-7 評価対象 |
| 必須 | outputs/phase-02/slack-channel-strategy.md | R-7 評価対象 |
| 必須 | index.md | AC-8 紐付け |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | 設計レビュー結果（AC-8） |

## 次 Phase

- 次: 4 (実装計画・別サイクル)
- 引き継ぎ事項: GO 判定の場合は Phase 4 以降の実装着手可。NO-GO の場合は差し戻し事項を Phase 2 に返却
- ブロック条件: `outputs/phase-03/design-review.md` 未作成、または GO/NO-GO 判定未記載の場合は Phase 4 へ進まない
