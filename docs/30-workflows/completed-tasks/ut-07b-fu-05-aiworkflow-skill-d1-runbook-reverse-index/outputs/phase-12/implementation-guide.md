# Implementation Guide

## Part 1: 中学生レベル

たとえば、学校の図書室で「本番データベースに変更を入れる手順書」を探したいとします。手順書そのものが棚にあっても、目次や案内板に場所が書かれていなければ、毎回あちこち探すことになります。

このタスクでは、案内板に「D1 migration の手順書はここ」「使う道具はここ」「確認するしくみはここ」と書き足しました。これにより、次に同じ作業をする人が、遠回りせずに正しい手順書とコマンドへ進めます。

| 言葉 | やさしい言い換え |
| --- | --- |
| D1 | Cloudflare が持つデータの入れ物 |
| migration | データの入れ物を新しい形にする手順 |
| runbook | 作業手順書 |
| index | 探すための目次 |
| CI gate | 自動の確認係 |

## Part 2: 技術者レベル

本タスクは TypeScript API / runtime code を追加しない。代わりに aiworkflow-requirements skill の index contract を更新する。

| 要件 | 反映 |
| --- | --- |
| TypeScript 型定義 | N/A。skill metadata 更新のみ |
| API signature | N/A。API 変更なし |
| 使用例 | `rg "d1-migration-verify|scripts/d1|d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes` |
| エラー処理 | `pnpm indexes:rebuild` 後に drift が出た場合、生成差分を確認して index 正本を再同期する |
| 設定値 | `package.json` の `indexes:rebuild` script |

## Runtime boundary

`bash scripts/cf.sh d1:apply-prod` は quick-reference に載せるが、本改善では実行しない。production D1 mutation はユーザー明示承認後のみ。

