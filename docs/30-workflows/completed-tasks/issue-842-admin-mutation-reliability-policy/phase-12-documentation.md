# Phase 12: ドキュメント更新

> 本ファイルは **Phase 12 で何をするかの仕様**である。2026-05-24 の compliance 改善サイクルで `outputs/phase-12/*.md`（strict 7）を物理生成済み。
> task-specification-creator skill の Phase 12 仕様（中学生レベル概念説明 + 技術詳細 + システム仕様書同期 + 視覚証跡）に従い、Part 1 / Part 2 構成で記述する。

---

## Part 1: 中学生にも分かる概念説明（必須セクション）

### なぜこの仕組みが必要なの？（先に理由）

管理画面では「会員のメモを更新する」「タグの申請を処理する」といった **保存ボタン（mutation）** をよく押します。このとき、次のような困りごとが起きていました。

- ボタンを押したのに **いつまでも返事が来ない**（通信が固まる）。管理者は画面を放置したり、もう一度押したりして、記録（audit log）が二重に汚れる
- 一瞬だけサーバーが混んだ（一過性のエラー）だけなのに、**すぐ「失敗しました」** と出てやり直しになる
- 同じボタンを **二回押してしまう** と、同じ処理が二回走ってしまう
- 「やっぱりやめた」とダイアログを閉じても、**裏で通信が走り続ける**

この 4 つを解決するのが今回の仕組みです。順番に、日常の例えで説明します。

### timeout（待ちすぎを止める）

レストランで料理を頼んだのに、いつまでも来ない。普通は「10 分待っても来なかったら店員さんに確認する」と決めますよね。それと同じで、**「10 秒待っても返事が来なかったら、その注文（通信）は打ち切る」** ルールが timeout です。打ち切ったときは「失敗しました」と騒がず、静かに止めます（後述の abort）。

### retry（もう一回試す）

電話をかけて「ただいま回線が混み合っています」と言われたら、少し待ってかけ直しますよね。でも「番号が間違っています」と言われたら、何回かけ直しても無駄です。retry は **「混んでいた（一過性のエラー）ときだけ、少し時間を空けてもう一回試す」** 仕組みです。間違い（番号違い＝相手側の明確な拒否）では繰り返しません。しかも「同じことを二回やっても結果が変わらない操作」でだけ許します（後述の idempotency）。

### idempotency（二重注文を防ぐ整理券番号）

人気のパン屋さんで整理券を引きます。同じ整理券番号を出している限り、たとえ列に二回並んでも「あなたはもう受付済みですよ」と分かるので、**二重に注文が通りません**。idempotency-key はこの整理券番号と同じで、「この操作はさっきのと同じものですよ」とサーバーに教える番号です。これで二重押しがあっても処理は一回だけになります。

### abort（注文キャンセル）

注文した直後に「やっぱりやめます」と言えば、料理を作り始める前にキャンセルできますよね。abort は **「ダイアログを閉じた（＝やめた）ら、裏で走っている通信もその場でキャンセルする」** 仕組みです。キャンセルなので、エラーとして騒ぎません（静かに止める＝silent）。

### まとめ

これらは全部 **保存ボタンの裏側（hook）** にまとめて入れます。各画面（caller）が自分でこの面倒を書かずに済むので、新しい管理画面を作るときも安全になります。

---

## Part 2: 技術者向け詳細

> 正本は Phase 2（設計）。本節は Phase 2 の §番号を引用して要点を再掲する。

### 2-1. 型定義（Phase 2 §2）

```ts
export type MutationMethod = "POST" | "PATCH" | "PUT" | "DELETE";   // 既存に DELETE 追加
export type IdempotentMethod = "PUT" | "DELETE";                    // retry 許可対象

export interface RetryPolicy {
  readonly maxAttempts: number;            // 初回含む最大試行回数
  readonly baseDelayMs?: number;           // 既定 200
  readonly maxDelayMs?: number;            // 既定 2000
  readonly retryOn?: (status: number | null) => boolean; // 既定: null or 5xx
}

export type Treat404AsSuccess = false | "silent" | { readonly toast: string }; // 既定 false
```

`UseAdminMutationOptions<T>` は既存オプション（`mutationFn` / `onSuccess` / `onError` / `successMessage` / `refreshOnSuccess` / `redirector` / `currentPath`）を不変で保ちつつ、新規 policy（`timeoutMs` / `idempotencyKey` / `treat404AsSuccess`）を optional 追加する。`retry` は `UseAdminMutationIdempotentOptions<T>`（`UseAdminMutationOptions<T>` の拡張）にのみ存在する（Phase 2 §2）。

