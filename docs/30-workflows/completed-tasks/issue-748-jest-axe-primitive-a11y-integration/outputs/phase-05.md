# Phase 5 — テスト設計

[実装区分: 実装仕様書]

## 5.1 追加するテストケース

`apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` に `describe.each` で 7 ケース追加（5 primitive のうち FormField と Icon は state 別に 2 ケース）。

| # | ケース名 | 対象 state | 期待値 |
| --- | --- | --- | --- |
| A1 | `a11y(FormField) axe violation 0` | error 無し / required 無し | `results.violations.length === 0` |
| A2 | `a11y(FormField (error)) axe violation 0` | error あり | 同上 |
| A3 | `a11y(EmptyState) axe violation 0` | 4 props 指定 | 同上 |
| A4 | `a11y(Pagination) axe violation 0` | total 指定 / hasNext+hasPrev | 同上 |
| A5 | `a11y(Icon (labelled)) axe violation 0` | `ariaLabel` 指定 | 同上 |
| A6 | `a11y(Icon (decorative)) axe violation 0` | `ariaLabel` 未指定 | 同上 |
| A7 | `a11y(Breadcrumb) axe violation 0` | items 2 件 | 同上 |

## 5.2 残置する既存テストケース（regression 対策）

Phase 4.2 T3 の「残置」表を参照。axe で代替不能な固有契約のみ残す。

## 5.3 削除するテストケース

Phase 4.2 T3 の「削除対象」表を参照。

## 5.4 期待される失敗パターン

| 失敗 | 想定原因 | 対応 |
| --- | --- | --- |
| `color-contrast` violation | rule disable 漏れ | `apps/web/src/test/axe.ts` の rules 設定確認 |
| `region` violation | 同上 | 同上 |
| `landmark-one-main` violation | 同上 | 同上 |
| `button-name` violation（Pagination） | `aria-label` 欠落 | primitive 側のコード修正（本タスクスコープ内で許容） |
| `link-name` violation（Breadcrumb） | 同上 | 同上 |

## 5.5 test 時間予算

| 単位 | 想定 |
| --- | --- |
| axe 1 件 | 50〜200ms |
| 追加 7 ケース合計 | < 1.5 秒 |
| 既存 spec 全体 | 増加分 +2 秒未満 |

## 5.6 検証コマンド

```bash
# 単体実行
mise exec -- pnpm --filter web test -- apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx

# apps/web 全体
mise exec -- pnpm --filter web test
```

## 5.7 完了条件

- 追加 7 ケースすべて green
- 既存ケースすべて green
- spec 全体の実行時間 +2 秒以内
