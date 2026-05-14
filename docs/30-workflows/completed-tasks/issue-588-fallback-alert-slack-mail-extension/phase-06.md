# Phase 6: 異常系・エラーハンドリング

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed |

## 異常系一覧

| シナリオ | 期待動作 | 検証 |
| --- | --- | --- |
| Slack webhook 4xx/5xx | `slackError` に message を格納し dispatcher は throw を握る、Issue 起票・mail は継続 | TC-09 |
| Mail webhook 4xx/5xx | `mailError` に message を格納し握る、Slack は影響受けず | TC-10 |
| createIssue throw | caller に伝播（必須通知優先度） | TC-11 |
| `SLACK_WEBHOOK_INCIDENT` / fallback `SLACK_WEBHOOK_URL` 未設定 | dispatcher 呼出しなし、`slackDelivered` undefined | TC-12 |
| `EMAIL_WEBHOOK_URL` 未設定 | dispatcher 呼出しなし、`mailDelivered` undefined | TC-12 派生 |
| `EMAIL_FROM` / `EMAIL_TO` 未設定 | mail dispatcher を呼ばない（仕様: 3 値全揃いが条件） | 設計 §1-4 |
| dry-run | fetch 0 回・dispatcher 0 回・stdout に payload 出力 | TC-07 |
| network timeout | fetch が reject → catch で握る（Slack/mail）or 伝播（Issue） | 既存 fetch 挙動に依存 |
| redaction 不全（hash 漏洩等） | unit test で 0 件 grep を保証 | TC-01〜TC-03 |
| 通知 body の文字数超過（Slack 4000+ 等） | 本サイクルでは扱わない（fallback alert は数行で短い）。将来必要なら truncate を別 issue で | scope out |

## fail-safe 原則

- 通知系は best-effort: 失敗を握って Issue 起票（audit trail）を必ず通す
- secret 漏洩は fail-fast: redaction が機能しない場合は unit test で検出して merge 阻止

## 出力

- `outputs/phase-06/main.md`