返却 `UseAdminMutationReturn<T>` には既存（`trigger` / `isLoading` / `error` / `reset`）に加え `abort()` を追加する（Phase 2 §2）。

### 2-2. overload シグネチャ（Phase 2 §3 — AC-3）

```ts
// idempotent method（PUT/DELETE）のみ retry 付き options
export function useAdminMutation<T = unknown>(
  endpoint: string, method: IdempotentMethod,
  options?: UseAdminMutationIdempotentOptions<T>,
): UseAdminMutationReturn<T>;

// 非冪等 method（POST/PATCH）は retry を含まない options のみ
export function useAdminMutation<T = unknown>(
  endpoint: string, method: "POST" | "PATCH",
  options?: UseAdminMutationOptions<T>,
): UseAdminMutationReturn<T>;
```

POST/PATCH の overload は `retry` を持たない `UseAdminMutationOptions` を受け取るため、`retry` を渡すと **コンパイルエラー**になる。これが retry の idempotent 限定の型レベル保証（Phase 2 §3）。

### 2-3. 内部フロー（Phase 2 §4）

`trigger(payload, endpointOverride)` は in-flight ガード後、attempt ループ内で attempt ごとに新しい `AbortController` + `setTimeout(abort, timeoutMs ?? 10000)` を張る。

- `mutationFn` 経路: signal を渡せないため **timeout/retry 非適用**（後方互換・Phase 2 §8）。success 処理して return
- fetch 経路: `signal: controller.signal` 付きで実行。`Idempotency-Key` header は `idempotencyKey` 指定時のみ付与
- 401 → `AuthRequiredError`
- 404 かつ `treat404AsSuccess !== false` → success-relaxation
- `!res.ok` → `FetchAuthedError`。`shouldRetry` 成立かつ attempt 残あれば backoff sleep 後 continue
- catch で AbortError は silent（`setError(null)` し throw、toast/onError 非呼び出し）。network error は `shouldRetry(method, retry, null)` で retry 判定

補助関数（Phase 2 §4）:

```ts
function shouldRetry(method, retry, status) {
  if (!retry || !isIdempotent(method)) return false;          // 型 + runtime の二重ガード
  const predicate = retry.retryOn ?? ((s) => s === null || (s >= 500 && s <= 599));
  return predicate(status);
}
function backoffMs(attempt, retry) {
  return Math.min((retry.baseDelayMs ?? 200) * 2 ** (attempt - 1), retry.maxDelayMs ?? 2000);
}
```

### 2-4. 404 policy 3 値（Phase 2 §2 / §4 — AC-4）

| 値 | 挙動 |
|---|---|
| `false`（既定） | 404 は `FetchAuthedError` で失敗扱い |
| `'silent'` | 404 を成功相当に倒す。toast なし。`onSuccess(undefined)` → refresh |
| `{ toast: string }` | 404 を成功相当に倒す。`toast(treat404AsSuccess.toast, "status")` 表示 → `onSuccess(undefined)` → refresh |

silent / toast 時の戻り値は `undefined as T`（DELETE 404 に body なし前提・Phase 2 §8）。

### 2-5. abort 連携契約（Phase 2 §5 — AC-5）

`useConfirmDialog` に `onCancelMutation?: () => void` を追加し、`closeConfirm` で `submitting` 時に `onCancelMutationRef.current?.()` を呼んでから `INITIAL` に戻す。`onCancelMutation` は `onSubmit` 同様に ref 経由で最新を参照する（stale 回避）。配線は一方向 callback（hook 間循環なし・Phase 3 §3）。focus restore は `ConfirmDialog.tsx` の責務のまま（hook は触らない）。

```ts
const mutation = useAdminMutation("/api/admin/...", "DELETE", { retry: { maxAttempts: 3 } });
const dialog = useConfirmDialog(onSubmit, { onCancelMutation: () => mutation.abort() });
```

### 2-6. 既定値一覧（Phase 2 §4 / §8）

| 定数 | 既定値 |
|---|---|
| `DEFAULT_TIMEOUT_MS` | `10000`（ms） |
| `DEFAULT_BASE_DELAY_MS` | `200`（ms） |
| `DEFAULT_MAX_DELAY_MS` | `2000`（ms） |
| retry 既定 | opt-in・オフ（指定時のみ） |
| idempotency-key 既定生成 | しない（option 指定時のみ送出） |
| `treat404AsSuccess` 既定 | `false` |

### 2-7. エラーハンドリング（Phase 2 §4）

