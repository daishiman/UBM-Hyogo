# Phase 6: Failure Cases

## 状態

pending。派生実装タスクで観測する異常系を定義する。

## ケース

| ID | 失敗 | 防御 |
| --- | --- | --- |
| FC-1 | front matter Markdown への適用 | `SKILL.md` と references を除外 |
| FC-2 | JSON / YAML / lockfile への適用 | check-attr で `unspecified` |
| FC-3 | `**/*.md` broad glob | review reject |
| FC-4 | 時系列 ledger の行順破壊 | A-2 fragment へ逃がす |
