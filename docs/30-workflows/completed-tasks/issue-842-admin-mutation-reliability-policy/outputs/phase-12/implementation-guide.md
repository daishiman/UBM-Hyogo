# Implementation Guide

## Part 1: 中学生にも分かる説明

### なぜ必要か

管理画面の保存ボタンは、名簿に書き込む係のようなものです。返事がないまま何度もお願いすると、同じ記録が重なったり、どこまで終わったか分からなくなります。

今回の仕様は、保存ボタンの裏側に「待ちすぎたら止める」「安全な操作だけもう一度試す」「同じお願いだと分かる番号を付ける」「やめたら通信も止める」という共通ルールを置くためのものです。各画面が別々に判断せず、管理画面全体で同じ安全策を使えます。

### 何をするか

`useAdminMutation` という共通 hook に、timeout、retry、idempotency-key、404 の扱い、abort をまとめます。`useConfirmDialog` は、ダイアログを閉じたときに進行中の通信へキャンセルを伝えるだけにします。

こうすると、画面側は「この操作は安全に retry できるか」「404 を成功扱いにしてよいか」を宣言するだけになります。教室で同じ提出箱を使うように、全員が同じルールで提出できます。

### 今回作ったもの

- Phase 12 strict 7 outputs をこの workflow の `outputs/phase-12/` に実体化しました。
- 前身 one-pager を `consumed_by_canonical_workflow` に更新し、正規 workflow への参照を追加しました。
- aiworkflow-requirements の inventory / changelog / LOGS を同期し、Issue #842 の仕様書を検索可能にしました。

## Part 2: 技術者向け詳細

### APIシグネチャ

```ts
export type MutationMethod = "POST" | "PATCH" | "PUT" | "DELETE";
export type IdempotentMethod = "PUT" | "DELETE";
export type Treat404AsSuccess = false | "silent" | { readonly toast: string };

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly retryOn?: (status: number | null) => boolean;
}

export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: IdempotentMethod,
  options?: UseAdminMutationIdempotentOptions<T>,
): UseAdminMutationReturn<T>;

export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH",
  options?: UseAdminMutationOptions<T>,
): UseAdminMutationReturn<T>;
```

The overload keeps retry opt-in and idempotent-only. POST/PATCH callers continue using the existing shape and cannot pass `retry` without a type error.

### 使用例

```ts
const mutation = useAdminMutation("/api/admin/example", "DELETE", {
  timeoutMs: 10000,
  retry: { maxAttempts: 3 },
  idempotencyKey: () => crypto.randomUUID(),
  treat404AsSuccess: { toast: "Already removed by another admin" },
});

const dialog = useConfirmDialog(handleSubmit, {
  onCancelMutation: () => mutation.abort(),
});
```

`MeetingAttendancePanel.tsx` is intentionally unchanged by this spec-created cycle because current code is POST-only. The former DELETE-404 assumption is stale, so the hook policy is prepared without forcing a caller migration.

### エラーハンドリング

`AbortError` is silent: no failure toast and no `onError` callback. Auth failures keep the existing redirect path, and non-2xx responses continue through `FetchAuthedError` unless the explicit 404 success policy applies.

Retry is only for transient network or 5xx failures and only when the method is idempotent. Timeout abort is a deliberate cancellation and is not retried.

### エッジケース

`mutationFn` cannot receive a fetch `signal`, so timeout/retry/abort signal behavior is documented as non-applicable for that path. This preserves backward compatibility and prevents callers from assuming hidden cancellation support.

`treat404AsSuccess` defaults to `false`. The 3-value policy exists for future DELETE-like races, but current POST 404 responses remain real failures.

### 設定項目と定数一覧

| Item | Value |
|---|---|
| `DEFAULT_TIMEOUT_MS` | `10000` |
| `DEFAULT_BASE_DELAY_MS` | `200` |
| `DEFAULT_MAX_DELAY_MS` | `2000` |
| retry default | off |
| `treat404AsSuccess` default | `false` |

### テスト構成

Focused Vitest must cover timeout abort, retry success/final failure/non-retry 4xx, idempotency-key string/function/absent, 404 false/silent/toast, AbortError silent handling, and `useConfirmDialog` submit-close cancellation.

Verification commands for this implemented cycle:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test src/features/admin/hooks/
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```