- AbortError（`e instanceof Error && e.name === "AbortError"`）: silent。`setError(null)` して throw。toast / onError を呼ばない
- AuthRequiredError: 既存どおり redirect
- FetchAuthedError: 既存どおり toast
- その他: 既存どおり toast

### 2-8. エッジケース

| ケース | 挙動 | 根拠 |
|---|---|---|
| `mutationFn` 経路 | timeout / retry **非適用**（signal を渡せない）。JSDoc で明記 | Phase 2 §4 / §8 |
| AbortError silent | エラー状態も残さず（`setError(null)`）caller の await は reject するが toast / onError なし | Phase 2 §4 |
| timeout abort 時の retry | しない（明示打ち切り）。retry は transient（5xx / network）限定 | Phase 2 §4「timeout と retry の合成」 |
| AbortError の型 | `DOMException`。`instanceof Error` ラップ後も `name` 保持。`name === "AbortError"` で判定 | Phase 2 §4 / Phase 3 §4 |

## 視覚証跡

**UI/UX 変更なしのため Phase 11 スクリーンショット不要。** 本タスクは NON_VISUAL（hook 内部の信頼性 policy）であり、代替証跡として vitest 5 観点の source-level PASS を `outputs/phase-11/manual-test-result.md` に記録する（Phase 11 §0 / §1 参照）。

## システム仕様書同期（Step 1-A / 1-B / 1-C）

実装サイクルで `outputs/phase-12/implementation-guide.md` を生成する際に、以下を実施する。

- **Step 1-A（影響特定）**: 本タスクは API endpoint / D1 schema / Google Form に変更がない（AC-9〜AC-11）。`docs/00-getting-started-manual/specs/*.md` の本文更新は不要。admin hooks 信頼性 policy のため、CLAUDE.md 不変条件 10（admin mutation は `@/features/admin/hooks/useAdminMutation` 経由）の SSOT 一本化を補強する位置づけ。
- **Step 1-B（close-out ステータス）**: 本タスクは `implemented` ステータスで close-out する（index.md / artifacts.json 状態に整合）。ローカル実装・テストは完了し、commit / push / PR は Phase 13 の user-gated 外部操作として残す。
- **Step 1-C（関連ドキュメント更新）**: 前身 one-pager `docs/30-workflows/completed-tasks/admin-mutation-timeout-policy.md`（現 status: `pending`・単一指示書）の status を **仕様書化済み**へ更新し、本ワークフロー `docs/30-workflows/issue-842-admin-mutation-reliability-policy/` への参照リンクを冒頭に追記する（破壊的書き換えはせず参照で接続）。

## issue AC-6 陳腐化への最適化の根拠（必須明記）

元 issue #842 の AC-6 は「`MeetingAttendancePanel.tsx` の DELETE 404『他管理者先行解除』を hook へ移譲する」を前提としていた。しかし **現コードでは DELETE attendance が未実装**で、パネルは POST 登録専用であり、404 は正当な「not found」失敗である（index.md §調査サマリ AC-6 / Phase 1 §2 inventory）。

したがって本仕様では:

- `treat404AsSuccess` を hook の **汎用 policy オプションとして実装するが、強制移行する caller は現状ゼロ**
- `MeetingAttendancePanel.tsx` は **本サイクルで変更しない**（POST 404 は既定 `false` で失敗扱いのまま維持・不変）
- 将来 DELETE attendance を実装する際に、当該 policy を宣言で使える土台のみ整える（DELETE route 自体の実装は step-06 が「将来 task」と明記しスコープ外）

この根拠を `outputs/phase-12/implementation-guide.md` にも明記する（index.md §issue 陳腐化への最適化方針 / Phase 1 §4 AC-6 に整合）。

## 完了条件（Phase 12 DoD）

- [ ] Part 1（中学生レベル）で timeout / retry / idempotency / abort を専門用語なしで説明（なぜ必要かを先に提示）
- [ ] Part 2（技術者レベル）で型・overload・内部フロー・404 三値・abort 契約・既定値・エラーハンドリング・エッジケースを Phase 2 §番号引用付きで記載
- [ ] `## 視覚証跡` に「UI/UX 変更なしのため Phase 11 スクリーンショット不要」を明記
- [ ] システム仕様書同期 Step 1-A/1-B/1-C（`implemented` close-out / one-pager status 更新）の作業内容を記載
- [ ] issue AC-6 陳腐化への最適化の根拠を明記
- [x] 本ファイルは Phase 12 仕様であり、2026-05-24 compliance 改善サイクルで `outputs/phase-12/*.md` を物理生成済みである旨を注記
