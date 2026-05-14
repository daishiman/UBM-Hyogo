# Phase 8: リファクタリング（重複除去）

## 1. 対象 / Before / After / 理由

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| SMOKE-COVERAGE-MATRIX.md 内の axe profile 記述 | 各行に展開 | 凡例 section で `A11Y-DEFAULT` として 1 回宣言、行は参照 | 19 行に同一文字列を繰り返さない |
| token 軸の SSOT 言及 | 行ごとに 3 path | 凡例で `TOKEN-SSOT` として宣言、行は参照 | 同上 |
| visual baseline 列 | 4 routes に長文記載 | `✓ <baseline name>` の短形に統一 | 19 行 horizontally compact |
| 共通 3 routes の observability | 各行で詳述 | section 6 に集約、行は短縮 | 表幅縮小 |

## 2. 追加リファクタなし

code 変更なしのため、source side のリファクタリングは対象外。

## 3. 完了条件

- matrix が 1 画面内（端末 80 col 想定）で読みやすい
- 凡例の参照識別子（`A11Y-DEFAULT`, `TOKEN-SSOT` 等）が 19 行内で重複なく使われる
