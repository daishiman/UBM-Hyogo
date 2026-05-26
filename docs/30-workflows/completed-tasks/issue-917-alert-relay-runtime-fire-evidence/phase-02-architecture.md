---
phase: 2
title: Architecture
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: completed
---

# Phase 2: Architecture — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

判定根拠: 既存トポロジ（issue-857 配線結果）を観測対象として扱い、新規コード surface を追加しない。

## 1. 観測対象トポロジ（現コード・不変）

```
[*/15 cron Trigger] ─ ctx.waitUntil ─▶ runSheetsAuthHealthcheck(env, event)
                                          │  Sheets API 最小 read (A1:A1)
                                          ▼
                              401/403 → cls.isAuthFailure = true
                                          │
                                          ▼  postAlertRelay(env, cls, fetch)
              base  = env.API_INTERNAL_BASE_URL    ★ issue-857 で 2 env 配線済み
              token = env.INTERNAL_ALERT_TOKEN
                       ?? env.CF_WEBHOOK_AUTH_SECRET  ★ fallback 正本
                                          │
                  base/token どちらか falsy → no-op:
                      event: "sheets.auth.alert_relay_skipped"
                      reason: "missing API_INTERNAL_BASE_URL or token"
                                          │
                                          ▼ POST ${base}/internal/alert-relay
                                          │ header: cf-webhook-auth: <token>
                                          ▼
                              [同一 Worker] /internal/alert-relay route
                                          │ verifyCfWebhookAuth middleware
                                          │   expected = env.CF_WEBHOOK_AUTH_SECRET
                                          │   一致 → next() / 不一致 → 401 / null → 500
                                          ▼
                              handleSheetsAuthAlert → ALERT_DEDUP_KV(任意) → Slack/mail
```

## 2. 本タスクの介入点（観測のみ・mutation なし）

| 介入点 | 種別 | 内容 |
| --- | --- | --- |
| `bash scripts/cf.sh secret list --env staging` | 観測（user-gated） | `CF_WEBHOOK_AUTH_SECRET` name presence を確認（値非表示） |
| `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | mutation（user-gated） | staging への再 deploy。実 mutation だが対象は既存 config のみ |
| `bash scripts/cf.sh tail ...` | 観測（user-gated） | deploy 前後の Workers tail で no-op reason 消失を確認 |
| 親 UT-25-DERIV-02 Phase 11 invalidation 手順 | mutation（user-gated） | SA 資格情報失効を模した controlled dry-run |
| `apps/api/src/scheduled/sheets-auth-healthcheck.ts` | 編集 | relay POST 応答の `responseStatus` structured log |
| `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` | 編集 | 200 / 401 responseStatus logging assertion |
| `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` | 新規作成 | evidence MD（user-gated runtime cycle） |
| `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md` | 編集 | 「actual alert receipt」行のステータス更新（user-gated runtime cycle） |

> **コード surface は新規追加しない**。送受信のロジック・型・vars はすべて不変。

## 3. wrangler.toml `[vars]` named env 非継承の罠（再確認）

issue-857 で確定済みの不変条件:

- top-level `[vars]` は `[env.staging]` / `[env.production]` に継承されない。
- `API_INTERNAL_BASE_URL` は両 named env の `[vars]` テーブルに直書きで配線済み（issue-857）。
- 本サイクルで `apps/api/wrangler.toml` を編集しない。観測のみ実施し、片肺配線が無いことを deploy 前後の tail で実機証明する。

| env | 期待 var 値 | 検証手段 |
| --- | --- | --- |
| staging | `https://api-staging.ubm-hyogo.workers.dev` | 配線済み（issue-857 §1.2）・tail で `alert_relay_skipped` が出ないことで効果実証 |
| production | `https://api.ubm-hyogo.workers.dev` | 同上・本サイクルでは deploy ポリシー次第で観測 |

## 4. 送受信 token 整合の再確認

| ケース | `INTERNAL_ALERT_TOKEN` | 送信 token | relay 結果 | 本サイクルでの扱い |
| --- | --- | --- | --- | --- |
| A（正本） | 未設定 | `CF_WEBHOOK_AUTH_SECRET` | 200 | ✅ 観測対象（dry-run で 200 を期待） |
| B | `CF_WEBHOOK_AUTH_SECRET` と同値 | 一致 | 200 | △ 冗長（本サイクルでは投入しない） |
| C（罠） | 別値 | 不一致 | 401（drop） | ❌ 投入禁止。`negative path` として「もし誤投入したら 401 になる」想定として MD に文書化のみ |

ケース A の維持を runtime で実証することが AC-4 の本質。ケース C の negative path は実投入せず仕様書側の risks（Phase 9）と evidence MD の「想定外動作」セクションで文書化する。

## 5. 依存関係

| 種別 | 対象 | 状態 |
| --- | --- | --- |
| 上流 | issue-857 配線 PR の `dev` 取り込み + staging deploy | merged（前提） |
| 上流 | `CF_WEBHOOK_AUTH_SECRET` の staging / production Secret 投入 | UT-17 等で既存・name presence のみ確認 |
| 上流 | UT-25-DERIV-02 healthcheck cron 実装 | 完了（前提） |
| 上流 | UT-25-DERIV-02 Phase 11 controlled invalidation 手順 | 完了（本サイクルで再利用） |
| 並走 | `ALERT_DEDUP_KV` namespace 有効化 | 任意（未有効化でも degrade forward する。本サイクル非ブロッカー） |
| 下流 | UT-25-DERIV-02 close-out / 月次運用 SOP | 本サイクル完了で「runtime verified」境界を進められる |
| 関連 | `ut-17-followup-001-alert-relay-runtime-smoke-evidence.md` | 受信側 smoke。送信トリガー経路と別ファイルで保管 |
