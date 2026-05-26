# Phase 4: テスト作成

## メタ情報

| 項目   | 値                                      |
| ------ | --------------------------------------- |
| Phase  | 4 / 13（テスト作成）                    |
| 依存   | Phase 3                                 |
| Mode   | `verify_existing` のため targeted run 設計 |
| 成果物 | outputs/phase-4/phase-4.md              |

## 目的

`implementation_mode: "verify_existing"` のため、既実装のカバレッジを担保する targeted vitest を設計する。
`PublicHeader.spec.tsx` の 3 ケース追加と `(public)/layout.spec.tsx` の async wrapper mock を定義する。

## 実行タスク

- [x] `PublicHeader.spec.tsx` の追加 3 ケースを設計する
- [x] `(public)/layout.spec.tsx` の `vi.mock` 設計を確定する
- [x] targeted run コマンドを確定する
- [x] command と expected result を列挙する

## test suite

### `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx`（5 tests）

| # | テスト                                                                                                          |
| - | --------------------------------------------------------------------------------------------------------------- |
| 1 | 既存: brand / nav の構造                                                                                        |
| 2 | 既存: `currentPath` に応じた `aria-current` 付与                                                                |
| 3 | 新規: 未ログイン（`currentUser` 未指定）で CTA が `/login` + `data-state="anonymous"`、nav にマイページ非表示    |
| 4 | 新規: ログイン中（`currentUser={memberId, name}`）で CTA が `/profile` + `data-state="authenticated"`、nav に `data-role="my-profile"` のマイページ |
| 5 | 新規: `currentPath="/profile"` のとき nav のマイページに `aria-current="page"`                                  |

### `apps/web/app/(public)/layout.spec.tsx`（3 tests）

冒頭で `vi.mock("../../src/components/public/SessionAwarePublicHeader", ...)` を宣言し、async wrapper を
sync な `<div data-testid="session-aware-public-header-mock" />` に差し替える。

| # | テスト                                                                                                         |
| - | -------------------------------------------------------------------------------------------------------------- |
| 1 | wrapper に `data-theme='warm'` / `data-route-group='public'` / `data-testid='public-shell'` が付与される        |
| 2 | `data-shell='topbar'` / `data-shell='footer'` / `main[data-route='public']` を含む                              |
| 3 | axe critical 違反 0 件                                                                                          |

## targeted run コマンド

```bash
mise exec -- pnpm exec vitest run --root=. \
  apps/web/src/components/public/__tests__/PublicHeader.spec.tsx \
  "apps/web/app/(public)/layout.spec.tsx"
```

期待結果: 全 8 tests green。

## 参照資料

- `apps/web/src/test/axe.ts`（既存 axe helper）
- `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx`（拡張前）
- `apps/web/app/(public)/layout.spec.tsx`（拡張前）

## 成果物

- `outputs/phase-4/phase-4.md`（本書）

## 完了条件

- [x] 8 tests の設計が完了
- [x] async wrapper の `vi.mock` 戦略を確定
- [x] targeted run コマンドを固定
