# Phase 9 — `pnpm indexes:rebuild` で drift 解消

## 実行ログ

```
$ mise exec -- pnpm indexes:rebuild
> ubm-hyogo@0.1.0 indexes:rebuild
> node .claude/skills/aiworkflow-requirements/scripts/generate-index.js

📚 インデックス生成中...
📂 557ファイルを分類:
   API設計: 8 / アーキテクチャ: 24 / Claude Code: 11 / DB: 14 / セキュリティ: 12
   ワークフロー: 102 / UI/UX: 47 / インターフェース: 46 / その他: 282 ほか
1. トピックマップ生成... ✅ indexes/topic-map.md
2. キーワード索引生成... ✅ indexes/keywords.json (4317キーワード)
✅ インデックス生成完了
```

## 生成後の git status（drift 状態）

```
M .claude/skills/aiworkflow-requirements/indexes/keywords.json
M .claude/skills/aiworkflow-requirements/indexes/quick-reference.md
M .claude/skills/aiworkflow-requirements/indexes/resource-map.md
M .claude/skills/aiworkflow-requirements/indexes/topic-map.md
```

`indexes/` 配下の 4 ファイルが変更状態。これは Phase 8 で手編集した anchor / keyword に加え、本タスクの新規 outputs ファイル群（phase-1〜phase-11）を generator が拾って正規化した結果。CI gate `verify-indexes-up-to-date` は rebuild 後の状態と HEAD が一致することで PASS するため、Phase 13 の commit でこの diff を含めれば green になる。

## DoD

- [x] `pnpm indexes:rebuild` success
- [x] indexes 配下の差分は本タスク追加分のみ（資源不変のもの混入なし）
- [x] rebuild 出力ログを記録
