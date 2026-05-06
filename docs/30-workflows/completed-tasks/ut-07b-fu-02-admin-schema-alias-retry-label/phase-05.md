# Phase 5: 実装仕様（API client / SchemaDiffPanel）

`[実装区分: 実装仕様書]`

## 1. 変更対象ファイル一覧

| パス | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/lib/admin/api.ts` | 編集 | `postSchemaAlias` の戻り値型拡張、`SchemaAliasApplyBody` / `isSchemaAliasRetryableContinuation` 追加 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | `feedback` state に置換、4 状態の表示分岐追加、retryable 時の selection 維持 |
| `apps/web/src/lib/admin/__tests__/api.test.ts` | 編集 | API-01〜API-05 の 5 ケース追加 |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx` | 編集 | UI-01〜UI-05 の 5 ケース追加（既存 case の regress 防止） |

## 2. `apps/web/src/lib/admin/api.ts` の変更

### 2.1 追加する型 / helper

Phase 2 §2.2 のコードを `postSchemaAlias` の直前または直後に追加する。

```ts
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

export const isSchemaAliasRetryableContinuation = (
  r: AdminMutationResult<SchemaAliasApplyBody>,
): r is AdminMutationOk<SchemaAliasApplySuccessBody> => {
  if (!r.ok || r.status !== 202) return false;
  const body = r.data;
  if (typeof body !== "object" || body === null) return false;
  if (!("mode" in body) || body.mode !== "apply") return false;
  return body.backfill?.status === "exhausted" && body.backfill?.retryable === true;
};
```

### 2.2 既存 export 変更

```ts
// before
export const postSchemaAlias = (body: {
  questionId: string;
  stableKey: string;
  diffId?: string;
}) => call(`/schema/aliases`, "POST", body);

// after
export const postSchemaAlias = (body: {
  questionId: string;
  stableKey: string;
  diffId?: string;
}): Promise<AdminMutationResult<SchemaAliasApplyBody>> =>
  call<SchemaAliasApplyBody>(`/schema/aliases`, "POST", body);
```

### 2.3 不変条件

- `call()` 内部の HTTP 2xx 判定は変更しない（202 は `res.ok=true` で透過）
- `fetch` URL（`/api/admin${path}`）は変更しない
- `AdminMutationOk` / `AdminMutationErr` 既存型は変更しない

## 3. `apps/web/src/components/admin/SchemaDiffPanel.tsx` の変更

### 3.1 import 追加

```ts
import { postSchemaAlias, isSchemaAliasRetryableContinuation } from "../../lib/admin/api";
```

### 3.2 state 置換

```ts
type FeedbackKind =
  | "success"
  | "retryable"
  | "validation_error"
  | "conflict_error"
  | "error";

interface Feedback {
  kind: FeedbackKind;
  label: string;
  detail?: string;
}

const [feedback, setFeedback] = useState<Feedback | null>(null);
```

`toast` state は削除し、すべて `feedback` に置換する。

### 3.3 `onSubmit` 改修

```ts
const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!active || !active.questionId || !stableKey.trim()) return;
  setBusy(true);
  const r = await postSchemaAlias({
    diffId: active.diffId,
    questionId: active.questionId,
    stableKey: stableKey.trim(),
  });
  setBusy(false);

  if (isSchemaAliasRetryableContinuation(r)) {
    setFeedback({
      kind: "retryable",
      label: "Back-fill 再試行可能（続きから処理できます）",
      detail: "もう一度「割当」を押すと続きから処理されます。",
    });
    return; // selection は維持し、再送信できる
  }

  if (!r.ok) {
    if (r.status === 422) {
      setFeedback({ kind: "validation_error", label: `入力内容に誤りがあります: ${r.error}` });
    } else if (r.status === 409) {
      setFeedback({ kind: "conflict_error", label: `他の操作と競合しました: ${r.error}` });
    } else {
      setFeedback({ kind: "error", label: `失敗: ${r.error}` });
    }
    return;
  }

  setFeedback({ kind: "success", label: "alias を割当てました" });
  setActive(null);
  router.refresh();
};
```

