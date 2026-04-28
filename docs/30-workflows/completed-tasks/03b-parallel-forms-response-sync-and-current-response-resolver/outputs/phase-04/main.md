# Phase 4 成果物: テスト戦略（03b: forms-response-sync-and-current-response-resolver）

## 1. サマリ

unit / contract / authorization の3層で AC-1〜AC-10 をカバーする。E2E（再回答シナリオ・consent 撤回シナリオ）は 08b に委譲する。`ResponseId` / `MemberId` / `StableKey` は `@ubm-hyogo/shared` の brand 型を import し、誤代入は TypeScript コンパイラが拒否する（型 test を `expect-type` 不要のシンプルな `// @ts-expect-error` 注釈で表現）。

## 2. unit test 対象

| ファイル | 対象 | 主な assertion |
| --- | --- | --- |
| `apps/api/src/jobs/mappers/normalize-response.test.ts` | `normalizeResponse` | known stableKey と unknown questionId を分離。`responseEmail` は known/unknown いずれにも含めない（system field 除外）|
| `apps/api/src/jobs/mappers/extract-consent.test.ts` | `extractConsent` | `consented` / `declined` / `unknown` の3値正規化。旧 `ruleConsent` キーは `rulesConsent` に正規化される。`@ubm-hyogo/shared` の `normalizeConsent` を再利用 |
| `apps/api/src/jobs/sync-forms-responses.test.ts` | `runResponseSync` 正常系 / 失敗系 / 二重起動 / cursor pagination / writeCap break / is_deleted skip | sync_jobs の status 遷移、processed カウント、cursor の保存先 |
| `apps/api/src/jobs/cursor-store.test.ts` | `readCursor` / `writeCursor` | sync_jobs.metrics_json の `cursor` キーに read/write |
| `apps/api/src/repository/__tests__/responseFieldsUpsert.test.ts` | `upsertKnownField` / `upsertExtraField` | known stableKey の upsert + extra 用 raw_value_json 保存 |

## 3. contract test 対象

| 対象 | 形 |
| --- | --- |
| `POST /admin/sync/responses` | `{ jobId: string, status: 'succeeded' \| 'failed' \| 'skipped', processedCount: number, writeCount: number, cursor?: string }` |
| `member_responses` row | `{ response_id, response_email, submitted_at, schema_hash, raw_answers_json, extra field row (`response_fields.stable_key=__extra__:<questionId>`), ... }` (form field として `response_fields` には responseEmail が無いことを assert) |
| `response_fields` row | known: `(response_id, stable_key, value_json, raw_value_json)` / unknown: `(stable_key='__extra__:<questionId>', raw_value_json)` |
| `member_identities` row | `{ member_id, response_email (UNIQUE), current_response_id, first_response_id, last_submitted_at }` |
| `member_status` row | `{ member_id, public_consent, rules_consent }` のみ更新（`publish_state` / `is_deleted` は不変）|
| `schema_diff_queue` row | unknown question_id ごとに 1 件 enqueue、同じ `(question_id, revision_id, status='queued')` の重複 enqueue は no-op |

## 4. authorization test

| ケース | 期待 |
| --- | --- |
| Authorization ヘッダなし | 401 |
| 不正トークン | 401 |
| 正しい admin token | 200 / 409（既に running なら） |
| `?fullSync=true` パラメータ | cursor を破棄して full sync |

## 5. fixture 設計

```
apps/api/tests/fixtures/responses/
├── forms-list-page1.json          # 5 response, nextPageToken='p2'
├── forms-list-page2.json          # 5 response, nextPageToken=null
├── forms-list-unknown.json        # 1 response, 1 unknown question
├── forms-list-re-submission.json  # 同 email × 2（古い + 新しい）
└── forms-list-rule-consent.json   # 旧名 ruleConsent を answer に持つ
```

> 実装上は `MemberResponse` の `answersByStableKey` / `rawAnswersByQuestionId` / `unmappedQuestionIds` を直接組み立てたインメモリ fixture（test ファイル内）を主に使い、JSON ファイルは Phase 11 / 08b の手動 smoke 用とする。

## 6. type test（AC-7）

`apps/api/src/jobs/sync-forms-responses.types.test.ts`:

```ts
import { asMemberId, asResponseId } from "@ubm-hyogo/shared";

const m = asMemberId("m1");
const r = asResponseId("r1");

// @ts-expect-error: ResponseId is not assignable to MemberId
const _bad: typeof m = r;
```

`@ts-expect-error` ディレクティブが TypeScript コンパイラで報告されない（= 代入が成功してしまう）と test ファイルの `tsc` 自体が fail する。Vitest 上では `it("compiles", () => expect(true).toBe(true))` で素通しし、`tsc --noEmit` 側で AC-7 を gate する。

## 7. test matrix

別ファイル: `outputs/phase-04/test-matrix.md` 参照。

## 8. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | unit test 列挙 | completed |
| 2 | contract test 列挙 | completed |
| 3 | authz test 列挙 | completed |
| 4 | fixture 設計 | completed |
| 5 | matrix 出力 | completed |

## 9. 次 Phase 引き継ぎ

- Phase 5 入力: §2〜§6 の test 列を runbook の test 章にマッピング
- Phase 5 で確定する事項: 関数名・モジュール配置・実装本体
- ブロックなし
