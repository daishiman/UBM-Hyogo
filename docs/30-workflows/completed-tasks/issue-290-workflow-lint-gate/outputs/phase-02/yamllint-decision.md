# Yamllint decision

## Verdict

`yamllint` は本タスクでは不採用。GitHub Actions workflow の primary gate は `actionlint 1.7.7` に固定する。

## 評価

| 評価軸 | actionlint | yamllint | 判定 |
| --- | --- | --- | --- |
| GitHub Actions 文脈 | workflow syntax / expression / job graph を検査 | 一般 YAML のみ | actionlint 優先 |
| YAML 構文 | parser error を検出 | parser error を検出 | actionlint で充足 |
| `${{ }}` など独自表現 | native 対応 | rule noise の可能性 | yamllint 不利 |
| 運用複雑性 | 既存 CI / runbook に統合済み | config と例外管理が追加 | yamllint 不採用 |

## 再検討条件

Actions 以外の YAML 群を同じ gate で管理する必要が出た場合のみ、別タスクで最小 rule set を評価する。
