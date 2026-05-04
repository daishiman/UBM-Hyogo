# `wrangler login` 残置検知 evidence

実行日: 2026-05-04
実行コマンド: `ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1`

## 結果

```
ls: /Users/dm/Library/Preferences/.wrangler/config/default.toml: No such file or directory
```

## 判定

| 項目 | 結果 |
| --- | --- |
| OAuth config 残置 | なし（PASS） |
| 除去操作の実施 | 不要（残置自体がない） |
| `.env` op 参照経路への影響 | なし |

AC-7 PASS。`wrangler login` でローカル OAuth トークンを保持していないことを確認。
