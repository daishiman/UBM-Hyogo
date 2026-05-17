**[実装区分: 実装仕様書]**

# Phase 10: regression smoke

## メタ情報

- task: `i02-admin-error-type-unify`
- 対象: 既存 admin 機能全般（`apps/web/src/app/(admin)/admin/**`）
- 前提: Phase 9 の品質ゲートを通過済み

## 目的

`AdminMutationHttpError` から `AuthRequiredError` / `FetchAuthedError` への error 型統一が、
既存 admin 機能の 401 / 403 / 5xx ハンドリング挙動を**意図せず壊していない**ことを
grep + 手動 smoke + 既存 visual smoke で確認する。

## 実行タスク

| ID | タスク | 種別 |
| --- | --- | --- |
| T-10-1 | `AdminMutationHttpError` の残存参照 grep | 静的 |
| T-10-2 | `useAdminMutation` caller の全件列挙 | 静的 |
| T-10-3 | 各 caller で 401 / 403 / 5xx 表現の確認（toast / boundary） | 静的 |
| T-10-4 | ローカル dev 起動 → admin 画面で 401 / 403 / 5xx 手動再現 | 動的 |
| T-10-5 | `playwright-smoke` 既存 spec の green 確認（影響範囲のみ） | 動的 |
| T-10-6 | 残課題・観測結果のメモ化 | 記録 |

## 参照資料

| パス | 用途 |
| --- | --- |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 変更対象 |
| `apps/web/src/features/admin/hooks/index.ts` | export surface |
| `apps/web/src/app/(admin)/admin/**` | caller 集合 |
| `apps/web/src/lib/fetch/errors.ts` | 統一後 error class |
| `apps/web/playwright/**` | 既存 smoke spec |

## 実行手順

### 1. 静的影響範囲 grep

```bash
# 旧 class 完全除去確認
grep -rn "AdminMutationHttpError" /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260517-014848-wt-1/apps/web/src/
# 期待: 0 件（exit 1 想定）

# 新 class への参照
grep -rn "AuthRequiredError\|FetchAuthedError" /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260517-014848-wt-1/apps/web/src/features/admin/

# useAdminMutation の caller 列挙
grep -rn "useAdminMutation" /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260517-014848-wt-1/apps/web/src/
```

caller 一覧から、各 component が独自 error 表現（toast / inline message）を持つ箇所を抽出する。

### 2. caller ごとの動作観点

| シナリオ | 期待動作 | 確認方法 |
| --- | --- | --- |
| 401（session 切れ） | `/login?redirect=<現在 path>` へ redirect（p-10 経路） | unit test |
| 403（権限不足） | toast 表示 / inline error、redirect なし | 手動 |
| 500 / 5xx | global error boundary or toast、再試行可能 | 手動 |
| network fail | toast「通信に失敗しました」相当、redirect なし | 手動 |

### 3. ローカル dev 手動 smoke

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" dev
```

- admin login 後、`/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/requests` でそれぞれ mutation（保存 / 削除 / 承認）を 1 回実行
- DevTools Network panel で対象 API 応答を 401 / 403 / 500 に override し、UI 挙動を観測
- 401 が `/login?redirect=/admin/...` に遷移すること
- 403 / 5xx で redirect が起きず、画面に error 表現が出ること

### 4. 既存 playwright smoke

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" exec playwright test --project=chromium --grep "admin"
```

i02 は UI 表示・layout に影響しないため visual diff は発生しない想定。差分が出た場合は調査優先。

## 統合テスト連携

- Phase 8 の `useAdminMutation.spec.ts` redirect DI case は本 Phase の自動カバレッジ枠
- p-10 が完了している場合、本 Phase で `it.todo` 化していた cases を解除して再実行
- 手動 smoke の結果は最終レポートに観測表として添付

## 多角的チェック観点（AIが判断）

- toast 文言が 401 / 403 で差別化されているか（403 は「権限がありません」相当を維持）
- redirect 後の `next` query が URL encode 済みか（特に `?` を含む path）
- multi-tab で 401 を踏んだ場合、両 tab で redirect が独立に発火しても破綻しないか
- network fail（`fetch` reject）で `FetchAuthedError` ではなく素の `Error` が throw されること、UI が誤って redirect しないこと
- `AdminMutationHttpError` import 残骸が test snapshot や story file に残っていないか（grep gate）

## サブタスク管理

- T-10-1〜T-10-3 を先行（静的・短時間）
- T-10-4 を dev server 起動下で集中実行
- T-10-5 は CI 側でも回るが、push 前 local で 1 回確認
- T-10-6 で観測結果を最終レポートに集約

## 成果物

- regression smoke 観測表（最終レポート内）
- 追加の修正コミット（必要に応じて）
- grep gate 結果（`AdminMutationHttpError` 0 件）

## 完了条件

- [ ] `grep -rn "AdminMutationHttpError" apps/web/src/` の結果が 0 件
- [ ] `useAdminMutation` caller 全件で 401 / 403 / 5xx 手動 smoke 完了
- [x] 401 → `/login?redirect=...` redirect が unit test で観測できる
- [ ] 403 / 5xx で redirect が**起きない**ことを観測
- [ ] 既存 admin 関連 playwright smoke がローカルで PASS
- [ ] 観測結果が最終レポートに表形式で記載

## タスク100%実行確認【必須】

- [ ] T-10-1〜T-10-6 すべて完了
- [ ] 静的 grep / 動的 smoke / 既存 spec の 3 層で regression なし
- [ ] p-10 との連携状態（完了 / 未完了）を最終レポートに明記
- [ ] 残課題があれば issue 化方針（既存 issue 追記 or 新規）を提示

## 次Phase

Phase 11: ドキュメント / artifact 更新（必要なら canonical workflow 昇格判断）。
