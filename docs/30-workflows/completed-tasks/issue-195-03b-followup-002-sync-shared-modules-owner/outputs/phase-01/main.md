# Phase 1 成果物 — 要件定義決定事項

## 採択した論点

- 論点 1: owner 表は `docs/30-workflows/_design/` 配下に新規作成。
- 論点 2: 表は5列構成（ファイル / owner / co-owner / 必須レビュアー / 備考）、初期2行（ledger.ts / sync-error.ts）。
- 論点 3: 03a / 03b の `index.md` から1ホップで到達可能なリンクを追記。
- 論点 4: 未割当 #7（schema 集約）は本表を foundation として参照する関係に留める。
- 論点 5: AC は「2 ファイル以上の表行」「変更ルール文の存在」までを必須化。

## AC の quantitative 化

| AC | 計測コマンド | 期待 |
| --- | --- | --- |
| AC-1 | `find docs/30-workflows/_design -maxdepth 1 -type f -name '*.md' \| wc -l` | `>=2` |
| AC-2 | 5列ヘッダ grep | 1 hit |
| AC-3 | `_shared/` 行 grep | `>=2` |
| AC-4 | 03a/03b index 1ホップ link grep | 2 hit |
| AC-5 | 変更ルール 4項目 grep | `>=4` |
| AC-6 | `関連未割当` grep | `>=1` |
| AC-7 | secret hygiene | 0 件 |

## 4 条件評価

価値性・実現性・整合性・運用性 すべて PASS（index.md の表参照）。

## Phase 2 への申し送り

- `_design/README.md` の要否 → 作成する（Phase 3 で決定）
- 未割当 #7 への参照表現 → owner 表末尾と `_design/README.md` の双方に「関連未割当タスク」節を置く
