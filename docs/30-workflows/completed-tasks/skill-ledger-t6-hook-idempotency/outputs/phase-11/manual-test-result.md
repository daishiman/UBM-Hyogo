# manual-test-result — T-6 hook 冪等化 smoke 結果テンプレ

> **NOT EXECUTED**: 本ワークフロー（仕様書整備 PR）では実走しない。実走 PR 担当者が本ファイルを実値で上書きする。

## 1. 実行サマリ

| 項目 | 値 |
| --- | --- |
| date_utc | NOT EXECUTED |
| operator | NOT EXECUTED |
| 実 hook PR ref | NOT EXECUTED |
| base commit | NOT EXECUTED |
| 全体結論 | NOT EXECUTED（PASS / FAIL） |

## 2. AC 検証マトリクス

| AC | 検証方法 | 結果 |
| --- | --- | --- |
| AC-1 hook が `git add` 系を呼ばない | smoke 中の `git status` / `git log` 連続観察 | NOT EXECUTED |
| AC-2 派生物存在時はスキップ | 派生物事前生成 → smoke 起動 → タイムスタンプ未更新確認 | NOT EXECUTED |
| AC-3 部分 JSON リカバリ手順 | 中断 → `jq -e . || rm` → 再 rebuild | NOT EXECUTED |
| AC-4 4 worktree `unmerged=0` | `git ls-files --unmerged | wc -l` | NOT EXECUTED |
| AC-5 A-2 完了 gate | 実走前に Issue #130 状態確認 | NOT EXECUTED |
| AC-6 `wait $PID` 個別集約 | コマンド系列が pids[] / rcs[] 採用 | NOT EXECUTED |
| AC-7 2→4 二段構え | 事前 smoke PASS 後に full smoke 起動 | NOT EXECUTED |
| AC-8 ロールバック | `git revert` + `lefthook -V` の再配置確認（演習レベルで OK） | NOT EXECUTED |

## 3. 採取データ（実走時に転記）

| 項目 | 値 |
| --- | --- |
| 2 worktree pids | NOT EXECUTED |
| 2 worktree rcs | NOT EXECUTED |
| 4 worktree pids | NOT EXECUTED |
| 4 worktree rcs | NOT EXECUTED |
| 削除した部分 JSON 一覧 | NOT EXECUTED |
| `git ls-files --unmerged \| wc -l` | NOT EXECUTED |
| 所要秒（事前 / full） | NOT EXECUTED |

## 4. 失敗時の戻し先

| 状態 | 戻し先 |
| --- | --- |
| 2 worktree FAIL | Phase 6（異常系） / Phase 9（品質保証） |
| 4 worktree FAIL かつ 2 worktree PASS | I/O 飽和懸念。Phase 2 §6 の系列を `n` を `1 2` で再現 |
| 部分 JSON リカバリ FAIL | Phase 5 ランブックへ戻し、手動再現可能性を強化 |

## 5. 結論

NOT EXECUTED — 実走 PR で本セクションを `PASS` または `FAIL + 戻し先` に置換する。
