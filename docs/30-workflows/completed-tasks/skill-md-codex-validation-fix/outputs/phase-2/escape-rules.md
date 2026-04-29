# YAML escape 規則（Phase 2）

## 出力フォーマット

description は **double-quoted scalar** に統一する（literal block `|` は使用しない）。

```yaml
description: "概要1段落。Anchors: 主要3件。Trigger: 主要8語。詳細は references/ 参照。"
```

## エスケープ対象

| 入力 | 処理 |
| --- | --- |
| `\n`（改行） | 半角スペースに正規化 |
| `\n\n`（連続改行） | 半角スペース 1 個 |
| `\t`（Tab） | 半角スペース |
| `:` + 半角スペース | quote 内に保持（double-quoted で安全） |
| `"`（ダブルクォート） | `\"` にエスケープ |
| `\`（バックスラッシュ） | `\\` にエスケープ |
| 先頭が `#` `&` `*` `?` `:` `-` `<` `>` `=` `!` `%` `@` `\`` | quote で安全（追加処理不要） |

## 自動拒否パターン

- 先頭が `## Layer N:` 等の Markdown 見出しで始まる description は採用拒否（throw）
- description 内に literal block 由来の改行が連続して含まれる場合は throw

## API

```js
// scripts/utils/yaml-escape.js
export function escapeForScalar(str) { /* double-quote 内で安全な文字列を返す */ }
export function normalizeWhitespace(str) { /* 改行/Tab/連続空白を半角空白に正規化 */ }
```
