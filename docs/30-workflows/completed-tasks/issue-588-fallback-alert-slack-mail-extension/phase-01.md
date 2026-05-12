# Phase 1: 要件定義 / Gate 整理

[実装区分: 実装仕様書]

## 目的

Issue #588 の要件を確定する。親 #549 で実装済みの GitHub Issue 起票に**追加**して、Slack / mail 通知を `scripts/cf-audit-log/observation/fallback-rate-alert.ts` に組み込む。閾値・window・evaluator は親仕様を不変として扱い、本サイクルでは **dispatcher 層の追加** のみをスコープとする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed |

## 真の論点

- 論点 1: Slack / mail を Issue 起票と並列にするか、置換するか
  - 結論: **並列**。alert fatigue より見逃しリスクの方が運用上重い。Issue は audit trail、Slack は即時通知、mail は inbox 経由の予備系として 3 系統並立。
- 論点 2: mail 配送の transport
  - 結論: SMTP は依存が重いため、`EMAIL_WEBHOOK_URL`（HTTP webhook 経由の transactional mail provider, 例: Mailgun / Resend）を採用。env 未設定時は no-op で skip。provider 契約は本サイクル外。
- 論点 3: 通知失敗時の動作
  - 結論: Slack / mail dispatcher は **try/catch で握り** stderr にログ出力するのみ。GitHub Issue 起票は throw 伝播（既存通り）。3 系統が独立に失敗しても他は継続する failure isolation を担保。
- 論点 4: redaction の責務範囲
  - 結論: webhook URL は payload に絶対含めない（送信先としてのみ使う）。`buildIssueBody` 出力に `userId` / `tenantId` / 32+ hex（fingerprintHash の生値）が含まれる場合は通知系では `[REDACTED]` に置換した別 body を使う。Issue body は audit trail としてフルで残す（既存挙動）。
- 論点 5: dry-run の意味
  - 結論: 既存 `--dry-run` は Issue 起票を skip する。本拡張で Slack / mail も同様に skip。dry-run 時は payload を JSON で stdout に書き出して可観測にする。

## Gate decision table

| 状態 | 条件 | 結論 |
| --- | --- | --- |
| 実装着手 | 親 #549 の現行実装が main にマージ済み | 着手可 |
| 実装保留 | `EMAIL_WEBHOOK_URL` provider 未確定 | mail dispatcher は env 未設定時 no-op で実装し、契約完了後 secret 投入のみで活性化 |

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 価値 | fallback rate 連続超過の即時検知。Issue 起票だけでは notification lag が発生 |
| 実現 | 単一 module への追加。新規依存ゼロ（`fetch` のみ）。failure isolation で既存ロジックを破壊しない |
| 整合 | `buildIssueBody` / `evaluateConsecutive` の signature 不変。env 未設定時は無効化される（後方互換） |
| 運用 | dry-run で staging 検証可能。secret は 1Password 正本 + `cf.sh secret put` 流儀に整合 |

## 確定要件

- R-1: `dispatchSlack(payload, { url })` と `dispatchMail(payload, { url })` を `fallback-rate-alert.ts` 内 export する
- R-2: `evaluateAndAlert` に `slackWebhookUrl?` / `emailWebhookUrl?` を追加（optional）
- R-3: redaction 関数 `redactForNotification(text): string` を export する
- R-4: dry-run 時は HTTP fetch を一切呼ばない
- R-5: 既存 unit test は無修正で PASS する
- R-6: `.github/workflows/cf-audit-log-monitor.yml` の該当 job の `env` に `SLACK_WEBHOOK_INCIDENT` / `EMAIL_WEBHOOK_URL` を `secrets.*` から渡し、`EMAIL_FROM` / `EMAIL_TO` を `vars.*` から渡す行を追加

## 完了条件

- [x] スコープと不変条件が `outputs/phase-01/main.md` に確定記述される
- [x] AC-1〜AC-8（index.md）が Phase 4 / Phase 9 のテストで証明可能な粒度で書かれている
- [x] failure isolation 方針（Slack/mail は best-effort、Issue は必須）が明文化される

## 出力

- `outputs/phase-01/main.md`

## 参照

- `index.md`
- `scripts/cf-audit-log/observation/fallback-rate-alert.ts`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-12.md`
- `docs/30-workflows/completed-tasks/issue-520-slack-incidents-channel-webhook-provisioning/index.md`
