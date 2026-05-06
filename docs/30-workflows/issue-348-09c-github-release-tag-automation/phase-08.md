# Phase 8: runbook 実装

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-8/phase-8.md` |
| 実装区分 | 実装仕様書 |

## 目的
`docs/runbooks/release-create.md` の章構成（前提 / 前段 09c production deploy 完了確認 / dry-run 手順 / apply 手順 / 検証 / rollback 時の release 削除 / トラブルシュート）を仕様化する。manual fallback として CI が落ちた際にローカルから release 作成できる経路を残す。

## 実行タスク
詳細は `outputs/phase-8/phase-8.md` を正本とする。

## 統合テスト連携
Phase 11 で runbook 走破 evidence を取得する経路の文書化を担う。Phase 7 workflow と整合させる。

## 参照資料
- `outputs/phase-8/phase-8.md`
- Phase 5 / 6 / 7 の仕様

## 成果物
- `outputs/phase-8/phase-8.md`
- `docs/runbooks/release-create.md`（仕様確定）

## 完了条件
- Phase 8 正本ファイルが存在する。
- 章構成が確定し、各章で実行する具体コマンド (`gh release view` 等) が仕様として列挙されている。
- rollback 時の `gh release delete` / `git push --delete origin <tag>` 手順が仕様化されている。
