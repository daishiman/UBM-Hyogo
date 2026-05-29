# Phase 8: リファクタリング

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 8 / 13                      |
| 名称      | リファクタリング            |
| 状態      | completed                   |
| 作成日    | 2026-05-28                  |

## 1. リファクタ対象 / Before / After / 理由

| 対象                                        | Before                        | After                                              | 理由                                                       |
| ------------------------------------------- | ----------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| `apps/web/app/page.tsx` の PublicHeader 配信 | `<PublicHeader />`            | `<PublicHeader authView={authView} />`             | Task A async props 化に整合                                |
| `app/page.tsx` の auth fetch                | （なし）                       | `const authView = await getAuthView();`            | server cycle 内で 1 回だけ session を解決し props 配信     |
| import 順序                                  | 既存 import 群                 | `getAuthView` を相対 import の適切な位置に挿入      | 既存スタイルに合わせ ESLint import/order に違反しないようにする |

## 2. duplicate / navigation drift

- duplicate なし（`getAuthView` は Task A 正本 helper の 1 経路のみ）
- navigation drift なし（route 移動なし。`/` route は不変）

## 3. 完了条件

- 上記 3 リファクタ後も Phase 4 / 6 のテストが全て GREEN
- `pnpm lint` が import/order 含めて green
