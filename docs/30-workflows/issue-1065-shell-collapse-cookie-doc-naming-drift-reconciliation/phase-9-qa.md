# Phase 9: 品質保証

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 本タスクの QA 観点（極小・doc 整合 + 3 行削除）

本タスクの code diff は `shell-collapse-cookie.ts` の dead alias **3 行削除のみ**であり、新しい振る舞いを足さない。したがって QA は「削除が安全に成立しているか」「設計 doc が primary 名へ整合したか」の 2 軸に集約する。

- line budget の観点: doc 整合（3 本）+ 3 行削除のみで、新規ファイル増・大幅な行数増は発生しない。
- link の観点: doc 内の関数/定数参照が primary 名へ整合し、code とのリンク（navigation）が一致する。
- mirror parity の観点: alias 削除により code と doc の export 名が 1:1 で一致（drift = 0）。

## 2. 削除確認の合格基準 [FB-UI-02-1]

削除は「**git delete されている OR `export {}` stub 化かつ live import ゼロ**」を PASS とする。本件は alias を **物理削除**する方針であり、削除後に以下の grep でゼロ件を証跡に残す。

```bash
rg "readCollapsedFromCookieString|writeCollapsedCookie|SHELL_COLLAPSE_COOKIE\b" apps/web/src
```

- 期待結果: **0 件**（`SHELL_COLLAPSE_COOKIE\b` の word boundary により、keep する `SHELL_COLLAPSE_COOKIE_NAME` は除外される）。
- 削除「前」にも同 grep を実行し、3 alias が `apps/web/src` 内で 0 参照であること（=安全に削除可能）を再確認する（AC-3）。

## 3. QA チェックリスト（実行は user-gated・実装後）

| # | チェック項目 | 合格基準 | 状態 |
| --- | --- | --- | --- |
| Q-1 | typecheck green | `pnpm typecheck` exit 0（alias 再参照が無いため fail しない） | 実装後に取得（spec_created 段階） |
| Q-2 | lint green | `pnpm lint` exit 0 | 実装後に取得 |
| Q-3 | focused Vitest green | `shell-collapse-cookie.spec.ts` 4 ケース全 PASS（削除前後で不変） | 実装後に取得 |
| Q-4 | alias 削除確認 | §2 の grep が削除後 0 件 / 削除前も 0 参照 | 実装後に取得 |
| Q-5 | cookie 名/value 無変更 | `ubm_shell_collapsed` / `true|false` / 属性（Path=/・SameSite=Lax・Max-Age=31536000）が無変更（AC-5） | 実装後に取得 |
| Q-6 | consumer 無変更 | `SidebarShell.server.tsx` / `useSidebarState.ts` に diff が出ない（全 primary 名使用済） | 実装後に取得 |
| Q-7 | diff は 3 行削除のみ | `git diff` が dead alias 3 行削除に閉じる（AC-4） | 実装後に取得 |
| Q-8 | doc 整合 | 設計 doc 3 本が primary 名 + 値 parser 訂正注記へ整合（AC-1/AC-2） | 実装後に取得 |

## 4. 想定リスクと緩和

- **alias 復活回帰**: Phase 4 §4 案 A（typecheck gate）が guard。alias を再参照するコードを足すと typecheck で fail するため、追加テストは見送り可。
- **環境ブロッカー**: Vitest / esbuild runtime の arch / worktree isolation 問題が出た場合は `pnpm verify:vitest-runtime` で切り分ける（本タスク固有のリスクではない）。
