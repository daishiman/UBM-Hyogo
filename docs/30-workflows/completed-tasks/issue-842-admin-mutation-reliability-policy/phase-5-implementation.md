# Phase 5: 実装手順

> Phase 2 設計を実コードに落とす Step バイ Step 手順。型・シグネチャ・内部フロー・補助関数の正本は [phase-2-design.md](phase-2-design.md)。本 Phase は §番号を引用し、コード全文の再掲は避ける。
> RED テストの期待値は [phase-4-test-plan.md](phase-4-test-plan.md)。

## 変更対象ファイル一覧（CONST_005）

| パス | 種別 | 内容 |
|---|---|---|
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 編集 | Phase 2 §2 型追加 / §3 overload / §4 内部フロー（timeout+retry+idempotency+404 policy+abort+補助関数） |
| `apps/web/src/features/admin/hooks/useConfirmDialog.ts` | 編集 | Phase 2 §5 `onCancelMutation` 追加・`closeConfirm` 改修（ref 経由） |
| `apps/web/src/features/admin/hooks/index.ts` | 編集 | 新規型 export（`RetryPolicy`/`Treat404AsSuccess`/`MutationMethod`/`IdempotentMethod`/`UseAdminMutationIdempotentOptions`） |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | 編集 | Phase 4 §3..§8 の TC-11..23 / TC-TY-01 追加 |
| `apps/web/src/features/admin/hooks/__tests__/useConfirmDialog.spec.tsx` | 編集 | Phase 4 §9 の U10/U11 追加 + U7 改訂 |
| `apps/web/src/lib/useAdminMutation.ts` | **削除** | legacy dead code（0 caller） |
| `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` | **削除** | legacy 専用テスト |

> `MeetingAttendancePanel.tsx` は本サイクルでは変更しない（index.md 注記・AC-6 陳腐化最適化）。

## Step 0: 事前確認

```bash
mise exec -- node -v   # v24.15.0 であること（異なれば mise exec -- 経由を徹底）

# 現状シグネチャの確認（method 型 "POST"|"PATCH"|"PUT"、AbortController なし）
grep -n "method:" apps/web/src/features/admin/hooks/useAdminMutation.ts

# legacy production 参照 0 件の証跡（テスト import を除く）。0 件であること
grep -rn "lib/useAdminMutation" apps/web/src --include="*.ts" --include="*.tsx" \
  | grep -v "apps/web/src/lib/useAdminMutation.ts" \
  | grep -v "apps/web/src/lib/__tests__/useAdminMutation.spec.tsx"
# → 出力 0 行を確認（caller は全て features/admin/hooks/useAdminMutation を参照）
```

## Step 1: `useAdminMutation.ts` に型を追加（Phase 2 §2）

`UseAdminMutationOptions<T>` の上に Phase 2 §2 の型を追加する。

- `export type MutationMethod = "POST" | "PATCH" | "PUT" | "DELETE";`（既存 `"POST"|"PATCH"|"PUT"` を置換し DELETE を追加）
- `export type IdempotentMethod = "PUT" | "DELETE";`
- `export interface RetryPolicy { maxAttempts; baseDelayMs?; maxDelayMs?; retryOn? }`（§2 そのまま）
- `export type Treat404AsSuccess = false | "silent" | { readonly toast: string };`
- 既存 `UseAdminMutationOptions<T>` に新規 policy（`timeoutMs?` / `idempotencyKey?` / `treat404AsSuccess?`）を追加。`retry` は **ここには置かない**（overload 側のみ）。
- `export interface UseAdminMutationIdempotentOptions<T> extends UseAdminMutationOptions<T> { readonly retry?: RetryPolicy; }`
- `UseAdminMutationReturn<T>` に `readonly abort: () => void;` を追加。

## Step 2: overload シグネチャを実装（Phase 2 §3）

現行の単一シグネチャ（`useAdminMutation<T>(endpoint, method: "POST"|"PATCH"|"PUT", options?)`）を Phase 2 §3 の 3 段 overload に置換する。

1. `(endpoint, method: IdempotentMethod, options?: UseAdminMutationIdempotentOptions<T>)`
2. `(endpoint, method: "POST" | "PATCH", options?: UseAdminMutationOptions<T>)`
3. 実装シグネチャ `(endpoint, method: MutationMethod, options?: UseAdminMutationIdempotentOptions<T>)`

