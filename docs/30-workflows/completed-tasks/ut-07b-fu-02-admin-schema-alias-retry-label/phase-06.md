# Phase 6: 異常系（4 状態区別）

`[実装区分: 実装仕様書]`

## 1. 異常系一覧

| ID | 入力 | 期待動作 |
| --- | --- | --- |
| ABN-01 | 422 validation error | `role="alert"` で「入力内容に誤り」を含む / form open のまま / busy=false |
| ABN-02 | 409 conflict（他 admin が先に確定） | `role="alert"` で「他の操作と競合」を含む / form open のまま / busy=false |
| ABN-03 | 500 internal error | `role="alert"` で「失敗: HTTP 500」 / form open のまま |
| ABN-04 | network error（fetch reject） | `role="alert"` で「失敗: network error」 / form open のまま |
| ABN-05 | 202 + `retryable=false`（仮想ケース、契約上発生しないが防御） | `isSchemaAliasRetryableContinuation` が false → 通常 success として扱わず、`feedback.kind="error"` で「予期しない応答」を表示することは要求しない（`success` 扱いで OK。理由: 200/202 双方で `confirmed=true` のため alias 確定は成立している） |
| ABN-06 | 202 + `backfill.status='pending'`（enqueue 直後） | predicate=false。success として処理し toast 表示。再試行案内は表示しない（仕様上 enqueue 完了を意味し、運用者の retry 不要） |
| ABN-07 | 重複送信（busy 中の二度押し） | 既存 `disabled={busy || !stableKey.trim()}` で防御。retryable 後は busy=false に戻り再送信可能 |

## 2. retryable 表示の重複抑止

retryable continuation 後にユーザーが連打した場合、`onSubmit` 内で `setBusy(true)` 直後に `setBusy(false)` するため、API レスポンス到着までは disabled になり連打防止が効く。テスト UI-05 で「retryable 後に再送信して 200 success に切替」をカバーする。

## 3. 既存挙動 regress 防止

| 既存挙動 | 維持確認方法 |
| --- | --- |
| dryRun 経路（ある場合） | 現状 `SchemaDiffPanel` は dryRun query を送らないため影響なし |
| `questionId` null で alias 不可 | 既存の `<p role="alert">この diff には questionId が…</p>` 維持 |
| diff 一覧表示 | `grouped` / `TYPES` mapping 不変 |
| `router.refresh()` の発火 | success 時のみ呼び、retryable / error 時は呼ばない（router refresh で active が再構成されると retry できなくなる） |

## 4. 完了条件

- [ ] ABN-01〜ABN-07 が表で列挙
- [ ] 既存挙動 regress チェック観点が確定
