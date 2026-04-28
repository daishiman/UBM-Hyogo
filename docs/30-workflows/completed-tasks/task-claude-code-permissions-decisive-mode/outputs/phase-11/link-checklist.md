# Link Checklist

3 段リンク（`index.md` → `phase-NN.md` → `outputs/phase-N/*`）の健全性を確認する。

## 検証対象

| レイヤ | パス |
| --- | --- |
| L1 | `docs/30-workflows/task-claude-code-permissions-decisive-mode/index.md` |
| L2 | `docs/30-workflows/task-claude-code-permissions-decisive-mode/phase-01.md` 〜 `phase-13.md` |
| L3 | `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-{1..13}/*.md` |
| sync | `artifacts.json` / `outputs/artifacts.json` |

## 確認項目

| # | 項目 | 期待 | 結果 |
| --- | --- | --- | --- |
| 1 | index.md → 各 phase-NN.md リンクが切れていない | OK | OK |
| 2 | 各 phase-NN.md の `outputs/phase-N/*` 言及が実ファイルに対応 | OK | OK |
| 3 | `artifacts.json` の `phases[*].outputs` と実ファイル ls が一致 | OK | OK |
| 4 | `outputs/artifacts.json` がルート `artifacts.json` と diff なし | OK | OK |
| 5 | Phase 11 の主証跡 `manual-smoke-log.md` が L2 から参照されている | OK | OK |
| 6 | Phase 12 の 6 成果物が `phase-12.md` の本文 / 主成果物節と一致 | OK | OK |
| 7 | `screenshots/` ディレクトリが存在しない（NON_VISUAL） | OK | OK |
| 8 | `docs/00-getting-started-manual/claude-code-config.md` への外部参照が壊れていない | OK | OK |

## 検証コマンド例

```bash
# Phase outputs と実ファイルの照合
jq -r '.phases[] | .outputs[]' artifacts.json | sort -u > /tmp/declared.txt
( cd outputs && find . -type f -name '*.md' ) | sed 's|^\./|outputs/|' | sort -u > /tmp/actual.txt
diff /tmp/declared.txt /tmp/actual.txt

# ルート / outputs 双方の同期
diff artifacts.json outputs/artifacts.json

# screenshots 不在の確認
test ! -d outputs/phase-11/screenshots && echo OK
```

## 完了条件

- 全 8 項目が OK で埋まる
- diff コマンドが exit 0
- 不一致が見つかった場合は phase-12 の compliance check に MINOR としてエスカレーションする
