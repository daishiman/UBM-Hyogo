# system-spec-update-summary

## Step 1-A: タスク完了記録

- 親 workflow `docs/30-workflows/public-header-logged-in-nav-cleanup/` の Task D 派生として `login-redirect-when-authenticated` を独立 workflow 化。
- 親 workflow の `tasks/task-d-login-redirect-when-authenticated.md` を source とし、本 workflow で local implementation evidence を確定。

## Step 1-B: 実装状況テーブル

| 項目                                | 状態         |
| ----------------------------------- | ------------ |
| workflow_state                      | `implemented_local_evidence_captured` |
| 仕様書（Phase 1-13）                | completed |
| `safe-next.ts` 実装                  | completed |
| `/login` redirect 配線              | completed |
| unit test 16 + 6                    | PASS（22 tests） |

## Step 1-C: 関連タスク

| 関連 workflow                                    | ステータス     | 関係              |
| ------------------------------------------------ | -------------- | ----------------- |
| `public-header-logged-in-nav-cleanup`            | 進行中（親）   | 本 workflow を派生 |
| `apps/web/src/lib/url/safe-redirect.ts`（既存）  | 既実装         | `isSafeInternalRedirect` を `safeNext` から再利用 |

## Step 2: システム仕様更新（条件付き）

| 判定項目                       | 結果   |
| ------------------------------ | ------ |
| 新規インターフェース追加       | Yes（`apps/web/src/lib/url/safe-next.ts` の route-local helper） |
| 既存インターフェース変更       | No     |
| 新規定数追加（系統的）         | No（`MAX_NEXT_LENGTH` ローカル定数のみ）       |
| API 仕様変更                   | No     |

**結論**: aiworkflow-requirements の workflow ledger / quick-reference / resource-map / artifact inventory を同 wave で更新する。

`safe-redirect.ts` との関係性は未タスク化せず、`safeNext` が既存 predicate を再利用する実装へ変更した。
