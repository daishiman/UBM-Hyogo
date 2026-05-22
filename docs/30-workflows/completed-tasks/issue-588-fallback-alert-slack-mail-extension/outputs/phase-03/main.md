# Phase 3 Output — 設計レビュー

仕様書: `../../phase-03.md`

## レビュー結果

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 不変条件1（payload に webhook URL / token / hash 全文 / PII を含めない） | OK | `redactForNotification` 5 ルールを `buildNotificationPayload` 経由で必ず通過 |
| 不変条件2（通知失敗時も Issue 起票は実行） | OK | Issue 起票を Slack/mail dispatch より前に実行し、dispatch のみ try/catch で隔離 |
| 不変条件3（dry-run は HTTP を一切叩かない） | OK | `evaluateAndAlert` で dry-run 時は payload を stdout に書いて return |
| 不変条件4（既存 `evaluateConsecutive` / `buildIssueBody` 後方互換） | OK | 既存 export は signature 変更なし、追加引数は optional |
| 既存 unit test の互換 | OK | 21 case のうち legacy ケース全 PASS（phase-11 evidence 参照） |
| 親 #549 の運用合意（5% / 3h）未変更 | OK | parseArgs default `threshold=0.05` / `window=3` 維持 |

懸念事項なし。Phase 4 へ進行可。
