# Phase 8: リファクタリング

## 実施内容
- `tokens.css` を Surface / Text / Border / Accent / Status / Zone / Radius / Shadow / Typography / Spacing / Motion の 11 ブロックに分割しコメント区切り済み（実装時から実装）。
- `globals.css` の `@theme inline` を color / radius / shadow / font の 4 ブロックに区切り。
- warm/cool/dark/fallback の 4 セレクタを別ブロックに分離（dark mode は spec 通り placeholder 空ブロック）。

## 不変条件確認
- HEX は `:root` の surface/text/border 系のみで、OKLch 値の fallback は `@supports not` 内に閉じている。
- 重複定義なし。

## 後続改善案（未タスク化しない）
- `@theme inline` から `--color-text-2 / --color-text-3 / --color-border-2` の bridge を utility 利用が増えた段階で見直す（task-10〜task-17 で必要時）。
