[実装区分: 実装仕様書]

# Phase 8: DRY 化 — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 8 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`(member)` / `(admin)` 双方で同一の sign-out 表現を実現し、将来同型 UI（settings など）
追加時にも再利用できる構造を維持する。

## 実行タスク

1. `signOut` 呼出を `SignOutButton` に集約する。
2. `/profile` と `(member)` layout は同じ `MemberHeader` を再利用する。
3. admin 側は既存 sidebar 構造を維持して footer だけ追加する。
4. public route への import 混入が無いことを確認する。

## 参照資料

- apps/web/src/components/auth/SignOutButton.tsx
- apps/web/src/components/layout/MemberHeader.tsx
- apps/web/src/components/layout/AdminSidebar.tsx

## 統合テスト連携

- `SignOutButton` unit test が共通 sign-out 契約を検証する。
- `/profile` と `/admin` の manual smoke が同一 component の配置を確認する。

## DRY 観点

| 重複候補 | 対処 |
| --- | --- |
| `signOut({ redirectTo: "/login" })` の引数 | `SignOutButton` 内で `redirectTo` props のデフォルトに集約 |
| ボタンスタイル | 既存 `apps/web/src/components/ui/Button.tsx` を再利用、独自 className を最小化 |
| ヘッダ DOM 構造 | `MemberHeader` を共通化し、admin 側は既存 `AdminSidebar` フッタに同 component を配置 |
| Auth.js endpoint 仕様 | `apps/web/src/lib/auth.ts` を参照、ここで再記述しない |
| middleware redirect 仕様 | `apps/web/middleware.ts` を参照、ここで再記述しない |

## 多角的チェック観点

- 同一仕様を 2 箇所以上に書いていない
- `signOut` の `redirectTo` を local literal で複数記述していない
- public route に同 component を読み込んでいない

## サブタスク管理

- [ ] `signOut` 引数の default を SignOutButton に集約
- [ ] Button primitive の variant 利用を確認
- [ ] `(member)` / `(admin)` 双方で同 component を参照していることを確認
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md

## 完了条件

- 重複が SignOutButton に集約されている
- 既存契約（Auth.js / middleware / Button）への参照ベースで設計されている

## タスク100%実行確認

- [ ] 同一仕様の重複記述が無い
- [ ] 既存契約を改変する記述が含まれていない

## 次 Phase への引き渡し

Phase 9 へ、参照化済の構造と固有要素一覧を渡す。
