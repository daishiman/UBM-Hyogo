# Phase 7: カバレッジ確認

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 対象範囲（Feedback BEFORE-QUIT-002 / 5）

- カバレッジ対象: `apps/web/src/components/shell/shell-collapse-cookie.ts` の **primary 5 export のみ**
  - 定数: `SHELL_COLLAPSE_COOKIE_NAME`
  - 関数: `parseShellCollapsedCookie` / `serializeShellCollapsedCookie` / `writeShellCollapsedCookie` / `readCollapsedFromDocument`
- 対象外: 削除する dead alias 3 件（`SHELL_COLLAPSE_COOKIE` / `readCollapsedFromCookieString` / `writeCollapsedCookie`）。これらは **primary への単純再代入で実行コード分岐を持たない**ため、削除によるカバレッジ低下は発生しない。

## 2. 既存 focused Vitest の網羅状況

| primary export | カバーするケース（Phase 4 §2） |
| --- | --- |
| `parseShellCollapsedCookie` | #1（true / false / 不正値 / null の全分岐） |
| `serializeShellCollapsedCookie` | #2（value / Path / SameSite / Max-Age） |
| `writeShellCollapsedCookie` | #3（document.cookie 書込・内部で serialize 経由） |
| `readCollapsedFromDocument` | #4（混在 cookie 下の matched 抽出 → parse 委譲） |
| `SHELL_COLLAPSE_COOKIE_NAME` | 上記全ケースで間接経由（cookie 名生成・prefix マッチ） |

- 4 関数すべてが直接テストで呼ばれ、private 定数 `SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS` は #2 で `Max-Age=31536000` として間接検証される。
- alias 削除はこの網羅に **影響しない**（alias は primary を指すだけで、テストはもともと primary を直接叩いている）。

## 3. 変更行のカバレッジ

- code diff は 3 行の **削除のみ**。削除行は実行コードを持たないため、変更により新たに「未カバー行」は生まれない。
- 変更行カバレッジの実測値は、実装適用後（user-gated）に下記で取得する:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts --coverage
```

> 実測取得は実装後。本仕様書はコード実装・カバレッジ実行を行わない（user-gated）。