> overload 1 と 2 のみ export 宣言として公開、3 は実装本体。これにより POST/PATCH に `retry` を渡すと型エラー（AC-3 / Phase 4 §8 TC-TY-01）。

## Step 3: 内部フロー（`trigger` 改修・補助関数）（Phase 2 §4）

### 3.1 補助関数と定数（モジュールトップレベル）

Phase 2 §4「補助関数」をそのまま追加する。

- 定数: `DEFAULT_TIMEOUT_MS = 10000` / `DEFAULT_BASE_DELAY_MS = 200` / `DEFAULT_MAX_DELAY_MS = 2000`
- `isIdempotent(method)` / `shouldRetry(method, retry, status)` / `backoffMs(attempt, retry)` / `resolveIdempotencyKey(k)`
- `sleep(ms)` ヘルパ（`new Promise((r) => setTimeout(r, ms))`）。fake timer 下で `vi.advanceTimersByTimeAsync` により消化される（Phase 4 §2.2）。

### 3.2 abort 用 ref と `abort()` 返却

- `const abortRef = useRef<AbortController | null>(null);` を追加。
- `const abort = useCallback(() => { abortRef.current?.abort(); }, []);` を追加し、return に含める。

### 3.3 `trigger` を retry loop 化（Phase 2 §4 擬似コード）

- 既存の二重 trigger ガード（`isSubmittingRef`）は loop 進入前に維持。
- `mutationFn` 経路は **loop の外（または attempt ループの最初）で signal 非適用のまま**実行し、timeout/retry をかけない（Phase 2 §4 コメント / §8「mutationFn 経路は非適用」）。既存の mutationFn 成功処理ブロックを温存する。
- fetch 経路:
  - 各 attempt で `const controller = new AbortController(); abortRef.current = controller; const timeoutId = setTimeout(() => controller.abort(), options?.timeoutMs ?? DEFAULT_TIMEOUT_MS);`
  - `fetch(url, { method, headers: { "content-type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) }, body, credentials: "same-origin", signal: controller.signal })`。`key = resolveIdempotencyKey(options?.idempotencyKey)` は attempt ごとに評価（関数形は trigger 毎再評価。Phase 6 で回帰）。
  - 応答後 `clearTimeout(timeoutId)`。
  - 401 → `AuthRequiredError` throw（既存どおり）。
  - 404 かつ `treat404AsSuccess !== false` → success-relaxation（Phase 2 §4）: `"silent"` は toast なし、`{toast}` は `toast(treat404AsSuccess.toast, "status")`。`await onSuccess?.(undefined as T)`、`refreshOnSuccess !== false` で `router.refresh()`、`return undefined as T`。
  - `!res.ok` → `FetchAuthedError(status, bodyText)`。`shouldRetry(method, retry, status) && attempt+1 < retry.maxAttempts` なら `attempt++; await sleep(backoffMs(attempt, retry)); continue`。さもなくば throw。
  - 成功 → `res.json()` → 既存 success 処理 → return。
  - catch: `e.name === "AbortError"`（`e instanceof Error && e.name === "AbortError"`、Phase 2 §4「AbortError 判定の注意」）なら `setError(null)` で silent・`throw e`（toast/onError 呼ばない）。network error（status null）は `shouldRetry(method, retry, null)` で retry 判定。retry 不可なら既存 error 分岐（AuthRequired→redirect / FetchAuthed→toast / その他→toast）へ。
  - finally（loop 脱出時）: `clearTimeout(timeoutId)`（catch 内未 clear の保険）・`isSubmittingRef.current = false`・`setIsLoading(false)`・`abortRef.current = null`。

> timeout abort は明示打ち切りのため retry しない（Phase 2 §4「timeout と retry の合成」/ §8）。`shouldRetry` は network error/5xx のみ true。

## Step 4: `useConfirmDialog.ts` 改修（Phase 2 §5）

- `UseConfirmDialogOptions` に `readonly onCancelMutation?: () => void;` を追加。
- `onSubmitRef` と同様に `const onCancelMutationRef = useRef(options.onCancelMutation); useEffect(() => { onCancelMutationRef.current = options.onCancelMutation; }, [options.onCancelMutation]);` を追加（ref 経由で最新参照・stale 回避。Phase 2 §5 注記）。
- `closeConfirm` を Phase 2 §5 の updater に置換: `submitting` 時は `onCancelMutationRef.current?.()` を呼んで `INITIAL` を返す。非 submit 時は従来どおり `s.open ? INITIAL : s`。

