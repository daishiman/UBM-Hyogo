# ut-17-followup-003-alert-relay-healthcheck-cron - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/api` Worker に新規 `scheduled` 分岐・新規 `scheduled/healthcheck.ts` モジュール・`env.ts` zod / TypeScript 型拡張・`wrangler.toml` cron 既存枠への相乗り定義・Slack / Mail フォールバック実装を伴うコード実装タスク。設定単独では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-17-FU-003 |
| タスク名 | Cloudflare Cron Triggers による alert-relay → Slack の週次自動死活確認 |
| ディレクトリ | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron |
| 親タスク | UT-17 (`docs/30-workflows/ut-17-cloudflare-analytics-alerts/`) |
| 原典 | docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 状態 | implementation_completed_external_ops_pending |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | LOW |
| GitHub Issue | #635（CLOSED / local implementation complete / external ops pending） |

## 目的

UT-17 で実装した Cloudflare Notifications → 日本語化リレー Worker → Slack の通知経路を、
週 1 回の Cloudflare Workers Cron Triggers で **自動 healthcheck** する。Slack Incoming Webhook の
revoke / drift / `SLACK_WEBHOOK_URL` 誤投入を最大 1 週間で検出し、Slack 経路失敗時は
Resend 経由のメールで運用者にフォールバック通知する。

これにより、月次手動 runbook (`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`)
への依存を解消し、定常監視は cron、deep-dive は runbook という役割分担に切り替える。

## スコープ

### 含む

- `apps/api/wrangler.toml` 既存 `[triggers]` `crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` への
  **相乗り**による週次 healthcheck 起動（free plan account 上限 3 本制約を遵守）
- `apps/api/src/scheduled/healthcheck.ts`（新規）: alert-relay route を Request 偽造経由で呼び出す
- `apps/api/src/index.ts` の `scheduled` handler 内に `0 18 * * *` 分岐への healthcheck 起動コードを追加
- `apps/api/src/env.ts` の `Env` interface 拡張（`SLACK_WEBHOOK_URL_HEALTHCHECK` / `HEALTHCHECK_FALLBACK_EMAIL` / `RESEND_API_KEY` の optional 追加）
- 健全判定: `status === 200 && body.trim() === "ok"` の両面検証
- Slack channel 分離戦略（`SLACK_WEBHOOK_URL_HEALTHCHECK` 未設定時の本番 URL fallback ポリシー）
- Mail fallback: Resend 無料枠（3,000 通/月）API 経由送信
- ユニットテスト（`apps/api/src/scheduled/healthcheck.test.ts` 新規）
- 月次 runbook の役割分担追記方針（Phase 2 文書化）

### 含まない

- 新規 cron スロット追加（free plan 3 本上限を増やさない）
- Cloudflare Email Routing の outbound 構成（MailChannels は SPF/DKIM 検証コスト過大のため不採用）
- UT-17 本体 alert-relay ルートの挙動変更
- D1 schema 変更
- UT-08 / UT-14 / UT-18 責務領域
- Workers Paid プラン移行（Trade-off として記載のみ）

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md | 原典タスク仕様 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/index.md | 親タスク AC / 不変条件 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-02.md | リレー Worker 設計 |
| 必須 | apps/api/wrangler.toml | cron schedule 正本 |
| 必須 | apps/api/src/index.ts | `scheduled` handler 既存実装 |
| 必須 | apps/api/src/env.ts | zod / TypeScript 型拡張対象 |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 内部呼び出し対象（`createAlertRelayRoute`） |
| 必須 | CLAUDE.md | Secret 管理 / `scripts/cf.sh` 利用ルール |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cron Triggers 公式 |
| 参考 | https://api.slack.com/messaging/webhooks | Slack Incoming Webhook 仕様 |
| 参考 | https://resend.com/docs/api-reference/emails/send-email | Resend send email API |

## 受入条件 (AC)

