# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed |

## テスト対象ファイル

`scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts` に以下のケースを **追記** する（既存 case は触らない）。

## テストケース

| ID | name | 目的 | 期待 |
| --- | --- | --- | --- |
| TC-01 | redactForNotification removes 32+ hex | hash 漏洩防止 | `[REDACTED:hash]` を含む |
| TC-02 | redactForNotification removes userId/tenantId/Bearer/slack-webhook | PII / token / webhook URL 除去 | 各 placeholder に置換 |
| TC-03 | buildNotificationPayload uses redacted body | composition 検証 | text に hash / userId 等を含まない |
| TC-04 | dispatchSlack POSTs to url with text | 正常系 | fetch が 1 回呼ばれ、body は `{text: ...}` |
| TC-05 | dispatchMail POSTs to url with subject/body | 正常系 | fetch が 1 回呼ばれ、body は subject/body/from/to を含む |
| TC-06 | evaluateAndAlert: triggered + slackUrl + mailUrl → 3 calls | 並列発火 | createIssue / dispatchSlack / dispatchMail 各 1 回 |
| TC-07 | evaluateAndAlert: dry-run → 0 calls | dry-run 不変条件 | fetch / dispatcher 0 回 |
| TC-08 | evaluateAndAlert: not triggered → 0 calls | 評価器尊重 | 既存挙動維持 |
| TC-09 | evaluateAndAlert: slack throws → result.slackError set, issueUrl present | failure isolation | Issue 起票成功・mail 継続 |
| TC-10 | evaluateAndAlert: mail throws → result.mailError set, slackDelivered true | failure isolation | Slack 配信成功 |
| TC-11 | evaluateAndAlert: createIssue throws → propagates | 必須通知の優先度 | throw が caller に伝播 |
| TC-12 | evaluateAndAlert: slackUrl undefined → no slack attempt, no error | env 未設定 | `slackDelivered` undefined |

## モック戦略

- vitest `vi.fn()` で `IssueCreator` / `SlackDispatcher` / `MailDispatcher` を inject
- HTTP 直叩きの `defaultSlackDispatcher` / `defaultMailDispatcher` の単体検証は `globalThis.fetch` を `vi.spyOn(globalThis, "fetch")` で stub
- snapshot fixture は既存 case のものを再利用（3h 連続超過 / 未満 / 空配列）

## negative case

- TC-09 / TC-10 / TC-11 で failure isolation を網羅
- redaction の負例として TC-02 で webhook URL 文字列を含むテキストの除去を検証

## 完了条件

- [x] テスト一覧（TC-01〜TC-12）が `outputs/phase-04/main.md` に転記される
- [x] 全ケースが Phase 9 で実装可能な粒度で書かれている

## 出力

- `outputs/phase-04/main.md`
