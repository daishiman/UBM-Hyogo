# Phase 04 — タスク分解

## サブタスク一覧（1 cycle 完結・CONST_007 遵守）

| No | サブタスク | 種別 | 依存 |
| --- | --- | --- | --- |
| T1 | `useAutoFocusOnMount` hook 本体実装 | 新規 | なし |
| T2 | hook 単体 spec 実装（3 ケース） | 新規 | T1 |
| T3 | root `app/error.tsx` を hook 経由に置換 | 編集 | T1 |
| T4 | 既存 root `error.component.spec.tsx` の assertion 維持確認 | 編集 | T3 |
| T5 | `app/login/error.tsx` に hook 適用 + `h1 ref/tabIndex` 追加 | 編集 | T1 |
| T6 | `app/login/__tests__/error.component.spec.tsx` 新規 | 新規 | T5 |
| T7 | `app/profile/error.tsx` に hook 適用 | 編集 | T1 |
| T8 | `app/profile/__tests__/error.component.spec.tsx` 新規 | 新規 | T7 |
| T9 | `app/(admin)/admin/error.tsx` に hook 適用 | 編集 | T1 |
| T10 | `app/(admin)/admin/__tests__/error.component.spec.tsx` 新規 | 新規 | T9 |
| T11 | typecheck / lint / spec runtime | 検証 | T2,T4,T6,T8,T10 |
| T12 | docs 更新（hook 利用ガイド） | 編集 | T1 |

## 並列実行可能性

- T1 完了後、T3 / T5 / T7 / T9 は並列実行可
- 各 boundary の spec (T4, T6, T8, T10) は対応する boundary 編集後に並列実行可
- T11 は全実装後

## 1 サイクル完結性 (CONST_007)

すべて単一 PR で完結可能。先送りタスクなし。
