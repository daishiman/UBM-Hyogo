# Implementation Guide - UT-07B-FU-02

## Part 1: 中学生レベル

たとえば、学校の大掃除で教室が広すぎて、今日だけでは全部終わらないことがあります。そのとき先生が「ここまでは終わった。残りは明日ここから続けよう」と言えば、失敗ではなく、続きが残っているだけだと分かります。

このタスクも同じです。管理画面で「名前をそろえる作業」をしたとき、裏側の作業が大きすぎると、画面に「全部終わった」とは言えない場合があります。でも「ここまではできたので、もう一度押せば続きからできます」と伝えられれば、管理者は慌てずに同じボタンをもう一度押せます。

### 用語の言い換え

| 用語 | 日常語での言い換え |
| --- | --- |
| schema alias | 表の項目名をそろえるための別名 |
| back-fill | 残っている行にも同じ直し方を広げる作業 |
| retryable | もう一度試せる状態 |
| HTTP 202 | 途中まで受け付けたという返事 |
| API contract | 画面と裏側の約束ごと |

## Part 2: 技術者レベル

実装済みの `apps/web/src/lib/admin/api.ts` の `postSchemaAlias` は HTTP status と body を component へ返す narrow union を公開する。`isSchemaAliasRetryableContinuation` は次の 5 点合致のみを retryable continuation と判定する。

```ts
status === 202
body.ok === true
body.backfill?.status === "exhausted"
body.backfill?.retryable === true
body.backfill?.code === "backfill_cpu_budget_exhausted"
```

`apps/web/src/components/admin/SchemaDiffPanel.tsx` は feedback state を `success | retryable | validation_error | conflict_error | error` に分ける。`success` と `retryable` は `role="status"`、error 系は `role="alert"` とする。retryable continuation では `setActive(null)` と `router.refresh()` を呼ばず、同じ form を維持して再送信できる状態に戻す。

API signature:

```ts
postSchemaAlias(body: {
  questionId: string;
  stableKey: string;
  diffId?: string;
}): Promise<AdminMutationResult<SchemaAliasApplyBody>>
```

使用例:

```ts
const result = await postSchemaAlias({ questionId, stableKey, diffId });
if (isSchemaAliasRetryableContinuation(result)) {
  // show retryable continuation status and keep the form open
}
```

Edge cases:

| Case | UI |
| --- | --- |
| 202 + `status='exhausted'` + `retryable=true` but missing `code` | generic success/error path, not retryable continuation |
| 422 | `validation_error` alert |
| 409 | `conflict_error` alert |
| network / 5xx mapped error | generic `error` alert |

設定値と境界:

| 項目 | 値 |
| --- | --- |
| retryable label | `Back-fill 再試行可能（続きから処理できます）` |
| retryable detail | `もう一度「割当」を押すと続きから処理されます。` |
| API 変更 | なし |
| DB / migration 変更 | なし |
| D1 access | `apps/api` 限定を維持 |

検証は `apps/web/src/lib/admin/__tests__/api.test.ts` と `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx` に focused cases を追加し、200 success / 202 retryable / 422 validation / 409 conflict の 4 状態を固定する。Focused Vitest は 30 tests PASS。
