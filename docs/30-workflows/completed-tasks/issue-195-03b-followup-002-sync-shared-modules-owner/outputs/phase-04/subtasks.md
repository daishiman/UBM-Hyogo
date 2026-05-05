# Phase 4 成果物 — サブタスク分解

| ID | 名称 | 種別 | 対象パス | 依存 | 検証 |
| --- | --- | --- | --- | --- | --- |
| T1 | `_design/` ディレクトリ作成 | mkdir | `docs/30-workflows/_design/` | なし | Phase 6 U-1 |
| T2 | `_design/README.md` 作成 | new file | `docs/30-workflows/_design/README.md` | T1 | Phase 6 U-5 |
| T3 | owner 表本体作成 | new file | `docs/30-workflows/_design/sync-shared-modules-owner.md` | T1 | Phase 6 U-2/U-3/U-4 |
| T4 | 03a index.md 編集 | edit | `docs/30-workflows/completed-tasks/03a-.../index.md` | T3 | Phase 7 I-1, I-3 |
| T5 | 03b index.md 編集 | edit | `docs/30-workflows/completed-tasks/03b-.../index.md` | T3 | Phase 7 I-2, I-3 |

## 検証コマンド計画

| Phase | コマンド | 期待 |
| --- | --- | --- |
| 6 U-1 | `find docs/30-workflows/_design -type f -name '*.md'` | `>=2` |
| 6 U-3 | `_shared/` 行 grep | `>=2` |
| 7 I-1/I-2 | リンク grep | 各 1 hit |
| 9 Q-1 | secret hygiene grep | 0 |
