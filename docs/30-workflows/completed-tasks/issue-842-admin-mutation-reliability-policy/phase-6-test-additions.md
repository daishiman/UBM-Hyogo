# Phase 6: テスト拡充

> Phase 4 の主観点テスト（TC-11..23 / TC-TY-01 / U10/U11）に対し、fail path・境界・回帰 guard を追加する。
> 設計の正本は [phase-2-design.md](phase-2-design.md)、主テストは [phase-4-test-plan.md](phase-4-test-plan.md)。
> 追加先: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` と `useConfirmDialog.spec.tsx`。
> mock 方針（`makeAbortableFetch` / fake timer × async act）は Phase 4 §2 を踏襲する。

## 1. timeout × retry の合成境界（retry 中に timeout）

Phase 2 §4「timeout と retry の合成」: 各 attempt ごとに新 `AbortController` + `setTimeout`。timeout abort は明示打ち切りで **retry しない**。

### TC-24: retry 試行中の attempt が timeout に達したら silent abort で打ち切り（retry しない）

- セットアップ: `DELETE` + `retry: { maxAttempts: 3, baseDelayMs: 200 }` + `timeoutMs: 5000`。`fetch` mock は 1 回目を即 503 で resolve、2 回目は `makeAbortableFetch` 系で **resolve しない**（abort 待ち）。`vi.useFakeTimers()`。
- 操作:
  1. `const p = result.current.trigger({});` → 1 回目 fetch 即 503
  2. `await vi.advanceTimersByTimeAsync(200)` → backoff 消化、2 回目 fetch（ハング）開始
  3. `await vi.advanceTimersByTimeAsync(5000)` → 2 回目 attempt の timeout 発火 → `controller.abort()`
- 期待:
  - `await expect(p).rejects.toMatchObject({ name: "AbortError" })`
  - `fetchMock` は 2 回まで（timeout abort 後に 3 回目を呼ばない＝timeout は retry 対象外）
  - `toastMock` 呼ばれない、`onError` 呼ばれない、`error` null（silent）

> 区別ポイント: 5xx/network error は retry 対象だが、timeout abort は `e.name === "AbortError"` 分岐で silent throw され `continue` しない（Phase 2 §4 catch 分岐）。

## 2. AbortError 判定の回帰 guard（DOMException / Error 両系統）

Phase 2 §4「AbortError 判定の注意」: `e instanceof Error && e.name === "AbortError"`。jsdom/happy-dom の DOMException も `name` を保持。

### TC-25: 投げられた error が DOMException でも name==="AbortError" で silent

- セットアップ: `makeAbortableFetch()` の abort reject を `new DOMException("Aborted", "AbortError")` にする。
- 操作: `trigger` 開始 → `act(() => result.current.abort())`。
- 期待: silent（toast/onError 非呼出・error=null）、`rejects.toMatchObject({ name: "AbortError" })`。

### TC-26: DOMException 非対応環境フォールバック（plain Error + name="AbortError"）でも silent

- セットアップ: abort reject を `Object.assign(new Error("Aborted"), { name: "AbortError" })` にする（Phase 4 §2.1 注記の代替系統）。
- 期待: 同上 silent。`instanceof Error` 経路でも `name` 判定で silent になることを担保（実装が `instanceof DOMException` に依存していないことの回帰 guard）。

## 3. `mutationFn` 経路で timeout/retry が非適用（後方互換）

Phase 2 §4 コメント / §8「mutationFn 経路は timeout/retry 非適用」。

### TC-27: mutationFn 経路は timeoutMs を超えても abort されない

- セットアップ: `mutationFn` を「`timeoutMs` より長く解決しない」promise にする。`timeoutMs: 1000`。`vi.useFakeTimers()`。
  - 例: `mutationFn: () => new Promise((r) => setTimeout(() => r({ ok: true }), 5000))`。
- 操作: `const p = trigger({});` → `await vi.advanceTimersByTimeAsync(1001)`（timeout 相当時間）→ まだ resolve しないこと（`p` pending）を `vi.getTimerCount()` 等で確認 → `await vi.advanceTimersByTimeAsync(4000)`（mutationFn 内 timer 消化）→ resolve。
- 期待: `await p` が **成功**（AbortError にならない）、成功 toast 1 回、`fetch` は呼ばれない。mutationFn 経路に `setTimeout` abort が掛かっていないことを担保。

### TC-28: mutationFn 経路では retry が掛からない（idempotent method でも）

- セットアップ: `DELETE` + `retry: { maxAttempts: 3 }` + `mutationFn` が 1 回 reject（`new Error("transient")`）。
- 操作: `trigger`。
- 期待: `mutationFn` が **1 回のみ**呼ばれる（retry しない）、`rejects`、`onError` 呼ばれる。mutationFn 経路は fetch loop に入らないため retry/timeout を素通りすることの回帰 guard。

## 4. 既存 caller が型エラーにならない回帰確認（typecheck で担保）

Phase 2 §7（後方互換性）/ Phase 3 §4「overload 追加で型推論が崩れ既存 caller が型エラー」リスクの回帰確認。実行時テストではなく typecheck で担保する。

### 手順

```bash
# 既存 caller を含む web 全体の型を検証（POST/PATCH caller が overload 2 にマッチし retry 無し options で通ること）
mise exec -- pnpm typecheck
```

- 検証観点: `MemberDrawer.tsx`（PATCH）/ `MeetingPanel.tsx`（POST/PATCH）/ `IdentityConflictRow.tsx`（POST）/ `TagsQueueResolveDrawer.tsx`（POST）/ `SchemaDiffPanel.tsx`（POST）/ `RequestQueuePanel.tsx`（POST）が型エラーにならないこと（Phase 1 §2 caller method 実測表）。
- これらは全て非冪等 method で `retry` 未使用のため overload 2（`UseAdminMutationOptions`）にマッチし、`abort` 返却追加・`timeoutMs` 等の optional 追加は非破壊（Phase 2 §7）。
- 補強として spec 内に「POST caller 相当の呼び出しが retry 無し options で型エラーにならない」positive 型ケースを TC-TY-01（Phase 4 §8）の PUT/DELETE 行と対に置く（`@ts-expect-error` を付けない＝型 OK を保証）。

## 5. idempotency-key 関数形の trigger 毎再評価

Phase 2 §2「関数なら trigger 毎に評価」/ §4（`resolveIdempotencyKey` を attempt 内で評価）。

### TC-29: idempotencyKey 関数は trigger ごとに再評価され、毎回異なる値を送出できる

- セットアップ: `let n = 0; const keyFn = vi.fn(() => `key-${++n}`);`。`idempotencyKey: keyFn`。`fetch` を 2 回とも即成功 resolve。
- 操作: `await trigger({})`（1 回目）→ `await trigger({})`（2 回目）。
- 期待:
  - `keyFn` が 2 回呼ばれる
  - 1 回目 fetch の `init.headers["Idempotency-Key"] === "key-1"`、2 回目は `"key-2"`（`fetchMock.mock.calls` で各 init を検証）
  - trigger 毎に最新評価値が送られる（固定キャプチャしていないことの回帰 guard）

> retry 内でも `resolveIdempotencyKey` を attempt ごとに呼ぶ実装の場合、同一 trigger 内の retry で同じ呼び出し回数になるか・キーが変わるかは実装詳細。最低限「trigger 単位で再評価される」ことを保証する（idempotency-key の意図は「同一論理操作=同一キー」だが、server 永続化はスコープ外のため client 送出形のみ検証）。

## 6. useConfirmDialog: onCancelMutation の ref 最新参照（再レンダリング回帰）

Phase 2 §5「`onSubmit` 同様に ref 経由で最新を参照（再生成由来の stale 回避）」。

### U12: rerender で onCancelMutation が差し替わっても最新が呼ばれる

- セットアップ: `renderHook` の `initialProps` で `onCancelMutation` を渡し、`rerender` で別の `vi.fn()` に差し替える。resolve 保留 onSubmit で submit 中状態を作る。
- 操作: `openConfirm("delete")` → `submit()` 開始 → `waitFor(submitting === true)` → `rerender({ onCancelMutation: newFn })` → `act(() => closeConfirm())`。
- 期待: **新しい** `newFn` が呼ばれ、古い callback は呼ばれない（ref 経由で最新参照される回帰 guard）。

## 7. DoD（Definition of Done）

- [ ] TC-24: retry 中の attempt が timeout に達したら silent abort で打ち切り retry しないことを fake timer で検証
- [ ] TC-25 / TC-26: AbortError が DOMException でも plain Error + `name==="AbortError"` でも silent になる回帰 guard を追加
- [ ] TC-27: mutationFn 経路は timeoutMs 超過でも abort されず成功することを検証
- [ ] TC-28: mutationFn 経路は idempotent method + retry 指定でも再試行されないことを検証
- [ ] §4: 既存 6 caller が overload 追加後も型エラーにならないことを `pnpm typecheck` で担保し、手順を記述
- [ ] TC-29: idempotencyKey 関数が trigger 毎に再評価され異なるキーを送出できることを検証
- [ ] U12: useConfirmDialog の `onCancelMutation` が rerender 後も ref 経由で最新参照されることを検証
- [ ] 追加 TC が既存 TC-01..10 / U1..U9 に副作用を与えない（fake timer は局所適用・末尾で `vi.useRealTimers()`）
