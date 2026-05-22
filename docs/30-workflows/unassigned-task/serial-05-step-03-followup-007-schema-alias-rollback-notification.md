# serial-05 step-03 schema alias rollback notification - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | serial-05-step-03-followup-007-schema-alias-rollback-notification |
| タスク名 | Schema alias rollback 発生時の通知 |
| 分類 | follow-up / notification |
| 対象機能 | schema alias rollback audit |
| 優先度 | 低 |
| ステータス | pending |
| 発見元 | `docs/30-workflows/issue-778-schema-alias-rollback-undo/` |
| 発見日 | 2026-05-19 |

## なぜこのタスクが必要か

rollback は監査上重要な操作だが、通知チャネル（Slack / email / dashboard alert）と通知条件は未確定である。Issue #778 本体に含めると rollback / undo の基本経路完成を妨げるため、通知は独立 follow-up とする。

## スコープ

### 含む

- 通知チャネルの選定
- 通知 payload の secret / PII redaction
- rollback audit log との連携
- retry / failure handling

### 含まない

- rollback / undo 本体
- 集計再実行
- bulk rollback

## 受入条件

- 通知 payload に secret / PII が含まれない
- notification failure が rollback transaction を壊さない
- runtime smoke evidence が tracked file として残る

## 参照

- `docs/30-workflows/issue-778-schema-alias-rollback-undo/`
- `docs/30-workflows/unassigned-task/serial-05-step-03-followup-004-schema-alias-rollback-undo.md`

## 苦戦箇所【記入必須】

- 通知チャネルの secret 管理: Slack webhook / email 認証情報を Cloudflare Secrets に投入する経路と op 参照の運用ルール整備。
- 配信失敗時の retry / dead-letter 設計: rollback 本体の transaction を壊さず、通知だけを非同期に再試行する境界線。
- payload テンプレートの PII / secret redaction: rollback 対象 alias の stableKey や actor email を含めるかの方針判断。
- 通知ループ防止: 通知 channel 側の自動応答や監視 alert と区別するための meta tag 付与。
- 多言語 / 単一言語の選択: MVP では日本語のみで足りるか、admin 通知は英語固定かの確定。

## リスクと対策

- リスク: 通知漏れによる監査不能 → 対策: rollback audit log に notification status (queued / sent / failed) を必ず併記し、failed は dashboard に集計。
- リスク: misconfig による spam / 過剰通知 → 対策: 通知条件（actor 種別、件数閾値）を config 化し、staging で dry-run を必須化。
- リスク: 通知失敗が rollback transaction を巻き込む → 対策: 通知は非同期 queue 経由で送信し、rollback commit には影響させない。
- リスク: payload に PII / token 混入 → 対策: redaction unit test を必須とし、payload schema に redaction 後の field のみ許容する。

## 検証方法

- unit: redaction test（stableKey / actor / token が payload に含まれないこと）。
- contract: notification status enum と audit log field の整合性 spec。
- integration: channel mock で送信失敗 → retry → dead-letter の遷移を確認。
- E2E (staging): rollback 実行 → 通知 queue → mock channel 受信までを runtime evidence として tracked file に保存。
- failure path: webhook 401 / 5xx を意図的に発生させ、rollback 本体は成功・通知のみ failed となることを確認。
