## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-06a-followup-003-mobile-filterbar-tag-picker |
| タスク名 | mobile FilterBar / tag picker UX |
| 分類 | UI/UX 改善 |
| 対象機能 | `/members` FilterBar |
| 優先度 | 中 |
| ステータス | 未実施 |
| 発見元 | 06a 30種思考法レビュー |
| 発見日 | 2026-04-29 |

---

## 苦戦箇所【記入必須】

06a の `MembersFilterBar` は URL から repeated `tag` を復元し、選択済み tag の削除はできる。一方で新規 tag 候補を選ぶ UI はなく、mobile で検索、select、segmented control が縦に増えた時の操作密度も未検証。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| tag 検索が URL 直指定でしか使えず、発見性が低い | 04a tag dictionary / frequent tags を取得して chip picker を追加する |
| mobile で FilterBar が長くなり、一覧到達が遅くなる | 折りたたみ、sticky summary、clear all を検討する |

## 検証方法

- Playwright mobile viewport で `/members?tag=ai&tag=design` を撮影
- tag 追加 / 削除 / clear / reload restore の E2E を追加
- URL が `tag=...&tag=...` の repeated query を維持することを確認

## スコープ（含む/含まない）

含む:
- mobile FilterBar レイアウト改善
- tag candidate picker
- tag 5 件 truncate の UI hint

含まない:
- tag 辞書編集 UI
- member self-service tag 編集
