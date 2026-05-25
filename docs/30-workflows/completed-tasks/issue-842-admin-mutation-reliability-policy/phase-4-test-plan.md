# Phase 4: テスト計画

> RED フェーズのテスト設計。期待値・mock 方針・実行コマンドを確定する。
> 型・シグネチャ・内部フローの正本は [phase-2-design.md](phase-2-design.md)。本 Phase は §番号を引用し重複を避ける。
> テストファイル: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`（既存 TC-01..10 拡張）
> および `apps/web/src/features/admin/hooks/__tests__/useConfirmDialog.spec.tsx`（既存 U1..U9 拡張）。

## 0. テスト対象と AC 対応表

| AC | 観点 | 追加 TC | 対象ファイル |
|---|---|---|---|
| AC-2 | timeout abort silent | TC-11, TC-12 | useAdminMutation.spec.ts |
| AC-3 | retry idempotent 限定（型レベル） | TC-TY-01（`@ts-expect-error`） | useAdminMutation.spec.ts |
| AC-1/AC-12 | retry 経路（成功 / 上限 / 4xx 非対象 / backoff） | TC-13, TC-14, TC-15, TC-16 | useAdminMutation.spec.ts |
| AC-1/AC-12 | idempotency-key 注入（文字列 / 関数 / 未指定） | TC-17, TC-18, TC-19 | useAdminMutation.spec.ts |
| AC-4/AC-12 | treat404AsSuccess 3 値 | TC-20, TC-21, TC-22 | useAdminMutation.spec.ts |
| AC-2/AC-12 | abort() 連携 silent | TC-23 | useAdminMutation.spec.ts |
| AC-5 | useConfirmDialog の onCancelMutation 連携 | U10, U11 | useConfirmDialog.spec.tsx |

## 1. 既存 TC-01..10 を壊さない方針

Phase 2 §7（後方互換性）に従い、既存 caller の挙動変化は「既定 timeout 10000ms が新規適用される」のみ。

- 既存 TC-01..10 はすべて **即解決系**（`fetch` mock が同期的に resolve / reject）。既定 timeout 10000ms に到達する前に解決するため、**fake timer を使わなくても影響を受けない**。既存テストは実時間のまま無改修で PASS することを確認する（Phase 3 §4 リスク表「既存 TC-01..10 は実時間のまま」と整合）。
- TC-09（concurrent guard）は `isSubmittingRef` ベースのままで挙動不変。Phase 2 §4 の loop 構造に変わっても、二重 trigger ガードは loop 進入前に評価されるため影響なし。
- timeout / retry / abort を検証する新規 TC のみ `vi.useFakeTimers()` を `it` スコープ内で局所的に有効化し、`afterEach` の `vi.restoreAllMocks()` に加え各 fake timer テストの末尾で `vi.useRealTimers()` に戻す。既存テストへ fake timer を波及させない。

## 2. mock 方針（共通）

既存 spec の mock パターン（`vi.mock("next/navigation")` / `vi.mock(".../Toast")` / `vi.stubGlobal("fetch", ...)`）を踏襲する。

### 2.1 fetch mock で AbortController.signal を観測する

`fetch` の第 2 引数 `init.signal` を捕捉して abort 連携を検証する。

```ts
// signal を記録し、abort されたら reject する fetch mock のテンプレート
function makeAbortableFetch(): {
  fetchMock: ReturnType<typeof vi.fn>;
  capturedSignal: () => AbortSignal | undefined;
} {
  let signal: AbortSignal | undefined;
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    signal = init?.signal ?? undefined;
    return new Promise((_resolve, reject) => {
      // resolve しない長期 fetch。signal.abort で reject する
      signal?.addEventListener("abort", () => {
        const err = new DOMException("Aborted", "AbortError");
        reject(err);
      });
    });
  });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  return { fetchMock, capturedSignal: () => signal };
}
```

> abort 時に投げる error は `DOMException("Aborted", "AbortError")`（Phase 2 §4「AbortError 判定の注意」と一致）。jsdom/happy-dom 環境で `DOMException` が無い場合は `Object.assign(new Error("Aborted"), { name: "AbortError" })` で代替する。Phase 6 でこの両系統を回帰 guard する。

### 2.2 fake timer と async act の組み合わせ注意

- `vi.useFakeTimers()` 有効時は `setTimeout`（timeout）と `sleep`（retry backoff）の両方が仮想時間で進む。`await act(async () => { ... })` の内側で `await vi.advanceTimersByTimeAsync(ms)` を使い、microtask を flush しながら進める（同期版 `advanceTimersByTime` は fetch promise の `.then` を解決しないため不可）。
- timeout 発火は `trigger()` を await 開始 → `await vi.advanceTimersByTimeAsync(10001)` で `setTimeout` callback（`controller.abort()`）を発火 → fetch mock の abort listener が reject → `trigger` の catch に到達、の順で進める。
- retry backoff は各 attempt 間に `await vi.advanceTimersByTimeAsync(backoffMs)` を入れて sleep を消化する。`vi.getTimerCount()` で保留タイマ残数を確認すると debug しやすい。
- fetch reject 後の `trigger` promise の reject を受けるため、`await expect(triggerPromise).rejects...` は `act` の内側で await する。

## 3. AC-2: timeout 発火（silent）

### TC-11: 既定 10000ms 経過で AbortError → toast/onError とも呼ばれない（silent）

- セットアップ: `makeAbortableFetch()`、`onError = vi.fn()`。`useAdminMutation("/api/admin/x", "POST", { onError })`。
- 操作: `vi.useFakeTimers()` 下で `const p = result.current.trigger({});`（reject を後で受ける）→ `await vi.advanceTimersByTimeAsync(10001)`。
- 期待:
  - `await expect(p).rejects.toMatchObject({ name: "AbortError" })`（caller の await は reject される。Phase 2 §4「caller の await は reject」）
  - `toastMock` が **一度も呼ばれない**（silent。Phase 2 §4「toast/onError は呼ばない」）
  - `onError` が呼ばれない
  - `result.current.error` が `null`（Phase 2 §4「silent: error 状態も残さない」）
  - `result.current.isLoading` が `false`（finally で解除）
- 末尾で `vi.useRealTimers()`。

### TC-12: timeout 前に解決すれば abort されない（誤発火しない安全側）

- セットアップ: `fetch` mock を即 resolve（ok:true, status:200, json）。`vi.useFakeTimers()`。
- 操作: `await act` 内で `trigger` を await（fetch 即解決のため timeout 到達前に成功）。`vi.advanceTimersByTimeAsync` は不要だが念のため `await vi.advanceTimersByTimeAsync(20000)` を後置しても toast が二重に出ないこと。
- 期待: 成功 toast 1 回、`error` null。Phase 2 §8「短すぎる abort 誤発火を避ける安全側」の確認。

## 4. AC-3/AC-1: retry（idempotent method）

retry は idempotent method（`PUT`/`DELETE`）でのみ runtime 適用（Phase 2 §4 `shouldRetry` の二重ガード）。fake timer で backoff を消化する。

### TC-13: DELETE で 5xx → 再試行 → 成功

- セットアップ: `fetch` mock を `mockResolvedValueOnce({ok:false,status:503,text:async()=>"down"})` → `mockResolvedValueOnce({ok:true,status:200,json:async()=>({ok:true})})`。`vi.useFakeTimers()`。
- 操作: `useAdminMutation("/api/admin/x", "DELETE", { retry: { maxAttempts: 3, baseDelayMs: 200 } })`。`trigger` 開始 → `await vi.advanceTimersByTimeAsync(200)`（backoff 消化）。
- 期待: `fetchMock` 2 回呼ばれる、最終的に成功 toast、`error` null、`refreshMock` 呼ばれる。

### TC-14: PUT で maxAttempts 到達 → 最終失敗

- セットアップ: `fetch` を常に `{ok:false,status:503,text:async()=>"down"}` resolve。`maxAttempts: 2`、`baseDelayMs: 200`。
- 操作: `trigger` 開始 → `await vi.advanceTimersByTimeAsync(200)`（1 回目 backoff）。
- 期待: `fetchMock` が `maxAttempts`=2 回呼ばれる、`await expect(p).rejects.toBeInstanceOf(FetchAuthedError)`、失敗 toast 1 回、`error` が FetchAuthedError。

### TC-15: 4xx は retry しない

- セットアップ: `fetch` を `{ok:false,status:400,text:async()=>JSON.stringify({error:"bad"})}` resolve。`PUT` + `retry: { maxAttempts: 3 }`。
- 操作: `trigger`（fake timer 任意。backoff は発生しない想定）。
- 期待: `fetchMock` が **1 回のみ**、`rejects` FetchAuthedError。Phase 2 §2 `RetryPolicy.retryOn` 既定「4xx は retry しない」を確認。

### TC-16: backoff が baseDelayMs から指数増加する

- セットアップ: `fetch` を `{status:503}` を 3 回 resolve。`DELETE` + `retry: { maxAttempts: 3, baseDelayMs: 200, maxDelayMs: 2000 }`。`vi.useFakeTimers()`。
- 操作と期待（Phase 2 §4 `backoffMs(attempt, retry) = min(base * 2^(attempt-1), max)`）:
  1. `trigger` 開始 → 1 回目 fetch 即 503
  2. `await vi.advanceTimersByTimeAsync(199)` → まだ 2 回目 fetch されない（`fetchMock` 1 回）
  3. `await vi.advanceTimersByTimeAsync(1)`（累計 200=base*2^0）→ 2 回目 fetch 発火（`fetchMock` 2 回）
  4. `await vi.advanceTimersByTimeAsync(399)` → まだ 3 回目されない
  5. `await vi.advanceTimersByTimeAsync(1)`（累計 400=base*2^1）→ 3 回目 fetch 発火（`fetchMock` 3 回）
- これにより backoff が 200 → 400 と指数増加することを fake timer の境界で検証する。

## 5. AC-1: idempotency-key 注入

### TC-17: 文字列指定で headers に Idempotency-Key が入る

- セットアップ: `fetch` 即成功 mock。`useAdminMutation("/api/admin/x", "POST", { idempotencyKey: "key-abc" })`。
- 期待: `fetchMock` 呼び出しの第 2 引数 `init.headers` に `"Idempotency-Key": "key-abc"` が含まれる（`expect.objectContaining({ headers: expect.objectContaining({ "Idempotency-Key": "key-abc" }) })`）。

### TC-18: 関数指定で trigger 時に評価される

- セットアップ: `const keyFn = vi.fn(() => "key-fn-1")`。`idempotencyKey: keyFn`。`fetch` 即成功。
- 期待: `keyFn` が呼ばれ、`init.headers["Idempotency-Key"] === "key-fn-1"`。Phase 2 §2「関数なら trigger 毎に評価」。trigger 毎再評価の詳細は Phase 6 で深掘り。

### TC-19: 未指定なら Idempotency-Key を含まない

- セットアップ: `fetch` 即成功 mock。option に `idempotencyKey` なし。
- 期待: `init.headers` に `Idempotency-Key` キーが **存在しない**（`expect(headers).not.toHaveProperty("Idempotency-Key")`）。Phase 2 §8「option 指定時のみ送出」。

## 6. AC-4: treat404AsSuccess 3 値

Phase 2 §4 の 404 分岐（`res.status === 404 && treat404AsSuccess !== false`）に対応。

### TC-20: 既定（false）で 404 は FetchAuthedError throw

- セットアップ: `fetch` を `{ok:false,status:404,text:async()=>"not found"}`。option なし（既定 false）。
- 期待: `rejects.toBeInstanceOf(FetchAuthedError)`、`error.status === 404`、失敗 toast。Phase 2 §2「既定 false（失敗扱い）」。

### TC-21: 'silent' で toast なし success + onSuccess(undefined)

- セットアップ: `fetch` を `{status:404}`。`onSuccess = vi.fn()`。`treat404AsSuccess: "silent"`。
- 期待: `trigger` が **resolve**（reject しない）、`toastMock` 呼ばれない、`onSuccess` が `undefined` 引数で呼ばれる（`expect(onSuccess).toHaveBeenCalledWith(undefined)`、Phase 2 §8「404 silent 時の戻り値 undefined as T」）、`refreshMock` 呼ばれる（既定 refreshOnSuccess）。

### TC-22: { toast } で指定文言が status variant で出る

- セットアップ: `fetch` を `{status:404}`。`treat404AsSuccess: { toast: "既に解除済みです" }`。
- 期待: `trigger` resolve、`toastMock` が `("既に解除済みです", "status")` で呼ばれる（Phase 2 §4「toast(treat404AsSuccess.toast, "status")」）、`onSuccess(undefined)`、`error` null。

## 7. AC-2: abort() 連携

### TC-23: abort() で進行中 fetch が中断され silent

- セットアップ: `makeAbortableFetch()`。`onError = vi.fn()`。実時間でよい（timeout 到達前に手動 abort）。
- 操作: `const p = result.current.trigger({});`（resolve しない fetch）→ `act(() => result.current.abort())` → fetch mock の abort listener が reject。
- 期待:
  - `await expect(p).rejects.toMatchObject({ name: "AbortError" })`
  - `toastMock` 呼ばれない、`onError` 呼ばれない（silent）
  - `result.current.error` null、`isLoading` false
  - `capturedSignal()?.aborted === true`

## 8. AC-3: 型レベルテスト（POST/PATCH に retry を渡すと型エラー）

Phase 2 §3 の overload による静的保証。`@ts-expect-error` コメントで担保し、`mise exec -- pnpm typecheck` が 0 error であることをもって RED→GREEN を判定する（実行時 assert ではなくコンパイル時 assert）。

```ts
it("TC-TY-01: POST/PATCH に retry を渡すと型エラーになる（コンパイル時）", () => {
  // @ts-expect-error retry not allowed for non-idempotent method (POST)
  void (() => useAdminMutation("/api/admin/x", "POST", { retry: { maxAttempts: 3 } }));
  // @ts-expect-error retry not allowed for non-idempotent method (PATCH)
  void (() => useAdminMutation("/api/admin/x", "PATCH", { retry: { maxAttempts: 3 } }));
  // PUT/DELETE は retry 許可（@ts-expect-error を付けない＝型エラーが出ないことを保証）
  void (() => useAdminMutation("/api/admin/x", "PUT", { retry: { maxAttempts: 3 } }));
  void (() => useAdminMutation("/api/admin/x", "DELETE", { retry: { maxAttempts: 3 } }));
  expect(true).toBe(true);
});
```

> `@ts-expect-error` は対象行で型エラーが出ないと逆に typecheck が fail する。これにより「retry を非冪等 method に渡せない」ことが回帰検知される。PUT/DELETE 行に `@ts-expect-error` を付けないことで「idempotent では許可される」ことも同時に担保する（誤って overload が壊れると PUT/DELETE 行が unused `@ts-expect-error` 化せず逆方向で検知）。

## 9. AC-5: useConfirmDialog の onCancelMutation 連携

> 重要: Phase 2 §5 で `closeConfirm` の仕様を「submit 中の close = no-op」から「submit 中の close = 明示キャンセル → `onCancelMutation` 呼出 → INITIAL に戻す」へ**変更する**。
> このため既存 **U7（「submit 中の closeConfirm は no-op」）は仕様変更により期待値の更新が必要**。U7 を新仕様（submit 中 close で INITIAL に戻り `onCancelMutation` が呼ばれる）へ書き換える。`onCancelMutation` 未指定時は呼び出しをスキップして従来同様 INITIAL に戻すことを併せて確認する。

### U7（改訂）: submit 中の closeConfirm は dialog を閉じ、onCancelMutation 未指定でも安全

- セットアップ: 既存 U7 の resolve 保留 onSubmit パターン。option に `onCancelMutation` なし。
- 操作: `openConfirm("delete")` → `submit()` 開始 → `waitFor(submitting === true)` → `act(() => closeConfirm())`。
- 期待（新仕様）: `result.current.open === false`、`result.current.submitting === false`（INITIAL に戻る）。`onCancelMutation` 未指定でも例外なく閉じる。

### U10: submit 中の closeConfirm で onCancelMutation が呼ばれ INITIAL に戻る

- セットアップ: resolve 保留 onSubmit。`const onCancelMutation = vi.fn()`。`useConfirmDialog(onSubmit, { onCancelMutation })`。
- 操作: `openConfirm("delete")` → `submit()` 開始 → `waitFor(submitting === true)` → `act(() => closeConfirm())`。
- 期待: `onCancelMutation` が 1 回呼ばれる、`result.current.open === false`、`kind === null`、`submitting === false`（Phase 2 §5 closeConfirm 改修）。

### U11: 非 submit 中の closeConfirm では onCancelMutation を呼ばない

- セットアップ: `onCancelMutation = vi.fn()`。`openConfirm("approve")`（submit していない）。
- 操作: `act(() => closeConfirm())`。
- 期待: `onCancelMutation` 呼ばれない、INITIAL に戻る。Phase 2 §5 の updater は `s.submitting` 分岐内でのみ `onCancelMutation` を呼ぶため、非 submit close では呼ばれない。

> `onCancelMutation` は Phase 2 §5「`onSubmit` 同様に ref 経由で最新を参照」する設計。再レンダリングで callback 参照が変わっても最新が呼ばれることは Phase 6 で回帰 guard する。

## 10. ローカル実行コマンド

```bash
# useAdminMutation の追加 TC
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/features/admin/hooks/__tests__/useAdminMutation.spec.ts