- **AC-1**: `apps/api/wrangler.toml` の既存 cron 3 本（`0 18 * * *`, `*/15 * * * *`, `*/5 * * * *`）に対し、
  追加 cron は新設せず、`0 18 * * *` 分岐内で **dayOfWeek=1 (月曜) 限定** で healthcheck を起動する設計が
  `outputs/phase-02/cron-schedule-design.md` に決定されている。
- **AC-2**: `apps/api/src/scheduled/healthcheck.ts` の I/O 契約・関数シグネチャ・依存注入境界が
  `outputs/phase-02/scheduled-handler-design.md` に確定している。
- **AC-3**: healthcheck payload に `name: "UT-17 weekly healthcheck"`, `severity: "info"`,
  `data.healthcheck: true` が固定で乗り、本物アラートと一意識別可能であることが Phase 02 で明文化されている。
- **AC-4**: Slack 投稿の成功判定は `response.status === 200 && (await response.text()).trim() === "ok"` の両面検証で
  あることがコード仕様レベルで `outputs/phase-02/scheduled-handler-design.md` に記載されている。
- **AC-5**: Slack 投稿失敗時の Mail fallback（Resend API・`HEALTHCHECK_FALLBACK_EMAIL` 宛・送信元 Resend 所有ドメイン）が
  `outputs/phase-02/mail-fallback-design.md` に記載されている。
- **AC-6**: `Env` への追加 binding（`SLACK_WEBHOOK_URL_HEALTHCHECK?`, `HEALTHCHECK_FALLBACK_EMAIL?`,
  `RESEND_API_KEY?`）と 1Password 正本パス / `bash scripts/cf.sh secret put` の投入手順が
  `outputs/phase-02/env-binding-design.md` に記載されている。
- **AC-7**: `SLACK_WEBHOOK_URL_HEALTHCHECK` を専用 channel `#alerts-healthcheck` に向ける一方、
  未設定時は本番 `SLACK_WEBHOOK_URL` にフォールバックする決定が
  `outputs/phase-02/slack-channel-strategy.md` に記載されている。
- **AC-8**: 設計レビュー結果（GO / NO-GO 判定）が `outputs/phase-03/design-review.md` に記録されている。
- **AC-9**: 月次手動 runbook (`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`)
  に対する役割分担追記方針が Phase 02 設計に存在する（実 runbook 編集は Phase 04 以降）。

## Phase 一覧（本仕様書の対象範囲）

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{cron-schedule-design,scheduled-handler-design,mail-fallback-design,env-binding-design,slack-channel-strategy}.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | タスク分解 | phase-04.md | completed | outputs/phase-04/{task-breakdown,critical-path}.md |
| 5 | 実装計画 | phase-05.md | completed | outputs/phase-05/implementation-plan.md |
| 6 | 実装手順 | phase-06.md | completed | outputs/phase-06/implementation-steps.md |
| 7 | テスト計画 | phase-07.md | completed | outputs/phase-07/test-plan.md |
| 8 | ドキュメント更新 | phase-08.md | completed | outputs/phase-08/docs-updates.md |
| 9 | 受入確認 | phase-09.md | completed | outputs/phase-09/acceptance.md |
| 10 | リファクタ | phase-10.md | completed | outputs/phase-10/refactor-summary.md |
| 11 | NON_VISUAL evidence | phase-11.md | completed | outputs/phase-11/visual-verification-skip.md |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR・振り返り | phase-13.md | blocked_pending_user_approval | outputs/phase-13/pr-summary.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物 |
| ドキュメント | outputs/phase-02/cron-schedule-design.md | cron schedule 相乗り設計（AC-1） |
| ドキュメント | outputs/phase-02/scheduled-handler-design.md | scheduled handler 構造・I/O契約（AC-2, AC-3, AC-4） |
| ドキュメント | outputs/phase-02/mail-fallback-design.md | Resend Mail fallback 設計（AC-5） |
| ドキュメント | outputs/phase-02/env-binding-design.md | env binding / Secret 投入設計（AC-6） |
| ドキュメント | outputs/phase-02/slack-channel-strategy.md | Slack channel 分離戦略（AC-7） |
| ドキュメント | outputs/phase-03/design-review.md | 設計レビュー（AC-8） |
| 管理 | artifacts.json | root workflow state / Phase 1-13 status |
| 管理 | outputs/artifacts.json | outputs parity marker |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 strict compliance / 4条件 / 30種 compact evidence |

