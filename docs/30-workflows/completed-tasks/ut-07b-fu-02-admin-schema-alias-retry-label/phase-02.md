# Phase 2: 設計（response narrowing / 表示分岐）

`[実装区分: 実装仕様書]`

## 1. 設計方針

API contract は不変（200/202 切替は既に `apps/api/src/routes/admin/schema.ts` で実装済み）。本タスクは web 側で次の 2 点を実現する。

1. `postSchemaAlias` の戻り値が **HTTP status code と body を component に伝播する** 形に拡張する。
2. `SchemaDiffPanel` が戻り値を 4 状態に narrow して表示分岐する。

## 2. 型設計（変更対象: `apps/web/src/lib/admin/api.ts`）

### 2.1 既存型

```ts
export interface AdminMutationOk<T = unknown> {
  ok: true;
  status: number;
  data: T;
}
export interface AdminMutationErr {
  ok: false;
  status: number;
  error: string;
}
```

→ `status` は既に保持済み。HTTP 202 は `res.ok=true` のため `AdminMutationOk` に入る。`data` には API response body（`{ ok, mode, confirmed, backfill, ... }`）が入る。

### 2.2 追加: schema alias response 型と narrowing

`apps/web/src/lib/admin/api.ts` 末尾またはファイル分割（`api.ts` の責務肥大化を避けるため別 helper にしてもよい）に以下を追加する。

```ts
// UT-07B-FU-02: schema alias apply の response narrowing
export type SchemaAliasBackfillStatus =
  | "pending"
  | "running"
  | "exhausted"
  | "completed";

export interface SchemaAliasApplySuccessBody {
  ok: true;
  mode: "apply";
  confirmed: true;
  backfill: {
    status: SchemaAliasBackfillStatus;
    remaining?: number;
    lastProcessedAt?: string;
    dedupeKey?: string;
    enqueued?: boolean;
    code?: "backfill_cpu_budget_exhausted";
    retryable?: boolean;
  };
}

export interface SchemaAliasApplyDryRunBody {
  ok: true;
  mode: "dryRun";
  confirmed?: false;
}

export type SchemaAliasApplyBody =
  | SchemaAliasApplySuccessBody
  | SchemaAliasApplyDryRunBody;

/** HTTP 202 + backfill.status='exhausted' + retryable=true → retryable continuation */
export const isSchemaAliasRetryableContinuation = (
  r: AdminMutationResult<SchemaAliasApplyBody>,
): r is AdminMutationOk<SchemaAliasApplySuccessBody> =>
  r.ok &&
  r.status === 202 &&
  typeof r.data === "object" &&
  r.data !== null &&
  "mode" in r.data &&
  r.data.mode === "apply" &&
  r.data.backfill?.status === "exhausted" &&
  r.data.backfill?.retryable === true;
```

`postSchemaAlias` のシグネチャを次に変更:

```ts
export const postSchemaAlias = (body: {
  questionId: string;
  stableKey: string;
  diffId?: string;
}): Promise<AdminMutationResult<SchemaAliasApplyBody>> =>
  call<SchemaAliasApplyBody>(`/schema/aliases`, "POST", body);
```

## 3. 表示分岐設計（変更対象: `apps/web/src/components/admin/SchemaDiffPanel.tsx`）

### 3.1 状態の 4 区別

| 状態 | 判定 | 表示 |
| --- | --- | --- |
| success | `r.ok && r.status === 200 && r.data.confirmed === true && r.data.backfill?.status !== 'exhausted'` | toast「alias を割当てました」(既存)、active を閉じ、router.refresh() |
| retryable continuation | `isSchemaAliasRetryableContinuation(r)` | label「Back-fill 再試行可能（続きから処理できます）」/ `role="status"` / 補助説明「もう一度『割当』を押すと続きから処理されます」/ active を閉じない / busy 解除 |
| validation error | `!r.ok && r.status === 422` | `role="alert"` で「入力内容に誤りがあります: ${r.error}」 |
| conflict error | `!r.ok && r.status === 409` | `role="alert"` で「他の操作と競合しました: ${r.error}」 |
| その他 error | `!r.ok` 残り | 既存「失敗: ${r.error}」 |

### 3.2 状態管理

既存 `toast: string | null` を以下に置換:

```ts
type FeedbackKind = "success" | "retryable" | "validation_error" | "conflict_error" | "error";
interface Feedback { kind: FeedbackKind; label: string; detail?: string }
const [feedback, setFeedback] = useState<Feedback | null>(null);
```

retryable continuation 時は `setActive(...)` を呼ばず（再送信できるよう selection 維持）、busy のみ false に戻す。

## 4. 文言確定

| 状態 | label | role |
| --- | --- | --- |
| success | `alias を割当てました` | `status` |
| retryable | `Back-fill 再試行可能（続きから処理できます）` | `status` |
| retryable detail | `もう一度「割当」を押すと続きから処理されます。` | — |
| validation_error | `入力内容に誤りがあります: ${error}` | `alert` |
| conflict_error | `他の操作と競合しました: ${error}` | `alert` |
| error | `失敗: ${error}` | `alert` |

## 5. 完了条件

- [ ] 型追加箇所と narrowing helper の所在が決定
- [ ] 4 状態の判定条件と表示文言・role が表で確定
- [ ] `setFeedback` 状態管理の置換方針が確定