> 注意（後方互換の挙動変更）: 現行は submit 中 close を no-op にしているが、本改修で「submit 中 close = abort して閉じる」に変わる。これは AC-5 の意図的変更。既存テスト U7 は Phase 4 §9 の改訂版へ更新する（Step 8 のテストで担保）。

## Step 5: `index.ts` barrel に export 追加

`export type { ... } from "./useAdminMutation"` に以下を追加する。

```ts
export type {
  UseAdminMutationOptions,
  UseAdminMutationReturn,
  RetryPolicy,
  Treat404AsSuccess,
  MutationMethod,
  IdempotentMethod,
  UseAdminMutationIdempotentOptions,
} from "./useAdminMutation";
```

`useConfirmDialog` の type export は既存どおり（`UseConfirmDialogOptions` に `onCancelMutation` が増えるのみで export 名は不変）。

## Step 6: legacy 削除（AC-7）

削除前に Step 0 の grep を再実行し 0 件を確認した証跡を残す。

```bash
# 削除直前の最終証跡（0 行であること）
grep -rn "lib/useAdminMutation" apps/web/src --include="*.ts" --include="*.tsx" \
  | grep -v "apps/web/src/lib/useAdminMutation.ts" \
  | grep -v "apps/web/src/lib/__tests__/useAdminMutation.spec.tsx"

rm apps/web/src/lib/useAdminMutation.ts
rm apps/web/src/lib/__tests__/useAdminMutation.spec.tsx
```

> 削除根拠は Phase 2 §6（0 caller / 新旧シグネチャ非互換で re-export 不能 / deprecate は dead code 温存に過ぎない）。

## Step 7: typecheck / lint

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

- 0 error / 0 warning（baseline 維持・AC-13/AC-14）まで最大 3 サイクルで修正。
- 想定される修正点: overload 追加による既存 caller の型推論（POST/PATCH caller は retry 未使用のため非破壊・Phase 3 §4）。`@ts-expect-error`（TC-TY-01）が unused にならないこと。

## Step 8: テスト実行（Phase 4 の RED→GREEN）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/features/admin/hooks/__tests__/useAdminMutation.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/features/admin/hooks/__tests__/useConfirmDialog.spec.tsx
```

- 既存 TC-01..10 / U1..U9（U7 は改訂）+ 追加 TC-11..23 / TC-TY-01 / U10/U11 が全 PASS（AC-12/AC-15）。

## Step 9: build 確認（OpenNext Workers 互換）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
```

`next build --webpack`（CLAUDE.md env 不変条件）が success すること。`AbortController` / `setTimeout` は Workers ランタイムで利用可（標準 Web API）のため bundle 互換性問題なし。

## DoD（Definition of Done） — AC 対応

- [ ] AC-1: `timeoutMs` / `retry` / `idempotencyKey` / `treat404AsSuccess` を型定義 + JSDoc 付きで追加（Step 1）
- [ ] AC-2: timeout / `abort()` で AbortError silent（toast/onError 非呼出・error=null）（Step 3.2/3.3）
- [ ] AC-3: overload で POST/PATCH は `retry` を型レベル拒否、PUT/DELETE は許可（Step 2）
- [ ] AC-4: `treat404AsSuccess` が `false | 'silent' | {toast}` の 3 値、既定 false（Step 1/3.3）
- [ ] AC-5: `useConfirmDialog.onCancelMutation` を ref 経由で追加し `closeConfirm` で呼ぶ（Step 4）
- [ ] AC-6: `MeetingAttendancePanel.tsx` 無変更（POST 404 既定 false 維持）
- [ ] AC-7: legacy 2 ファイルを物理削除（削除前 grep 0 件証跡）（Step 0/6）
- [ ] AC-8: caller は新基盤のみ参照（grep 0 件で担保）
- [ ] AC-9/10/11: API endpoint / D1 schema / D1 直接アクセス追加なし
- [ ] AC-12: `useAdminMutation.spec.ts` に 5 観点（timeout/retry/idempotency/404-3値/abort）追加し PASS（Step 8）
- [ ] AC-13: `pnpm typecheck` 0 error（Step 7）
- [ ] AC-14: `pnpm lint` 0 error / 0 warning（Step 7）
- [ ] AC-15: 該当 vitest 0 fail（Step 8）
- [ ] barrel に新規型 export 追加（Step 5）
- [ ] `pnpm --filter @ubm-hyogo/web build` success（Step 9）
