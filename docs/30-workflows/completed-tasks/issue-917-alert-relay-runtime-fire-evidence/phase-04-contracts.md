---
phase: 4
title: Contracts
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: completed
---

# Phase 4: Contracts — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

判定根拠: 既存 contract（送受信 token 解決 / verify-cf-webhook-auth / wrangler.toml vars）は不変。本タスクはそれらを runtime で観測する出力契約（`scripts/cf.sh` 経由のコマンド出力形式と relay status 契約）を規定する。

## 1. `scripts/cf.sh secret list` 出力契約

```bash
bash scripts/cf.sh secret list --env staging
bash scripts/cf.sh secret list --env production
```

期待出力（name のみ・値は表示しない）:

```
┌──────────────────────────────┬───────┐
│ Name                         │ Type  │
├──────────────────────────────┼───────┤
│ CF_WEBHOOK_AUTH_SECRET       │ secret│
│ ...（他 secret 名）           │ secret│
└──────────────────────────────┴───────┘
```

契約:

- `CF_WEBHOOK_AUTH_SECRET` の name が出力に含まれていれば AC-1 充足。
- Type 列 / 値は出力されない（wrangler/cf.sh 仕様）。evidence MD には name 列のみ転記し、その他列は省略可。
- 不在の場合は `bash scripts/cf.sh secret put --env <env> CF_WEBHOOK_AUTH_SECRET`（user-gated）で投入し、再 list で presence を確認する。

## 2. `scripts/cf.sh deploy` 出力契約

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

期待出力（要点抜粋）:

```
Total Upload: ... KiB / ... KiB gzip
Uploaded ubm-hyogo-api (staging) (... sec)
Deployed ubm-hyogo-api (staging) triggers (... sec)
  https://api-staging.ubm-hyogo.workers.dev
Current Version ID: <uuid>
```

契約:

- `Deployed` 行と `Current Version ID` が evidence MD に redact 不要で記録される（version id は機密ではない）。
- `https://api-staging.ubm-hyogo.workers.dev` が表示され、本サイクルでは production への deploy は **ポリシー判断**。

## 3. Workers tail 出力契約

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty
```

### 3.1 配線後・正常時（cron 通常稼働）

`event: "sheets.auth.healthcheck"` の構造化ログが定期的に出力され、`event: "sheets.auth.alert_relay_skipped"` / `reason: "missing API_INTERNAL_BASE_URL or token"` は **出ない** ことが正常。

### 3.2 SA 資格情報失効 dry-run 中（AC-3..5 観測対象）

```json
// 期待される log の概形（実値は redact）
{
  "event": "sheets.auth.healthcheck",
  "outcome": "auth_failure",
  "status": 401,        // または 403
  "ts": "..."
}
{
  "event": "sheets.auth.alert_relay_post",
  "url": "https://api-staging.ubm-hyogo.workers.dev/internal/alert-relay",
  "responseStatus": 200, // 正常時 / negative path で 401
  "ts": "..."
}
```

契約:

- POST 到達時の `responseStatus` が `200`（送受信 token 整合・ケース A）または `401`（不整合・ケース C）であること。`500` や connection error は本タスク失敗。
- `cf-webhook-auth` header 値は **絶対に tail に表示させない**（コードの実装が header 値をログ出力しないことが前提・確認）。出力されている場合は evidence MD で `<redacted>` 置換。
- `event` 名は `sheets.auth.healthcheck` / `sheets.auth.alert_relay_skipped` / `sheets.auth.alert_relay_post`（dot 区切り命名・Phase 1 §6 規則）に従う。

## 4. evidence MD 契約

`docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` の見出し構造（本サイクルは雛形のみ提示・実値は runtime 後追加）:

```markdown
# alert-relay-fire-staging

## メタ
- env: staging
- workflow: issue-917-alert-relay-runtime-fire-evidence
- upstream: issue-857
- 取得日時: <ISO8601>
- 取得者: <user>

## 1. secret name presence
- staging: `CF_WEBHOOK_AUTH_SECRET` present / absent
- production: 同上（実施範囲）

## 2. deploy 前後 tail（no-op reason 消失）
### before deploy
- `alert_relay_skipped` 出力: あり / なし / 観測不可
### after deploy
- `alert_relay_skipped` 出力: なし（期待）

## 3. SA 資格情報失効 dry-run
- 手順: 親 UT-25-DERIV-02 Phase 11 controlled invalidation を参照
- Sheets API 観測 status: 401 / 403

## 4. alert-relay POST 到達
- URL: `https://api-staging.ubm-hyogo.workers.dev/internal/alert-relay`
- responseStatus: 200 / 401
- header `cf-webhook-auth`: `<redacted>`

## 5. 通知到達（任意）
- Slack / mail: 到達 / 未設定のため対象外

## 6. 想定外動作（negative path 文書化）
- ケース C（`INTERNAL_ALERT_TOKEN` 別値投入時）: 本サイクルでは投入せず、401 が出る理論のみ記録

## 7. 関連
- issue-857: `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/`
- 親 UT-25-DERIV-02: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/`
- 受信側 smoke（重複回避）: `docs/30-workflows/unassigned-task/ut-17-followup-001-alert-relay-runtime-smoke-evidence.md`
```

契約:

- secret 値・token 値・cookie 値は MD 内に絶対に転記しない。`<redacted>` 一律。
- staging を必須セクションとし、production は実施範囲を明記する任意セクション（実施なしなら「deploy ポリシーにより staging のみ実施」と記録）。

## 5. issue-857 implementation-guide 更新契約

`docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md` の「Runtime Path x Evidence」表を以下の差分で更新する（step-08）:

```diff
- | actual alert receipt | Workers tail after deploy and controlled SA key invalidation | pending_user_approval |
+ | actual alert receipt | Workers tail after deploy and controlled SA key invalidation | verified — see docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md |
```

契約:

- リンクは repo 相対 path。
- `verified` 文字列を必須キーワードとして残す（後続検索の正本キー）。
- 本更新は本サイクルでは未実施（runtime evidence 取得サイクルで実施）。
