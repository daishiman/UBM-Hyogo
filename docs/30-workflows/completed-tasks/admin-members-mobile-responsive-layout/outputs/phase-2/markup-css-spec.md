# マークアップ / CSS 仕様

## F1 属性追加マップ（td → data-label / data-cell）

正本は [SSOT §3.2](../shared-context.md)。

| td 位置 / 内容 | 付与属性 |
| -------------- | -------- |
| ラッパー div | `data-component="admin-members-table"` + `overflow-hidden`→`overflow-x-auto` |
| thead | `data-role="table-head"` |
| 1: チェック | `data-cell="select"` |
| 2: メンバー | `data-cell="member"` |
| 3: メール | `data-label="メール"` |
| 4: 区画 / ステータス | `data-label="区画 / ステータス"` |
| 5: タグ | `data-label="タグ"` |
| 6: 最終更新 | `data-label="最終更新"` |
| 7: 公開 | `data-label="公開"` |
| 8: 操作 | `data-cell="actions"` |

## F2 CSS（card 化雛型）

正本は [SSOT §3.3](../shared-context.md)。`globals.css:2576`（issue-276 ブロック直後・同一 `@layer`）に `@media (max-width:640px)` を追加。`table/tbody/tr/td` を `display:block`、`tr` をカード枠、`td[data-label]::before { content: attr(data-label); }`、`thead[data-role="table-head"]` を `position:absolute; clip` で視覚的に隠す。色・寸法は OKLch トークンのみ。

## 不変

機械可読id・行/セル順序・desktop 表示は不変（I-2/I-3/I-6）。
