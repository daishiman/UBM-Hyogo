# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 3（設計レビュー） |
| 次 Phase | 5（実装ランブック） |
| 状態 | pending |

## 目的

unit / contract / E2E / authorization の test を設計し、AC-1〜AC-10 を verify suite にマップする。

## 実行タスク

1. unit test 対象列挙（normalize-answer / extract-consent / resolve-identity / pick-current-response / snapshot-consent / cursor-store / forms-response-sync）。
2. contract test 列挙（`POST /admin/sync/responses` response、`member_responses` row、`response_fields` row、`member_identities` row、`member_status` row）。
3. E2E は 08b に委譲（再回答シナリオ）。
4. authorization test（401 / 403 / 200 / 409）。
5. fixture 設計（forms-list-page1.json / page2.json / unknown-field.json / re-submission.json）。
6. test matrix を outputs/phase-04/test-matrix.md。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-02/main.md | module |
| 必須 | outputs/phase-03/main.md | リスク |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | 31 項目 fixture |
| 参考 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | sync_jobs |

## 実行手順

### ステップ 1: unit
- `normalize-answer.spec.ts`: known stableKey / unknown questionId 双方を分離
- `extract-consent.spec.ts`: `consented` / `declined` / `unknown` + ruleConsent 正規化
- `resolve-identity.spec.ts`: 新規 email → 新 memberId、既存 → 同じ memberId
- `pick-current-response.spec.ts`: submittedAt 最新、タイ時 responseId desc
- `snapshot-consent.spec.ts`: is_deleted=true は skip、false は更新
- `cursor-store.spec.ts`: payload に保存 / 読み出し
- `forms-response-sync.spec.ts`: 正常系 + 失敗系で status 遷移

### ステップ 2: contract
- `POST /admin/sync/responses`: `{ jobId, status, processedCount }`
- `member_responses` row: `{ responseId, memberId, responseEmail, submittedAt, schemaRevisionId, rawJson }`
- `response_fields` row: `{ responseId, stableKey?, valueText, valueJson, rawQuestionId, extraFieldsJson? }`
- `member_identities` row: `{ memberId, responseEmail (UNIQUE), currentResponseId, firstResponseId, lastSubmittedAt }`
- `member_status` row: `{ memberId, publicConsent, rulesConsent, publishState, isDeleted }`

### ステップ 3: E2E（08b 委譲）
- 同 email で 2 回回答 → current_response が後者に切り替わる
- 既知のみ → unknown 0 件
- unknown 1 件追加 → diff queue 1 件

### ステップ 4: authorization
- 未ログイン → 401
- 一般会員 → 403
- admin → 200
- admin + running → 409

### ステップ 5: fixture
- `apps/api/tests/fixtures/forms-list-page1.json`（5 response）
- `forms-list-page2.json`（5 response + nextPageToken なし）
- `forms-list-unknown.json`（1 不明 question 含む）
- `forms-list-re-submission.json`（同 email 2 件）
- `forms-list-rule-consent.json`（旧名 ruleConsent を answer に持つ）

### ステップ 6: matrix
- 後述参照、独立保存。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook sanity check |
| Phase 7 | AC matrix 実装 column |
| Wave 8a | contract test に組込 |
| Wave 8b | E2E シナリオ |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| consent キー | #2 | extract-consent test で `ruleConsent` 旧名 → `rulesConsent` 正規化を検証 |
| responseEmail | #3 | resolve-identity test で response_fields に書かないことを assert |
| profile 編集禁止 | #4 | 既存 responseId の row 上書き範囲を限定する test |
| ID 混同 | #7 | type test で `MemberId` と `ResponseId` を混同する代入を error |
| schema 集約 | #14 | normalize-answer + diffQueueWriter の連動 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test 列挙 | 4 | pending | 7 ファイル |
| 2 | contract test 列挙 | 4 | pending | endpoint + 5 row 形 |
| 3 | authz test | 4 | pending | 401/403/200/409 |
| 4 | fixture 設計 | 4 | pending | 5 種 |
| 5 | matrix 出力 | 4 | pending | test-matrix.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | サマリ |
| ドキュメント | outputs/phase-04/test-matrix.md | matrix |
| メタ | artifacts.json | phase 4 を `completed` |

## 完了条件

- [ ] AC-1〜AC-10 が test に対応
- [ ] fixture 5 種が記述
- [ ] type test 設計あり

## タスク100%実行確認【必須】

- [ ] サブタスク 5 件すべて completed
- [ ] AC-7 が type test を持つ
- [ ] AC-8 が fixture (rule-consent) を持つ
- [ ] artifacts.json の phase 4 が `completed`

## 次 Phase

- 次: 5（実装ランブック）

## verify suite

### unit

| 対象 | 検証 |
| --- | --- |
| normalize-answer | known/unknown 分離、rawAnswers 保持 |
| extract-consent | 同意 / 不同意 / unknown + ruleConsent 正規化 |
| resolve-identity | 新規 / 既存 |
| pick-current-response | submittedAt 最新 / responseId tiebreak |
| snapshot-consent | is_deleted skip |
| cursor-store | payload r/w |
| forms-response-sync | 正常 + 失敗の status 遷移 |

### contract

| 対象 | 検証 |
| --- | --- |
| POST /admin/sync/responses | response 形 |
| member_responses row | カラム full set |
| response_fields row | known stableKey + extra_fields_json |
| member_identities row | UNIQUE response_email、current_response_id 切替 |
| member_status row | public_consent / rules_consent のみ更新 |

### E2E（08b 委譲）

- 再回答シナリオ
- unknown field 追加シナリオ
- consent 撤回シナリオ

### authorization

| ケース | 期待 |
| --- | --- |
| 未ログイン | 401 |
| 一般会員 | 403 |
| admin | 200 |
| admin + running | 409 |

## test matrix

| AC | unit | contract | authz | E2E | fixture |
| --- | --- | --- | --- | --- | --- |
| AC-1 current_response 切替 | pick-current-response / forms-response-sync | member_identities current_response_id | - | 再回答 | re-submission.json |
| AC-2 unknown → extra + queue | normalize-answer + diffQueueWriter | response_fields extra_fields_json + schema_diff_queue | - | unknown 追加 | unknown.json |
| AC-3 consent snapshot | extract-consent + snapshot-consent | member_status row | - | consent 変化 | re-submission.json |
| AC-4 responseEmail = system field | resolve-identity | member_responses.response_email | - | - | page1 |
| AC-5 cursor pagination | cursor-store / forms-response-sync | sync_jobs.payload.cursor | - | 2 ページ | page1 + page2 |
| AC-6 同種 job 排他 | forms-response-sync | POST 409 | admin + running | - | - |
| AC-7 ID 混同禁止 | type test (TS) | - | - | - | - |
| AC-8 ruleConsent 排除 | extract-consent | response_fields に ruleConsent stableKey なし | - | - | rule-consent.json |
| AC-9 is_deleted skip | snapshot-consent | member_status 不変 | - | - | - |
| AC-10 D1 write < 200 / sync | forms-response-sync (count metric) | - | - | - | page1 + page2 |

## fixture 設計

```
apps/api/tests/fixtures/
├── forms-list-page1.json          # 5 response, nextPageToken='p2'
├── forms-list-page2.json          # 5 response, nextPageToken=null
├── forms-list-unknown.json        # 1 response, 1 unknown question
├── forms-list-re-submission.json  # 同 email × 2 (古い + 新しい)
└── forms-list-rule-consent.json   # 旧名 ruleConsent 含む
```
