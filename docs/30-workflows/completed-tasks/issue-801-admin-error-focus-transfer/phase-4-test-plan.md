# Phase 4: Test Plan — issue-801 admin error focus transfer

## テストファイル

新規: `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx`

ベース: `apps/web/app/__tests__/error.component.spec.tsx`（root の TC-U-01〜TC-U-09 構造を流用）

## モック方針

- `../../../../src/lib/logger` を `vi.mock` で差し替え、`logger.error` を `vi.fn()` に
- `vi.stubEnv("NODE_ENV", ...)` で isDev 分岐切り替え
- `vi.spyOn(HTMLElement.prototype, "focus")` で `focus` 呼び出し検証

## テストケース一覧

| TC | 観点 | 入力 | 期待 | AC 対応 |
|---|---|---|---|---|
| TC-AE-01 | dev mode で stack 表示 | `NODE_ENV=development`, stack あり | `<pre>` に stack 内容 | AC-6 |
| TC-AE-02 | prod mode で stack 非表示 | `NODE_ENV=production`, stack あり | `<pre>` 不在 | AC-6 |
| TC-AE-03 | digest 表示 | `digest="d1"` | `エラーID:` ラベル + `d1` | AC-5 |
| TC-AE-04 | digest 未指定で非表示 | digest なし | `エラーID:` ラベル不在 | AC-5 |
| TC-AE-05 | reset click | ボタンクリック | `reset` prop 1 回呼ばれる | AC-2 |
| TC-AE-06 | logger.error 呼び出し | mount | `logger.error` 1 回、`event="error.boundary.caught"`, `scope="admin"`, `digest` 正しい | AC-2 |
| TC-AE-07 | 同一 error rerender | 同 error 3 回 render | `logger.error` 累計 1 回 | AC-2 |
| TC-AE-08 | OKLch トークン使用 | mount | `text-danger` / `text-text-3` / `bg-accent` / `border-border` 存在、HEX / `ubm-color-*` 不在 | AC-8 |
| TC-AE-09a | h1 focus 移譲 | mount | `document.activeElement === h1` | AC-1, AC-2, AC-9 |
| TC-AE-09b | h1 tabIndex=-1 | mount | `h1.getAttribute("tabindex") === "-1"` | AC-1, AC-9 |
| TC-AE-09c | preventScroll | mount | `focus` が `{preventScroll: true}` で呼ばれる | AC-2, AC-9 |
| TC-AE-10 | role="alert" + aria-live | mount | wrapper に `role="alert"` + `aria-live="assertive"` | AC-4 |
| TC-AE-11 | Link 先 `/` | mount | `<a href="/">トップへ戻る</a>` 存在 | AC-7 |

## 実行コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run admin/__tests__/error.component
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## DoD

- 12 TC すべて PASS
- AC-9〜AC-13 ローカル達成