# useConfirmDialog の追加 U10/U11/U7 改訂
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/features/admin/hooks/__tests__/useConfirmDialog.spec.tsx

# 型レベル assert（TC-TY-01）の検証
mise exec -- pnpm typecheck
```

## 11. DoD（Definition of Done）

- [ ] 既存 TC-01..10 が無改修（実時間のまま）で PASS することを確認した（既定 timeout 10s 適用でも即解決系は無影響）
- [ ] AC-2: TC-11（timeout silent）/ TC-12（誤発火しない）/ TC-23（abort silent）を追加し、いずれも toast/onError 非呼出・error=null を assert
- [ ] AC-3: TC-15（4xx 非 retry）+ TC-TY-01（型エラー `@ts-expect-error`）を追加
- [ ] AC-1/AC-12: TC-13（retry 成功）/ TC-14（maxAttempts 失敗）/ TC-16（backoff 指数増加）を fake timer で追加
- [ ] AC-1: TC-17/18/19（idempotency-key 文字列・関数・未指定）を追加
- [ ] AC-4: TC-20/21/22（404 三値）を追加
- [ ] AC-5: useConfirmDialog.spec.tsx に U10/U11 追加 + U7 を新仕様へ改訂
- [ ] fake timer は新規 timeout/retry テストに局所適用し、末尾で `vi.useRealTimers()` に戻す方針を記述した
- [ ] fetch mock で `init.signal` を観測する `makeAbortableFetch` テンプレートを記述した
- [ ] ローカル実行コマンドを明記した
