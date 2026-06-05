# Phase 4: テスト計画

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 方針（極小・削除のみタスクの TDD 適用）

`implementation_mode: new` だが、本タスクの code diff は `shell-collapse-cookie.ts` の **dead alias 3 行削除のみ**で、新しい振る舞いは一切追加しない。したがって古典的な「失敗テストを先に書く」TDD ではなく、**既存の focused Vitest が削除後も green を維持すること**を回帰 guard とする。

- 既存 focused Vitest（`apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`）は **primary 名のみ**を import している（`parseShellCollapsedCookie` / `readCollapsedFromDocument` / `serializeShellCollapsedCookie` / `writeShellCollapsedCookie`）。
- 削除する 3 件（`SHELL_COLLAPSE_COOKIE` / `readCollapsedFromCookieString` / `writeCollapsedCookie`）は **どのテストからも参照されない**。
- よって **テストファイルの変更は不要**。削除後も全 4 ケースが不変で PASS することが期待値。

## 2. 既存 focused Vitest の現行ケース（回帰 guard として維持）

| # | ケース名 | 検証対象（primary 名） | 期待値 |
| --- | --- | --- | --- |
| 1 | `cookie value を boolean に parse する` | `parseShellCollapsedCookie` | `"true"`→`true` / `"false"`→`false` / 不正値→`null` / `null`→`null` |
| 2 | `client writable な sidebar cookie を serialize する` | `serializeShellCollapsedCookie` | 値 `ubm_shell_collapsed=true|false`・`Path=/`・`SameSite=Lax`・`Max-Age=31536000` を含む |
| 3 | `document.cookie に collapse 状態を書き込む` | `writeShellCollapsedCookie` | `document.cookie` に `ubm_shell_collapsed=true` が反映 |
| 4 | `document.cookie から collapse 状態を読み取る` | `readCollapsedFromDocument` | 他 cookie 混在下でも `ubm_shell_collapsed=true` を読み取り `true` を返す |

> 4 ケースは parse / serialize / document 書込 / document 読取 を網羅し、primary 5 export のうち `SHELL_COLLAPSE_COOKIE_NAME` 以外の 4 関数を直接呼ぶ。`SHELL_COLLAPSE_COOKIE_NAME` は全関数・全ケースで間接的に経由される。

## 3. 命名規則整合の検証（Phase 1-3 命名規則）

削除後に残る export が Phase 1-3 で確定した命名規則と整合することを確認する:

- 定数: `SHELL_COLLAPSE_COOKIE_NAME`（SCREAMING_SNAKE） / private `SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS`（SCREAMING_SNAKE・非 export）
- 関数: `parseShellCollapsedCookie` / `serializeShellCollapsedCookie` / `writeShellCollapsedCookie` / `readCollapsedFromDocument`（いずれも camelCase）

削除する 3 件は「primary への単純再代入 alias」であり drift の原因。削除により命名 SSOT が code-primary に一本化される。

## 4. alias 復活防止の回帰 guard（任意・検討項目）

必須ではない（既存 4 ケースで機能網羅済み）。過剰実装を避けつつ、将来の drift 再発が懸念される場合の選択肢を記録する:

- **案 A（型レベル担保 / 推奨・追加コストゼロ）**: alias を import している箇所が無いため、誤って alias を再参照するコードを足すと `typecheck` で fail する。Phase 5 の typecheck gate がそのまま guard になる。
- **案 B（export surface assert / 任意）**: テストに `import * as mod` の `Object.keys(mod)` が削除した 3 名を **含まないこと**を assert するケースを 1 件足す案。drift 再発リスクが高いと判断した場合のみ採用。今回は単純タスクのため **見送り可**。

## 5. targeted run ファイルリスト（FB-UI-02-2）

実装後（user-gated）に実行する単体指定:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts
```

- 対象: `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`（単体指定）
- 新規テストファイル: なし
- 期待: 4 ケース全 PASS（削除前後で不変）
