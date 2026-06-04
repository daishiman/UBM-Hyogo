# Phase 6: テスト拡充

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 主題（削除のみタスクの fail path / 回帰 guard 検討）

本タスクは新機能を足さず dead alias 3 行を削るだけのため、追加すべき fail path は原理的に存在しない（削除対象は実行コードを持たない単純再代入）。Phase 6 の検討主題は **「alias 復活防止の回帰 guard をテストへ追加するか」**の一点に絞る（EMB-005-FB: 単純タスクは Phase 6 を軽量化可）。

## 2. 結論: 必須の新規テストは無し

既存 focused Vitest（`shell-collapse-cookie.spec.ts`）が **primary 名で全機能（parse / serialize / write / readFromDocument）を網羅**しており、削除後も不変で 4 ケース PASS する（Phase 4 §2）。したがって機能カバレッジ確保のための新規テストは不要。

## 3. 任意の回帰 guard（過剰実装を避ける前提で提案のみ）

| 案 | 内容 | コスト | 採否判断 |
| --- | --- | --- | --- |
| 型レベル担保（推奨） | alias を import するコードを誤って足すと `typecheck` で fail。Phase 5 の typecheck gate がそのまま guard。 | ゼロ（既存 gate 流用） | 採用（追加作業なし） |
| export surface assert | `import * as mod` の `Object.keys(mod)` が削除 3 名（`SHELL_COLLAPSE_COOKIE` / `readCollapsedFromCookieString` / `writeCollapsedCookie`）を含まないことを assert する 1 ケース追加 | 小 | **見送り可**（drift 再発リスクが高いと判断した時のみ追加） |

> 過剰実装回避方針: 今回は alias を import している箇所が 0 のため、型レベル担保で十分。export surface assert は将来 drift が再発した場合の追加候補として記録に留める。

## 4. 削除識別子の旧参照非残存の確認手順

実装後（user-gated）に、削除した 3 識別子の旧参照が code / test に残らないことを grep で確認する:

```bash
rg -n "SHELL_COLLAPSE_COOKIE\b|readCollapsedFromCookieString|writeCollapsedCookie\b" apps/web/src
```

- 期待: 削除対象 3 名（`SHELL_COLLAPSE_COOKIE` 完全一致 / `readCollapsedFromCookieString` / `writeCollapsedCookie`）のヒットが **0**。
- 注意: `SHELL_COLLAPSE_COOKIE_NAME`・`SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS` は語境界 `\b` で別語となるため、これらは削除対象外として残存して良い。
