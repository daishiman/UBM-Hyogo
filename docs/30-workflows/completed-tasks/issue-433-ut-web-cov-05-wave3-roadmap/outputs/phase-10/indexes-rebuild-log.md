# indexes:rebuild Log

Status: `COMPLETED`

Command:

```bash
mise exec -- pnpm indexes:rebuild
```

Result: PASS

## 出力サマリ

```
📂 487ファイルを分類:
   API設計: 8 / アーキテクチャ: 24 / Claude Code: 11 / データベース: 13 /
   概要・品質: 4 / インターフェース: 46 / セキュリティ: 12 /
   技術スタック: 7 / UI/UX: 46 / ワークフロー: 71 / その他: 245

1. トピックマップ生成 → indexes/topic-map.md
2. キーワード索引生成 → indexes/keywords.json (3837 キーワード)
```

## diff stat

```
indexes/keywords.json  | 26 +++++++++++-----------
indexes/topic-map.md   | 25 ++++++++++-----------
2 files changed, 25 insertions(+), 26 deletions(-)
```

## Notes

- `mise` reported the local `.mise.toml` trust warning.
- Node reported `MODULE_TYPELESS_PACKAGE_JSON`.
- `generate-index.js` completed successfully and regenerated `indexes/topic-map.md` and `indexes/keywords.json`.
