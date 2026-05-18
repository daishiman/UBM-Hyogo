# Phase 04: タスク分解

## タスク一覧

| ID | タスク | 対象ファイル | 推定 |
|----|--------|--------------|------|
| T-04-1 | `VisibilityRequestDialog.tsx` に `useRouter` import + `router.refresh()` 最先発火 | apps/web/app/profile/_components/VisibilityRequestDialog.tsx | 10 min |
| T-04-2 | `DeleteRequestDialog.tsx` 同上 | apps/web/app/profile/_components/DeleteRequestDialog.tsx | 10 min |
| T-04-3 | `RequestActionPanel.tsx` の `onSubmitted` から `router.refresh()` 撤去 + 未使用 import clean | apps/web/app/profile/_components/RequestActionPanel.tsx | 10 min |
| T-04-4 | `VisibilityRequestDialog.component.spec.tsx` に `callOrder` assertion 追加 | apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx | 15 min |
| T-04-5 | `DeleteRequestDialog.component.spec.tsx` 同上 | apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx | 15 min |
| T-04-6 | `RequestActionPanel.component.spec.tsx` で parent 側 refresh 非発火 assert | apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx | 10 min |
| T-04-7 | `pnpm typecheck` / `pnpm lint` / 該当 spec test 実行 | - | 5 min |
| T-04-8 | Phase 11 evidence (order assertion 結果) 収集 | outputs/phase-11/visual-verification-skip.md | 5 min |
| T-04-9 | Phase 12 正本同期 7 ファイル生成 | outputs/phase-12/* | 30 min |
| T-04-10 | Phase 13 PR summary 作成（user approval 待ち） | outputs/phase-13/pr-summary.md | 10 min |

## クリティカルパス

```
T-04-1, T-04-2, T-04-3 (並列可) → T-04-4, T-04-5, T-04-6 (並列可) → T-04-7 → T-04-8 → T-04-9 → T-04-10
```

ファイル重複なしで並列実装可能。

## 依存関係

- T-04-4 は T-04-1 完了を前提（実装に対する test）
- T-04-5 は T-04-2 完了を前提
- T-04-6 は T-04-3 完了を前提
- T-04-7 はコード変更 3 件・test 変更 3 件すべて完了後

## DoD

- [x] `outputs/phase-04/task-breakdown.md` にタスク表とクリティカルパスを記載
