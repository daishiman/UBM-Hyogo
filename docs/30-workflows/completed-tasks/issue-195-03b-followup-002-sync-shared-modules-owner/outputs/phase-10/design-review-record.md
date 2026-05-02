# Phase 10 成果物 — 設計レビュー記録

## 決定

D-1〜D-7 を採択し、Phase 5 で全サブタスク（T1〜T10）を実適用。新規 `_design/` 階層 + 5列 owner 表 + 03a/03b 1ホップリンク + `_shared/` skeleton + CODEOWNERS 行という最小成果で AC-1〜AC-12 をすべて満たす設計に更新した。

## 代替案却下

- **案 A**: owner 表を 03a / 03b 配下に置く → 却下。workflow 横断 governance を wave 配下に置くと「並列 wave 共通の正本」が見つからなくなり再発防止にならない。
- **案 B**: skill 本体テンプレに owner 列を追加する → 却下。本タスクの最小価値（owner 表を立てる）を超え、skill 改修の合意プロセスが必要となるため Phase 12 skill feedback に候補として残置。
- **案 C**: schema 集約タスクを本タスクに併合する → 却下。未割当 #7 が独立して起票できる粒度に保つほうが運用上良い。

## リスク

- owner 表が陳腐化しても気づかない可能性あり。緩和策として、後続 sync 系タスクの Phase 4（実装計画）で必ず本表を確認するルールを変更ルール #4 に明記済。
- `_design/` 階層が増えすぎると目的が拡散する → 短期は workflow 横断 governance に限定。

## 開放残課題（Phase 12 へ）

1. 未割当 #7（schema 集約）の起票責務確定
2. 03a / 03b spec 文中の「主担当 / サブ担当」語彙の "owner / co-owner" 統一
3. `_design/` 配下に追加すべき他の workflow 横断 governance 文書（auth helper の owner 表 等）の起票要否検討