## 不変条件

1. **cron 上限遵守**: Cloudflare Workers free plan は account 内 cron 合計 3 本上限。新規 cron は追加せず、
   既存 `0 18 * * *` への相乗り（dayOfWeek 判定）で実現する。
2. **`wrangler` 直接禁止**: Secret 投入・deploy は `bash scripts/cf.sh` 経由のみ。
3. **D1 直接アクセス境界**: 本タスクで D1 binding は使用しない（healthcheck は Slack/Mail 経路のみ）。
4. **平文 secret 禁止**: `.env` には `op://Vault/Item/Field` 参照のみ。実値のコミット禁止。
5. **alert-relay 改変禁止**: UT-17 本体 `createAlertRelayRoute` のシグネチャ・挙動は変更しない。
   healthcheck からは `createAlertRelayRoute().request("/", { method: "POST", ... }, env)` 経由で内部実行する。
6. **Slack 成功判定**: `response.status === 200 && body.trim() === "ok"` の両面検証を必ず実施する。
7. **healthcheck payload 識別**: `data.healthcheck: true` を含み、UT-17 リレーの
   `cloudflare-alert-formatter` が本物アラートと区別できるマーカーを持つ。
8. **dedupe 抑止考慮**: 既存 alert-relay の 5 分 dedupe 窓に弾かれないよう、
   payload に `policy_id: "ut-17-weekly-healthcheck-{ISO週}"` 等の時刻分散キーを必ず付与する。
9. **CONST_007 遵守**: 本サイクル内で Phase 1〜12 と local implementation を完了させる。Phase 13 の commit / push / PR と external ops は user-gated。

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| free plan cron 上限 3 本到達 | 新規 cron 追加せず既存 `0 18 * * *` への相乗り（dayOfWeek=1 判定）で実現 |
| 既存 `0 18 * * *` の retention purge / schema sync を阻害 | healthcheck は `ctx.waitUntil` の独立 promise として並列起動・throw を吸収 |
| Slack revoke で `200 + body=="ok"` 以外が返り誤検知 | status と body の両面検証 + Mail fallback で網羅 |
| Mail fallback の SPF/DKIM 不整合 | Resend 所有ドメインからの送信に固定（自社ドメイン検証コストを回避） |
| Healthcheck の OK 通知がアラート channel を埋める | `SLACK_WEBHOOK_URL_HEALTHCHECK` 専用 channel を別 secret で分離 |
| 既存 alert-relay の dedupe 5min 窓に弾かれる | `policy_id` を週単位で変える（`ut-17-weekly-healthcheck-{ISO週番号}`）|
| Workers Paid プランへの誘導圧力 | Trade-off 章で代替案として明記。Free plan 維持を第一推奨に固定 |

## Phase マップ

```
phase-01 (要件定義)
  └─ outputs/phase-01/requirements.md
       │
       ▼
phase-02 (設計)
  ├─ outputs/phase-02/cron-schedule-design.md
  ├─ outputs/phase-02/scheduled-handler-design.md
  ├─ outputs/phase-02/mail-fallback-design.md
  ├─ outputs/phase-02/env-binding-design.md
  └─ outputs/phase-02/slack-channel-strategy.md
       │
       ▼
phase-03 (設計レビュー)
  └─ outputs/phase-03/design-review.md
       │
       ▼
phase-04〜12 (実装〜正本同期 / local complete)
     │
     ▼
phase-13 (PR・振り返り / user approval gate)
```

## 注意点

- GitHub Issue #635 は既に CLOSED だが、原典 task spec 上は **未実装 followup** だった。本サイクルで local implementation と正本同期まで完了し、external ops は user-gated として残す。
- Phase 4 以降は本サイクルで追補済み。本仕様書は Phase 1〜13 を成果物範囲とする。
- 親 UT-17 本体は `implementation_completed_external_ops_pending` 状態。本 followup は親完了状態を前提とする。
