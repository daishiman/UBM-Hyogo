# Phase 4 Output — テスト戦略

仕様書: `../../phase-04.md`

## 確定テストケース（vitest）

| ID | 対象 | 概要 |
| --- | --- | --- |
| TC-01 | parseArgs | default window=3 / threshold=0.05 |
| TC-02 | parseArgs | invalid threshold reject |
| TC-03 | parseArgs | invalid window reject |
| TC-04 | evaluateConsecutive | 連続 N 時間超過で trigger |
| TC-05 | evaluateConsecutive | 直近 1 時間が閾値内なら no-trigger |
| TC-06 | evaluateConsecutive | snapshot 不足で no-trigger |
| TC-07 | evaluateConsecutive | 空入力安全 |
| TC-08 | buildIssueBody | observed / Refs #549 を含む |
| TC-09 | redactForNotification | 5 パターンの全マスク確認 |
| TC-10 | buildNotificationPayload | title 安定性 + body redact 確認 |
| TC-11 | defaultSlackDispatcher | `{text}` POST、200 |
| TC-12 | defaultSlackDispatcher | non-2xx で throw |
| TC-13 | defaultMailDispatcher | subject/body/from/to POST |
| TC-14 | evaluateAndAlert | dry-run で createIssue 未呼出 |
| TC-15 | evaluateAndAlert | trigger 時 createIssue 呼出 |
| TC-16 | evaluateAndAlert | issue + slack + mail の 3 系統発火 |
| TC-17 | evaluateAndAlert | dry-run 時は全 dispatcher skip |
| TC-18 | evaluateAndAlert | Slack 失敗時も mail / issue は完遂（failure isolation） |
| TC-19 | evaluateAndAlert | Slack/mail env 未設定で dispatcher 未呼出 |
| TC-20 | evaluateAndAlert | non-trigger で createIssue 未呼出 |
| TC-21 | evaluateAndAlert | trigger + non-dry-run で repo/token 必須 |

mock 戦略: dispatcher / createIssue は DI で `vi.fn()` 注入。`defaultSlackDispatcher` / `defaultMailDispatcher` の HTTP は `vi.spyOn(globalThis, "fetch")` で代替。実 HTTP 呼出は無し。
