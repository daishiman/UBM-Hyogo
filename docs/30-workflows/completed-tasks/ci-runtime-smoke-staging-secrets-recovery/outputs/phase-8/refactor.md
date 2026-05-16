# Phase 8: リファクタリング（実行結果）

## 適用結果

| 対象 | Before | After | 採否 |
|------|--------|-------|------|
| report 文字列構築 | `report="${report}...\n"` の incremental append | `mktemp` で tmpfile に append、終了時に `cat` で出力 + `trap rm -f` でクリーンアップ | **適用済み**（bash 互換性向上、`printf '%b'` 依存回避） |
| URL 除外と anchor 処理 | 別段処理 | line ベースで URL filter、ref 単位で anchor 除去（`${ref%%#*}`） | **適用済み**（読みやすさ維持） |
| runtime evidence / placeholder 除外 | scope 拡張時に追加 | `case` 分岐で明示除外 | **適用済み**（false positive 抑止） |

## 同値性確認

リファクタ後も TC-01〜TC-07 全 PASS、`OK (17 references checked across 32 files)` で挙動同値。

## 過剰リファクタ回避

変更規模が小さいため、awk pipeline への集約等は見送り（CONST: 過剰実装禁止）。
