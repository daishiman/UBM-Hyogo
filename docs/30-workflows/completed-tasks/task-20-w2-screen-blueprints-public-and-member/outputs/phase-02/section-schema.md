# §X.1〜X.7 fixed schema

各画面 1 セクションが以下 7 サブセクションを必ず持つ。

| # | 名称 | 内容 |
| --- | --- | --- |
| X.1 | prototype 由来 | `pages-*.jsx` の `return (...)` 全体を一字一句転記（fenced jsx ブロック） |
| X.2 | コピー原文 | UI 表示テキスト一字一句（heading / body / button label / link text） |
| X.3 | 状態遷移 | mermaid stateDiagram-v2（標準 5: idle/loading/success/empty/error。login のみ画面固有 5: input/sent/unregistered/deleted/error） |
| X.4 | API 接続表 | method × endpoint × route の 3 タプル。現行 API 正本と完全一致 |
| X.5 | props / 内部 state | 親→子 props と useState 構造 |
| X.6 | a11y | aria-* / 見出しレベル / focus 順 / キーボード操作 |
| X.7 | 参照 | 09b token / 09c primitive / 09d icon の §番号 link（3 種固定）+ 09a prototype-map（optional） |