### 3.4 表示

`{toast && <p role="status">{toast}</p>}` を以下に置換:

```tsx
{feedback && (
  <div
    role={feedback.kind === "success" || feedback.kind === "retryable" ? "status" : "alert"}
    data-feedback-kind={feedback.kind}
  >
    <p>{feedback.label}</p>
    {feedback.detail && <p>{feedback.detail}</p>}
  </div>
)}
```

`onSelect` 内の `setToast(null)` は `setFeedback(null)` に置換する。

## 4. 入力 / 出力 / 副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | admin user が `SchemaDiffPanel` で diff 選択 → stableKey 入力 → 「割当」押下 |
| 出力 | 4 状態のいずれかの feedback DOM（role / `data-feedback-kind` で識別可能） |
| 副作用 | success 時のみ `router.refresh()` を呼ぶ。retryable / error 時は呼ばない |

## 5. テスト方針（Phase 4 と整合）

### 5.1 `api.test.ts` 追加ケース

`global.fetch` を mock し、status と body を fixture 化:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { postSchemaAlias, isSchemaAliasRetryableContinuation } from "../api";

const mockFetch = (status: number, body: unknown) => {
  const res = new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
  vi.spyOn(globalThis, "fetch").mockResolvedValue(res);
};

describe("postSchemaAlias", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("API-01: 200 success", async () => {
    mockFetch(200, { ok: true, mode: "apply", confirmed: true, backfill: { status: "completed" } });
    const r = await postSchemaAlias({ questionId: "q1", stableKey: "k1", diffId: "d1" });
    expect(r.ok).toBe(true);
    expect(r.status).toBe(200);
    expect(isSchemaAliasRetryableContinuation(r)).toBe(false);
  });

  it("API-02: 202 retryable continuation", async () => {
    mockFetch(202, {
      ok: true, mode: "apply", confirmed: true,
      backfill: { status: "exhausted", retryable: true, code: "backfill_cpu_budget_exhausted" },
    });
    const r = await postSchemaAlias({ questionId: "q1", stableKey: "k1", diffId: "d1" });
    expect(r.ok).toBe(true);
    expect(r.status).toBe(202);
    expect(isSchemaAliasRetryableContinuation(r)).toBe(true);
  });

  it("API-03: 202 with status=pending is not retryable continuation", async () => {
    mockFetch(202, {
      ok: true, mode: "apply", confirmed: true,
      backfill: { status: "pending", retryable: true },
    });
    const r = await postSchemaAlias({ questionId: "q1", stableKey: "k1" });
    expect(isSchemaAliasRetryableContinuation(r)).toBe(false);
  });

  it("API-04: 422 validation error", async () => {
    mockFetch(422, { ok: false, error: "invalid" });
    const r = await postSchemaAlias({ questionId: "q1", stableKey: "k1" });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });

  it("API-05: 409 conflict", async () => {
    mockFetch(409, { ok: false, error: "conflict" });
    const r = await postSchemaAlias({ questionId: "q1", stableKey: "k1" });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(409);
  });
});
```

### 5.2 `SchemaDiffPanel.test.tsx` 追加ケース

既存 test の app/lib mocking パターンを踏襲し、`postSchemaAlias` を `vi.mock("../../../lib/admin/api", ...)` で置換。Phase 4 §2.2 の UI-01〜UI-05 を実装する。

## 6. 完了条件（DoD）

- [ ] `api.ts` に `SchemaAliasApplyBody` / `isSchemaAliasRetryableContinuation` / 戻り値型変更が反映
- [ ] `SchemaDiffPanel.tsx` の `feedback` state 置換と 4 状態分岐実装
- [ ] `api.test.ts` の API-01〜API-05 が GREEN
- [ ] `SchemaDiffPanel.test.tsx` の UI-01〜UI-05 が GREEN
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` PASS
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web lint` PASS
- [x] focused Vitest PASS（`mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts ...`）
- [ ] `apps/api/**` に変更なし（`git diff main...HEAD --name-only` で確認）
