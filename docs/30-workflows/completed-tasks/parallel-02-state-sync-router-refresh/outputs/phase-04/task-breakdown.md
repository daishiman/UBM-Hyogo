# Phase 04: タスク分解

## SRP に基づく分解（5 件）

| # | タスク | 対象ファイル | 種別 |
| --- | --- | --- | --- |
| T1 | VisibilityRequestDialog.tsx に `useRouter` import / hook / success branch refresh を追加 | `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | code |
| T2 | DeleteRequestDialog.tsx に同様の変更を追加 | `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | code |
| T3 | RequestActionPanel.tsx の `onSubmitted` から `router.refresh()` を削除、accepted bridge state へ再構成 | `apps/web/app/profile/_components/RequestActionPanel.tsx` | code |
| T4 | VisibilityRequestDialog.component.spec.tsx / DeleteRequestDialog.component.spec.tsx に refresh 呼び出し検証ケース追加（success / failure / order） | spec.tsx 2 件 | test |
| T5 | RequestActionPanel.component.spec.tsx に non-regression 検証ケース追加（refresh を呼ばないこと） | spec.tsx | test |

## 依存関係

- T1, T2, T3 は code-only / 互いに独立 → 並列実装可
- T4, T5 は T1〜T3 完了後に並列実装可（テスト先行 TDD も可）

## 実装区分

全 5 タスクが code 実装（CONST_006 適用、ドキュメントのみではない）
