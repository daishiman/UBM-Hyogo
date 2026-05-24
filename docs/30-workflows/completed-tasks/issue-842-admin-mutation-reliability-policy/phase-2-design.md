# Phase 2: 設計

> 本 Phase は後続フェーズが参照する **設計の正本**。型・シグネチャ・差分方針はここで確定する。

## 1. 設計方針（責務境界）

| レイヤ | 責務 | 状態所有 |
|---|---|---|
| `useAdminMutation`（hook） | 通信ライフサイクル（fetch / timeout / retry / idempotency / 404 policy / abort） | `isLoading` / `error` / 内部 `AbortController` ref |
| `useConfirmDialog`（hook） | dialog open 状態 + submit orchestration + close 時の cancel 通知 | dialog state |
| `ConfirmDialog.tsx`（presentational） | focus trap / focus restore（**変更なし**） | DOM focus |
| caller（admin components） | resource 固有の policy 宣言（timeout 値・404 解釈・idempotency-key 生成） | UI domain state |

**バランスループ**: timeout 短すぎ → 正常応答も abort → 失敗増。timeout 長すぎ → ハング放置。既定 `10000ms` で安全側。
**強化ループ**: policy を hook オプションに集約 → caller の try/catch が痩せる → admin 横展開コストが線形。

## 2. 型定義（`useAdminMutation.ts`）

```ts
// 既存 "POST" | "PATCH" | "PUT" に DELETE を追加
export type MutationMethod = "POST" | "PATCH" | "PUT" | "DELETE";

// retry を許可する idempotent method（型レベル制約用）
export type IdempotentMethod = "PUT" | "DELETE";

export interface RetryPolicy {
  /** 最大試行回数（初回含む）。例: 3 = 初回 + 2 retry */
  readonly maxAttempts: number;
  /** 初回 backoff 遅延 ms（既定 200） */
  readonly baseDelayMs?: number;
  /** backoff 上限 ms（既定 2000） */
  readonly maxDelayMs?: number;
  /**
   * retry するか判定。既定: network error（status null）または 5xx。
   * 4xx は retry しない（冪等でも 4xx は再試行で直らない）。
   */
  readonly retryOn?: (status: number | null) => boolean;
}

/** 404 を成功相当に倒す policy。既定 false（失敗扱い） */
export type Treat404AsSuccess = false | "silent" | { readonly toast: string };

export interface UseAdminMutationOptions<T> {
  // --- 既存（不変） ---
  readonly mutationFn?: (payload: unknown, endpointOverride?: string) => Promise<T>;
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly successMessage?: string | ((data: T) => string);
  readonly refreshOnSuccess?: boolean;
  readonly redirector?: (url: string) => void;
  readonly currentPath?: string;
  // --- 新規 policy ---
  /** fetch 打ち切り timeout（ms）。既定 10000。0/未指定で既定適用 */
  readonly timeoutMs?: number;
  /** Idempotency-Key header に送る値。関数なら trigger 毎に評価 */
  readonly idempotencyKey?: string | (() => string);
  /** 404 を成功相当に倒す policy。既定 false */
  readonly treat404AsSuccess?: Treat404AsSuccess;
  // retry は overload 側でのみ受け付ける（下記参照）
}

/** idempotent method のときだけ retry を許可する拡張 options */
export interface UseAdminMutationIdempotentOptions<T>
  extends UseAdminMutationOptions<T> {
  /** 一過性 5xx / network error への自動再試行。idempotent method 限定 */
  readonly retry?: RetryPolicy;
}

export interface UseAdminMutationReturn<T> {
  readonly trigger: (payload: unknown, endpointOverride?: string) => Promise<T>;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly reset: () => void;
  /** 進行中 fetch を AbortController で中断（dialog close 連携用）。AbortError は silent */
  readonly abort: () => void;
}
```

## 3. シグネチャ（overload による型レベル idempotent 限定 — AC-3）

```ts
// idempotent method（PUT/DELETE）のみ retry 付き options を許可
export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: IdempotentMethod,
  options?: UseAdminMutationIdempotentOptions<T>,
): UseAdminMutationReturn<T>;

// 非冪等 method（POST/PATCH）は retry を含まない options のみ
export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH",
  options?: UseAdminMutationOptions<T>,
): UseAdminMutationReturn<T>;

// 実装シグネチャ
export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: MutationMethod,
  options?: UseAdminMutationIdempotentOptions<T>,
): UseAdminMutationReturn<T> {
  /* ... */
}
```

> `POST`/`PATCH` の overload は `UseAdminMutationOptions`（`retry` を持たない）を受け取るため、`retry` を渡すと **コンパイルエラー**になる。これが AC-3 の型レベル保証。

## 4. 内部実装フロー（`trigger` 改修）

