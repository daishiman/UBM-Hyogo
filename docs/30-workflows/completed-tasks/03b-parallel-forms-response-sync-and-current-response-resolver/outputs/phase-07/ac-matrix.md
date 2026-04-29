# AC ↔ Test ↔ Code マトリクス

| AC | 内容 | Test ID | Test ファイル | 主要 code |
|----|------|---------|---------------|-----------|
| AC-1 | submittedAt 最新 + responseId tiebreak | T-U-01 / T-U-02 | `sync-forms-responses.test.ts` (decide / "同 email 再回答") | `decideShouldUpdate` |
| AC-2 | unknown question を schema_diff_queue に enqueue / 重複 no-op | T-U-09 | `sync-forms-responses.test.ts` ("AC-2") | `processResponse` + `enqueueDiff` + migration 0005 partial UNIQUE |
| AC-3 | consent 正規化 (`publicConsent`/`rulesConsent`) | T-U-05 | `extract-consent.test.ts` / `sync-forms-responses.test.ts` (正常系) | `extract-consent.ts` + shared `normalizeConsent` |
| AC-4 | `responseEmail` を `member_responses.response_email` に system field 保存 | T-U-03 / T-U-12 | `normalize-response.test.ts` / `sync-forms-responses.test.ts` (正常系) | `processResponse` upsertMemberResponse / `SYSTEM_STABLE_KEYS` |
| AC-5 | cursor pagination loop / `nextPageToken=undefined` 停止 | T-U-13 | `sync-forms-responses.test.ts` ("AC-5") | `runResponseSync` while-loop |
| AC-6 | 二重起動防止 → skipped → route 409 | T-U-14 / T-A-01 | `sync-forms-responses.test.ts` ("AC-6") + `responses-sync.test.ts` (409) | `sync-locks` + route mapping |
| AC-7 | `MemberId` / `ResponseId` brand 型混同を拒否 | T-U-11 | `sync-forms-responses.types.test.ts` | `@ubm-hyogo/shared` brand types |
| AC-8 | consent legacy alias (`ruleConsent` → `rulesConsent`) | T-U-07 | `extract-consent.test.ts` | shared `normalizeConsent` |
| AC-9 | `is_deleted=1` の identity は consent snapshot 更新を skip | T-U-08 | `sync-forms-responses.test.ts` ("AC-9") | `processResponse` の `is_deleted` guard |
| AC-10 | per-sync write cap で loop 打ち切り | T-U-10 | `sync-forms-responses.test.ts` ("AC-10") | `RESPONSE_SYNC_WRITE_CAP` + break |

## ルート系（401 / 200 / 409 / 500）

| Test ID | 状態 | テスト |
|---------|------|--------|
| T-A-00 | 401 | `responses-sync.test.ts` "Authorization なしは 401" |
| T-A-02 | 200 | `responses-sync.test.ts` "正しい token + idle は 200" |
| T-A-01 | 409 | `responses-sync.test.ts` "既に running の場合は 409" |
| T-A-03 | 500 | `responses-sync.test.ts` "SYNC_ADMIN_TOKEN 未設定は 500" |
| —      | param 透過 | `responses-sync.test.ts` "?fullSync=true ... が runResponseSync に渡る" |

## 失敗系（Phase 6 の F-* と対応）

| F-* | Test |
|-----|------|
| F-01 | `sync-forms-responses.test.ts` "失敗系: client.listResponses が throw" |
| F-05 | AC-6 と共有 |
| F-07 | AC-2 と共有 |
| F-08 | AC-9 と共有 |
| F-09 | AC-10 と共有 |
| F-10 | AC-7 type test |