```
trigger(payload, endpointOverride):
  if isSubmittingRef.current: throw "mutation already in flight"
  isSubmittingRef = true; setIsLoading(true); setError(null)
  attempt = 0
  loop:
    controller = new AbortController(); abortRef.current = controller
    timeoutId = setTimeout(() => controller.abort(), timeoutMs ?? 10000)
    try:
      if options.mutationFn:  # mutationFn 経路は signal を渡せないため timeout/retry 非適用（後方互換）
        data = await options.mutationFn(payload, endpointOverride)
        → success 処理（onSuccess / refresh / toast）; return data
      res = await fetch(url, {
        method, headers: { content-type, ...(Idempotency-Key if idempotencyKey) },
        body: JSON.stringify(payload), credentials: "same-origin",
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if res.status === 401: throw AuthRequiredError
      if res.status === 404 and treat404AsSuccess !== false:
        # success-relaxation: body parse せず success 相当
        if treat404AsSuccess === 'silent': (toast なし)
        else: toast(treat404AsSuccess.toast, "status")
        await onSuccess?.(undefined as T); if refreshOnSuccess !== false: refresh()
        return undefined as T
      if !res.ok:
        bodyText = await res.text()
        err = FetchAuthedError(res.status, bodyText)
        if shouldRetry(method, retry, res.status) and attempt+1 < retry.maxAttempts:
          attempt++; await sleep(backoff(attempt, retry)); continue loop
        throw err
      data = await res.json(); → success 処理; return data
    catch e:
      clearTimeout(timeoutId)
      if e is AbortError (e.name === "AbortError"):
        setError(null)        # silent: error 状態も残さない
        throw e               # caller の await は reject。toast/onError は呼ばない
      # network error（fetch reject、status 不明）
      if shouldRetry(method, retry, null) and attempt+1 < retry.maxAttempts:
        attempt++; await sleep(backoff(attempt, retry)); continue loop
      → 既存の error 分岐（AuthRequired→redirect / FetchAuthed→toast / その他→toast）
      throw err
    finally(loop 脱出時):
      isSubmittingRef = false; setIsLoading(false); abortRef.current = null
```

補助関数:

```ts
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_BASE_DELAY_MS = 200;
const DEFAULT_MAX_DELAY_MS = 2000;

function isIdempotent(method: MutationMethod): boolean {
  return method === "PUT" || method === "DELETE";
}

function shouldRetry(
  method: MutationMethod,
  retry: RetryPolicy | undefined,
  status: number | null,
): boolean {
  if (!retry || !isIdempotent(method)) return false; // 二重ガード（型 + runtime）
  const predicate = retry.retryOn ?? ((s) => s === null || (s >= 500 && s <= 599));
  return predicate(status);
}

function backoffMs(attempt: number, retry: RetryPolicy): number {
  const base = retry.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const max = retry.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  return Math.min(base * 2 ** (attempt - 1), max);
}

function resolveIdempotencyKey(k?: string | (() => string)): string | undefined {
  return typeof k === "function" ? k() : k;
}
```

### AbortError 判定の注意

`AbortController.abort()` による fetch reject は `DOMException` の `name === "AbortError"`。`e instanceof Error` でラップ後も `name` は保持される。実装では `e instanceof Error && e.name === "AbortError"` で判定する。

### timeout と retry の合成

各 attempt ごとに新しい `AbortController` + `setTimeout` を張る。timeout で abort された場合は **silent abort** とし retry しない（明示打ち切りのため）。retry は「5xx / network error」のみ対象。

## 5. `useConfirmDialog` 改修（AC-5）

```ts
export interface UseConfirmDialogOptions {
  readonly requireNote?: boolean;
  readonly maxNoteLength?: number;
  /** dialog close（キャンセル）時に進行中 mutation を止めるコールバック */
  readonly onCancelMutation?: () => void; // ← 新規
}
```

`closeConfirm` の改修:

```ts
const closeConfirm = useCallback(() => {
  setState((s) => {
    if (s.submitting) {
      // submit 中の close = キャンセル。mutation を abort して dialog も閉じる
      onCancelMutationRef.current?.();
      return INITIAL;
    }
    return s.open ? INITIAL : s;
  });
}, []);
```

> 現行は `submitting` 時に閉じない仕様だが、abort 連携導入後は「submit 中の close = 明示キャンセル → abort → 閉じる」に変更する。focus restore は `ConfirmDialog.tsx` の unmount/close effect が担うため hook 側は触らない。`onCancelMutation` は `onSubmit` 同様に ref 経由で最新を参照する（再生成由来の stale 回避）。

caller 側の配線例（参考。本タスクでは caller 変更は任意・最小）:

```ts
const mutation = useAdminMutation("/api/admin/...", "DELETE", { retry: { maxAttempts: 3 } });
const dialog = useConfirmDialog(onSubmit, { onCancelMutation: () => mutation.abort() });
```

## 6. legacy 削除（AC-7）

- 削除対象: `apps/web/src/lib/useAdminMutation.ts` / `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx`
- 削除根拠: production caller 0 件（Phase 5 で `grep` 再確認）。新旧シグネチャ非互換（legacy=`useAdminMutation({mutationFn})` / 新=`useAdminMutation(endpoint, method, options)`）のため re-export 不能。deprecate は dead code 温存に過ぎない
- 削除手順は Phase 5 で実行。削除前に `grep -rn "lib/useAdminMutation" apps/web` が 0 件であること（テスト import を除く）を証跡化

## 7. 後方互換性

- option 追加は全て optional。既存 caller（POST/PATCH・policy 未指定）は **timeout=10s が新たに適用される**以外の挙動変化なし
- method 型に `DELETE` 追加は union 拡張で既存呼び出しに非破壊
- `abort()` は返却に追加（既存返却の破壊なし）
- overload 追加で POST/PATCH に retry を渡している既存 caller は無い（§Phase 1 inventory で確認済）

## 8. 設計上の決定事項（決め打ち）

| 論点 | 決定 | 理由 |
|---|---|---|
| 既定 timeout | 10000ms | admin 操作の体感上限。短すぎる abort 誤発火を避ける安全側 |
| `mutationFn` 経路の timeout/retry | **非適用** | mutationFn は signal を受け取らないため abort 不能。後方互換優先。JSDoc で明記 |
| timeout abort 時の retry | しない | 明示打ち切り。retry は transient error 限定 |
| idempotency-key の既定生成 | しない（option 指定時のみ送出） | server 永続化がスコープ外のため、強制送出は無意味な header 増を招く |
| 404 silent 時の戻り値 | `undefined as T` | DELETE 404 に body は無い。caller は data を使わない前提 |
